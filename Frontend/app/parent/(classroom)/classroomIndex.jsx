// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   SafeAreaView,
// } from "react-native";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { useAuth } from "../../context/authContext";
// import axios from "axios";
// import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";

// const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

// const SECTION_HEIGHT = 300; // Fixed height for scrollable sections

// export default function ClassroomDetail() {
//   const params = useLocalSearchParams();
//   const router = useRouter();
//   const { token } = useAuth();
//   const [classroom, setClassroom] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeSection, setActiveSection] = useState("announcements");

//   useEffect(() => {
//     if (!params.id) {
//       Alert.alert("Error", "No classroom ID provided");
//       router.back();
//       return;
//     }
//     fetchClassroomDetails();
//   }, [params.id]);

//   const fetchClassroomDetails = async () => {
//     try {
//       const response = await axios.get(
//         `${API_URL}/api/parent/classroom/${params.id}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (response.data.success) {
//         setClassroom(response.data.classroom);
//       } else {
//         Alert.alert("Error", "Failed to fetch classroom details");
//       }
//     } catch (error) {
//       console.error("Error fetching classroom details:", error);
//       Alert.alert("Error", "Failed to fetch classroom details");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderSection = () => {
//     switch (activeSection) {
//       case "announcements":
//         return (
//           <ScrollView
//             className="bg-white rounded-lg p-2"
//             style={{ height: SECTION_HEIGHT }}
//           >
//             {classroom.announcements?.length > 0 ? (
//               classroom.announcements.map((announcement) => (
//                 <View
//                   key={announcement._id}
//                   className="p-4 mb-3 bg-blue-50 rounded-lg"
//                 >
//                   <Text className="font-semibold text-gray-800 mb-1">
//                     {announcement.title}
//                   </Text>
//                   <Text className="text-gray-600">{announcement.content}</Text>
//                   <Text className="text-gray-400 text-sm mt-2">
//                     {new Date(announcement.createdAt).toLocaleDateString()}
//                   </Text>
//                 </View>
//               ))
//             ) : (
//               <Text className="text-gray-500 italic p-4">
//                 No announcements yet
//               </Text>
//             )}
//           </ScrollView>
//         );

//       case "assignments":
//         return (
//           <ScrollView
//             className="bg-white rounded-lg p-2"
//             style={{ height: SECTION_HEIGHT }}
//           >
//             {classroom.assignments?.length > 0 ? (
//               classroom.assignments.map((assignment) => (
//                 <View
//                   key={assignment._id}
//                   className="p-4 mb-3 bg-blue-50 rounded-lg"
//                 >
//                   <Text className="font-semibold text-gray-800 mb-1">
//                     {assignment.title}
//                   </Text>
//                   <Text className="text-gray-600 mb-2">
//                     {assignment.description}
//                   </Text>
//                   <Text className="text-blue-600">
//                     Due: {new Date(assignment.dueDate).toLocaleDateString()}
//                   </Text>
//                 </View>
//               ))
//             ) : (
//               <Text className="text-gray-500 italic p-4">
//                 No assignments yet
//               </Text>
//             )}
//           </ScrollView>
//         );
//       case "marks":
//         return (
//           <ScrollView
//             className="bg-white rounded-lg p-2"
//             style={{ height: SECTION_HEIGHT }}
//           >
//             {classroom.marks?.length > 0 ? (
//               classroom.marks.map((mark) => (
//                 <View key={mark._id} className="p-4 mb-3 bg-blue-50 rounded-lg">
//                   {/* Exam Title */}
//                   <Text className="font-bold text-gray-800 text-lg mb-2">
//                     {mark.exam || "Test"}
//                   </Text>

//                   {/* Student's Score */}
//                   <View className="bg-white p-3 rounded-lg mb-2">
//                     <View className="flex-row justify-between items-center">
//                       <Text className="font-semibold text-gray-700">
//                         Your Score
//                       </Text>
//                       <Text className="text-lg font-bold text-blue-600">
//                         {mark.marksObtained}/{mark.totalMarks}
//                       </Text>
//                     </View>
//                     <Text className="text-gray-500 text-sm">
//                       Percentage:{" "}
//                       {((mark.marksObtained / mark.totalMarks) * 100).toFixed(
//                         1
//                       )}
//                       %
//                     </Text>
//                   </View>

