import React, { useState } from "react";
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
import axios from "axios";
import CustomDropdown from "./components/customDropdown";
import useDropdown from "./components/useDropdown";
import { Input } from "~/components/ui/input";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

const RegisterScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    school: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const schoolDropdown = useDropdown();

  const schools = [
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
  ];

  const handleChange = (name) => (value) => {
    setError("");
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!formData.school) {
      setError("Please select a school");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/api/teacher/register`,
        formData
      );
      console.log("Registration response:", response.data);
      const { user, token } = response.data;

      await login(user, token);
      router.replace("teacher/(tabs)/home");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      console.error("Registration error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginPress = () => {
    router.push("/login");
  };

  const renderInputField = (name, label, options = {}) => (
    <View key={name} className="w-full mb-4">
      <Text className="text-base font-medium mb-1">{label}</Text>
      <Input
        placeholder={`Enter ${label.toLowerCase()}`}
        value={formData[name]}
        onChangeText={handleChange(name)}
        editable={!isLoading}
        className="bg-white"
        {...options}
      />
    </View>
  );

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
            className="w-full h-28 mb-5"
            resizeMode="contain"
          />

          <Text className="text-3xl font-bold text-blue-600 mb-5">
            Register
          </Text>

          {renderInputField("name", "Name", { autoCapitalize: "words" })}
          {renderInputField("email", "Email", {
            keyboardType: "email-address",
            autoCapitalize: "none",
            autoCorrect: false,
          })}
          {renderInputField("password", "Password", { secureTextEntry: true })}

          <View className="w-full">
            <CustomDropdown
              label="School"
              value={formData.school}
              options={schools}
              onSelect={handleChange("school")}
              onClear={() => handleChange("school")("")}
              isOpen={schoolDropdown.isOpen}
              toggleDropdown={schoolDropdown.toggleDropdown}
              dropdownAnimation={schoolDropdown.dropdownAnimation}
              disabled={isLoading}
              placeholder="Select your school"
            />
          </View>

          {error ? (
            <Text className="text-red-500 mb-2.5 text-center">{error}</Text>
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
              <Text className="text-white text-lg font-bold">Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLoginPress}
            className="mt-5"
            disabled={isLoading}
          >
            <View className="flex-row">
              <Text className="text-base text-gray-600">
                Already have an account?{" "}
              </Text>
              <Text className="text-base text-blue-600 font-bold">Login</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;
