import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
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

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;
const EXPO_PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID;

const MAX_CHILDREN = 10;

const ParentRegistrationScreen = () => {
  const router = useRouter();
  const { login } = useAuth();

  // Create fixed number of dropdown hooks upfront
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
      { label: "Delhi Public School", value: "Delhi Public School" },
      { label: "St. Mary's School", value: "St. Mary's School" },
      { label: "Modern School", value: "Modern School" },
      { label: "Ryan International", value: "Ryan International" },
      { label: "Cambridge International", value: "Cambridge International" },
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
        // Reset the dropdown state for removed child
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
        <View key={index} className="w-full mb-6 p-4 bg-gray-50 rounded-lg">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-700">
              Child {index + 1}
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
            <Text className="text-base font-medium mb-1">Child's Name</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2.5 text-base w-full bg-white"
              placeholder="Enter child's name"
              value={child.name}
              onChangeText={(value) => handleChildChange(index, "name", value)}
              editable={!isLoading}
              autoCapitalize="words"
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
            <Text className="text-base font-medium mb-1">Admission Number</Text>
            <TextInput
              className="border border-gray-300 rounded-md p-2.5 text-base w-full bg-white"
              placeholder="Enter admission number"
              value={child.admissionNumber}
              onChangeText={(value) =>
                handleChildChange(index, "admissionNumber", value)
              }
              editable={!isLoading}
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
        <Text className="text-base font-medium mb-1">{label}</Text>
        <TextInput
          className="border border-gray-300 rounded-md p-2.5 text-base w-full"
          placeholder={`Enter ${label.toLowerCase()}`}
          value={formData[name]}
          onChangeText={handleChange(name)}
          editable={!isLoading}
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

    // Validate children data
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

      // Register for push notifications after successful registration
      try {
        await registerForPushNotifications();
      } catch (pushError) {
        console.error("Push notification registration error:", pushError);
        // Continue with registration flow even if push registration fails
      }

      router.replace("parent/(tabs)/home");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to register for push notifications (same as in login)
  const registerForPushNotifications = async () => {
    try {
      // Check for existing permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If not already granted, request permission
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // If permission not granted, exit
      if (finalStatus !== "granted") {
        console.log("Notification permission not granted");
        return;
      }

      // Get Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EXPO_PROJECT_ID,
      });

      console.log("Push token obtained on registration:", tokenData.data);

      // Store token in AsyncStorage
      await AsyncStorage.setItem("expoPushToken", tokenData.data);

      // Send token to server
      await axios.put(`${API_URL}/api/parent/push-token`, {
        pushToken: tokenData.data,
      });
    } catch (error) {
      console.error(
        "Error registering for push notifications during registration:",
        error
      );
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
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
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
            className="w-50 h-25 mb-5"
            style={{ width: 350, height: 100 }}
          />

          <Text className="text-3xl font-bold text-blue-600 mb-5">
            Registration
          </Text>

          <View className="w-full mb-4">
            <Text className="text-base font-medium mb-1">I am the child's</Text>
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
                  Father
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
                  Mother
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
              Children Information
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
                  Add Another Child
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {error ? (
            <Text className="text-red-500 mb-2.5 text-center">{error}</Text>
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
              <Text className="text-white text-lg font-bold">Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLoginPress}
            className="mt-5"
            disabled={isLoading}
          >
            <Text className="text-base text-gray-600">
              Already have an account?{" "}
              <Text className="text-blue-600 font-bold">Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ParentRegistrationScreen;
