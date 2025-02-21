// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   ActivityIndicator,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { useAuth } from "../../context/authContext";
// import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import NetInfo from "@react-native-community/netinfo";
// import axios from "axios";

// const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

// export default function HomeScreen() {
//   const router = useRouter();
//   const { user, token } = useAuth();
//   const [profileData, setProfileData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
//   const [isOnline, setIsOnline] = useState(true);

//   useEffect(() => {
//     loadData();
//     const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);
//     return () => unsubscribe();
//   }, []);

//   const handleConnectivityChange = async (state) => {
//     setIsOnline(state.isConnected);
//     if (state.isConnected) {
//       await syncData();
//     }
//   };

//   const loadData = async () => {
//     // Try to load cached data first
//     const cachedData = await loadCachedData();
//     if (cachedData) {
//       setProfileData(cachedData);
//       setIsLoading(false);
//     }

//     // Check network status
//     const networkState = await NetInfo.fetch();
//     setIsOnline(networkState.isConnected);

//     if (networkState.isConnected) {
//       await fetchParentProfile();
//     }
//   };

//   const loadCachedData = async () => {
//     try {
//       const jsonValue = await AsyncStorage.getItem("parentProfile");
//       return jsonValue != null ? JSON.parse(jsonValue) : null;
//     } catch (error) {
//       console.error("Error loading cached data:", error);
//       return null;
//     }
//   };

//   const syncData = async () => {
//     try {
//       await fetchParentProfile();
//     } catch (error) {
//       console.error("Error syncing data:", error);
//     }
//   };

//   const fetchParentProfile = async () => {
//     try {
//       const response = await axios.get(`${API_URL}/api/parent/profile`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const newProfileData = response.data.parent;
//       console.log(
//         "Fetched profile data:",
//         newProfileData.students[0].classrooms
//       );

//       // Save to local storage
//       await AsyncStorage.setItem(
//         "parentProfile",
//         JSON.stringify(newProfileData)
//       );

//       setProfileData(newProfileData);
//     } catch (error) {
//       console.error("Error fetching profile:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const calculateAttendance = (student) => {
//     const classTeacherRoom = student.classrooms.find(
//       (classroom) => classroom.classTeacher === true
//     );

//     if (!classTeacherRoom) return null;

//     const currentMonth = new Date().getMonth();
//     const currentYear = new Date().getFullYear();

//     const studentAttendance = classTeacherRoom.attendance.filter((record) => {
//       const recordDate = new Date(record.date);
//       return (
//         recordDate.getMonth() === currentMonth &&
//         recordDate.getFullYear() === currentYear &&
//         (record.studentId?._id?.toString() === student._id?.toString() ||
//           record.studentId?.toString() === student._id?.toString())
//       );
//     });

//     const totalDays = studentAttendance.length;
//     const presentDays = studentAttendance.filter(
//       (record) => record.status === "present"
//     ).length;

//     return {
//       totalDays,
//       presentDays,
//       percentage: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
//       classTeacherInfo: {
//         teacherName: classTeacherRoom.teacher?.name,
//         grade: classTeacherRoom.grade,
//         section: classTeacherRoom.section,
//         announcements: classTeacherRoom.announcements || [],
//       },
//     };
//   };

//   if (isLoading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-white">
//         <ActivityIndicator size="large" color="#3b82f6" />
//       </View>
//     );
//   }

//   if (!profileData?.students?.length) {
//     return (
//       <View className="flex-1 justify-center items-center bg-white">
//         <Text className="text-gray-500">No students found</Text>
//       </View>
//     );
//   }

//   const currentStudent = profileData.students[currentStudentIndex];
//   const dashboardData = calculateAttendance(currentStudent);

