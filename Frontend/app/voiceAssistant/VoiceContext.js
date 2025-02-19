import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { Audio } from "expo-av";
import axios from "axios";
import { useMute } from "./MuteContext";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY;

const googleAxios = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Remove any interceptors that might be modifying headers
googleAxios.interceptors.request.clear();

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const soundRef = useRef(null);
  const { isMuted } = useMute();
  const [isReady, setIsReady] = useState(false);
  const apiCallInProgressRef = useRef(false);
  const retryCountRef = useRef(0);

  // Initialize audio system
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        // Still mark as ready to avoid completely breaking the app
        setIsReady(true);
      }
    };

    setupAudio();

    return () => {
      safeStopAudio();
    };
  }, []);

  // Safe audio stopping without logging errors
  const safeStopAudio = async () => {
    try {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync().catch(() => {});
        } catch (e) {
          console.error("Error stopping sound:", e);
        }

        try {
          await soundRef.current.unloadAsync().catch(() => {});
        } catch (e) {}

        soundRef.current = null;
      }
    } catch (error) {
      console.error("Error stopping audio:", error);
    }
  };

  const stopAudio = async () => {
    await safeStopAudio();
  };

  const speakText = async (text, languageCode) => {
    if (
      isMuted ||
      !isReady ||
      !text ||
      !languageCode ||
      apiCallInProgressRef.current
    ) {
      return;
    }

    try {
      apiCallInProgressRef.current = true;

      // Force stop any existing audio
      await safeStopAudio();

      // Generate a unique request ID to avoid caching
      const timestamp =
        Date.now() + Math.random().toString(36).substring(2, 10);

      // Use Standard voice only
      const response = await googleAxios({
        method: "post",
        url: `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}&_=${timestamp}`,
        data: {
          input: { text },
          voice: {
            languageCode,
            name: `${languageCode}-Standard-A`,
            ssmlGender: "MALE",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 0.9,
          },
        },
        headers: {
          // Ensure no auth headers leak in
          Authorization: null,
          "X-Request-ID": `tts-${timestamp}`,
        },
      });

      if (isMuted) {
        apiCallInProgressRef.current = false;
        return;
      }

      const audioContent = response.data.audioContent;
      if (!audioContent) {
        throw new Error("No audio content received");
      }

      const audioUri = `data:audio/mp3;base64,${audioContent}`;

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        (status) => {
          if (status.didJustFinish) {
            try {
              sound.unloadAsync().catch(() => {});
            } catch (e) {
              console.error("Error unloading sound:", e);
            }
            if (soundRef.current === sound) {
              soundRef.current = null;
            }
          }
        }
      );

      soundRef.current = sound;
      retryCountRef.current = 0; // Reset retry counter on success
    } catch (error) {
      retryCountRef.current++;

      if (error.response?.status === 401) {
        console.error(
          "Google API authentication failed. Attempt:",
          retryCountRef.current
        );

        // If we've had repeated auth failures, pause voice requests
        if (retryCountRef.current > 3) {
          console.log("Multiple auth failures, will pause voice requests");
          // Wait 2 minutes before allowing more requests
          setTimeout(() => {
            retryCountRef.current = 0;
          }, 2 * 60 * 1000);
        }
      } else {
        console.error("Error in speakText:", error);
      }
    } finally {
      apiCallInProgressRef.current = false;
    }
  };

  return (
    <VoiceContext.Provider
      value={{
        speakText,
        stopAudio,
        isReady,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
};

export default VoiceContext;
