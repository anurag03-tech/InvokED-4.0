import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/authContext";
import axios from "axios";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Input } from "~/components/ui/input";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;
const EXPO_PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID;

const Login = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, role } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (name) => (value) => {
    setError("");
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.email.trim() || !formData.password.trim()) {
      setError("All fields are required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      if (role === "teacher") {
        const response = await axios.post(
          `${API_URL}/api/teacher/login`,
          formData
        );
        const { user, token } = response.data;

        // Set language using the proper method
        if (user && user.language) {
          console.log("Setting language to:", user.language);
          i18n.changeLanguage(user.language);
          // Also store it for app restarts
          await AsyncStorage.setItem("userLanguage", user.language);
        }

        await login(user, token);
        router.replace("teacher/(tabs)/home");
      } else if (role === "parent") {
        const response = await axios.post(
          `${API_URL}/api/parent/login`,
          formData
        );
        const { user, token } = response.data;

        // Set language using the proper method
        if (user && user.language) {
          console.log("Setting language to:", user.language);
          i18n.changeLanguage(user.language);
          // Also store it for app restarts
          await AsyncStorage.setItem("userLanguage", user.language);
        }

        await login(user, token);
        await registerForPushNotifications();
        router.replace("parent/(tabs)/home");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  const registerForPushNotifications = async () => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Notification permission not granted");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EXPO_PROJECT_ID,
      });

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
        });
      }

      await AsyncStorage.setItem("expoPushToken", tokenData.data);
      await axios.put(`${API_URL}/api/parent/push-token`, {
        pushToken: tokenData.data,
      });
    } catch (error) {
      console.error("Error registering for push notifications:", error);
      throw error;
    }
  };

  const handleRegisterPress = () => {
    if (role === "teacher") {
      router.push("/registerTeacher");
    } else if (role === "parent") {
      router.push("/registerParent");
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View className="items-center w-full">
          <Image
            source={require("../../assets/images/logo.jpg")}
            className="w-64 h-64 mb-10"
          />

          <Text className="text-3xl font-bold text-blue-600 mb-5">
            {t("Login")}
          </Text>

          <View className="w-full gap-y-2">
            <View>
              <Text className="text-base font-medium mb-1">{t("Email")}</Text>
              <Input
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={formData.email}
                onChangeText={handleChange("email")}
                editable={!isLoading}
                className="bg-white"
              />
            </View>

            <View>
              <Text className="text-base font-medium mb-1">
                {t("Password")}
              </Text>
              <Input
                placeholder="Enter your password"
                secureTextEntry
                value={formData.password}
                onChangeText={handleChange("password")}
                editable={!isLoading}
                className="bg-white"
              />
            </View>
          </View>

          {error ? (
            <Text className="text-red-500 mt-2 mb-2 text-center">
              {t(error)}
            </Text>
          ) : null}

          <TouchableOpacity
            className={`bg-blue-600 py-3 px-5 rounded-md w-full items-center mt-4 ${
              isLoading ? "opacity-70" : ""
            }`}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-bold">{t("Login")}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRegisterPress}
            className="mt-5"
            disabled={isLoading}
          >
            <Text className="text-base text-gray-600">
              {t("Don't have an account")}
              {"? "}
              <Text className="text-blue-600 font-bold">{t("Register")}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;
