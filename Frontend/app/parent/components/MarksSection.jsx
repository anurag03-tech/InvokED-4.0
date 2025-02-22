import React, { memo, useMemo, useCallback } from "react";
import { View, Text, ScrollView, Dimensions } from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import { Svg, Circle, Text as SvgText } from "react-native-svg";
import { useTranslation } from "react-i18next";

const screenWidth = Dimensions.get("window").width - 40;

// Move chart config outside component to prevent recreation
const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.7,
  useShadowColorFromDataset: false,
  decimalPlaces: 1,
  labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
  propsForLabels: {
    fontSize: 10,
  },
};

const ScoreGaugeComponent = memo(({ score, total, size }) => {
  const percentage = useMemo(
    () => (total > 0 ? (score / total) * 100 : 0),
    [score, total]
  );
  const radius = size / 2;
  const bgStrokeWidth = Math.max(4, size * 0.06);
  const fgStrokeWidth = Math.max(6, size * 0.08);
  const innerRadius = radius - fgStrokeWidth / 2;
  const circumference = innerRadius * Math.PI * 2;
  const strokeDashoffset = useMemo(
    () => circumference - (percentage / 100) * circumference,
    [circumference, percentage]
  );

  const getColor = useCallback((pct) => {
    if (pct >= 80) return "#10B981";
    if (pct >= 60) return "#3B82F6";
    if (pct >= 40) return "#F59E0B";
    return "#EF4444";
  }, []);

  const color = useMemo(() => getColor(percentage), [getColor, percentage]);

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        <Circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          stroke="#E5E7EB"
          strokeWidth={bgStrokeWidth}
          fill="transparent"
        />
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
          strokeOpacity={1}
        />
        <SvgText
          x={radius}
          y={radius - 3}
          textAnchor="middle"
          fill="#1F2937"
          fontSize={size * 0.19}
          fontWeight="bold"
        >
          {score}
        </SvgText>
        <SvgText
          x={radius}
          y={radius + size * 0.17}
          textAnchor="middle"
          fill="#6B7280"
          fontSize={size * 0.15}
        >
          / {total}
        </SvgText>
      </Svg>
      <Text className="text-sm font-bold mt-1" style={{ color }}>
        {percentage.toFixed(1)}%
      </Text>
    </View>
  );
});

const ComparisonChartComponent = memo(
  ({ yourScore, average, highest, total, width, t }) => {
    const barData = useMemo(() => {
      const safeTotal = total || 100;
      const yourPercent = (yourScore / safeTotal) * 100;
      const avgPercent = (average / safeTotal) * 100;
      const highestPercent = (highest / safeTotal) * 100;

      return {
        labels: [t("You"), t("Avg"), t("High")],
        datasets: [
          {
            data: [yourPercent, avgPercent, highestPercent],
            colors: [
              (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              (opacity = 1) => `rgba(234, 88, 12, ${opacity})`,
              (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            ],
          },
        ],
      };
    }, [yourScore, average, highest, total, t]);

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
            formatYLabel: (label) => `${label}%`,
            yAxisSuffix: "%",
          }}
          style={{
            borderRadius: 8,
          }}
          fromZero
          withCustomBarColorFromData
          flatColor
          showValuesOnTopOfBars
        />

        <View className="flex-row justify-around mt-2">
          <View className="items-center">
            <View className="w-4 h-4 bg-blue-600 rounded-full mb-1" />
            <Text className="text-sm text-gray-700 font-medium">
              {t("Your Marks")}
            </Text>
            <Text className="text-sm font-bold text-blue-600">
              {yourScore}/{total}
            </Text>
          </View>

          <View className="items-center">
            <View className="w-4 h-4 bg-orange-600 rounded-full mb-1" />
            <Text className="text-sm text-gray-700 font-medium">
              {t("Class Avg")}
            </Text>
            <Text className="text-sm font-bold text-orange-600">
              {average.toFixed(1)}/{total}
            </Text>
          </View>

          <View className="items-center">
            <View className="w-4 h-4 bg-green-600 rounded-full mb-1" />
            <Text className="text-sm text-gray-700 font-medium">
              {t("Highest")}
            </Text>
            <Text className="text-sm font-bold text-green-600">
              {highest}/{total}
            </Text>
          </View>
        </View>
      </View>
    );
  }
);

