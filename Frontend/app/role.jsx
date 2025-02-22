import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from "react-native";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";
import { useRouter } from "expo-router";
import { useAuth } from "./context/authContext";
import { useTranslation } from "react-i18next";

const CustomButton = ({
  onPress,
  title,
  image,
  variant = "outline",
  className,
  t,
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`
      p-4 rounded-xl flex-row items-center justify-between border-2 
      ${
        variant === "outline"
          ? "bg-white border-blue-500"
          : "bg-blue-500 border-blue-500"
      }
      ${className}
      shadow-lg mb-4
    `}
  >
    <View className="w-1/3 pr-4">
      <Image
        source={image}
        className="w-full h-32 rounded-xl"
        resizeMode="cover"
      />
    </View>
    <View className="flex-1">
      <Text
        className={`
          text-xl font-bold tracking-tight
          ${variant === "outline" ? "text-blue-600" : "text-white"}
        `}
      >
        {t(title)}
      </Text>
      <Text
        className={`
          text-sm mt-2
          ${variant === "outline" ? "text-gray-600" : "text-white"}
        `}
      >
        {t(
          variant === "outline" ? "Click to select this role" : "Role selected"
        )}
      </Text>
    </View>
  </TouchableOpacity>
);

const Role = () => {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState(null);
  const router = useRouter();
  const { setUserRole } = useAuth();

  const handleRoleSelection = (role) => {
    setSelectedRole(role);
  };

  const handleNext = async () => {
    if (selectedRole) {
      try {
        await setUserRole(selectedRole);
        console.log("Selected Role stored: ", selectedRole);
        router.push("/(auth)/login");
      } catch (error) {
        console.error("Error storing role:", error);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-6 pt-12 pb-8 justify-between">
        {/* Header Section */}
        <View className="items-center">
          <Text className="text-4xl font-extrabold text-blue-600 mb-4 tracking-tighter">
            {t("Get Started")}
          </Text>
          <Text className="text-lg font-medium text-gray-600 text-center mb-12">
            {t("Let's make learning engaging together")}
          </Text>
        </View>

        {/* Role Selection Section */}
        <View className="flex-1 justify-center w-full">
          <View className="px-2">
            <CustomButton
              title="Teacher"
              image={require("../assets/images/teacher.jpg")}
              variant={selectedRole === "teacher" ? "default" : "outline"}
              onPress={() => handleRoleSelection("teacher")}
              className="w-full"
              t={t}
            />
            <CustomButton
              title="Parent"
              image={require("../assets/images/parent.jpg")}
              variant={selectedRole === "parent" ? "default" : "outline"}
              onPress={() => handleRoleSelection("parent")}
              className="w-full"
              t={t}
            />
          </View>

          {selectedRole && (
            <Text className="text-lg text-blue-600 mt-6 font-semibold text-center">
              {t("Selected")}:{" "}
              {t(selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1))}
            </Text>
          )}
        </View>

        {/* Next Button Section */}
        <View className="items-center">
          <Button
            size="lg"
            variant="destructive"
            onPress={handleNext}
            disabled={!selectedRole}
            className="mt-4 mb-5 w-11/12 bg-blue-500 active:bg-blue-400 disabled:opacity-50 rounded-md"
          >
            <Text className="text-white font-bold text-lg">{t("Next")}</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Role;
