import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const CARD_COLORS = [
  {
    bg: "bg-blue-50",
    border: "border border-black",
    icon: "#4f46e5",
    title: "text-blue-900",
  },
  {
    bg: "bg-rose-50",
    border: "border border-rose-500",
    icon: "#e11d48",
    title: "text-rose-900",
  },
  {
    bg: "bg-amber-50",
    border: "border border-amber-500",
    icon: "#d97706",
    title: "text-amber-900",
  },
  {
    bg: "bg-emerald-50",
    border: "border border-emerald-600",
    icon: "#059669",
    title: "text-emerald-900",
  },
];

export const ClassroomsList = ({ student, router }) => (
  <View className="mx-2 mt-2 mb-4">
    <Text className="text-base font-semibold text-white mb-3 p-1 text-center bg-blue-500 rounded-md">
      Classrooms
    </Text>

    {student.classrooms?.length > 0 ? (
      <View className="flex-row flex-wrap gap-2">
        {student.classrooms.map((classroom, index) => {
          const colorScheme = CARD_COLORS[index % CARD_COLORS.length];

          return (
            <TouchableOpacity
              key={classroom._id}
              className={`w-[48%] ${colorScheme.bg} ${colorScheme.border} rounded-lg p-3`}
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
              <View>
                <View className="flex-row items-center justify-between">
                  <Text
                    numberOfLines={1}
                    className={`text-lg font-semibold ${colorScheme.title} flex-1 mr-2`}
                  >
                    {classroom.subject}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={colorScheme.icon}
                  />
                </View>

                {classroom.classTeacher && (
                  <View
                    className={`mt-1 px-2 py-0.5 bg-white ${colorScheme.border} rounded-full self-start`}
                  >
                    <Text
                      className={`text-xs font-medium ${colorScheme.title}`}
                    >
                      Class Teacher
                    </Text>
                  </View>
                )}

                <Text className=" text-gray-500 mt-0.5 mb-1">
                  Teacher: {classroom.teacher?.name}
                </Text>

                <Text className="text-sm text-gray-600 mt-1">
                  Class {classroom.grade} - {classroom.section}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    ) : (
      <Text className="text-gray-500 italic">No classrooms assigned yet</Text>
    )}
  </View>
);