const MarksSection = memo(({ classroom }) => {
  const { t } = useTranslation();

  const sortedMarks = useMemo(() => {
    if (!classroom?.marks?.length) return [];
    return [...classroom.marks].sort((a, b) => {
      try {
        return new Date(a.date || 0) - new Date(b.date || 0);
      } catch (e) {
        return 0;
      }
    });
  }, [classroom?.marks]);

  const lineChartData = useMemo(() => {
    if (!sortedMarks.length) {
      return {
        labels: [t("No Data")],
        datasets: [
          {
            data: [0],
            color: (opacity = 1) => `rgba(200, 200, 200, ${opacity})`,
            strokeWidth: 2,
          },
        ],
      };
    }

    return {
      labels: sortedMarks.map(
        (mark) => mark.exam?.substring(0, 6) || t("Test")
      ),
      datasets: [
        {
          data: sortedMarks.map((mark) => {
            const score = mark.marksObtained || 0;
            const total = mark.totalMarks || 100;
            return ((score / total) * 100).toFixed(1);
          }),
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: sortedMarks.map((mark) => {
            const avg = mark.averageMarks || 0;
            const total = mark.totalMarks || 100;
            return ((avg / total) * 100).toFixed(1);
          }),
          color: (opacity = 1) => `rgba(234, 88, 12, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [sortedMarks, t]);

  if (!classroom?.marks?.length) {
    return (
      <View className="bg-white rounded-lg p-4" style={{ height: 300 }}>
        <Text className="text-gray-500 italic p-4 text-center">
          {t("No marks available yet")}
        </Text>
        <LineChart
          data={lineChartData}
          width={screenWidth - 20}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={{ borderRadius: 8 }}
        />
      </View>
    );
  }

  return (
    <ScrollView className="bg-white rounded-lg p-2" style={{ height: 300 }}>
      <View className="p-2 bg-white rounded-lg shadow-sm mb-4 border border-slate-400">
        <Text className="font-bold text-gray-800 mb-1 text-lg">
          {t("Performance Trend")}
        </Text>
        <LineChart
          data={lineChartData}
          width={screenWidth - 20}
          height={160}
          chartConfig={chartConfig}
          bezier
          style={{ borderRadius: 8 }}
        />
        <View className="flex-row justify-center mt-1">
          <View className="flex-row items-center mr-4">
            <View className="w-3 h-3 bg-blue-600 rounded-full mr-1" />
            <Text className="text-gray-600">{t("Your Score")} %</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 bg-orange-600 rounded-full mr-1 mt-1" />
            <Text className="text-gray-600 mt-1">{t("Class Average")} %</Text>
          </View>
        </View>
      </View>

      {sortedMarks.map((mark, index) => (
        <View
          key={mark._id || index}
          className="p-3 mb-3 bg-blue-50 rounded-lg shadow-sm"
        >
          <Text className="font-bold text-gray-800 mb-2">
            {t("Exam")} : {mark.exam || t("Test")}
          </Text>

          <View className="flex-row flex-wrap">
            <View className="w-4/12 items-center justify-center">
              <ScoreGaugeComponent
                score={mark.marksObtained || 0}
                total={mark.totalMarks || 100}
                size={90}
              />
            </View>

            <View className="w-8/12">
              <Text className="font-semibold text-gray-700 mb-2">
                {t("Score Comparison")}
              </Text>
              <ComparisonChartComponent
                yourScore={mark.marksObtained || 0}
                average={mark.averageMarks || 0}
                highest={mark.highestMarks || 0}
                total={mark.totalMarks || 100}
                width={screenWidth * 0.58}
                t={t}
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
});

MarksSection.displayName = "MarksSection";
ScoreGaugeComponent.displayName = "ScoreGaugeComponent";
ComparisonChartComponent.displayName = "ComparisonChartComponent";

export default MarksSection;
