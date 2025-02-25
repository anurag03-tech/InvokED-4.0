import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/authContext";
import axios from "axios";
import {
  MaterialIcons,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

const ClassroomDetail = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) {
      Alert.alert("Error", "No classroom ID provided");
      router.back();
      return;
    }
    fetchClassroomDetails();
  }, [params.id]);

  const fetchClassroomDetails = async () => {
    try {
      //console.log("Fetching classroom with ID:", params.id);
      const response = await axios.get(
        `${API_URL}/api/classroom/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setClassroom(response.data.classroom);
      } else {
        Alert.alert(
          "Error",
          response.data.message || "Failed to fetch classroom details"
        );
      }
    } catch (error) {
      console.error("Error fetching classroom details:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to fetch classroom details";
      Alert.alert("Error", errorMessage);
      if (error.response?.status === 404) {
        router.back();
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToFeature = (feature) => {
    router.push({
      pathname: `./${feature}`,
      params: {
        id: params.id,
        subject: classroom.subject,
        grade: classroom.grade,
        section: classroom.section,
      },
    });
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

  // Select header background color based on class teacher status
  const headerBgColor = classroom.classTeacher ? "bg-blue-700" : "bg-blue-700";

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Enhanced Header Section */}
      <View className={`${headerBgColor} rounded-b-xl shadow-md p-6`}>
        {classroom.classTeacher && (
          <View className="absolute top-3 right-4 bg-yellow-400 rounded-full px-3 py-1 z-10 flex-row items-center">
            <MaterialIcons name="stars" size={16} color="#7c2d12" />
            <Text className="text-xs font-bold text-amber-900 ml-1">
              Class Teacher
            </Text>
          </View>
        )}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-white mb-1">
              Class {classroom.grade} - {classroom.section}
            </Text>
            <Text className="text-xl text-blue-100">{classroom.subject}</Text>
          </View>
        </View>

        <View className="flex-row mt-2 justify-between gap-2">
          <View className="bg-blue-500 rounded-lg p-2 flex-row items-center flex-1  justify-center">
            <FontAwesome5 name="users" size={18} color="#e0f2fe" />
            <View className="ml-3 flex-row gap-4 justify-center items-center">
              <Text className="text-white">Students</Text>
              <Text className="text-white font-bold text-lg">
                {classroom.students?.length || 0}
              </Text>
            </View>
          </View>
          <View className="bg-blue-500 rounded-lg p-2 flex-row items-center flex-1  justify-center">
            <MaterialIcons name="assignment" size={20} color="#e0f2fe" />
            <View className="ml-3 flex-row gap-4 justify-center items-center">
              <Text className="text-white">Assignments</Text>
              <Text className="text-white font-bold text-lg">
                {classroom.assignments?.length || 0}
              </Text>
            </View>
          </View>
        </View>

        {classroom.classTeacher && (
          <TouchableOpacity
            onPress={() => navigateToFeature("attendance")}
            className="mt-4 bg-white/90 rounded-lg p-3 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <MaterialIcons name="event-available" size={22} color="#1d4ed8" />
              <Text className="ml-3 font-semibold text-blue-900">
                Today's Attendance
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#1d4ed8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions Grid */}
      <View className="p-4">
        <Text className="text-xl font-bold text-gray-800 mb-4">
          Classroom Management
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {/* Announcements */}

          <TouchableOpacity
            className="bg-white w-[48%] p-2 rounded-xl mb-4 shadow-sm border border-blue-200"
            onPress={() => navigateToFeature("announcement")}
          >
            <View className="items-center">
              <MaterialIcons name="campaign" size={28} color="#3b82f6" />
              <Text className="text-center font-semibold mt-2">
                Announcements
              </Text>
              <Text className="text-center text-gray-500 text-sm">
                Class updates
              </Text>
            </View>
          </TouchableOpacity>

          {/* Assignments */}
          <TouchableOpacity
            className="bg-white w-[48%] p-4 rounded-xl mb-4 shadow-sm border border-blue-200"
            onPress={() => navigateToFeature("assignment")}
          >
            <View className="items-center">
              <Ionicons name="book" size={28} color="#3b82f6" />
              <Text className="text-center font-semibold mt-2">
                Assignments
              </Text>
              <Text className="text-center text-gray-500 text-sm">
                Tasks & homework
              </Text>
            </View>
          </TouchableOpacity>

          {/* Marks */}
          <TouchableOpacity
            className="bg-white w-[48%] p-4 rounded-xl mb-4 shadow-sm border border-blue-200"
            onPress={() => navigateToFeature("marks")}
          >
            <View className="items-center">
              <MaterialCommunityIcons
                name="trophy-award"
                size={28}
                color="#3b82f6"
              />
              <Text className="text-center font-semibold mt-2">Marks</Text>
              <Text className="text-center text-gray-500 text-sm">
                Upload scores
              </Text>
            </View>
          </TouchableOpacity>

          {/* Remarks */}
          <TouchableOpacity
            className="bg-white w-[48%] p-4 rounded-xl mb-4 shadow-sm border border-blue-200"
            onPress={() => navigateToFeature("remark")}
          >
            <View className="items-center">
              <MaterialIcons name="comment" size={28} color="#3b82f6" />
              <Text className="text-center font-semibold mt-2">Remarks</Text>
              <Text className="text-center text-gray-500 text-sm">
                Student feedback
              </Text>
            </View>
          </TouchableOpacity>

          {/* Time Table - Only visible to class teacher */}
          {classroom.classTeacher && (
            <TouchableOpacity
              className="bg-white w-[48%] p-4 rounded-xl mb-4 shadow-sm border border-blue-200"
              onPress={() => navigateToFeature("timetable")}
            >
              <View className="items-center">
                <Ionicons name="time" size={28} color="#3b82f6" />
                <Text className="text-center font-semibold mt-2">
                  Time Table
                </Text>
                <Text className="text-center text-gray-500 text-sm">
                  Class schedule
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Student List */}
          <TouchableOpacity
            className={`bg-white ${
              classroom.classTeacher ? "w-[48%]" : "w-full"
            } p-4 rounded-xl mb-4 shadow-sm border border-blue-200`}
            onPress={() => navigateToFeature("student")}
          >
            <View className="items-center">
              <FontAwesome5 name="users" size={24} color="#3b82f6" />
              <Text className="text-center font-semibold mt-2">Students</Text>
              <Text className="text-center text-gray-500 text-sm">
                Manage students
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default ClassroomDetail;
