import React, { useEffect, useRef } from "react";
import { View, Animated, Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width - 40; // -40 for padding

const MarksSkeleton = () => {
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const AnimatedBox = ({ width, height, style }) => (
    <Animated.View
      style={[
        {
          backgroundColor: "#E5E7EB",
          opacity: animatedValue,
          borderRadius: 8,
          width,
          height,
        },
        style,
      ]}
    />
  );

  return (
    <View style={{ height: 300 }} className="bg-white rounded-lg p-2">
      {/* Performance Trend Chart Skeleton */}
      <View className="p-2 bg-white rounded-lg border border-slate-200 mb-4">
        <AnimatedBox width={120} height={20} style={{ marginBottom: 10 }} />
        <AnimatedBox width={screenWidth - 20} height={160} />
        <View className="flex-row justify-center mt-2 space-x-4">
          <AnimatedBox width={80} height={12} />
          <AnimatedBox width={80} height={12} />
        </View>
      </View>

      {/* Individual Exam Cards Skeleton */}
      {[1, 2].map((i) => (
        <View key={i} className="p-3 mb-3 bg-blue-50 rounded-lg">
          <AnimatedBox width={150} height={16} style={{ marginBottom: 10 }} />

          <View className="flex-row">
            {/* Score Gauge Skeleton */}
            <View className="w-4/12 items-center justify-center">
              <AnimatedBox
                width={90}
                height={90}
                style={{ borderRadius: 45 }}
              />
            </View>

            {/* Comparison Chart Skeleton */}
            <View className="w-8/12">
              <AnimatedBox
                width={100}
                height={14}
                style={{ marginBottom: 8 }}
              />
              <AnimatedBox width="100%" height={120} />
            </View>
          </View>

          <AnimatedBox width={100} height={12} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
};

export default MarksSkeleton;
