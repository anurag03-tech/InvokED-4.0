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

// Array of different user agents to rotate through
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36 Edg/111.0.1661.62",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0",
  "Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/111.0 Firefox/111.0",
];

// Generate random IP (for X-Forwarded-For header)
const generateRandomIP = () => {
  return Array(4)
    .fill(0)
    .map(() => Math.floor(Math.random() * 256))
    .join(".");
};

// Utility to get a random item from an array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Create axios instance for AI4Bharat API
const ttsAxios = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// Remove any interceptors that might be modifying headers
ttsAxios.interceptors.request.clear();

// Simple in-memory cache for audio content
const audioCache = new Map();

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const soundRef = useRef(null);
  const { isMuted } = useMute();
  const [isReady, setIsReady] = useState(false);
  const apiCallInProgressRef = useRef(false);
  const retryCountRef = useRef(0);
  const requestQueueRef = useRef([]);
  const processingQueueRef = useRef(false);

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

  // Handle playback status updates
  const handlePlaybackStatus = (status) => {
    if (status.didJustFinish) {
      try {
        if (soundRef.current) {
          const currentSound = soundRef.current;
          currentSound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      } catch (e) {
        console.error("Error unloading sound:", e);
      }
    }
  };

  // Process the request queue
  const processQueue = async () => {
    if (requestQueueRef.current.length === 0) {
      processingQueueRef.current = false;
      return;
    }

    processingQueueRef.current = true;
    const request = requestQueueRef.current.shift();

    try {
      await performSpeak(request.text, request.languageCode);
    } catch (error) {
      console.error("Error in queued speak request:", error);
    }

    // Add slight delay between requests
    setTimeout(() => {
      processQueue();
    }, 300); // 300ms delay between requests
  };

  // The actual speak implementation
  const performSpeak = async (text, languageCode) => {
    try {
      // Force stop any existing audio
      await safeStopAudio();

      // Check cache first
      const cacheKey = `${text}_${languageCode}`;
      if (audioCache.has(cacheKey)) {
        const cachedAudioUri = audioCache.get(cacheKey);

        const { sound } = await Audio.Sound.createAsync(
          { uri: cachedAudioUri },
          { shouldPlay: true },
          handlePlaybackStatus
        );

        soundRef.current = sound;
        return;
      }

      // Generate a unique request ID and timestamp
      const timestamp = Date.now();
      const requestId = Math.random().toString(36).substring(2, 10);

      // Map language code to the format expected by AI4Bharat
      const sourceLanguage = languageCode.split("-")[0] || "en";
      const gender = "female";

      // Generate random request identifiers
      const randomUserAgent = getRandomItem(userAgents);
      const randomIP = generateRandomIP();
      const clientId = `client-${timestamp}-${requestId}`;

      // Make request to AI4Bharat TTS API with randomized headers
      const response = await ttsAxios({
        method: "post",
        url: "https://demo-api.models.ai4bharat.org/inference/tts",
        data: {
          controlConfig: {
            dataTracking: true,
          },
          input: [
            {
              source: text,
            },
          ],
          config: {
            gender: gender,
            language: {
              sourceLanguage: sourceLanguage,
            },
          },
        },
        headers: {
          "X-Request-ID": `tts-${timestamp}-${requestId}`,
          "User-Agent": randomUserAgent,
          "X-Forwarded-For": randomIP,
          "X-Client-ID": clientId,
          "Accept-Language": getRandomItem([
            "en-US,en;q=0.9",
            "en-GB,en;q=0.8",
            "en;q=0.7",
          ]),
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (isMuted) {
        return;
      }

      // Extract the base64 audio content from the response
      const audioContent = response.data.audio[0].audioContent;
      if (!audioContent) {
        throw new Error("No audio content received");
      }

      // Create audio URI with the correct MIME type (wav for AI4Bharat)
      const audioUri = `data:audio/wav;base64,${audioContent}`;

      // Cache this audio
      audioCache.set(cacheKey, audioUri);

      // If the cache gets too large, remove oldest entries
      if (audioCache.size > 50) {
        const oldestKey = audioCache.keys().next().value;
        audioCache.delete(oldestKey);
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        handlePlaybackStatus
      );

      soundRef.current = sound;
      retryCountRef.current = 0; // Reset retry counter on success
    } catch (error) {
      retryCountRef.current++;

      if (error.response?.status === 429) {
        console.log("Rate limit reached (429), will retry with more delay");
        // For 429 errors, we'll retry with more backoff
        setTimeout(() => {
          if (requestQueueRef.current.length < 5) {
            // Avoid queue overflow
            requestQueueRef.current.push({ text, languageCode });
            if (!processingQueueRef.current) {
              processQueue();
            }
          }
        }, 2000 + Math.random() * 3000); // Random delay between 2-5 seconds
      } else if (error.response?.status === 401) {
        console.error(
          "API authentication failed. Attempt:",
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
    }
  };

  // Main speak function that adds to queue
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

    apiCallInProgressRef.current = true;

    try {
      // Add to queue
      requestQueueRef.current.push({ text, languageCode });

      // Start processing queue if not already
      if (!processingQueueRef.current) {
        processQueue();
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
