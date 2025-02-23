import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/authContext";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import CustomDropdown from "./components/customDropdown";
import useDropdown from "./components/useDropdown";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Input } from "~/components/ui/input";
import { useTranslation } from "react-i18next";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;
const EXPO_PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID;

const MAX_CHILDREN = 10;

const ParentRegistrationScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();

  const schoolDropdownHooks = Array(MAX_CHILDREN)
    .fill(null)
    .map(() => useDropdown());

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    relation: "father",
    children: [{ name: "", school: "", admissionNumber: "" }],
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const schools = useMemo(
    () => [
      {
        label: "Kendriya Vidyalaya, RK Puram, Delhi",
        value: "Kendriya Vidyalaya, RK Puram, Delhi",
      },
      {
        label: "Jawahar Navodaya Vidyalaya, Mumbai, Maharashtra",
        value: "Jawahar Navodaya Vidyalaya, Mumbai, Maharashtra",
      },
      {
        label: "Government Model School, Bangalore, Karnataka",
        value: "Government Model School, Bangalore, Karnataka",
      },
      {
        label: "Sarvodaya Vidyalaya, Chennai, Tamil Nadu",
        value: "Sarvodaya Vidyalaya, Chennai, Tamil Nadu",
      },

      {
        label: "Municipal Corporation School, Kolkata, West Bengal",
        value: "Municipal Corporation School, Kolkata, West Bengal",
      },
      {
        label: "Government Higher Secondary School, Pune, Maharashtra",
        value: "Government Higher Secondary School, Pune, Maharashtra",
      },
      {
        label: "State Board School, Jaipur, Rajasthan",
        value: "State Board School, Jaipur, Rajasthan",
      },

      {
        label: "Kendriya Vidyalaya, Patna, Bihar",
        value: "Kendriya Vidyalaya, Patna, Bihar",
      },
      {
        label: "Government Senior Secondary School, Bhopal, Madhya Pradesh",
        value: "Government Senior Secondary School, Bhopal, Madhya Pradesh",
      },
      {
        label: "Jawahar Navodaya Vidyalaya, Chandigarh",
        value: "Jawahar Navodaya Vidyalaya, Chandigarh",
      },
      {
        label: "Government Higher Secondary School, Shimla, Himachal Pradesh",
        value: "Government Higher Secondary School, Shimla, Himachal Pradesh",
      },
      {
        label: "Kendriya Vidyalaya, Ranchi, Jharkhand",
        value: "Kendriya Vidyalaya, Ranchi, Jharkhand",
      },

      {
        label: "Navyug School, Imphal, Manipur",
        value: "Navyug School, Imphal, Manipur",
      },
    ],
    []
  );

  const handleChange = useCallback(
    (name) => (value) => {
      setError("");
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleChildChange = useCallback((index, field, value) => {
    setError("");
    setFormData((prev) => {
      const newChildren = [...prev.children];
      newChildren[index] = {
        ...newChildren[index],
        [field]: value,
      };
      return {
        ...prev,
        children: newChildren,
      };
    });
  }, []);

  const addChild = useCallback(() => {
    if (formData.children.length < MAX_CHILDREN) {
      setFormData((prev) => ({
        ...prev,
        children: [
          ...prev.children,
          { name: "", school: "", admissionNumber: "" },
        ],
      }));
    }
  }, [formData.children.length]);

  const removeChild = useCallback(
    (index) => {
      if (formData.children.length > 1) {
        setFormData((prev) => ({
          ...prev,
          children: prev.children.filter((_, i) => i !== index),
        }));
        schoolDropdownHooks[index].toggleDropdown(false);
      }
    },
    [formData.children.length]
  );

  const renderChildFields = useCallback(
    (child, index) => {
      const { isOpen, dropdownAnimation, toggleDropdown } =
        schoolDropdownHooks[index];

      return (
        <View key={index} className="w-full mb-6 p-2 bg-gray-50 rounded-lg">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-700">
              {t("Child")} {index + 1}
            </Text>
            {formData.children.length > 1 && (
              <TouchableOpacity
                onPress={() => removeChild(index)}
                className="bg-red-100 p-2 rounded-full"
              >
                <MaterialIcons name="close" size={20} color="#dc2626" />
              </TouchableOpacity>
            )}
          </View>

          <View className="w-full mb-4">
            <Text className="text-base font-medium mb-1">
              {t("Child's Name")}
            </Text>
            <Input
              placeholder="Enter child's name"
              value={child.name}
              onChangeText={(value) => handleChildChange(index, "name", value)}
              editable={!isLoading}
              autoCapitalize="words"
              className="bg-white"
            />
          </View>

          <CustomDropdown
            label="School"
            value={child.school}
            options={schools}
            onSelect={(value) => handleChildChange(index, "school", value)}
            onClear={() => handleChildChange(index, "school", "")}
            isOpen={isOpen}
            toggleDropdown={toggleDropdown}
            dropdownAnimation={dropdownAnimation}
            disabled={isLoading}
            placeholder="Select school"
          />

          <View className="w-full mb-4">
            <Text className="text-base font-medium mb-1">
              {t("Admission Number")}
            </Text>
            <Input
              placeholder="Enter admission number"
              value={child.admissionNumber}
              onChangeText={(value) =>
                handleChildChange(index, "admissionNumber", value)
              }
              editable={!isLoading}
              className="bg-white"
            />
          </View>
        </View>
      );
    },
    [
      formData.children.length,
      handleChildChange,
      isLoading,
      removeChild,
      schools,
      schoolDropdownHooks,
    ]
  );

  const renderInputField = useCallback(
    (name, label, options = {}) => (
      <View className="w-full mb-4">
        <Text className="text-base font-medium mb-1">{t(label)}</Text>
        <Input
          placeholder={`Enter ${label.toLowerCase()}`}
          value={formData[name]}
          onChangeText={handleChange(name)}
          editable={!isLoading}
          className="bg-white"
          {...options}
        />
      </View>
    ),
    [formData, handleChange, isLoading]
  );

  const handleSubmit = async () => {
    const requiredFields = {
      name: "Parent name",
      email: "Email",
      password: "Password",
      phone: "Phone number",
      relation: "Relation",
    };

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field]) {
        setError(`${label} is required`);
        return;
      }
    }

    for (let i = 0; i < formData.children.length; i++) {
      const child = formData.children[i];
      if (!child.name || !child.school || !child.admissionNumber) {
        setError(`Please complete all fields for Child ${i + 1}`);
        return;
      }
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/parent/register`,
        formData
      );
      const { user, token } = response.data;

      await login(user, token);
      await registerForPushNotifications();
      router.replace("parent/(tabs)/home");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      console.error("Registration error:", err);
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

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLoginPress = () => {
    router.push("/login");
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
            source={require("../../assets/images/reg_logo.jpg")}
            className="w-full h-24 mb-5"
            resizeMode="contain"
          />

          <Text className="text-3xl font-bold text-blue-600 mb-5">
            {t("Registration")}
          </Text>

          <View className="w-full mb-4">
            <Text className="text-base font-medium mb-1">
              {t("I am the child's")}
            </Text>
            <View className="flex-row space-x-4">
              <TouchableOpacity
                onPress={() => handleChange("relation")("father")}
                className={`flex-1 py-2.5 rounded-md border ${
                  formData.relation === "father"
                    ? "bg-blue-50 border-blue-500"
                    : "border-gray-300"
                }`}
                disabled={isLoading}
              >
                <Text
                  className={`text-center text-base ${
                    formData.relation === "father"
                      ? "text-blue-600 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {t("Father")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleChange("relation")("mother")}
                className={`flex-1 py-2.5 rounded-md border ${
                  formData.relation === "mother"
                    ? "bg-blue-50 border-blue-500"
                    : "border-gray-300"
                }`}
                disabled={isLoading}
              >
                <Text
                  className={`text-center text-base ${
                    formData.relation === "mother"
                      ? "text-blue-600 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {t("Mother")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {renderInputField("name", "Parent Name", { autoCapitalize: "words" })}
          {renderInputField("email", "Email", {
            keyboardType: "email-address",
            autoCapitalize: "none",
            autoCorrect: false,
          })}
          {renderInputField("phone", "Phone Number", {
            keyboardType: "phone-pad",
          })}
          {renderInputField("password", "Password", { secureTextEntry: true })}

          <View className="w-full">
            <Text className="text-lg font-bold text-gray-700 mb-4">
              {t("Children Information")}
            </Text>
            {formData.children.map((child, index) =>
              renderChildFields(child, index)
            )}

            {formData.children.length < MAX_CHILDREN && (
              <TouchableOpacity
                onPress={addChild}
                className="flex-row items-center justify-center bg-blue-50 py-3 px-4 rounded-md mb-6"
              >
                <MaterialIcons
                  name="add-circle-outline"
                  size={24}
                  color="#2563eb"
                />
                <Text className="text-blue-600 font-medium ml-2">
                  {t("Add Another Child")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {error ? (
            <Text className="text-red-500 mb-2.5 text-center">{t(error)}</Text>
          ) : null}

          <TouchableOpacity
            className={`bg-blue-600 py-3 px-5 rounded-md w-full items-center ${
              isLoading ? "opacity-70" : ""
            }`}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-bold">
                {t("Register")}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLoginPress}
            className="mt-5"
            disabled={isLoading}
          >
            <Text className="text-base text-gray-600">
              {t("Already have an account")}
              {"? "}
              <Text className="text-blue-600 font-bold">{t("Login")}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ParentRegistrationScreen;
