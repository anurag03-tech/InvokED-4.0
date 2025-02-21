import React from "react";
import { View, ScrollView } from "react-native";

export const AttendanceSkeleton = () => {
  return (
    <ScrollView className="space-y-2">
      {/* Progress Skeleton */}
      <View className="bg-white p-2 rounded-xl">
        <View className="h-6 w-40 bg-gray-200 rounded-md mb-2" />
        <View className="h-4 bg-gray-200 rounded-full" />
        <View className="flex-row justify-between mt-2">
          <View className="h-4 w-8 bg-gray-200 rounded-md" />
          <View className="h-4 w-8 bg-gray-200 rounded-md" />
        </View>
      </View>

      {/* Summary Cards Skeleton */}
      <View className="flex-row justify-between space-x-3 gap-2">
        <View className="flex-1 bg-gray-100 py-2 px-4 rounded-xl">
          <View className="h-6 w-32 bg-gray-200 rounded-md mb-2" />
          <View className="h-8 w-16 bg-gray-200 rounded-md mb-1" />
          <View className="h-5 w-24 bg-gray-200 rounded-md" />
        </View>
        <View className="flex-1 bg-gray-100 py-2 px-4 rounded-xl">
          <View className="h-6 w-32 bg-gray-200 rounded-md mb-2" />
          <View className="h-8 w-16 bg-gray-200 rounded-md mb-1" />
          <View className="h-5 w-24 bg-gray-200 rounded-md" />
        </View>
      </View>

      {/* Daily Strip Skeleton */}
      <View className="bg-white rounded-xl py-1">
        <View className="h-6 w-32 bg-gray-200 rounded-md mb-2 ml-2" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          className="py-1"
        >
          {[1, 2, 3, 4, 5].map((_, index) => (
            <View
              key={index}
              className="rounded-lg bg-gray-100 p-2 mr-1 items-center w-16"
            >
              <View className="h-4 w-8 bg-gray-200 rounded-md mb-1" />
              <View className="h-6 w-6 bg-gray-200 rounded-md mb-1" />
              <View className="h-4 w-8 bg-gray-200 rounded-md mb-1" />
              <View className="h-4 w-12 bg-gray-200 rounded-md" />
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
};
