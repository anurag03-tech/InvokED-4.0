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
import NetInfo from "@react-native-community/netinfo";
import { getAudioForRoute } from "./AudioStorage";

// Array of different user agents to rotate through
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
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

// New API URL for AI4Bharat TTS
const TTS_API_URL = "https://admin.models.ai4bharat.org/inference/convert";

// Create axios instance for AI4Bharat API
const ttsAxios = axios.create({
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
  timeout: 15000, // 15 second timeout
});

// Remove any interceptors that might be modifying headers
ttsAxios.interceptors.request.clear();

// Simple in-memory cache for audio content
const audioCache = new Map();

// Supported languages for local audio
const LOCAL_AUDIO_LANGUAGES = ["en", "hi", "kn"];

// Language family grouping for different service IDs
const INDO_ARYAN_LANGUAGES = ["bn", "pa", "mr", "gu", "hi"]; // Bengali, Punjabi, Marathi, Gujarati, Hindi
const DRAVIDIAN_LANGUAGES = ["te", "ta", "kn"]; // Telugu, Tamil, Kannada

const VoiceContext = createContext();

export const VoiceProvider = ({ children }) => {
  const soundRef = useRef(null);
  const { isMuted } = useMute();
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const apiCallInProgressRef = useRef(false);
  const retryCountRef = useRef(0);
  const requestQueueRef = useRef([]);
  const processingQueueRef = useRef(false);
  const lastApiCallTimestampRef = useRef(0);

  // Initialize audio system and network monitoring
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
        // Still mark as ready to avoid completely breaking the app
        setIsReady(true);
      }
    };

    setupAudio();

    // Set up network monitoring
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    // Initial network check
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return () => {
      safeStopAudio();
      unsubscribe();
    };
  }, []);

  // Safe audio stopping without logging errors
  const safeStopAudio = async () => {
    try {
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync().catch(() => {});
        } catch (e) {
          // Silently handle stop errors
        }

        try {
          await soundRef.current.unloadAsync().catch(() => {});
        } catch (e) {
          // Silently handle unload errors
        }

        soundRef.current = null;
      }
    } catch (error) {
      // Silently handle errors
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
        // Silently handle errors
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
      // Rate limiting - ensure at least 1 second between API calls
      const now = Date.now();
      const timeSinceLastCall = now - lastApiCallTimestampRef.current;
      if (timeSinceLastCall < 1000) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 - timeSinceLastCall)
        );
      }

      await performSpeak(request.text, request.languageCode, request.route);
    } catch (error) {
      // Silently handle errors
    }

    // Add slight delay between requests
    setTimeout(() => {
      processQueue();
    }, 500); // 500ms delay between requests
  };

  // Play stored audio from base64 string
  const playStoredAudio = async (audioBase64) => {
    if (!audioBase64) return false;

    try {
      await safeStopAudio();

      const audioUri = `data:audio/wav;base64,${audioBase64}`;

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          handlePlaybackStatus
        );

        soundRef.current = sound;
        return true;
      } catch (soundError) {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  // The actual speak implementation
  const performSpeak = async (text, languageCode, route) => {
    // Check if online first
    if (!isOnline) {
      // Extract base language code (e.g., 'en' from 'en-IN')
      const baseLanguage = languageCode.split("-")[0] || "en";

      // Check if offline audio is available
      if (LOCAL_AUDIO_LANGUAGES.includes(baseLanguage) && route) {
        const storedAudio = getAudioForRoute(route, baseLanguage);

        if (storedAudio) {
          const success = await playStoredAudio(storedAudio);
          if (success) {
            return; // Successfully played stored audio
          }
        }
      }

      return;
    }

    try {
      // Force stop any existing audio
      await safeStopAudio();

      // Extract base language code (e.g., 'en' from 'en-IN')
      const baseLanguage = languageCode.split("-")[0] || "en";

      // Check if we should use local audio
      if (LOCAL_AUDIO_LANGUAGES.includes(baseLanguage) && route) {
        const storedAudio = getAudioForRoute(route, baseLanguage);

        if (storedAudio) {
          const success = await playStoredAudio(storedAudio);
          if (success) {
            return; // Successfully played stored audio
          }
          // If stored audio playback fails, continue to API call
        }
      }

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
      lastApiCallTimestampRef.current = timestamp;
      const requestId = Math.random().toString(36).substring(2, 10);

      // Map language code to the format expected by AI4Bharat
      const sourceLanguage = baseLanguage;
      const gender = "female";

      // Generate random request identifiers
      const randomUserAgent = getRandomItem(userAgents);
      const randomIP = generateRandomIP();
      const clientId = `client-${timestamp}-${requestId}`;

      // Determine the appropriate service ID based on language family
      let serviceId = "ai4bharat/indic-tts-indo-aryan--gpu-t4"; // Default service ID

      // Check language family and set appropriate service ID
      if (DRAVIDIAN_LANGUAGES.includes(sourceLanguage)) {
        serviceId = "ai4bharat/indic-tts-dravidian--gpu-t4";
      } else if (INDO_ARYAN_LANGUAGES.includes(sourceLanguage)) {
        serviceId = "ai4bharat/indic-tts-indo-aryan--gpu-t4";
      }

      // Make request to AI4Bharat TTS API with the new format
      const response = await ttsAxios({
        method: "post",
        url: TTS_API_URL,
        data: {
          sourceLanguage: sourceLanguage,
          input: text,
          task: "tts",
          serviceId: serviceId,
          samplingRate: 16000,
          gender: gender,
          track: true,
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

      // Extract the base64 audio content from the response (new format)
      const audioContent = response.data.audio?.[0]?.audioContent;
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
        // For 429 errors, we'll retry with more backoff
        setTimeout(() => {
          if (requestQueueRef.current.length < 5) {
            // Avoid queue overflow
            requestQueueRef.current.push({ text, languageCode, route });
            if (!processingQueueRef.current) {
              processQueue();
            }
          }
        }, 5000 + Math.random() * 500); // Random delay between 5-10 seconds
      } else if (error.response?.status === 401) {
        // If we've had repeated auth failures, pause voice requests
        if (retryCountRef.current > 3) {
          setTimeout(() => {
            retryCountRef.current = 0;
          }, 5 * 60 * 1000);
        }
      }
    }
  };

  // Main speak function that adds to queue
  const speakText = async (text, languageCode = "en", route = null) => {
    if (!isReady || !text || isMuted) {
      return;
    }

    // Ensure we have a route parameter (might be null)
    if (typeof route !== "string" && route !== null) {
      route = null;
    }

    // Truncate very long text to avoid API issues
    if (text.length > 300) {
      text = text.substring(0, 300) + "...";
    }

    // Ensure we have a reasonable language code
    if (!languageCode || typeof languageCode !== "string") {
      languageCode = "en";
    }

    // Add to queue
    requestQueueRef.current.push({ text, languageCode, route });

    // Start processing queue if not already
    if (!processingQueueRef.current) {
      processQueue();
    }
  };

  return (
    <VoiceContext.Provider
      value={{
        speakText,
        stopAudio,
        isReady,
        isOnline,
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
