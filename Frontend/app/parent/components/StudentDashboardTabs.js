import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { AttendanceSkeleton } from "./AttendanceSkeleton";

const TabButton = ({ title, icon, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={Platform.select({
      ios: { elevation: 0 },
      android: { elevation: 0 },
    })}
    className={`flex-1 py-3 rounded-md border border-blue-500 ${
      isActive ? "bg-blue-500" : "bg-blue-50"
    }`}
  >
    <View className="flex-row items-center justify-center gap-2 ">
      {icon}
      <Text
        className={` ${
          isActive ? "text-white font-semibold" : "text-blue-600"
        }`}
      >
        {title}
      </Text>
    </View>
  </TouchableOpacity>
);

const AttendanceChartSection = ({ student }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);

  useEffect(() => {
    calculateAttendanceData();
  }, [student]);

  const calculateAttendanceData = () => {
    setIsLoading(true);

    // Get class teacher room and attendance data
    const classTeacherRoom = student.classrooms.find(
      (classroom) => classroom.classTeacher === true
    );

    if (!classTeacherRoom) {
      setIsLoading(false);
      return;
    }

    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      // Filter attendance for current student
      const studentAttendance = classTeacherRoom.attendance
        .filter(
          (record) =>
            record.studentId?._id?.toString() === student._id?.toString() ||
            record.studentId?.toString() === student._id?.toString()
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate attendance stats
      const totalDays = studentAttendance.length;
      const presentDays = studentAttendance.filter(
        (record) => record.status === "present"
      ).length;
      const attendancePercentage =
        totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      const absentDays = totalDays - presentDays;

      setAttendanceData({
        studentAttendance,
        totalDays,
        presentDays,
        attendancePercentage,
        absentDays,
      });
      setIsLoading(false);
    }, 100);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString("default", { month: "short" }),
      weekday: date.toLocaleString("default", { weekday: "short" }),
    };
  };

  if (!attendanceData && !isLoading) {
    return (
      <View className="items-center justify-center p-8">
        <Text className="text-gray-500">No attendance data available</Text>
      </View>
    );
  }

  if (isLoading) {
    return <AttendanceSkeleton />;
  }

  const { studentAttendance, presentDays, attendancePercentage, absentDays } =
    attendanceData;

  return (
    <ScrollView className="space-y-2">
      {/* Attendance Progress */}
      <View className=" p-2 rounded-xl">
        <Text className="text-base font-medium text-gray-800 mb-2">
          Attendance Progress
        </Text>
        <View className="h-3 rounded-full overflow-hidden bg-gray-200">
          <View
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${Math.min(attendancePercentage, 100)}%` }}
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-sm text-gray-600">0%</Text>
          <Text className="text-sm text-gray-600">100%</Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View className="flex-row justify-between space-x-3 gap-2 ">
        <View className="flex-1 bg-blue-100 py-2 px-4 rounded-xl">
          <Text className="text-blue-700 text-base font-medium">
            Present Days
          </Text>
          <Text className="text-xl font-bold text-blue-700">{presentDays}</Text>
          <Text className="text-black mt-1 text-sm">
            {attendancePercentage.toFixed(1)}% Present
          </Text>
        </View>
        <View className="flex-1 bg-red-100 py-2 px-4 rounded-xl">
          <Text className="text-red-700 text-base font-medium">
            Absent Days
          </Text>
          <Text className="text-xl font-bold text-red-700">{absentDays}</Text>
          <Text className="text-red-600 mt-1 text-sm">
            {(100 - attendancePercentage).toFixed(1)}% Absence
          </Text>
        </View>
      </View>

      {/* Date Status Strip */}
      <View className=" rounded-xl py-1">
        <Text className="text-base font-medium text-gray-800 mb-1">
          Daily Attendance
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          className="py-1"
        >
          {studentAttendance.map((record, index) => {
            const { day, month, weekday } = formatDate(record.date);
            const isPresent = record.status === "present";

            return (
              <View
                key={index}
                className={`rounded-lg ${
                  isPresent
                    ? "bg-blue-50 border-blue-300 px-1 py-2"
                    : "bg-red-50 border-red-200 p-2"
                } mr-1 items-center border`}
              >
                <Text className="text-xs font-medium text-gray-600">
                  {month}
                </Text>
                <Text
                  className={` font-bold ${
                    isPresent ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  {day}
                </Text>
                <Text className="text-xs text-gray-500">{weekday}</Text>
                <Text
                  className={`text-xs ${
                    isPresent ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  {isPresent ? "Present" : "Absent"}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

export const StudentDashboardTabs = ({
  student,
  activeTab,
  setActiveTab,
  renderTimetableTab,
}) => {
  const classTeacherRoom = student.classrooms.find(
    (classroom) => classroom.classTeacher
  );

  return (
    <View className="flex-1 bg-gray-50">
      {classTeacherRoom && (
        <View className="flex-row gap-2 p-3 ">
          <View className="flex-1 flex-row items-center bg-white rounded-lg p-2 ">
            <View className="bg-blue-100 p-2 rounded-md">
              <FontAwesome5
                name="chalkboard-teacher"
                size={16}
                color="#2563eb"
              />
            </View>
            <View className="ml-3 flex-1 ">
              <Text className=" text-blue-600 font-medium">Class Teacher</Text>
              <Text className="text-gray-900 flex-wrap">
                {classTeacherRoom.teacher?.name}
              </Text>
            </View>
          </View>

          <View className=" w-1/2 flex-row items-center bg-white rounded-lg p-2 ">
            <View className="bg-blue-100 p-2 rounded-md">
              <MaterialIcons name="meeting-room" size={16} color="#2563eb" />
            </View>
            <View className="ml-3 flex-1">
              <Text className=" text-blue-600 font-medium">
                Class - {classTeacherRoom.grade}
              </Text>
              <Text className="text-gray-900">
                Section - {classTeacherRoom.section}
              </Text>
            </View>
          </View>
        </View>
      )}
      <View className="flex-row px-2 py-1">
        <TabButton
          title="Timetable"
          icon={
            <MaterialIcons
              name="schedule"
              size={20}
              color={activeTab === "timetable" ? "#ffffff" : "#2563eb"}
            />
          }
          isActive={activeTab === "timetable"}
          onPress={() => setActiveTab("timetable")}
        />
        <TabButton
          title="Attendance"
          icon={
            <FontAwesome5
              name="user-check"
              size={18}
              color={activeTab === "attendance" ? "#ffffff" : "#2563eb"}
            />
          }
          isActive={activeTab === "attendance"}
          onPress={() => setActiveTab("attendance")}
        />
      </View>

      <View className="bg-white p-2 ">
        {activeTab === "timetable" && renderTimetableTab(student)}
        {activeTab === "attendance" && (
          <AttendanceChartSection student={student} />
        )}
      </View>
    </View>
  );
};
