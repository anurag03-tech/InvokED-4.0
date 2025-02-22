import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";

export const ParentDashboardHeader = ({
  user,
  isOnline,
  profileData,
  currentStudentIndex,
  setCurrentStudentIndex,
  currentStudent,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {/* Student Selector */}
      {profileData.students.length > 1 && (
        <View className="flex-row p-2 bg-white">
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
                  className={
                    index === currentStudentIndex
                      ? "text-white"
                      : "text-gray-600"
                  }
                >
                  {student.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Header */}
      <View className="bg-blue-600 p-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xl font-bold text-white">
              {t("Welcome")}, {user?.name}
            </Text>
            <Text className="text-white mt-1">
              {t("Viewing")}: {currentStudent.name}'s {t("Dashboard")}
            </Text>
          </View>
          {!isOnline && (
            <View className="bg-white px-2 py-1 rounded-lg border">
              <Text className="text-blue-900 font-semibold ">
                {t("Offline")}
              </Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
};
