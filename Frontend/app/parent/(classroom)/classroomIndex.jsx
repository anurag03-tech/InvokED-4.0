import React, { useState } from "react";
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
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useClassroom } from "../../hook/useClassroom";
import renderMarksSection from "../EnhancedMarksSection";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;
const SECTION_HEIGHT = 300;

export default function ClassroomDetail() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState("announcements");

  // Use the custom hook instead of local state and useEffect
  const { classroom, loading, isOnline } = useClassroom(
    params.id,
    token,
    API_URL
  );

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
                No announcements yet
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
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-500 italic p-4">
                No assignments yet
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
        <Text className="text-xl text-gray-600">Classroom not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Offline Banner */}
      {!isOnline && (
        <View className="bg-yellow-500 px-4 py-2">
          <Text className="text-white text-center">
            Offline Mode - Some data may not be up to date
          </Text>
        </View>
      )}

      {/* Header Section */}
      <View className="bg-blue-600 px-6 py-3">
        <Text className="text-2xl font-bold text-white mb-1">
          Subject - {classroom.subject}
        </Text>
        <Text className="text-lg text-white">
          Teacher: {classroom.teacher?.name}
        </Text>
        <Text className="text-white mt-1">
          Class {classroom.grade} - {classroom.section}
        </Text>
      </View>

      {/* Navigation Buttons */}
      <View className="flex-row justify-between px-4 pt-2">
        <TouchableOpacity
          className={`flex-1 items-center py-3 mx-1 rounded-lg ${
            activeSection === "announcements" ? "bg-blue-500" : "bg-gray-200"
          }`}
          onPress={() => setActiveSection("announcements")}
        >
          <MaterialIcons
            name="announcement"
            size={24}
            color={activeSection === "announcements" ? "white" : "#4B5563"}
          />
          <Text
            className={`text-sm mt-1 ${
              activeSection === "announcements" ? "text-white" : "text-gray-600"
            }`}
          >
            Announcements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 items-center py-3 mx-1 rounded-lg ${
            activeSection === "assignments" ? "bg-blue-500" : "bg-gray-200"
          }`}
          onPress={() => setActiveSection("assignments")}
        >
          <FontAwesome5
            name="tasks"
            size={24}
            color={activeSection === "assignments" ? "white" : "#4B5563"}
          />
          <Text
            className={`text-sm mt-1 ${
              activeSection === "assignments" ? "text-white" : "text-gray-600"
            }`}
          >
            Assignments
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
            Marks
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View className="flex-1 p-3">{renderSection()}</View>

      {/* Teacher Remarks Button */}
      <View className="p-3 border-t border-gray-200 bg-white">
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
          <MaterialIcons name="comment" size={24} color="white" />
          <Text className="text-white font-semibold ml-2">Teacher Remarks</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
