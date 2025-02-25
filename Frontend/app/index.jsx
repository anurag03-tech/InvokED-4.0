import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "./context/authContext";
import { Button } from "~/components/ui/button";
import i18n from "../utils/language/i18n";
import { useVoice } from "./voiceAssistant/VoiceContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Audio } from "expo-av";

// TTS API URL
const TTS_API_URL = "https://admin.models.ai4bharat.org/inference/convert";

const LanguageSelection = () => {
  const router = useRouter();
  const { user, loading, role } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const { speakText, stopAudio } = useVoice();
  const hasSpokenRef = useRef(false);
  const languageSetRef = useRef(false);
  const soundRef = useRef(null);

  // Special function for English TTS using the specific service ID
  const speakEnglishDirectly = async (text) => {
    try {
      // Stop any existing audio
      if (soundRef.current) {
        try {
          await soundRef.current.stopAsync().catch(() => {});
          await soundRef.current.unloadAsync().catch(() => {});
        } catch (e) {
          // Silently handle errors
        }
        soundRef.current = null;
      }
      if (stopAudio) {
        await stopAudio();
      }

      // Make API request with the specific service ID for English
      const response = await axios.post(
        TTS_API_URL,
        {
          sourceLanguage: "en",
          input: text,
          task: "tts",
          serviceId: "ai4bharat/indic-tts-misc--gpu-t4",
          samplingRate: 16000,
          gender: "female",
          track: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          withCredentials: false,
          timeout: 15000,
        }
      );

      // Extract the audio content
      const audioContent = response.data.audio?.[0]?.audioContent;
      if (!audioContent) {
        throw new Error("No audio content received");
      }

      // Play the audio
      const audioUri = `data:audio/wav;base64,${audioContent}`;
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        (status) => {
          if (status.didJustFinish) {
            sound.unloadAsync().catch(() => {});
            soundRef.current = null;
          }
        }
      );

      soundRef.current = sound;
    } catch (error) {
      console.error("Error in special English TTS:", error);
      // Fall back to regular speakText
      speakText(text, "en-IN");
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      stopAudio();
    };
  }, []);

  // Set language from user's saved preference
  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        if (!loading && user && user.language && !languageSetRef.current) {
          console.log("Setting user's saved language:", user.language);
          i18n.changeLanguage(user.language);
          setSelectedLanguage(user.language);
          languageSetRef.current = true;
        } else if (!user) {
          // If no user is logged in, check for previously stored language preference
          const savedLanguage = await AsyncStorage.getItem("userLanguage");
          if (savedLanguage && !languageSetRef.current) {
            console.log("Loading saved language preference:", savedLanguage);
            i18n.changeLanguage(savedLanguage);
            setSelectedLanguage(savedLanguage);
            languageSetRef.current = true;
          }
        }
      } catch (error) {
        console.error("Error loading language:", error);
      }
    };

    loadUserLanguage();
  }, [user, loading]);

  useEffect(() => {
    // Only speak if there's no user and we haven't spoken yet
    if (!hasSpokenRef.current && !loading && !user) {
      // Use direct English TTS for the welcome message
      speakEnglishDirectly(
        "Please select your preferred language from the options below. After selecting your language, click the Next button to continue."
      );
      hasSpokenRef.current = true;
    }
  }, [loading, user]);

  useEffect(() => {
    // If not loading and user is authenticated, redirect to home
    if (!loading && user && role === "parent") {
      console.log(role);
      router.replace("parent/(tabs)/home");
    } else if (!loading && user && role === "teacher") {
      console.log(user);
      router.replace("teacher/(tabs)/home");
    }
  }, [user, loading, router]);

  const handleNext = () => {
    // Stop audio before navigating
    if (soundRef.current) {
      soundRef.current.stopAsync().catch(() => {});
      soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    stopAudio();

    router.push("./role");
  };

  // Show nothing while loading to prevent flicker
  if (loading) {
    return null;
  }

  const languages = [
    { label: "English", value: "en" },
    { label: "বাংলা", value: "bn" },
    { label: "ગુજરાતી", value: "gu" },
    { label: "हिन्दी", value: "hi" },
    { label: "ಕನ್ನಡ", value: "kn" },
    { label: "मराठी", value: "mr" },
    { label: "ਪੰਜਾਬੀ", value: "pa" },
    { label: "தமிழ்", value: "ta" },
    { label: "తెలుగు", value: "te" },
  ];

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    // Save the selected language to AsyncStorage
    AsyncStorage.setItem("userLanguage", lng)
      .then(() => console.log("Language saved to storage:", lng))
      .catch((err) => console.error("Error saving language:", err));
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.value);
    changeLanguage(language.value);
  };

  return (
    <View className="flex-1 items-center justify-center bg-white p-2">
      <View className="mb-4">
        <Image
          source={require("../assets/images/logo.jpg")}
          style={{ width: 250, height: 250 }}
        />
      </View>
      <View className="m-2 flex-row items-center justify-center">
        <Image
          source={require("../assets/images/language-icon.png")}
          style={{ width: 55, height: 55 }}
        />
        <Text className="text-2xl font-bold m-4">
          {i18n.t("Select your language")}
        </Text>
      </View>

      <View className="h-[300px]">
        <ScrollView className="w-[250px] px-2" persistentScrollbar={true}>
          {languages.map((language) => (
            <Button
              variant="outline"
              key={language.value}
              onPress={() => handleLanguageSelect(language)}
              className={`p-2 my-1 border bg-white ${
                selectedLanguage === language.value
                  ? "border-blue-500 bg-gray-100"
                  : "border-gray-300"
              }`}
            >
              <Text>{language.label}</Text>
            </Button>
          ))}
        </ScrollView>
      </View>

      {selectedLanguage && (
        <Button
          size="lg"
          variant="destructive"
          onPress={handleNext}
          className="mt-4 w-[250px] bg-blue-500 active:bg-blue-400"
        >
          <Text className="text-white font-semibold text-xl">
            {i18n.t("Next")}
          </Text>
        </Button>
      )}
    </View>
  );
};

export default LanguageSelection;
