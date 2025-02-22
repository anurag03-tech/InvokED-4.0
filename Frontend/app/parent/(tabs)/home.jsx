import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import axios from "axios";
import { ParentDashboardHeader } from "../components/ParentDashboardHeader";
import { StudentDashboardTabs } from "../components/StudentDashboardTabs";
import { ClassroomsList } from "../components/ClassroomsList";
import { useTranslation } from "react-i18next";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState("timetable");

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
    const cachedData = await loadCachedData();
    if (cachedData) {
      setProfileData(cachedData);
      setIsLoading(false);
    }

    const networkState = await NetInfo.fetch();
    setIsOnline(networkState.isConnected);

    if (networkState.isConnected) {
      await fetchParentProfile();
    }
  };

  const loadCachedData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("parentProfile");
      console.log("jsonValue", jsonValue);
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
      console.log("newProfileData", newProfileData);

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

  const renderTimetableTab = (student) => {
    const classTeacherRoom = student.classrooms.find(
      (classroom) => classroom.classTeacher === true
    );

    if (!classTeacherRoom?.timetable?.image) {
      return (
        <View className="items-center justify-center p-8">
          <Text className="text-gray-500">{t("No timetable available")}</Text>
        </View>
      );
    }

    return (
      <View className="">
        <Image
          source={{
            uri: `data:image/jpeg;base64,${classTeacherRoom.timetable.image}`,
          }}
          className="w-full h-auto items-start self-start"
          style={{ aspectRatio: 1.9 }}
          resizeMode="contain"
        />
      </View>
    );
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
        <Text className="text-gray-500">{t("No students found")}</Text>
      </View>
    );
  }

  const currentStudent = profileData.students[currentStudentIndex];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <ParentDashboardHeader
        user={user}
        isOnline={isOnline}
        profileData={profileData}
        currentStudentIndex={currentStudentIndex}
        setCurrentStudentIndex={setCurrentStudentIndex}
        currentStudent={currentStudent}
      />

      <StudentDashboardTabs
        student={currentStudent}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        renderTimetableTab={renderTimetableTab}
      />

      <ClassroomsList student={currentStudent} router={router} />
    </ScrollView>
  );
}