//                   {/* Class Statistics */}
//                   <View className="mt-2">
//                     <Text className="font-semibold text-gray-700 mb-1">
//                       Class Statistics
//                     </Text>
//                     <View className="bg-white p-3 rounded-lg">
//                       <View className="flex-row justify-between mb-1">
//                         <Text className="text-gray-600">Class Average</Text>
//                         <Text className="text-gray-800">
//                           {mark.averageMarks?.toFixed(1) || "N/A"}
//                         </Text>
//                       </View>
//                       <View className="flex-row justify-between">
//                         <Text className="text-gray-600">Highest Score</Text>
//                         <Text className="text-gray-800">
//                           {mark.highestMarks || "N/A"}
//                         </Text>
//                       </View>
//                     </View>
//                   </View>

//                   {/* Date */}
//                   <Text className="text-gray-400 text-sm mt-3">
//                     {new Date(mark.date).toLocaleDateString()}
//                   </Text>
//                 </View>
//               ))
//             ) : (
//               <Text className="text-gray-500 italic p-4">
//                 No marks available yet
//               </Text>
//             )}
//           </ScrollView>
//         );
//     }
//   };

//   if (loading) {
//     return (
//       <View className="flex-1 justify-center items-center">
//         <ActivityIndicator size="large" color="#3b82f6" />
//       </View>
//     );
//   }

//   if (!classroom) {
//     return (
//       <View className="flex-1 justify-center items-center p-4">
//         <Text className="text-xl text-gray-600">Classroom not found</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView className="flex-1 bg-gray-50">
//       {/* Header Section */}
//       <View className="bg-blue-600 p-6">
//         <Text className="text-2xl font-bold text-white mb-2">
//           Grade {classroom.grade} - Section {classroom.section}
//         </Text>
//         <Text className="text-lg text-white">Subject: {classroom.subject}</Text>
//         <Text className="text-white mt-2">
//           Teacher: {classroom.teacher?.name}
//         </Text>
//       </View>

//       {/* Navigation Buttons */}
//       <View className="flex-row justify-between px-4 py-2">
//         <TouchableOpacity
//           className={`flex-1 items-center py-3 mx-1 rounded-lg ${
//             activeSection === "announcements" ? "bg-blue-500" : "bg-gray-200"
//           }`}
//           onPress={() => setActiveSection("announcements")}
//         >
//           <MaterialIcons
//             name="announcement"
//             size={24}
//             color={activeSection === "announcements" ? "white" : "#4B5563"}
//           />
//           <Text
//             className={`text-sm mt-1 ${
//               activeSection === "announcements" ? "text-white" : "text-gray-600"
//             }`}
//           >
//             Announcements
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           className={`flex-1 items-center py-3 mx-1 rounded-lg ${
//             activeSection === "assignments" ? "bg-blue-500" : "bg-gray-200"
//           }`}
//           onPress={() => setActiveSection("assignments")}
//         >
//           <FontAwesome5
//             name="tasks"
//             size={24}
//             color={activeSection === "assignments" ? "white" : "#4B5563"}
//           />
//           <Text
//             className={`text-sm mt-1 ${
//               activeSection === "assignments" ? "text-white" : "text-gray-600"
//             }`}
//           >
//             Assignments
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           className={`flex-1 items-center py-3 mx-1 rounded-lg ${
//             activeSection === "marks" ? "bg-blue-500" : "bg-gray-200"
//           }`}
//           onPress={() => setActiveSection("marks")}
//         >
//           <Ionicons
//             name="newspaper"
//             size={24}
//             color={activeSection === "marks" ? "white" : "#4B5563"}
//           />
//           <Text
//             className={`text-sm mt-1 ${
//               activeSection === "marks" ? "text-white" : "text-gray-600"
//             }`}
//           >
//             Marks
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* Content Section */}
//       <View className="flex-1 p-4">{renderSection()}</View>

//       {/* Teacher Remarks Button */}
//       <View className="p-4 border-t border-gray-200 bg-white">
//         <TouchableOpacity
//           className="bg-blue-600 p-4 rounded-lg flex-row justify-center items-center"
//           onPress={() =>
//             router.push({
//               pathname: "./remarks",
//               params: {
//                 id: params.id,
//                 subject: classroom.subject,
//                 grade: classroom.grade,
//                 section: classroom.section,
//               },
//             })
//           }
//         >
//           <MaterialIcons name="comment" size={24} color="white" />
//           <Text className="text-white font-semibold ml-2">Teacher Remarks</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/authContext";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useClassroom } from "../../hook/useClassroom";
import renderMarksSection from "../EnhancedMarksSection";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;
const SECTION_HEIGHT = 300;

