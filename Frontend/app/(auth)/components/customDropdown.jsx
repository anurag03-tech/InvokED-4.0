import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const CustomDropdown = ({
  label,
  value,
  options,
  onSelect,
  onClear,
  isOpen,
  toggleDropdown,
  dropdownAnimation,
  disabled = false,
  placeholder = "Select an option",
}) => {
  const dropdownHeight = dropdownAnimation?.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const handleSelect = (option) => {
    onSelect(option.value);
    toggleDropdown();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onClear();
  };

  return (
    <View className="w-full mb-4">
      {label && <Text className="text-base font-medium mb-1">{label}</Text>}

      <TouchableOpacity
        onPress={toggleDropdown}
        activeOpacity={0.7}
        disabled={disabled}
        className="border border-gray-300 rounded-md bg-white"
      >
        <View className="py-2.5 px-3 flex-row justify-between items-center">
          <Text
            className={`text-base ${value ? "text-black" : "text-gray-400"}`}
          >
            {value || placeholder}
          </Text>
          <View className="flex-row items-center">
            {value && (
              <TouchableOpacity
                onPress={handleClear}
                className="p-1 rounded-full bg-gray-100 mr-2"
              >
                <MaterialIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            )}
            <MaterialIcons
              name={isOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={24}
              color="#666"
            />
          </View>
        </View>
      </TouchableOpacity>

      <Animated.View
        style={{ maxHeight: dropdownHeight }}
        className="overflow-hidden"
      >
        <View className="border border-gray-200 rounded-md bg-white mt-1 shadow-sm">
          <ScrollView nestedScrollEnabled bounces={false} className="max-h-48 ">
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option)}
                className={`px-4 py-3 flex-row justify-between items-center  border-b border-gray-400 active:bg-gray-50
                  ${value === option.value ? "bg-blue-50" : ""}`}
              >
                <Text
                  className={`text-base ${
                    value === option.value
                      ? "text-blue-600 font-medium"
                      : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
                {value === option.value && (
                  <MaterialIcons name="check" size={20} color="#2563eb" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
};

export default CustomDropdown;
