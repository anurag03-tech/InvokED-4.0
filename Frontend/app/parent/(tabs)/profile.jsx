import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/authContext";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18next";
import { useTranslation } from "react-i18next";

const ProfileScreen = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentLanguage = i18n.language;

  const generateTips = async (lang) => {
    try {
      const genAI = new GoogleGenerativeAI(
        process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY
      );
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `IMPORTANT: Respond with valid JSON only. No backticks, no comments, no additional text.
        Generate parenting tips in ${lang} language.
        Return a JSON object in this exact format:
        {
          "tips": [
            {"tip": "<first parenting tip in ${lang}>", "icon": "bulb"},
            {"tip": "<second parenting tip in ${lang}>", "icon": "bulb"},
            {"tip": "<third parenting tip in ${lang}>", "icon": "bulb"},
            {"tip": "<fourth parenting tip in ${lang}>", "icon": "bulb"},
            {"tip": "<fifth parenting tip in ${lang}>", "icon": "bulb"}
          ]
        }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text().trim();

      // Clean up the response
      if (text.startsWith("```json")) {
        text = text.slice(7, -3);
      } else if (text.startsWith("```")) {
        text = text.slice(3, -3);
      }

      const parsed = JSON.parse(text);

      if (
        parsed.tips &&
        Array.isArray(parsed.tips) &&
        parsed.tips.length === 5
      ) {
        return parsed.tips;
      }
      return null;
    } catch (error) {
      console.error("Error generating tips:", error);
      return null;
    }
  };

  const fetchDailyTips = async () => {
    try {
      setLoading(true);
      const lastFetchDate = await AsyncStorage.getItem("lastTipsFetchDate");
      const cachedLanguage = await AsyncStorage.getItem("tipsLanguage");
      const currentDate = new Date().toDateString();

      // Check if we need new tips (different date or language)
      if (lastFetchDate !== currentDate || cachedLanguage !== currentLanguage) {
        // Generate new tips
        const newTips = await generateTips(currentLanguage);

        if (newTips) {
          // Save new tips and update date
          await AsyncStorage.setItem("currentTips", JSON.stringify(newTips));
          await AsyncStorage.setItem("lastTipsFetchDate", currentDate);
          await AsyncStorage.setItem("tipsLanguage", currentLanguage);

          setTips(newTips);
        } else {
          // If generation fails, try to use cached tips
          const cachedTips = await AsyncStorage.getItem("currentTips");
          if (cachedTips) {
            setTips(JSON.parse(cachedTips));
          }
        }
      } else {
        // Use cached tips
        const cachedTips = await AsyncStorage.getItem("currentTips");
        if (cachedTips) {
          setTips(JSON.parse(cachedTips));
        } else {
          // If no cached tips, generate new ones
          const newTips = await generateTips(currentLanguage);
          if (newTips) {
            await AsyncStorage.setItem("currentTips", JSON.stringify(newTips));
            await AsyncStorage.setItem("lastTipsFetchDate", currentDate);
            await AsyncStorage.setItem("tipsLanguage", currentLanguage);

            setTips(newTips);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching daily tips:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyTips();
  }, [currentLanguage]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-blue-500 pt-5 pb-8 rounded-b-3xl shadow-lg">
        {/* Top Bar with Logout */}
        <View className="flex-row justify-end px-4 mb-4">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center bg-red-500 px-4 py-2 rounded-full"
          >
            <Feather name="log-out" size={18} color="white" />
            <Text className="text-white ml-2 font-medium">{t("Logout")}</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View className="items-center flex-row justify-center gap-10">
          <View className="bg-white p-1 rounded-full shadow-lg">
            <Image
              source={require("../../../assets/images/profile.jpg")}
              className="w-24 h-24 rounded-full"
            />
          </View>
          <View>
            <Text className="text-2xl font-bold text-white mt-4">
              {user?.name || "User Profile"}
            </Text>
            <Text className="text-gray-100">{user?.email}</Text>
            <Text className="text-gray-100 mt-1">{user?.phone}</Text>
          </View>
        </View>
      </View>

      {/* Parenting Tips Section */}
      {loading ? (
        <View className="items-center justify-center p-4 mt-6">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-2 text-gray-600">{t("Loading tips...")}</Text>
        </View>
      ) : (
        <View className="mx-4 mt-6 mb-8">
          <Text className="text-lg font-bold mb-4 text-gray-800">
            {t("Daily Parenting Tips")}
          </Text>
          {tips.map((tip, index) => (
            <View
              key={index}
              className="bg-white p-4 rounded-xl mb-3 shadow flex-row items-center"
            >
              <Ionicons name="bulb" size={24} color="#F59E0B" />
              <Text className="text-gray-700 ml-3 flex-1">{tip.tip}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default ProfileScreen;