export default function ClassroomDetail() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState("announcements");

  // Use the custom hook instead of local state and useEffect
  const { classroom, loading, isOnline } = useClassroom(
    params.id,
    token,
    API_URL
  );

  // Error handling for missing ID
  if (!params.id) {
    Alert.alert("Error", "No classroom ID provided");
    router.back();
    return null;
  }

  const renderSection = () => {
    switch (activeSection) {
      case "announcements":
        return (
          <ScrollView
            className="bg-white rounded-lg p-2"
            style={{ height: SECTION_HEIGHT }}
          >
            {classroom?.announcements?.length > 0 ? (
              classroom.announcements.map((announcement) => (
                <View
                  key={announcement._id}
                  className="p-4 mb-3 bg-blue-50 rounded-lg"
                >
                  <Text className="font-semibold text-gray-800 mb-1">
                    {announcement.title}
                  </Text>
                  <Text className="text-gray-600">{announcement.content}</Text>
                  <Text className="text-gray-400 text-sm mt-2">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-500 italic p-4">
                No announcements yet
              </Text>
            )}
          </ScrollView>
        );

      case "assignments":
        return (
          <ScrollView
            className="bg-white rounded-lg p-2"
            style={{ height: SECTION_HEIGHT }}
          >
            {classroom?.assignments?.length > 0 ? (
              classroom.assignments.map((assignment) => (
                <View
                  key={assignment._id}
                  className="p-4 mb-3 bg-blue-50 rounded-lg"
                >
                  <Text className="font-semibold text-gray-800 mb-1">
                    {assignment.title}
                  </Text>
                  <Text className="text-gray-600 mb-2">
                    {assignment.description}
                  </Text>
                  <Text className="text-blue-600">
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-500 italic p-4">
                No assignments yet
              </Text>
            )}
          </ScrollView>
        );

      case "marks":
        // Use the enhanced marks section component
        return renderMarksSection(classroom);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!classroom) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-xl text-gray-600">Classroom not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Offline Banner */}
      {!isOnline && (
        <View className="bg-yellow-500 px-4 py-2">
          <Text className="text-white text-center">
            Offline Mode - Some data may not be up to date
          </Text>
        </View>
      )}

      {/* Header Section */}
      <View className="bg-blue-600 p-6">
        <Text className="text-2xl font-bold text-white mb-2">
          Grade {classroom.grade} - Section {classroom.section}
        </Text>
        <Text className="text-lg text-white">Subject: {classroom.subject}</Text>
        <Text className="text-white mt-2">
          Teacher: {classroom.teacher?.name}
        </Text>
      </View>

      {/* Navigation Buttons */}
      <View className="flex-row justify-between px-4 py-2">
        <TouchableOpacity
          className={`flex-1 items-center py-3 mx-1 rounded-lg ${
            activeSection === "announcements" ? "bg-blue-500" : "bg-gray-200"
          }`}
          onPress={() => setActiveSection("announcements")}
        >
          <MaterialIcons
            name="announcement"
            size={24}
            color={activeSection === "announcements" ? "white" : "#4B5563"}
          />
          <Text
            className={`text-sm mt-1 ${
              activeSection === "announcements" ? "text-white" : "text-gray-600"
            }`}
          >
            Announcements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 items-center py-3 mx-1 rounded-lg ${
            activeSection === "assignments" ? "bg-blue-500" : "bg-gray-200"
          }`}
          onPress={() => setActiveSection("assignments")}
        >
          <FontAwesome5
            name="tasks"
            size={24}
            color={activeSection === "assignments" ? "white" : "#4B5563"}
          />
          <Text
            className={`text-sm mt-1 ${
              activeSection === "assignments" ? "text-white" : "text-gray-600"
            }`}
          >
            Assignments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 items-center py-3 mx-1 rounded-lg ${
            activeSection === "marks" ? "bg-blue-500" : "bg-gray-200"
          }`}
          onPress={() => setActiveSection("marks")}
        >
          <Ionicons
            name="newspaper"
            size={24}
            color={activeSection === "marks" ? "white" : "#4B5563"}
          />
          <Text
            className={`text-sm mt-1 ${
              activeSection === "marks" ? "text-white" : "text-gray-600"
            }`}
          >
            Marks
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Section */}
      <View className="flex-1 p-4">{renderSection()}</View>

      {/* Teacher Remarks Button */}
      <View className="p-4 border-t border-gray-200 bg-white">
        <TouchableOpacity
          className="bg-blue-600 p-4 rounded-lg flex-row justify-center items-center"
          onPress={() =>
            router.push({
              pathname: "./remarks",
              params: {
                id: params.id,
                subject: classroom.subject,
                grade: classroom.grade,
                section: classroom.section,
              },
            })
          }
        >
          <MaterialIcons name="comment" size={24} color="white" />
          <Text className="text-white font-semibold ml-2">Teacher Remarks</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
