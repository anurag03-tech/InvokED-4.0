import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/authContext";
import { useNotification } from "../../context/notificationContext";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useClassroom } from "../../hook/useClassroom";
import renderMarksSection from "../EnhancedMarksSection";
import { useTranslation } from "react-i18next";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;
const SECTION_HEIGHT = 300;

export default function ClassroomDetail() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { notifications, markAsRead } = useNotification();

  // Get activeSection from params or default to announcements
  const [activeSection, setActiveSection] = useState(
    params.activeSection || "announcements"
  );

  // Use the custom hook instead of local state and useEffect
  const { classroom, loading, isOnline } = useClassroom(
    params.id,
    token,
    API_URL
  );

  // Get unread notifications count for this classroom
  const getUnreadCount = (sectionType) => {
    if (!notifications || !classroom) return 0;

    return notifications.filter(
      (notification) =>
        !notification.isRead &&
        notification.classroom?._id === classroom._id &&
        notification.type === sectionType
    ).length;
  };

  // Mark notifications as read when viewing section
  useEffect(() => {
    if (activeSection && classroom) {
      const notificationsToMark = notifications.filter(
        (notification) =>
          !notification.isRead &&
          notification.classroom?._id === classroom._id &&
          notification.type === activeSection
      );

      notificationsToMark.forEach((notification) => {
        markAsRead(notification._id);
      });
    }
  }, [activeSection, classroom, notifications]);

  // Error handling for missing ID
  if (!params.id) {
    Alert.alert("Error", "No classroom ID provided");
    router.back();
    return null;
  }

  const renderSection = () => {
    switch (activeSection) {
      case "announcements":
        return (
          <ScrollView
            className="bg-white rounded-lg p-2"
            style={{ height: SECTION_HEIGHT }}
          >
            {classroom?.announcements?.length > 0 ? (
              classroom.announcements.map((announcement) => (
                <View
                  key={announcement._id}
                  className="p-4 mb-3 bg-blue-50 rounded-lg"
                >
                  <Text className="font-semibold text-gray-800 mb-1">
                    {announcement.title}
                  </Text>
                  <Text className="text-gray-600">{announcement.content}</Text>
                  <Text className="text-gray-400 text-sm mt-2">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-500 italic p-4">
                {t("No announcements yet")}
              </Text>
            )}
          </ScrollView>
        );

      case "assignments":
        return (
          <ScrollView
            className="bg-white rounded-lg p-2"
            style={{ height: SECTION_HEIGHT }}
          >
            {classroom?.assignments?.length > 0 ? (
              classroom.assignments.map((assignment) => (
                <View
                  key={assignment._id}
                  className="p-4 mb-3 bg-blue-50 rounded-lg"
                >
                  <Text className="font-semibold text-gray-800 mb-1">
                    {assignment.title}
                  </Text>
                  <Text className="text-gray-600 mb-2">
                    {assignment.description}
                  </Text>
                  <Text className="text-blue-600">
                    {t("Due")}:{" "}
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-500 italic p-4">
                {t("No assignments yet")}
              </Text>
            )}
          </ScrollView>
        );

      case "marks":
        // Use the enhanced marks section component
        return renderMarksSection(classroom);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!classroom) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-xl text-gray-600">
          {t("Classroom not found")}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Offline Banner */}
      {!isOnline && (
        <View className="bg-yellow-500 px-4 py-2">
          <Text className="text-white text-center">
            {t("Offline Mode - Some data may not be up to date")}
          </Text>
        </View>
      )}

      {/* Header Section */}
      <View className="bg-blue-600 p-6">
        <Text className="text-2xl font-bold text-white mb-2">
          {t("Grade")} {classroom.grade} - {t("Section")} {classroom.section}
        </Text>
        <Text className="text-lg text-white">
          {t("Subject")}: {classroom.subject}
        </Text>
        <Text className="text-white mt-2">
          {t("Teacher")}: {classroom.teacher?.name}
        </Text>
      </View>

      {/* Navigation Buttons */}
      <View className="flex-row justify-between px-4 py-2">
        <TouchableOpacity
          className={`flex-1 items-center py-3 mx-1 rounded-lg ${
            activeSection === "announcements" ? "bg-blue-500" : "bg-gray-200"
          }`}
          onPress={() => setActiveSection("announcements")}
        >
          <View className="relative">
            <MaterialIcons
              name="announcement"
              size={24}
              color={activeSection === "announcements" ? "white" : "#4B5563"}
            />
            {getUnreadCount("announcement") > 0 && (
              <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {getUnreadCount("announcement")}
                </Text>
              </View>
            )}
          </View>
          <Text
            className={`text-sm mt-1 ${
              activeSection === "announcements" ? "text-white" : "text-gray-600"
            }`}
          >
            {t("Announcements")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 items-center py-3 mx-1 rounded-lg ${
            activeSection === "assignments" ? "bg-blue-500" : "bg-gray-200"
          }`}
          onPress={() => setActiveSection("assignments")}
        >
          <View className="relative">
            <FontAwesome5
              name="tasks"
              size={24}
              color={activeSection === "assignments" ? "white" : "#4B5563"}
            />
            {getUnreadCount("assignment") > 0 && (
              <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {getUnreadCount("assignment")}
                </Text>
              </View>
            )}
          </View>
          <Text
            className={`text-sm mt-1 ${
              activeSection === "assignments" ? "text-white" : "text-gray-600"
            }`}
          >
            {t("Assignments")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 items-center py-3 mx-1 rounded-lg ${
            activeSection === "marks" ? "bg-blue-500" : "bg-gray-200"
          }`}
          onPress={() => setActiveSection("marks")}
        >
          <Ionicons
            name="newspaper"
            size={24}
            color={activeSection === "marks" ? "white" : "#4B5563"}
          />
          <Text
            className={`text-sm mt-1 ${
              activeSection === "marks" ? "text-white" : "text-gray-600"
            }`}
          >
            {t("Marks")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View className="flex-1 p-4">{renderSection()}</View>

      {/* Teacher Remarks Button */}
      <View className="p-4 border-t border-gray-200 bg-white">
        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-lg flex-row justify-center items-center"
          onPress={() =>
            router.push({
              pathname: "./remarks",
              params: {
                id: params.id,
                subject: classroom.subject,
                grade: classroom.grade,
                section: classroom.section,
              },
            })
          }
        >
          <View className="relative">
            <MaterialIcons name="comment" size={24} color="white" />
            {getUnreadCount("remark") > 0 && (
              <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {getUnreadCount("remark")}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-white font-semibold ml-2">
            {t("Teacher Remarks")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
