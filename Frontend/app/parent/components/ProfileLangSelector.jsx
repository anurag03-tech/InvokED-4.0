import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

const ProfileLangSelector = ({ user, setUser }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Available languages
  const languages = [
    { code: "en", name: "English" },
    { code: "bn", name: "বাংলা" },
    { code: "gu", name: "ગુજરાતી" },
    { code: "hi", name: "हिन्दी" },
    { code: "kn", name: "ಕನ್ನಡ" },
    { code: "mr", name: "मराठी" },
    { code: "pa", name: "ਪੰਜਾਬੀ" },
    { code: "ta", name: "தமிழ்" },
    { code: "te", name: "తెలుగు" },
  ];

  const updateLanguage = async (langCode) => {
    if (langCode === user?.language) {
      setIsOpen(false);
      return;
    }

    try {
      setUpdating(true);

      // Update i18n language
      await i18n.changeLanguage(langCode);
      console.log("i18n language changed to:", langCode);

      // Update language in the backend
      const token = await AsyncStorage.getItem("token");
      const response = await axios.put(
        `${API_URL}/api/parent/update-language`,
        { language: langCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update user state with new language
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        console.log("Language updated in backend:", langCode);
      }

      // Also save the language preference to AsyncStorage for app restarts
      await AsyncStorage.setItem("userLanguage", langCode);

      setIsOpen(false);
    } catch (error) {
      console.error("Error updating language:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View className="mx-4 mt-6 relative">
      <Text className="text-lg font-bold text-gray-800">
        {t("Change Default language of App")}
      </Text>

      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="bg-white p-4 rounded-xl mt-2 shadow flex-row justify-between items-center border border-gray-400"
      >
        <View className="flex-row items-center">
          <Ionicons name="language" size={24} color="#3B82F6" />
          <Text className="text-gray-700 ml-3">
            {languages.find((lang) => lang.code === user?.language)?.name ||
              "English"}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={22}
          color="#888"
        />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={isOpen}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
          className="flex-1 justify-center items-center bg-black bg-opacity-30"
        >
          <View className="bg-white rounded-xl w-4/5 p-2 m-4">
            <Text className="text-center font-bold text-lg p-2 border-b border-gray-200">
              {t("Select Language")}
            </Text>

            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                onPress={() => updateLanguage(language.code)}
                className={`p-4 flex-row items-center justify-between border-b border-gray-100 ${
                  language.code === user?.language ? "bg-blue-50" : ""
                }`}
              >
                <Text
                  className={`${
                    language.code === user?.language
                      ? "text-blue-500 font-bold"
                      : "text-gray-700"
                  }`}
                >
                  {language.name}
                </Text>
                {language.code === user?.language && (
                  <Ionicons name="checkmark" size={18} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              className="mt-3 bg-gray-200 p-3 rounded-xl"
            >
              <Text className="text-center font-medium">{t("Cancel")}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {updating && (
        <View className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center rounded-xl">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
    </View>
  );
};

export default ProfileLangSelector;
