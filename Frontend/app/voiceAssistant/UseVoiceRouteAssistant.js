import { useEffect, useRef, useState } from "react";
import { useSegments, usePathname, useNavigation } from "expo-router";
import { useVoice } from "./VoiceContext";
import { useMute } from "./MuteContext";
import i18n from "i18next";
import UseRouteAssistant from "./UseRouteAssistant";

const UseVoiceRouteAssistant = () => {
  const currentLanguage = i18n.language || "en";
  const segments = useSegments() || [];
  const pathname = usePathname() || "";
  const navigation = useNavigation();

  const voiceContext = useVoice();
  const { speakText, stopAudio, isReady } = voiceContext || {};

  const muteContext = useMute();
  const { isMuted } = muteContext || { isMuted: false };

  let routeText = {};
  try {
    routeText = UseRouteAssistant() || {};
  } catch (error) {
    console.error("Error getting route text:", error);
  }

  const lastRouteRef = useRef("");
  const lastNavigationTimeRef = useRef(Date.now());
  const timeoutRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const attemptsRef = useRef(0);

  // Track navigation state changes
  const [navigationCount, setNavigationCount] = useState(0);

  const isTeacherRoute = pathname.startsWith("/teacher");

  // Detect navigation state changes
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.("state", () => {
      lastNavigationTimeRef.current = Date.now();
      setNavigationCount((prev) => prev + 1);
    });

    return () => {
      unsubscribe?.();
    };
  }, [navigation]);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (stopAudio) {
        stopAudio();
      }
      isSpeakingRef.current = false;
    };
  }, [stopAudio]);

  useEffect(() => {
    if (!segments || !segments.length || !isReady || !speakText || !stopAudio) {
      return;
    }

    const currentRoute = segments[segments.length - 1];

    if (!currentRoute || isMuted || isTeacherRoute || isSpeakingRef.current) {
      return;
    }

    const textToSpeak = routeText[currentRoute];

    if (!textToSpeak) {
      return;
    }

    // Check if this is a new navigation or we're returning to the same route
    const isNewNavigation =
      currentRoute !== lastRouteRef.current ||
      Date.now() - lastNavigationTimeRef.current < 2000;

    if (!isNewNavigation) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    stopAudio();

    // Set speaking flag
    isSpeakingRef.current = true;
    lastRouteRef.current = currentRoute;
    attemptsRef.current = 0;

    // Delay speaking to prevent rapid-fire
    timeoutRef.current = setTimeout(async () => {
      try {
        await speakText(textToSpeak, `${currentLanguage}-IN`);
      } catch (error) {
        console.error("Error speaking text:", error);
        // Retry logic with exponential backoff (max 3 attempts)
        if (attemptsRef.current < 3) {
          attemptsRef.current++;
          const backoffDelay = Math.pow(2, attemptsRef.current) * 500;
          timeoutRef.current = setTimeout(async () => {
            try {
              await speakText(textToSpeak, `${currentLanguage}-IN`);
            } catch (retryError) {
              console.error("Retry failed:", retryError);
            } finally {
              isSpeakingRef.current = false;
            }
          }, backoffDelay);
          return;
        }
      } finally {
        if (attemptsRef.current >= 3 || !timeoutRef.current) {
          isSpeakingRef.current = false;
        }
      }
    }, 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      stopAudio();
      isSpeakingRef.current = false;
    };
  }, [
    segments,
    isMuted,
    currentLanguage,
    isTeacherRoute,
    pathname,
    stopAudio,
    speakText,
    isReady,
    navigationCount,
  ]);

  return null;
};

export default UseVoiceRouteAssistant;
