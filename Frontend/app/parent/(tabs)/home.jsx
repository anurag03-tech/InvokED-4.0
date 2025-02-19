import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/authContext";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadData();
    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);
    return () => unsubscribe();
  }, []);

  const handleConnectivityChange = async (state) => {
    setIsOnline(state.isConnected);
    if (state.isConnected) {
      await syncData();
    }
  };

  const loadData = async () => {
    // Try to load cached data first
    const cachedData = await loadCachedData();
    if (cachedData) {
      setProfileData(cachedData);
      setIsLoading(false);
    }

    // Check network status
    const networkState = await NetInfo.fetch();
    setIsOnline(networkState.isConnected);

    if (networkState.isConnected) {
      await fetchParentProfile();
    }
  };

  const loadCachedData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("parentProfile");
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error("Error loading cached data:", error);
      return null;
    }
  };

  const syncData = async () => {
    try {
      await fetchParentProfile();
    } catch (error) {
      console.error("Error syncing data:", error);
    }
  };

  const fetchParentProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/parent/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const newProfileData = response.data.parent;

      // Save to local storage
      await AsyncStorage.setItem(
        "parentProfile",
        JSON.stringify(newProfileData)
      );

      setProfileData(newProfileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAttendance = (student) => {
    const classTeacherRoom = student.classrooms.find(
      (classroom) => classroom.classTeacher === true
    );

    if (!classTeacherRoom) return null;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const studentAttendance = classTeacherRoom.attendance.filter((record) => {
      const recordDate = new Date(record.date);
      return (
        recordDate.getMonth() === currentMonth &&
        recordDate.getFullYear() === currentYear &&
        (record.studentId?._id?.toString() === student._id?.toString() ||
          record.studentId?.toString() === student._id?.toString())
      );
    });

    const totalDays = studentAttendance.length;
    const presentDays = studentAttendance.filter(
      (record) => record.status === "present"
    ).length;

    return {
      totalDays,
      presentDays,
      percentage: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
      classTeacherInfo: {
        teacherName: classTeacherRoom.teacher?.name,
        grade: classTeacherRoom.grade,
        section: classTeacherRoom.section,
        announcements: classTeacherRoom.announcements || [],
      },
    };
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!profileData?.students?.length) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-500">No students found</Text>
      </View>
    );
  }

  const currentStudent = profileData.students[currentStudentIndex];
  const dashboardData = calculateAttendance(currentStudent);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: 20,
      }}
    >
      {/* Student Selector */}
      {profileData.students.length > 1 && (
        <View className="flex-row p-4 bg-white">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {profileData.students.map((student, index) => (
              <TouchableOpacity
                key={student._id}
                className={`px-4 py-2 rounded-full mr-2 ${
                  index === currentStudentIndex ? "bg-blue-600" : "bg-gray-200"
                }`}
                onPress={() => setCurrentStudentIndex(index)}
              >
                <Text
                  className={`${
                    index === currentStudentIndex
                      ? "text-white"
                      : "text-gray-600"
                  }`}
                >
                  {student.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Welcome Header with Offline Indicator */}
      <View className="bg-blue-600 p-6">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-white">
              Welcome, {user?.name}
            </Text>
            <Text className="text-white mt-2">
              Viewing: {currentStudent.name}'s Dashboard
            </Text>
          </View>
          {!isOnline && (
            <View className="bg-yellow-500 px-3 py-1 rounded-full">
              <Text className="text-white text-sm">Offline</Text>
            </View>
          )}
        </View>
      </View>

      {/* Dashboard Section */}
      {dashboardData && (
        <View>
          {/* Attendance Card */}
          <View className="mx-4 my-4">
            <View className="bg-white rounded-lg shadow-sm p-4">
              <View className="flex-row items-center mb-4">
                <FontAwesome5 name="user-check" size={20} color="#3b82f6" />
                <Text className="text-lg font-bold text-gray-800 ml-2">
                  Monthly Attendance
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <View className="items-center">
                  <Text className="text-gray-600">Total Days</Text>
                  <Text className="text-2xl font-bold text-gray-800">
                    {dashboardData.totalDays}
                  </Text>
                </View>

                <View className="items-center">
                  <Text className="text-gray-600">Present</Text>
                  <Text className="text-2xl font-bold text-gray-800">
                    {dashboardData.presentDays}
                  </Text>
                </View>

                <View className="items-center">
                  <Text className="text-gray-600">Attendance</Text>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      dashboardData.percentage >= 90
                        ? "bg-green-500"
                        : dashboardData.percentage >= 75
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  >
                    <Text className="text-white font-bold">
                      {dashboardData.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Class Teacher Announcements */}
          {dashboardData.classTeacherInfo && (
            <View className="mx-4 mb-4">
              <View className="bg-white rounded-lg shadow-sm p-4">
                <View className="flex-row items-center mb-4">
                  <MaterialIcons name="campaign" size={24} color="#3b82f6" />
                  <Text className="text-lg font-bold text-gray-800 ml-2">
                    Class Teacher Announcements
                  </Text>
                </View>

                <ScrollView className="max-h-60">
                  {dashboardData.classTeacherInfo.announcements.length > 0 ? (
                    dashboardData.classTeacherInfo.announcements.map(
                      (announcement) => (
                        <View
                          key={announcement._id}
                          className="p-4 mb-3 bg-blue-50 rounded-lg"
                        >
                          <Text className="font-semibold text-gray-800 mb-1">
                            {announcement.title}
                          </Text>
                          <Text className="text-gray-600">
                            {announcement.content}
                          </Text>
                          <Text className="text-gray-400 text-sm mt-2">
                            {new Date(
                              announcement.createdAt
                            ).toLocaleDateString()}
                          </Text>
                        </View>
                      )
                    )
                  ) : (
                    <Text className="text-gray-500 italic p-4">
                      No announcements from class teacher
                    </Text>
                  )}
                </ScrollView>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Classrooms List */}
      <View className="mx-4">
        <Text className="text-xl font-semibold text-gray-800 mb-3">
          {currentStudent.name}'s Classrooms
        </Text>

        {currentStudent.classrooms?.length > 0 ? (
          currentStudent.classrooms.map((classroom) => (
            <TouchableOpacity
              key={classroom._id}
              className={`p-4 rounded-lg shadow-sm mb-4 ${
                classroom.classTeacher
                  ? "bg-blue-50 border-2 border-blue-200"
                  : "bg-white"
              }`}
              onPress={() =>
                router.push({
                  pathname: "../(classroom)/classroomIndex",
                  params: {
                    id: classroom._id,
                    subject: classroom.subject,
                    grade: classroom.grade,
                    section: classroom.section,
                  },
                })
              }
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <View className="flex-row items-center">
                    <Text className="text-lg font-semibold text-gray-800">
                      {classroom.subject}
                    </Text>
                    {classroom.classTeacher && (
                      <View className="ml-2 px-2 py-1 bg-blue-100 rounded-full">
                        <Text className="text-xs text-blue-600 font-medium">
                          Class Teacher
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-600">
                    Class {classroom.grade} - {classroom.section}
                  </Text>
                  <Text className="text-gray-500">
                    Teacher: {classroom.teacher?.name}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#3b82f6" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-gray-500 italic">
            No classrooms assigned yet
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
