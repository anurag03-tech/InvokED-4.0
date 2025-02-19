import React from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { Svg, Circle, Text as SvgText } from "react-native-svg";

// Chart configuration
const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // blue-600
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  decimalPlaces: 1,
  labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`, // gray-700
  propsForLabels: {
    fontSize: 10,
  },
};

const screenWidth = Dimensions.get("window").width - 40; // -40 for padding

// Default data to prevent chart errors
const DEFAULT_CHART_DATA = {
  labels: ["No Data"],
  datasets: [
    {
      data: [0],
      color: (opacity = 1) => `rgba(200, 200, 200, ${opacity})`,
      strokeWidth: 2,
    },
  ],
  legend: ["No Data Available"],
};

const renderMarksSection = (classroom) => {
  // Handle missing marks data safely
  if (
    !classroom ||
    !classroom.marks ||
    !Array.isArray(classroom.marks) ||
    classroom.marks.length === 0
  ) {
    return (
      <View className="bg-white rounded-lg p-4" style={{ height: 300 }}>
        <Text className="text-gray-500 italic p-4 text-center">
          No marks available yet
        </Text>

        {/* Show empty chart as placeholder */}
        <LineChart
          data={DEFAULT_CHART_DATA}
          width={screenWidth - 20}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={{ borderRadius: 8 }}
        />
      </View>
    );
  }

  // Safely sort marks by date with error handling
  const sortedMarks = [...classroom.marks].sort((a, b) => {
    try {
      return new Date(a.date || 0) - new Date(b.date || 0);
    } catch (e) {
      return 0;
    }
  });

  // Safely prepare data for line chart with error handling
  const prepareLineChartData = () => {
    try {
      return {
        labels: sortedMarks.map((mark) => mark.exam?.substring(0, 6) || "Test"),
        datasets: [
          {
            data: sortedMarks.map((mark) => {
              const score = mark.marksObtained || 0;
              const total = mark.totalMarks || 100;
              return ((score / total) * 100).toFixed(1);
            }),
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // blue-600
            strokeWidth: 2,
          },
          {
            data: sortedMarks.map((mark) => {
              const avg = mark.averageMarks || 0;
              const total = mark.totalMarks || 100;
              return ((avg / total) * 100).toFixed(1);
            }),
            color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`, // orange-600
            strokeWidth: 2,
          },
        ],
        legend: ["Your Score %", "Class Average %"],
      };
    } catch (e) {
      return DEFAULT_CHART_DATA;
    }
  };

  const lineChartData = prepareLineChartData();

  return (
    <ScrollView className="bg-white rounded-lg p-2" style={{ height: 300 }}>
      {/* Performance Trend Chart - Made more compact */}
      <View className="p-2 bg-white rounded-lg shadow-sm mb-4 border border-slate-400">
        <Text className="font-bold text-gray-800 mb-2 text-lg">
          Performance Trend
        </Text>
        <LineChart
          data={lineChartData}
          width={screenWidth - 20}
          height={160}
          chartConfig={chartConfig}
          bezier
          style={{
            borderRadius: 8,
          }}
        />
        <View className="flex-row justify-center mt-1">
          <View className="flex-row items-center mr-4">
            <View className="w-3 h-3 bg-blue-600 rounded-full mr-1" />
            <Text className=" text-gray-600">Your Score</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-orange-600 rounded-full mr-1 mt-1" />
            <Text className=" text-gray-600 mt-1">Class Average</Text>
          </View>
        </View>
      </View>

      {/* Individual Exam Details - More compact side-by-side layout */}
      {sortedMarks.map((mark, index) => (
        <View
          key={mark._id || index}
          className="p-3 mb-3 bg-blue-50 rounded-lg shadow-sm"
        >
          <Text className="font-bold text-gray-800 mb-2 text-lg">
            Exam : {mark.exam || "Test"}
          </Text>

          <View className="flex-row flex-wrap">
            {/* Left side: Score Gauge */}
            <View className="w-4/12 items-center justify-center">
              <ScoreGauge
                score={mark.marksObtained || 0}
                total={mark.totalMarks || 100}
                size={90}
              />
            </View>

            {/* Right side: Comparison Chart */}
            <View className="w-8/12">
              <Text className="font-semibold text-gray-700 mb-2">
                Score Comparison
              </Text>
              <ComparisonChart
                yourScore={mark.marksObtained || 0}
                average={mark.averageMarks || 0}
                highest={mark.highestMarks || 0}
                total={mark.totalMarks || 100}
                width={screenWidth * 0.58}
              />
            </View>
          </View>

          <Text className="text-gray-800 mt-2">
            {mark.date ? new Date(mark.date).toLocaleDateString() : ""}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

// Custom Score Gauge component - more compact
const ScoreGauge = ({ score, total, size }) => {
  // Calculate percentage with safety check
  const percentage = total > 0 ? (score / total) * 100 : 0;
  const radius = size / 2;
  const circumference = radius * Math.PI * 2;
  // Ensure visual accuracy - calculate exact offset
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine color based on score percentage
  const getColor = (pct) => {
    if (pct >= 80) return "#10B981"; // Green
    if (pct >= 60) return "#3B82F6"; // Blue
    if (pct >= 40) return "#F59E0B"; // Amber
    return "#EF4444"; // Red
  };

  const color = getColor(percentage);

  // Ensure stroke width is proportional to gauge size
  const bgStrokeWidth = Math.max(4, size * 0.06);
  const fgStrokeWidth = Math.max(6, size * 0.08);
  const innerRadius = radius - fgStrokeWidth / 2 - 2;

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          stroke="#E5E7EB"
          strokeWidth={bgStrokeWidth}
          fill="transparent"
        />
        {/* Progress circle - carefully calculated */}
        <Circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          stroke={color}
          strokeWidth={fgStrokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          rotation="-90"
          origin={`${radius}, ${radius}`}
        />
        {/* Score text */}
        <SvgText
          x={radius}
          y={radius - 3}
          textAnchor="middle"
          fill="#1F2937"
          fontSize="17"
          fontWeight="bold"
        >
          {score}
        </SvgText>
        <SvgText
          x={radius}
          y={radius + 15}
          textAnchor="middle"
          fill="#6B7280"
          fontSize="14"
        >
          / {total}
        </SvgText>
      </Svg>
      <Text className="text-sm font-bold" style={{ color }}>
        {percentage.toFixed(1)}%
      </Text>
    </View>
  );
};

// Comparison bar chart - more compact
const ComparisonChart = ({ yourScore, average, highest, total, width }) => {
  // Handle potential division by zero
  if (!total) total = 100;

  const yourPercent = (yourScore / total) * 100;
  const avgPercent = (average / total) * 100;
  const highestPercent = (highest / total) * 100;

  const barData = {
    labels: ["You", "Avg", "High"],
    datasets: [
      {
        data: [yourPercent, avgPercent, highestPercent],
        colors: [
          (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue
          (opacity = 1) => `rgba(234, 88, 12, ${opacity})`, // Orange
          (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Green
        ],
      },
    ],
  };

  return (
    <View>
      <BarChart
        data={barData}
        width={width}
        height={120}
        chartConfig={{
          ...chartConfig,
          barPercentage: 0.5,
          fillShadowGradientOpacity: 1,
          fillShadowGradient: "#3B82F6",
          formatYLabel: (label) => `${label}%`, // Add % to y-axis labels
          yAxisSuffix: "%", // Add % to values on bars
        }}
        style={{
          borderRadius: 8,
        }}
        fromZero
        withCustomBarColorFromData
        flatColor
        showValuesOnTopOfBars
      />

      {/* Labels below bar graph */}
      <View className="flex-row justify-around mt-2">
        <View className="items-center">
          <View className="w-4 h-4 bg-blue-600 rounded-full mb-1" />
          <Text className="text-sm text-gray-700 font-medium">Your Marks</Text>
          <Text className="text-sm font-bold text-blue-600">
            {yourScore}/{total}
          </Text>
        </View>

        <View className="items-center">
          <View className="w-4 h-4 bg-orange-600 rounded-full mb-1" />
          <Text className="text-sm text-gray-700 font-medium">Class Avg</Text>
          <Text className="text-sm font-bold text-orange-600">
            {average.toFixed(1)}/{total}
          </Text>
        </View>

        <View className="items-center">
          <View className="w-4 h-4 bg-green-600 rounded-full mb-1" />
          <Text className="text-sm text-gray-700 font-medium">Highest</Text>
          <Text className="text-sm font-bold text-green-600">
            {highest}/{total}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default renderMarksSection;
