import React, { useState } from "react";
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
import axios from "axios";
import CustomDropdown from "./components/customDropdown";
import useDropdown from "./components/useDropdown";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

const RegisterScreen = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    school: "",
    // employeeId: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const schoolDropdown = useDropdown();

  const schools = [
    { label: "Delhi Public School", value: "Delhi Public School" },
    { label: "St. Mary's School", value: "St. Mary's School" },
    { label: "Modern School", value: "Modern School" },
    { label: "Ryan International", value: "Ryan International" },
    { label: "Cambridge International", value: "Cambridge International" },
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

    // if (!formData.employeeId.trim()) {
    //   setError("Employee ID is required");
    //   return;
    // }

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
      <TextInput
        className="border border-gray-300 rounded-md p-2.5 text-base w-full"
        placeholder={`Enter ${label.toLowerCase()}`}
        value={formData[name]}
        onChangeText={handleChange(name)}
        editable={!isLoading}
        {...options}
      />
    </View>
  );

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
            style={{ width: 450, height: 110 }}
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

          <View className="w-full ">
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

          {/* {renderInputField("employeeId", "Employee ID")} */}

          {error ? (
            <Text className="text-red-500 mb-2.5 text-center">{error}</Text>
          ) : null}

          <TouchableOpacity
            className={`bg-blue-600 py-3 px-5 rounded-md w-full items-center mt-2${
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