//   return (
//     <ScrollView
//       className="flex-1 bg-gray-50"
//       contentContainerStyle={{
//         flexGrow: 1,
//         paddingBottom: 20,
//       }}
//     >
//       {/* Student Selector */}
//       {profileData.students.length > 1 && (
//         <View className="flex-row p-4 bg-white">
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {profileData.students.map((student, index) => (
//               <TouchableOpacity
//                 key={student._id}
//                 className={`px-4 py-2 rounded-full mr-2 ${
//                   index === currentStudentIndex ? "bg-blue-600" : "bg-gray-200"
//                 }`}
//                 onPress={() => setCurrentStudentIndex(index)}
//               >
//                 <Text
//                   className={`${
//                     index === currentStudentIndex
//                       ? "text-white"
//                       : "text-gray-600"
//                   }`}
//                 >
//                   {student.name}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>
//       )}

//       {/* Welcome Header with Offline Indicator */}
//       <View className="bg-blue-600 p-6">
//         <View className="flex-row justify-between items-center">
//           <View>
//             <Text className="text-2xl font-bold text-white">
//               Welcome, {user?.name}
//             </Text>
//             <Text className="text-white mt-2">
//               Viewing: {currentStudent.name}'s Dashboard
//             </Text>
//           </View>
//           {!isOnline && (
//             <View className="bg-yellow-500 px-3 py-1 rounded-full">
//               <Text className="text-white text-sm">Offline</Text>
//             </View>
//           )}
//         </View>
//       </View>

//       {/* Dashboard Section */}
//       {dashboardData && (
//         <View>
//           {/* Attendance Card */}
//           <View className="mx-4 my-4">
//             <View className="bg-white rounded-lg shadow-sm p-4">
//               <View className="flex-row items-center mb-4">
//                 <FontAwesome5 name="user-check" size={20} color="#3b82f6" />
//                 <Text className="text-lg font-bold text-gray-800 ml-2">
//                   Monthly Attendance
//                 </Text>
//               </View>

//               <View className="flex-row justify-between items-center">
//                 <View className="items-center">
//                   <Text className="text-gray-600">Total Days</Text>
//                   <Text className="text-2xl font-bold text-gray-800">
//                     {dashboardData.totalDays}
//                   </Text>
//                 </View>

//                 <View className="items-center">
//                   <Text className="text-gray-600">Present</Text>
//                   <Text className="text-2xl font-bold text-gray-800">
//                     {dashboardData.presentDays}
//                   </Text>
//                 </View>

//                 <View className="items-center">
//                   <Text className="text-gray-600">Attendance</Text>
//                   <View
//                     className={`px-3 py-1 rounded-full ${
//                       dashboardData.percentage >= 90
//                         ? "bg-green-500"
//                         : dashboardData.percentage >= 75
//                         ? "bg-yellow-500"
//                         : "bg-red-500"
//                     }`}
//                   >
//                     <Text className="text-white font-bold">
//                       {dashboardData.percentage.toFixed(1)}%
//                     </Text>
//                   </View>
//                 </View>
//               </View>
//             </View>
//           </View>

//           {/* Class Teacher Announcements */}
//           {dashboardData.classTeacherInfo && (
//             <View className="mx-4 mb-4">
//               <View className="bg-white rounded-lg shadow-sm p-4">
//                 <View className="flex-row items-center mb-4">
//                   <MaterialIcons name="campaign" size={24} color="#3b82f6" />
//                   <Text className="text-lg font-bold text-gray-800 ml-2">
//                     Class Teacher Announcements
//                   </Text>
//                 </View>

//                 <ScrollView className="max-h-60">
//                   {dashboardData.classTeacherInfo.announcements.length > 0 ? (
//                     dashboardData.classTeacherInfo.announcements.map(
//                       (announcement) => (
//                         <View
//                           key={announcement._id}
//                           className="p-4 mb-3 bg-blue-50 rounded-lg"
//                         >
//                           <Text className="font-semibold text-gray-800 mb-1">
//                             {announcement.title}
//                           </Text>
//                           <Text className="text-gray-600">
//                             {announcement.content}
//                           </Text>
//                           <Text className="text-gray-400 text-sm mt-2">
//                             {new Date(
//                               announcement.createdAt
//                             ).toLocaleDateString()}
//                           </Text>
//                         </View>
//                       )
//                     )
//                   ) : (
//                     <Text className="text-gray-500 italic p-4">
//                       No announcements from class teacher
//                     </Text>
//                   )}
//                 </ScrollView>
//               </View>
//             </View>
//           )}
//         </View>
//       )}

//       {/* Classrooms List */}
//       <View className="mx-4">
//         <Text className="text-xl font-semibold text-gray-800 mb-3">
//           {currentStudent.name}'s Classrooms
//         </Text>

//         {currentStudent.classrooms?.length > 0 ? (
//           currentStudent.classrooms.map((classroom) => (
//             <TouchableOpacity
//               key={classroom._id}
//               className={`p-4 rounded-lg shadow-sm mb-4 ${
//                 classroom.classTeacher
//                   ? "bg-blue-50 border-2 border-blue-200"
//                   : "bg-white"
//               }`}
//               onPress={() =>
//                 router.push({
//                   pathname: "../(classroom)/classroomIndex",
//                   params: {
//                     id: classroom._id,
//                     subject: classroom.subject,
//                     grade: classroom.grade,
//                     section: classroom.section,
//                   },
//                 })
//               }
//             >
//               <View className="flex-row justify-between items-center">
//                 <View>
//                   <View className="flex-row items-center">
//                     <Text className="text-lg font-semibold text-gray-800">
//                       {classroom.subject}
//                     </Text>
//                     {classroom.classTeacher && (
//                       <View className="ml-2 px-2 py-1 bg-blue-100 rounded-full">
//                         <Text className="text-xs text-blue-600 font-medium">
//                           Class Teacher
//                         </Text>
//                       </View>
//                     )}
//                   </View>
//                   <Text className="text-gray-600">
//                     Class {classroom.grade} - {classroom.section}
//                   </Text>
//                   <Text className="text-gray-500">
//                     Teacher: {classroom.teacher?.name}
//                   </Text>
//                 </View>
//                 <MaterialIcons name="chevron-right" size={24} color="#3b82f6" />
//               </View>
//             </TouchableOpacity>
//           ))
//         ) : (
//           <Text className="text-gray-500 italic">
//             No classrooms assigned yet
//           </Text>
//         )}
//       </View>
//     </ScrollView>
//   );
// }

//-----------------------------------------------------------------------------------------------------
// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   ActivityIndicator,
//   Image,
//   Dimensions,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { useAuth } from "../../context/authContext";
// import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import NetInfo from "@react-native-community/netinfo";
// import axios from "axios";

// const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;
// const { width } = Dimensions.get("window");

// const TabButton = ({ title, isActive, onPress }) => (
//   <TouchableOpacity
//     onPress={onPress}
//     className={`flex-1 py-3 ${isActive ? "border-b-2 border-blue-600" : ""}`}
//   >
//     <Text
//       className={`text-center ${
//         isActive ? "text-blue-600 font-bold" : "text-gray-600"
//       }`}
//     >
//       {title}
//     </Text>
//   </TouchableOpacity>
// );

// export default function HomeScreen() {
//   const router = useRouter();
//   const { user, token } = useAuth();
//   const [profileData, setProfileData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
//   const [isOnline, setIsOnline] = useState(true);
//   const [activeTab, setActiveTab] = useState("timetable");

//   useEffect(() => {
//     loadData();
//     const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);
//     return () => unsubscribe();
//   }, []);

//   const handleConnectivityChange = async (state) => {
//     setIsOnline(state.isConnected);
//     if (state.isConnected) {
//       await syncData();
//     }
//   };

//   const loadData = async () => {
//     // Try to load cached data first
//     const cachedData = await loadCachedData();
//     if (cachedData) {
//       setProfileData(cachedData);
//       setIsLoading(false);
//     }

//     // Check network status
//     const networkState = await NetInfo.fetch();
//     setIsOnline(networkState.isConnected);

//     if (networkState.isConnected) {
//       await fetchParentProfile();
//     }
//   };

//   const loadCachedData = async () => {
//     try {
//       const jsonValue = await AsyncStorage.getItem("parentProfile");
//       return jsonValue != null ? JSON.parse(jsonValue) : null;
//     } catch (error) {
//       console.error("Error loading cached data:", error);
//       return null;
//     }
//   };

//   const syncData = async () => {
//     try {
//       await fetchParentProfile();
//     } catch (error) {
//       console.error("Error syncing data:", error);
//     }
//   };

//   const fetchParentProfile = async () => {
//     try {
//       const response = await axios.get(`${API_URL}/api/parent/profile`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const newProfileData = response.data.parent;

//       // Save to local storage
//       await AsyncStorage.setItem(
//         "parentProfile",
//         JSON.stringify(newProfileData)
//       );

//       setProfileData(newProfileData);
//     } catch (error) {
//       console.error("Error fetching profile:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const calculateAttendance = (student) => {
//     const classTeacherRoom = student.classrooms.find(
//       (classroom) => classroom.classTeacher === true
//     );

//     if (!classTeacherRoom) return null;

//     const currentMonth = new Date().getMonth();
//     const currentYear = new Date().getFullYear();

//     const studentAttendance = classTeacherRoom.attendance.filter((record) => {
//       const recordDate = new Date(record.date);
//       return (
//         recordDate.getMonth() === currentMonth &&
//         recordDate.getFullYear() === currentYear &&
//         (record.studentId?._id?.toString() === student._id?.toString() ||
//           record.studentId?.toString() === student._id?.toString())
//       );
//     });

//     const totalDays = studentAttendance.length;
//     const presentDays = studentAttendance.filter(
//       (record) => record.status === "present"
//     ).length;

//     return {
//       totalDays,
//       presentDays,
//       percentage: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
//       classTeacherInfo: {
//         teacherName: classTeacherRoom.teacher?.name,
//         grade: classTeacherRoom.grade,
//         section: classTeacherRoom.section,
//       },
//     };
//   };

//   const renderTimetableTab = (student) => {
//     const classTeacherRoom = student.classrooms.find(
//       (classroom) => classroom.classTeacher === true
//     );

//     if (!classTeacherRoom?.timetable?.image) {
//       return (
//         <View className="items-center justify-center p-8">
//           <Text className="text-gray-500">No timetable available</Text>
//         </View>
//       );
//     }

//     return (
//       <View className="p-4">
//         <Image
//           source={{
//             uri: `data:image/jpeg;base64,${classTeacherRoom.timetable.image}`,
//           }}
//           className="w-full h-48"
//           resizeMode="contain"
//         />
//       </View>
//     );
//   };

//   const renderAnnouncementsTab = (student) => {
//     const classTeacherRoom = student.classrooms.find(
//       (classroom) => classroom.classTeacher === true
//     );

//     const announcements = classTeacherRoom?.announcements || [];

//     return (
//       <ScrollView className="p-4">
//         {announcements.length > 0 ? (
//           announcements.map((announcement, index) => (
//             <View
//               key={index}
//               className="bg-white rounded-lg p-4 mb-3 shadow-sm"
//             >
//               <Text className="font-bold text-gray-800 text-lg mb-2">
//                 {announcement.title}
//               </Text>
//               <Text className="text-gray-600 mb-2">{announcement.content}</Text>
//               <Text className="text-gray-400 text-sm">
//                 {new Date(announcement.createdAt).toLocaleDateString()}
//               </Text>
//             </View>
//           ))
//         ) : (
//           <Text className="text-center text-gray-500">
//             No announcements available
//           </Text>
//         )}
//       </ScrollView>
//     );
//   };

//   const renderAttendanceTab = (student) => {
//     const attendance = calculateAttendance(student);

//     if (!attendance) {
//       return (
//         <View className="items-center justify-center p-8">
//           <Text className="text-gray-500">No attendance data available</Text>
//         </View>
//       );
//     }

//     return (
//       <View className="p-4">
//         <View className="bg-white rounded-lg p-6 shadow-sm">
//           <View className="flex-row justify-between mb-6">
//             <View className="items-center">
//               <Text className="text-4xl font-bold text-blue-600">
//                 {attendance.totalDays}
//               </Text>
//               <Text className="text-gray-600 mt-2">Total Days</Text>
//             </View>
//             <View className="items-center">
//               <Text className="text-4xl font-bold text-green-600">
//                 {attendance.presentDays}
//               </Text>
//               <Text className="text-gray-600 mt-2">Present</Text>
//             </View>
//             <View className="items-center">
//               <Text className="text-4xl font-bold text-purple-600">
//                 {attendance.percentage.toFixed(1)}%
//               </Text>
//               <Text className="text-gray-600 mt-2">Attendance</Text>
//             </View>
//           </View>

//           <View className="items-center mt-4">
//             <View className="bg-gray-100 w-full rounded-full h-4">
//               <View
//                 className="bg-blue-600 h-full rounded-full"
//                 style={{ width: `${Math.min(attendance.percentage, 100)}%` }}
//               />
//             </View>
//           </View>
//         </View>

//         <View className="mt-4 bg-white rounded-lg p-4 shadow-sm">
//           <Text className="font-semibold text-gray-800 mb-2">
//             Class Details
//           </Text>
//           <Text className="text-gray-600">
//             Teacher: {attendance.classTeacherInfo.teacherName}
//           </Text>
//           <Text className="text-gray-600">
//             Class: {attendance.classTeacherInfo.grade}-
//             {attendance.classTeacherInfo.section}
//           </Text>
//         </View>
//       </View>
//     );
//   };

//   if (isLoading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-white">
//         <ActivityIndicator size="large" color="#3b82f6" />
//       </View>
//     );
//   }

//   if (!profileData?.students?.length) {
//     return (
//       <View className="flex-1 justify-center items-center bg-white">
//         <Text className="text-gray-500">No students found</Text>
//       </View>
//     );
//   }

//   const currentStudent = profileData.students[currentStudentIndex];

//   return (
//     <ScrollView className="flex-1 bg-gray-50">
//       {/* Student Selector */}
//       {profileData.students.length > 1 && (
//         <View className="flex-row p-4 bg-white">
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {profileData.students.map((student, index) => (
//               <TouchableOpacity
//                 key={student._id}
//                 className={`px-4 py-2 rounded-full mr-2 ${
//                   index === currentStudentIndex ? "bg-blue-600" : "bg-gray-200"
//                 }`}
//                 onPress={() => setCurrentStudentIndex(index)}
//               >
//                 <Text
//                   className={
//                     index === currentStudentIndex
//                       ? "text-white"
//                       : "text-gray-600"
//                   }
//                 >
//                   {student.name}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>
//       )}

//       {/* Header */}
//       <View className="bg-blue-600 p-6">
//         <View className="flex-row justify-between items-center">
//           <View>
//             <Text className="text-2xl font-bold text-white">
//               Welcome, {user?.name}
//             </Text>
//             <Text className="text-white mt-2">
//               Viewing: {currentStudent.name}'s Dashboard
//             </Text>
//           </View>
//           {!isOnline && (
//             <View className="bg-yellow-500 px-3 py-1 rounded-full">
//               <Text className="text-white text-sm">Offline</Text>
//             </View>
//           )}
//         </View>
//       </View>

//       {/* Tabs */}
//       <View className="bg-white mb-4">
//         <View className="flex-row border-b border-gray-200">
//           <TabButton
//             title="Timetable"
//             isActive={activeTab === "timetable"}
//             onPress={() => setActiveTab("timetable")}
//           />
//           <TabButton
//             title="Announcements"
//             isActive={activeTab === "announcements"}
//             onPress={() => setActiveTab("announcements")}
//           />
//           <TabButton
//             title="Attendance"
//             isActive={activeTab === "attendance"}
//             onPress={() => setActiveTab("attendance")}
//           />
//         </View>

//         <View className="h-64">
//           {activeTab === "timetable" && renderTimetableTab(currentStudent)}
//           {activeTab === "announcements" &&
//             renderAnnouncementsTab(currentStudent)}
//           {activeTab === "attendance" && renderAttendanceTab(currentStudent)}
//         </View>
//       </View>

//       {/* Classrooms List */}
//       <View className="mx-4 mb-6">
//         <Text className="text-xl font-semibold text-gray-800 mb-3">
//           {currentStudent.name}'s Classrooms
//         </Text>

//         {currentStudent.classrooms?.length > 0 ? (
//           currentStudent.classrooms.map((classroom) => (
//             <TouchableOpacity
//               key={classroom._id}
//               className={`p-4 rounded-lg shadow-sm mb-4 ${
//                 classroom.classTeacher
//                   ? "bg-blue-50 border-2 border-blue-200"
//                   : "bg-white"
//               }`}
//               onPress={() =>
//                 router.push({
//                   pathname: "../(classroom)/classroomIndex",
//                   params: {
//                     id: classroom._id,
//                     subject: classroom.subject,
//                     grade: classroom.grade,
//                     section: classroom.section,
//                   },
//                 })
//               }
//             >
//               <View className="flex-row justify-between items-center">
//                 <View>
//                   <View className="flex-row items-center">
//                     <Text className="text-lg font-semibold text-gray-800">
//                       {classroom.subject}
//                     </Text>
//                     {classroom.classTeacher && (
//                       <View className="ml-2 px-2 py-1 bg-blue-100 rounded-full">
//                         <Text className="text-xs text-blue-600 font-medium">
//                           Class Teacher
//                         </Text>
//                       </View>
//                     )}
//                   </View>
//                   <Text className="text-gray-600">
//                     Class {classroom.grade} - {classroom.section}
//                   </Text>
//                   <Text className="text-gray-500">
//                     Teacher: {classroom.teacher?.name}
//                   </Text>
//                 </View>
//                 <MaterialIcons name="chevron-right" size={24} color="#3b82f6" />
//               </View>
//             </TouchableOpacity>
//           ))
//         ) : (
//           <Text className="text-gray-500 italic">
//             No classrooms assigned yet
//           </Text>
//         )}
//       </View>
//     </ScrollView>
//   );
// }

//-----------------------------------------------------------------------------------------------------

// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   ActivityIndicator,
//   Image,
//   Dimensions,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { useAuth } from "../../context/authContext";
// import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import NetInfo from "@react-native-community/netinfo";
// import axios from "axios";

// const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;
// const { width } = Dimensions.get("window");

// const TabButton = ({ title, icon, isActive, onPress }) => (
//   <TouchableOpacity
//     onPress={onPress}
//     className={`flex-1 py-2 ${
//       isActive ? "border-b-2 border-blue-600" : "border-b border-gray-200"
//     }`}
//   >
//     <View className="flex items-center justify-center">
//       {icon}
//       <Text
//         className={`text-center mt-0.5 text-xs ${
//           isActive ? "text-blue-600 font-bold" : "text-gray-600"
//         }`}
//       >
//         {title}
//       </Text>
//     </View>
//   </TouchableOpacity>
// );

// export default function HomeScreen() {
//   const router = useRouter();
//   const { user, token } = useAuth();
//   const [profileData, setProfileData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
//   const [isOnline, setIsOnline] = useState(true);
//   const [activeTab, setActiveTab] = useState("timetable");

//   useEffect(() => {
//     loadData();
//     const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);
//     return () => unsubscribe();
//   }, []);

//   const handleConnectivityChange = async (state) => {
//     setIsOnline(state.isConnected);
//     if (state.isConnected) {
//       await syncData();
//     }
//   };

//   const loadData = async () => {
//     const cachedData = await loadCachedData();
//     if (cachedData) {
//       setProfileData(cachedData);
//       setIsLoading(false);
//     }

//     const networkState = await NetInfo.fetch();
//     setIsOnline(networkState.isConnected);

//     if (networkState.isConnected) {
//       await fetchParentProfile();
//     }
//   };

//   const loadCachedData = async () => {
//     try {
//       const jsonValue = await AsyncStorage.getItem("parentProfile");
//       return jsonValue != null ? JSON.parse(jsonValue) : null;
//     } catch (error) {
//       console.error("Error loading cached data:", error);
//       return null;
//     }
//   };

//   const syncData = async () => {
//     try {
//       await fetchParentProfile();
//     } catch (error) {
//       console.error("Error syncing data:", error);
//     }
//   };

//   const fetchParentProfile = async () => {
//     try {
//       const response = await axios.get(`${API_URL}/api/parent/profile`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const newProfileData = response.data.parent;

//       await AsyncStorage.setItem(
//         "parentProfile",
//         JSON.stringify(newProfileData)
//       );

//       setProfileData(newProfileData);
//     } catch (error) {
//       console.error("Error fetching profile:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const calculateAttendance = (student) => {
//     const classTeacherRoom = student.classrooms.find(
//       (classroom) => classroom.classTeacher === true
//     );

//     if (!classTeacherRoom) return null;

//     const currentMonth = new Date().getMonth();
//     const currentYear = new Date().getFullYear();

//     const studentAttendance = classTeacherRoom.attendance.filter((record) => {
//       const recordDate = new Date(record.date);
//       return (
//         recordDate.getMonth() === currentMonth &&
//         recordDate.getFullYear() === currentYear &&
//         (record.studentId?._id?.toString() === student._id?.toString() ||
//           record.studentId?.toString() === student._id?.toString())
//       );
//     });

//     const totalDays = studentAttendance.length;
//     const presentDays = studentAttendance.filter(
//       (record) => record.status === "present"
//     ).length;

//     return {
//       totalDays,
//       presentDays,
//       percentage: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
//       classTeacherInfo: {
//         teacherName: classTeacherRoom.teacher?.name,
//         grade: classTeacherRoom.grade,
//         section: classTeacherRoom.section,
//       },
//     };
//   };

//   const renderTimetableTab = (student) => {
//     const classTeacherRoom = student.classrooms.find(
//       (classroom) => classroom.classTeacher === true
//     );

//     if (!classTeacherRoom?.timetable?.image) {
//       return (
//         <View className="items-center justify-center p-8">
//           <Text className="text-gray-500">No timetable available</Text>
//         </View>
//       );
//     }

//     return (
//       <View className="p-2">
//         <Image
//           source={{
//             uri: `data:image/jpeg;base64,${classTeacherRoom.timetable.image}`,
//           }}
//           className="w-full h-72"
//           resizeMode="contain"
//         />
//       </View>
//     );
//   };

//   const renderAttendanceTab = (student) => {
//     const attendance = calculateAttendance(student);

//     if (!attendance) {
//       return (
//         <View className="items-center justify-center p-8">
//           <Text className="text-gray-500">No attendance data available</Text>
//         </View>
//       );
//     }

//     return (
//       <View className="p-4">
//         <View className="bg-white rounded-lg p-6 shadow-sm">
//           <View className="flex-row justify-between mb-6">
//             <View className="items-center">
//               <Text className="text-4xl font-bold text-blue-600">
//                 {attendance.totalDays}
//               </Text>
//               <Text className="text-gray-600 mt-2">Total Days</Text>
//             </View>
//             <View className="items-center">
//               <Text className="text-4xl font-bold text-green-600">
//                 {attendance.presentDays}
//               </Text>
//               <Text className="text-gray-600 mt-2">Present</Text>
//             </View>
//             <View className="items-center">
//               <Text className="text-4xl font-bold text-purple-600">
//                 {attendance.percentage.toFixed(1)}%
//               </Text>
//               <Text className="text-gray-600 mt-2">Attendance</Text>
//             </View>
//           </View>

//           <View className="items-center mt-4">
//             <View className="bg-gray-100 w-full rounded-full h-4">
//               <View
//                 className="bg-blue-600 h-full rounded-full"
//                 style={{ width: `${Math.min(attendance.percentage, 100)}%` }}
//               />
//             </View>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   if (isLoading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-white">
//         <ActivityIndicator size="large" color="#3b82f6" />
//       </View>
//     );
//   }

//   if (!profileData?.students?.length) {
//     return (
//       <View className="flex-1 justify-center items-center bg-white">
//         <Text className="text-gray-500">No students found</Text>
//       </View>
//     );
//   }

//   const currentStudent = profileData.students[currentStudentIndex];

//   return (
//     <ScrollView className="flex-1 bg-gray-50">
//       {/* Student Selector */}
//       {profileData.students.length > 1 && (
//         <View className="flex-row p-2 bg-white">
//           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//             {profileData.students.map((student, index) => (
//               <TouchableOpacity
//                 key={student._id}
//                 className={`px-4 py-2 rounded-full mr-2 ${
//                   index === currentStudentIndex ? "bg-blue-600" : "bg-gray-200"
//                 }`}
//                 onPress={() => setCurrentStudentIndex(index)}
//               >
//                 <Text
//                   className={
//                     index === currentStudentIndex
//                       ? "text-white"
//                       : "text-gray-600"
//                   }
//                 >
//                   {student.name}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </ScrollView>
//         </View>
//       )}

//       {/* Header */}
//       <View className="bg-blue-600 p-4">
//         <View className="flex-row justify-between items-center">
//           <View>
//             <Text className="text-xl font-bold text-white">
//               Welcome, {user?.name}
//             </Text>
//             <Text className="text-white mt-1">
//               Viewing: {currentStudent.name}'s Dashboard
//             </Text>
//           </View>
//           {!isOnline && (
//             <View className="bg-yellow-500 px-2 py-1 rounded-full">
//               <Text className="text-white text-xs">Offline</Text>
//             </View>
//           )}
//         </View>
//       </View>

//       {/* Class Details */}
//       {currentStudent.classrooms.find(
//         (classroom) => classroom.classTeacher
//       ) && (
//         <View className="mx-2 mt-1">
//           <View className="bg-white rounded-lg shadow-sm p-3">
//             <View className="flex-row items-center mb-2">
//               <MaterialIcons name="class" size={20} color="#3b82f6" />
//               <Text className="text-md font-bold text-gray-800 ml-2">
//                 Class Details
//               </Text>
//             </View>
//             <View className="flex-row justify-between items-center">
//               <View className="flex-1">
//                 <View className="flex-row items-center">
//                   <FontAwesome5
//                     name="chalkboard-teacher"
//                     size={14}
//                     color="#6b7280"
//                   />
//                   <Text className="text-gray-600 ml-2 ">
//                     Class Teacher:{" "}
//                     {
//                       currentStudent.classrooms.find(
//                         (classroom) => classroom.classTeacher
//                       ).teacher?.name
//                     }
//                   </Text>
//                 </View>
//                 <View className="flex-row items-center mt-1">
//                   <MaterialIcons
//                     name="meeting-room"
//                     size={14}
//                     color="#6b7280"
//                   />
//                   <Text className="text-gray-600 ml-2 ">
//                     Class:{" "}
//                     {
//                       currentStudent.classrooms.find(
//                         (classroom) => classroom.classTeacher
//                       ).grade
//                     }
//                     -
//                     {
//                       currentStudent.classrooms.find(
//                         (classroom) => classroom.classTeacher
//                       ).section
//                     }
//                   </Text>
//                 </View>
//               </View>
//             </View>
//           </View>
//         </View>
//       )}

//       {/* Tabs */}
//       <View className="bg-white">
//         <View className="flex-row border-b border-gray-200">
//           <TabButton
//             title="Timetable"
//             icon={
//               <MaterialIcons
//                 name="schedule"
//                 size={20}
//                 color={activeTab === "timetable" ? "#2563eb" : "#6b7280"}
//               />
//             }
//             isActive={activeTab === "timetable"}
//             onPress={() => setActiveTab("timetable")}
//           />
//           <TabButton
//             title="Attendance"
//             icon={
//               <FontAwesome5
//                 name="user-check"
//                 size={18}
//                 color={activeTab === "attendance" ? "#2563eb" : "#6b7280"}
//               />
//             }
//             isActive={activeTab === "attendance"}
//             onPress={() => setActiveTab("attendance")}
//           />
//         </View>

//         <View>
//           {activeTab === "timetable" && renderTimetableTab(currentStudent)}
//           {activeTab === "attendance" && renderAttendanceTab(currentStudent)}
//         </View>
//       </View>

//       {/* Classrooms List */}
//       <View className="mx-2 mt-2 mb-4">
//         <Text className="text-base font-semibold text-gray-800 mb-2 ml-1">
//           {currentStudent.name}'s Classrooms
//         </Text>

//         {currentStudent.classrooms?.length > 0 ? (
//           currentStudent.classrooms.map((classroom) => (
//             <TouchableOpacity
//               key={classroom._id}
//               className={`p-3 rounded-lg shadow-sm mb-2 ${
//                 classroom.classTeacher
//                   ? "bg-blue-50 border border-blue-200"
//                   : "bg-white"
//               }`}
//               onPress={() =>
//                 router.push({
//                   pathname: "../(classroom)/classroomIndex",
//                   params: {
//                     id: classroom._id,
//                     subject: classroom.subject,
//                     grade: classroom.grade,
//                     section: classroom.section,
//                   },
//                 })
//               }
//             >
//               <View className="flex-row justify-between items-center">
//                 <View>
//                   <View className="flex-row items-center">
//                     <Text className="text-base font-semibold text-gray-800">
//                       {classroom.subject}
//                     </Text>
//                     {classroom.classTeacher && (
//                       <View className="ml-2 px-2 py-0.5 bg-blue-100 rounded-full">
//                         <Text className="text-xs text-blue-600 font-medium">
//                           Class Teacher
//                         </Text>
//                       </View>
//                     )}
//                   </View>
//                   <Text className="text-sm text-gray-600">
//                     Class {classroom.grade} - {classroom.section}
//                   </Text>
//                   <Text className="text-sm text-gray-500">
//                     Teacher: {classroom.teacher?.name}
//                   </Text>
//                 </View>
//                 <MaterialIcons name="chevron-right" size={24} color="#3b82f6" />
//               </View>
//             </TouchableOpacity>
//           ))
//         ) : (
//           <Text className="text-gray-500 italic">
//             No classrooms assigned yet
//           </Text>
//         )}
//       </View>
//     </ScrollView>
//   );
// }

// // HomeScreen.js
// import React, { useState, useEffect } from "react";
// import { View, Text, ScrollView, Image, ActivityIndicator } from "react-native";
// import { useRouter } from "expo-router";
// import { useAuth } from "../../context/authContext";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import NetInfo from "@react-native-community/netinfo";
// import axios from "axios";
// import { ParentHeader } from "../components/ParentHeader";
// import { StudentDashboardTabs } from "../components/StudentDashboardTabs";
// import { ClassroomsList } from "../components/ClassroomsList";

// const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

// export default function HomeScreen() {
//   const router = useRouter();
//   const { user, token } = useAuth();
//   const [profileData, setProfileData] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentStudentIndex, setCurrentStudentIndex] = useState(0);
//   const [isOnline, setIsOnline] = useState(true);
//   const [activeTab, setActiveTab] = useState("timetable");

//   useEffect(() => {
//     loadData();
//     const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);
//     return () => unsubscribe();
//   }, []);

//   const handleConnectivityChange = async (state) => {
//     setIsOnline(state.isConnected);
//     if (state.isConnected) {
//       await syncData();
//     }
//   };

//   const loadData = async () => {
//     const cachedData = await loadCachedData();
//     if (cachedData) {
//       setProfileData(cachedData);
//       setIsLoading(false);
//     }

//     const networkState = await NetInfo.fetch();
//     setIsOnline(networkState.isConnected);

//     if (networkState.isConnected) {
//       await fetchParentProfile();
//     }
//   };

//   const loadCachedData = async () => {
//     try {
//       const jsonValue = await AsyncStorage.getItem("parentProfile");
//       return jsonValue != null ? JSON.parse(jsonValue) : null;
//     } catch (error) {
//       console.error("Error loading cached data:", error);
//       return null;
//     }
//   };

//   const syncData = async () => {
//     try {
//       await fetchParentProfile();
//     } catch (error) {
//       console.error("Error syncing data:", error);
//     }
//   };

//   const fetchParentProfile = async () => {
//     try {
//       const response = await axios.get(`${API_URL}/api/parent/profile`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const newProfileData = response.data.parent;

//       await AsyncStorage.setItem(
//         "parentProfile",
//         JSON.stringify(newProfileData)
//       );

//       setProfileData(newProfileData);
//     } catch (error) {
//       console.error("Error fetching profile:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const calculateAttendance = (student) => {
//     const classTeacherRoom = student.classrooms.find(
//       (classroom) => classroom.classTeacher === true
//     );

//     if (!classTeacherRoom) return null;

//     const currentMonth = new Date().getMonth();
//     const currentYear = new Date().getFullYear();

//     const studentAttendance = classTeacherRoom.attendance.filter((record) => {
//       const recordDate = new Date(record.date);
//       return (
//         recordDate.getMonth() === currentMonth &&
//         recordDate.getFullYear() === currentYear &&
//         (record.studentId?._id?.toString() === student._id?.toString() ||
//           record.studentId?.toString() === student._id?.toString())
//       );
//     });

//     const totalDays = studentAttendance.length;
//     const presentDays = studentAttendance.filter(
//       (record) => record.status === "present"
//     ).length;

//     return {
//       totalDays,
//       presentDays,
//       percentage: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
//       classTeacherInfo: {
//         teacherName: classTeacherRoom.teacher?.name,
//         grade: classTeacherRoom.grade,
//         section: classTeacherRoom.section,
//       },
//     };
//   };

//   const renderTimetableTab = (student) => {
//     const classTeacherRoom = student.classrooms.find(
//       (classroom) => classroom.classTeacher === true
//     );

//     if (!classTeacherRoom?.timetable?.image) {
//       return (
//         <View className="items-center justify-center p-8">
//           <Text className="text-gray-500">No timetable available</Text>
//         </View>
//       );
//     }

//     return (
//       <View className="p-2">
//         <Image
//           source={{
//             uri: `data:image/jpeg;base64,${classTeacherRoom.timetable.image}`,
//           }}
//           className="w-full h-72"
//           resizeMode="contain"
//         />
//       </View>
//     );
//   };

//   const renderAttendanceTab = (student) => {
//     const attendance = calculateAttendance(student);

//     if (!attendance) {
//       return (
//         <View className="items-center justify-center p-8">
//           <Text className="text-gray-500">No attendance data available</Text>
//         </View>
//       );
//     }

//     return (
//       <View className="p-4">
//         <View className="bg-white rounded-lg p-6 shadow-sm">
//           <View className="flex-row justify-between mb-6">
//             <View className="items-center">
//               <Text className="text-4xl font-bold text-blue-600">
//                 {attendance.totalDays}
//               </Text>
//               <Text className="text-gray-600 mt-2">Total Days</Text>
//             </View>
//             <View className="items-center">
//               <Text className="text-4xl font-bold text-green-600">
//                 {attendance.presentDays}
//               </Text>
//               <Text className="text-gray-600 mt-2">Present</Text>
//             </View>
//             <View className="items-center">
//               <Text className="text-4xl font-bold text-purple-600">
//                 {attendance.percentage.toFixed(1)}%
//               </Text>
//               <Text className="text-gray-600 mt-2">Attendance</Text>
//             </View>
//           </View>

//           <View className="items-center mt-4">
//             <View className="bg-gray-100 w-full rounded-full h-4">
//               <View
//                 className="bg-blue-600 h-full rounded-full"
//                 style={{ width: `${Math.min(attendance.percentage, 100)}%` }}
//               />
//             </View>
//           </View>
//         </View>
//       </View>
//     );
//   };

//   if (isLoading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-white">
//         <ActivityIndicator size="large" color="#3b82f6" />
//       </View>
//     );
//   }

//   if (!profileData?.students?.length) {
//     return (
//       <View className="flex-1 justify-center items-center bg-white">
//         <Text className="text-gray-500">No students found</Text>
//       </View>
//     );
//   }

//   const currentStudent = profileData.students[currentStudentIndex];

//   return (
//     <ScrollView className="flex-1 bg-gray-50">
//       <ParentHeader
//         user={user}
//         isOnline={isOnline}
//         profileData={profileData}
//         currentStudentIndex={currentStudentIndex}
//         setCurrentStudentIndex={setCurrentStudentIndex}
//         currentStudent={currentStudent}
//       />

//       <StudentDashboardTabs
//         student={currentStudent}
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         calculateAttendance={calculateAttendance}
//         renderTimetableTab={renderTimetableTab}
//         renderAttendanceTab={renderAttendanceTab}
//       />

//       <ClassroomsList student={currentStudent} router={router} />
//     </ScrollView>
//   );
// }

// HomeScreen.js
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

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

export default function HomeScreen() {
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
          <Text className="text-gray-500">No timetable available</Text>
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
        <Text className="text-gray-500">No students found</Text>
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
