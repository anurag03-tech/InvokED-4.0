// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   TextInput,
//   Alert,
//   Switch,
//   ActivityIndicator,
//   SafeAreaView,
//   RefreshControl,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { useAuth } from "../../context/authContext";
// import axios from "axios";
// import CustomModal from "../CustomModal";
// import {
//   MaterialIcons,
//   FontAwesome5,
//   MaterialCommunityIcons,
// } from "@expo/vector-icons";

// const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

// export default function HomeScreen() {
//   const router = useRouter();
//   const { user, token } = useAuth();
//   const [classrooms, setClassrooms] = useState([]);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [newClassroom, setNewClassroom] = useState({
//     grade: "",
//     section: "",
//     subject: "",
//     classTeacher: false,
//   });

//   // Get class teacher classrooms
//   const classTeacherClassrooms = classrooms.filter(
//     (classroom) => classroom.classTeacher
//   );

//   // Get subject teacher classrooms (where user is not the class teacher)
//   const subjectTeacherClassrooms = classrooms.filter(
//     (classroom) => !classroom.classTeacher
//   );

//   // Calculate unique students (prevent counting same student multiple times)
//   const getUniqueStudentCount = () => {
//     const uniqueStudentIds = new Set();

//     classrooms.forEach((classroom) => {
//       if (classroom.students && classroom.students.length > 0) {
//         classroom.students.forEach((studentId) => {
//           uniqueStudentIds.add(studentId);
//         });
//       }
//     });

//     return uniqueStudentIds.size;
//   };

//   useEffect(() => {
//     fetchClassrooms();
//   }, []);

//   const fetchClassrooms = async () => {
//     setRefreshing(true);
//     try {
//       const response = await axios.get(`${API_URL}/api/classroom/all`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       //console.log("Classrooms:", response.data.classrooms);
//       setClassrooms(response.data.classrooms);
//     } catch (error) {
//       console.error("Error fetching classrooms:", error);
//       if (error.response?.status === 401) {
//         Alert.alert("Authentication Error", "Please login again");
//       } else {
//         Alert.alert("Error", "Failed to fetch classrooms");
//       }
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const addClassroom = async () => {
//     if (newClassroom.grade && newClassroom.section && newClassroom.subject) {
//       setLoading(true);
//       try {
//         const response = await axios.post(
//           `${API_URL}/api/classroom/create`,
//           newClassroom,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );
//         setClassrooms([...classrooms, response.data.classroom]);
//         setNewClassroom({
//           grade: "",
//           section: "",
//           subject: "",
//           classTeacher: false,
//         });
//         setModalVisible(false);
//         Alert.alert("Success", "Classroom created successfully");
//       } catch (error) {
//         console.log("Error creating classroom:", error.response?.data?.message);
//         console.error("Error creating classroom:", error);
//         if (error.response?.status === 401) {
//           Alert.alert("Authentication Error", "Please login again");
//         } else {
//           Alert.alert("Error", error.response?.data?.message);
//         }
//       } finally {
//         setLoading(false);
//       }
//     } else {
//       Alert.alert("Error", "Please fill all fields");
//     }
//   };

//   if (loading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-gray-50">
//         <ActivityIndicator size="large" color="#2563eb" />
//         <Text className="mt-4 text-gray-600 font-medium">
//           Loading your classrooms...
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView className="flex-1 bg-gray-100">
//       <ScrollView
//         className="flex-1"
//         contentContainerStyle={{
//           flexGrow: 1,
//           paddingBottom: 20,
//         }}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={fetchClassrooms}
//             colors={["#2563eb"]}
//             tintColor="#2563eb"
//           />
//         }
//       >
//         {/* Improved Header with solid background */}
//         <View className="bg-blue-600 pb-5 rounded-b-3xl shadow-lg">
//           <View className="pt-3 px-5">
//             <View className="flex-row justify-between items-center mt-2">
//               <View>
//                 <Text className="text-white text-2xl font-medium ">
//                   Teacher's Dashboard,
//                 </Text>
//                 <Text className="text-white text-xl font-bold mt-1">
//                   {user?.name?.split(" ")[0] || "Teacher"}
//                 </Text>
//                 <Text className="text-blue-100 text-md mt-1">
//                   {user?.school || "School"}
//                 </Text>
//               </View>
//             </View>
//           </View>

//           {/* Stats Section */}
//           <View className="mx-5 mt-5 flex-row">
//             <View className=" rounded-xl flex-1 justify-center mr-3  bg-blue-500">
//               <View className="flex-row items-center justify-center gap-4 ">
//                 <View className="bg-white p-2 rounded-lg ">
//                   <FontAwesome5 name="users" size={18} color="blue" />
//                 </View>
//                 <View>
//                   <Text className="text-white">Students</Text>
//                   <Text className="text-xl font-bold text-white">
//                     {getUniqueStudentCount()}
//                   </Text>
//                 </View>
//               </View>
//             </View>

//             <View className=" rounded-xl p-4 flex-1 justify-center   bg-blue-500">
//               <View className="flex-row  items-center justify-center gap-4">
//                 <View className="bg-white p-2 rounded-lg ">
//                   <MaterialCommunityIcons
//                     name="google-classroom"
//                     size={18}
//                     color="blue"
//                   />
//                 </View>
//                 <View>
//                   <Text className="text-white ">Classes</Text>
//                   <Text className="text-xl font-bold text-white">
//                     {classrooms.length}
//                   </Text>
//                 </View>
//               </View>
//             </View>
//           </View>

//           {/* Add Classroom Button */}
//           <TouchableOpacity
//             className="bg-white mx-5 mt-5 py-2 rounded-xl shadow-md flex-row justify-center items-center border border-blue-100"
//             onPress={() => setModalVisible(true)}
//           >
//             <View className="bg-blue-100 p-1 rounded-md mr-2">
//               <MaterialIcons name="add" size={20} color="#2563eb" />
//             </View>
//             <Text className="text-blue-600 font-semibold text-lg">
//               Add New Classroom
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {/* All Classrooms Section */}
//         <View className="px-5 mt-4">
//           <View className="mb-3 flex-row items-center">
//             <MaterialCommunityIcons
//               name="google-classroom"
//               size={24}
//               color="#2563eb"
//             />
//             <Text className="text-blue-600 font-bold text-lg ml-2">
//               My Classrooms
//             </Text>
//           </View>

//           {/* Empty state */}
//           {classrooms.length === 0 && (
//             <View className="items-center justify-center py-12 px-5 bg-white rounded-xl border border-gray-100 shadow-sm">
//               <View className="bg-blue-50 p-4 rounded-full mb-4">
//                 <MaterialIcons name="book" size={42} color="#2563eb" />
//               </View>
//               <Text className="text-gray-800 text-lg font-semibold mb-1">
//                 No classrooms yet
//               </Text>
//               <Text className="text-gray-500 text-center text-sm max-w-xs">
//                 Click "Add New Classroom" to get started
//               </Text>
//             </View>
//           )}

//           {/* All Classroom Cards - Two columns, exactly half screen each */}
//           {classrooms.length > 0 && (
//             <View className="flex-row flex-wrap justify-between">
//               {classrooms.map((classroom, index) => {
//                 // Array of light background colors to rotate through
//                 const bgColors = [
//                   "bg-blue-50",
//                   "bg-green-50",
//                   "bg-purple-50",
//                   "bg-amber-50",
//                   "bg-rose-50",
//                   "bg-teal-50",
//                 ];

//                 // Array of matching border colors
//                 const borderColors = [
//                   "border-blue-300",
//                   "border-green-300",
//                   "border-purple-300",
//                   "border-amber-300",
//                   "border-rose-300",
//                   "border-teal-300",
//                 ];

//                 // Array of matching icon colors
//                 const iconColors = [
//                   "#2563eb", // blue
//                   "#059669", // green
//                   "#7c3aed", // purple
//                   "#d97706", // amber
//                   "#e11d48", // rose
//                   "#0d9488", // teal
//                 ];

//                 // Text accent colors
//                 const textAccentColors = [
//                   "text-blue-700",
//                   "text-green-700",
//                   "text-purple-700",
//                   "text-amber-700",
//                   "text-rose-700",
//                   "text-teal-700",
//                 ];

//                 // Get color based on index
//                 const colorIndex = index % bgColors.length;

//                 return (
//                   <TouchableOpacity
//                     key={classroom._id}
//                     className={`${bgColors[colorIndex]} rounded-xl p-2 ${borderColors[colorIndex]} border mb-3 w-[49%] h-32 flex-col`}
//                     onPress={() =>
//                       router.push({
//                         pathname: "../(classroom)",
//                         params: { id: classroom._id },
//                       })
//                     }
//                   >
//                     {/* Top section - Icon and Class info */}
//                     <View className="items-center flex-row justify-between">
//                       <View className="rounded-xl items-center justify-center aspect-square w-1/4">
//                         <MaterialCommunityIcons
//                           name="school"
//                           size={34}
//                           color={iconColors[colorIndex]}
//                         />
//                       </View>
//                       <View className="flex-1 ml-2">
//                         <Text className="text-gray-700 text-lg font-semibold">
//                           Class {classroom.grade}-{classroom.section}
//                         </Text>
//                       </View>
//                     </View>

//                     {/* Subject section */}
//                     <View className="mb-2 items-center">
//                       <Text className="text-xl font-semibold text-gray-800">
//                         {classroom.subject}
//                       </Text>
//                     </View>

//                     {classroom.classTeacher && (
//                       <View className="flex-row items-center justify-center">
//                         <MaterialCommunityIcons
//                           name="crown"
//                           size={20}
//                           color="#FFB74D"
//                         />
//                         <Text
//                           className={`${textAccentColors[colorIndex]} ml-1 font-medium`}
//                         >
//                           Class Teacher
//                         </Text>
//                       </View>
//                     )}
//                   </TouchableOpacity>
//                 );
//               })}
//             </View>
//           )}
//         </View>
//       </ScrollView>

//       {/* Add Classroom Modal - improved styling */}
//       <CustomModal
//         visible={modalVisible}
//         onClose={() => {
//           setModalVisible(false);
//           setNewClassroom({
//             grade: "",
//             section: "",
//             subject: "",
//             classTeacher: false,
//           });
//         }}
//         onSubmit={addClassroom}
//         title="Add New Classroom"
//         submitText="Create Classroom"
//         isLoading={loading}
//       >
//         <View className="space-y-4">
//           <View>
//             <Text className="font-medium text-gray-700 mb-1">Class</Text>
//             <View className="flex-row items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
//               <View className="bg-gray-50 p-3 border-r border-gray-300">
//                 <MaterialIcons name="school" size={20} color="#6b7280" />
//               </View>
//               <TextInput
//                 className="p-3 flex-1 bg-white"
//                 placeholder="Enter class (e.g., 8)"
//                 value={newClassroom.grade}
//                 onChangeText={(text) =>
//                   setNewClassroom({ ...newClassroom, grade: text })
//                 }
//                 keyboardType="numeric"
//               />
//             </View>
//           </View>

//           <View>
//             <Text className="font-medium text-gray-700 mb-1 mt-1">Section</Text>
//             <View className="flex-row items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
//               <View className="bg-gray-50 p-3 border-r border-gray-300">
//                 <MaterialIcons name="label" size={20} color="#6b7280" />
//               </View>
//               <TextInput
//                 className="p-3 flex-1 bg-white"
//                 placeholder="Enter section (e.g., A)"
//                 value={newClassroom.section}
//                 onChangeText={(text) =>
//                   setNewClassroom({
//                     ...newClassroom,
//                     section: text.toUpperCase(),
//                   })
//                 }
//                 autoCapitalize="characters"
//                 maxLength={1}
//               />
//             </View>
//           </View>

//           <View>
//             <Text className="font-medium text-gray-700 mb-1 mt-1">Subject</Text>
//             <View className="flex-row items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
//               <View className="bg-gray-50 p-3 border-r border-gray-300">
//                 <MaterialIcons name="book" size={20} color="#6b7280" />
//               </View>
//               <TextInput
//                 className="p-3 flex-1 bg-white"
//                 placeholder="Enter subject name"
//                 value={newClassroom.subject}
//                 onChangeText={(text) =>
//                   setNewClassroom({ ...newClassroom, subject: text })
//                 }
//                 autoCapitalize="words"
//               />
//             </View>
//           </View>

//           <View className="flex-row items-center justify-between bg-blue-50 mt-3 px-2 rounded-lg border border-blue-100">
//             <View className="flex-1">
//               <View className="flex-row items-center">
//                 <MaterialCommunityIcons
//                   name="shield-account"
//                   size={20}
//                   color="#2563eb"
//                 />
//                 <Text className="font-medium text-gray-800 ml-2">
//                   Class Teacher
//                 </Text>
//               </View>
//             </View>
//             <Switch
//               value={newClassroom.classTeacher}
//               onValueChange={(value) =>
//                 setNewClassroom({ ...newClassroom, classTeacher: value })
//               }
//               trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
//               thumbColor={newClassroom.classTeacher ? "#2563eb" : "#f3f4f6"}
//               ios_backgroundColor="#d1d5db"
//             />
//           </View>
//         </View>
//       </CustomModal>
//     </SafeAreaView>
//   );
// }

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/authContext";
import axios from "axios";
import CustomModal from "../CustomModal";
import {
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    grade: "",
    section: "",
    subject: "",
    classTeacher: false,
  });

  // Get class teacher classrooms
  const classTeacherClassrooms = classrooms.filter(
    (classroom) => classroom.classTeacher
  );

  // Get subject teacher classrooms (where user is not the class teacher)
  const subjectTeacherClassrooms = classrooms.filter(
    (classroom) => !classroom.classTeacher
  );

  // Calculate unique students (prevent counting same student multiple times)
  const getUniqueStudentCount = () => {
    const uniqueStudentIds = new Set();

    classrooms.forEach((classroom) => {
      if (classroom.students && classroom.students.length > 0) {
        classroom.students.forEach((studentId) => {
          uniqueStudentIds.add(studentId);
        });
      }
    });

    return uniqueStudentIds.size;
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    setRefreshing(true);
    try {
      const response = await axios.get(`${API_URL}/api/classroom/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClassrooms(response.data.classrooms);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      if (error.response?.status === 401) {
        Alert.alert("Authentication Error", "Please login again");
      } else {
        Alert.alert("Error", "Failed to fetch classrooms");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const addClassroom = async () => {
    if (newClassroom.grade && newClassroom.section && newClassroom.subject) {
      setLoading(true);
      try {
        const response = await axios.post(
          `${API_URL}/api/classroom/create`,
          newClassroom,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setClassrooms([...classrooms, response.data.classroom]);
        setNewClassroom({
          grade: "",
          section: "",
          subject: "",
          classTeacher: false,
        });
        setModalVisible(false);
        Alert.alert("Success", "Classroom created successfully");
      } catch (error) {
        console.log("Error creating classroom:", error.response?.data?.message);
        console.error("Error creating classroom:", error);
        if (error.response?.status === 401) {
          Alert.alert("Authentication Error", "Please login again");
        } else {
          Alert.alert("Error", error.response?.data?.message);
        }
      } finally {
        setLoading(false);
      }
    } else {
      Alert.alert("Error", "Please fill all fields");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-600 font-medium">
          Loading your classrooms...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchClassrooms}
            colors={["#2563eb"]}
            tintColor="#2563eb"
          />
        }
      >
        {/* Improved Header with solid background */}
        <View className="bg-blue-600 pb-5 rounded-b-3xl shadow-lg">
          <View className="pt-3 px-5">
            <View className="flex-row justify-between items-center mt-2">
              <View>
                <Text className="text-white text-2xl font-medium ">
                  Teacher's Dashboard,
                </Text>
                <Text className="text-white text-xl font-bold mt-1">
                  {user?.name?.split(" ")[0] || "Teacher"}
                </Text>
                <Text className="text-blue-100 text-md mt-1">
                  {user?.school || "School"}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Section */}
          <View className="mx-5 mt-5 flex-row">
            <View className="rounded-xl flex-1 justify-center mr-3 bg-blue-500 p-3">
              <View className="flex-row items-center justify-center gap-4 ">
                <View className="bg-white p-2 rounded-lg ">
                  <FontAwesome5 name="users" size={18} color="blue" />
                </View>
                <View>
                  <Text className="text-white">Students</Text>
                  <Text className="text-xl font-bold text-white">
                    {getUniqueStudentCount()}
                  </Text>
                </View>
              </View>
            </View>

            <View className="rounded-xl p-4 flex-1 justify-center bg-blue-500">
              <View className="flex-row items-center justify-center gap-4">
                <View className="bg-white p-2 rounded-lg ">
                  <MaterialCommunityIcons
                    name="google-classroom"
                    size={18}
                    color="blue"
                  />
                </View>
                <View>
                  <Text className="text-white ">Classes</Text>
                  <Text className="text-xl font-bold text-white">
                    {classrooms.length}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Add Classroom Button */}
          <TouchableOpacity
            className="bg-white mx-5 mt-5 py-3 rounded-xl shadow-md flex-row justify-center items-center border border-blue-100"
            onPress={() => setModalVisible(true)}
          >
            <View className="bg-blue-100 p-1 rounded-md mr-2">
              <MaterialIcons name="add" size={20} color="#2563eb" />
            </View>
            <Text className="text-blue-600 font-semibold text-lg">
              Add New Classroom
            </Text>
          </TouchableOpacity>
        </View>

        {/* All Classrooms Section */}
        <View className="px-3 mt-5">
          <View className="mb-4 flex-row items-center">
            <MaterialCommunityIcons
              name="google-classroom"
              size={24}
              color="#2563eb"
            />
            <Text className="text-blue-600 font-bold text-lg ml-2">
              My Classrooms
            </Text>
          </View>

          {/* Empty state */}
          {classrooms.length === 0 && (
            <View className="items-center justify-center py-12 px-5 bg-white rounded-xl border border-gray-100 shadow-sm">
              <View className="bg-blue-50 p-4 rounded-full mb-4">
                <MaterialIcons name="book" size={42} color="#2563eb" />
              </View>
              <Text className="text-gray-800 text-lg font-semibold mb-1">
                No classrooms yet
              </Text>
              <Text className="text-gray-500 text-center text-sm max-w-xs">
                Click "Add New Classroom" to get started
              </Text>
            </View>
          )}

          {/* All Classroom Cards - Improved styling */}
          {/* All Classroom Cards - Improved styling */}
          {/* All Classroom Cards - With student count at the bottom of the view */}
          {classrooms.length > 0 && (
            <View className="flex-row flex-wrap justify-between">
              {classrooms.map((classroom, index) => {
                // Define color schemes
                const CARD_COLORS = [
                  {
                    bg: "bg-blue-50",
                    border: "border border-blue-500",
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

                // Get color scheme based on index
                const colorScheme = CARD_COLORS[index % CARD_COLORS.length];

                // Get student count
                const studentCount = classroom.students?.length || 0;

                return (
                  <TouchableOpacity
                    key={classroom._id}
                    className={`w-[48.5%] h-32 ${colorScheme.bg} ${colorScheme.border} rounded-lg p-3 mb-3`}
                    onPress={() =>
                      router.push({
                        pathname: "../(classroom)",
                        params: { id: classroom._id },
                      })
                    }
                  >
                    <View className="h-full justify-between">
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
                            className={`px-2 py-1 bg-white ${colorScheme.border} rounded-full self-start mt-1`}
                          >
                            <Text
                              className={`text-xs font-medium ${colorScheme.title}`}
                            >
                              Class Teacher
                            </Text>
                          </View>
                        )}

                        <Text className="text-gray-600 mt-1">
                          Class {classroom.grade} - {classroom.section}
                        </Text>
                      </View>

                      <Text className="text-gray-500 text-sm">
                        Students: {studentCount}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Classroom Modal - improved styling */}
      <CustomModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setNewClassroom({
            grade: "",
            section: "",
            subject: "",
            classTeacher: false,
          });
        }}
        onSubmit={addClassroom}
        title="Add New Classroom"
        submitText="Create Classroom"
        isLoading={loading}
      >
        <View className="space-y-4">
          <View>
            <Text className="font-medium text-gray-700 mb-1">Class</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
              <View className="bg-gray-50 p-3 border-r border-gray-300">
                <MaterialIcons name="school" size={20} color="#6b7280" />
              </View>
              <TextInput
                className="p-3 flex-1 bg-white"
                placeholder="Enter class (e.g., 8)"
                value={newClassroom.grade}
                onChangeText={(text) =>
                  setNewClassroom({ ...newClassroom, grade: text })
                }
                keyboardType="numeric"
              />
            </View>
          </View>

          <View>
            <Text className="font-medium text-gray-700 mb-1 mt-1">Section</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
              <View className="bg-gray-50 p-3 border-r border-gray-300">
                <MaterialIcons name="label" size={20} color="#6b7280" />
              </View>
              <TextInput
                className="p-3 flex-1 bg-white"
                placeholder="Enter section (e.g., A)"
                value={newClassroom.section}
                onChangeText={(text) =>
                  setNewClassroom({
                    ...newClassroom,
                    section: text.toUpperCase(),
                  })
                }
                autoCapitalize="characters"
                maxLength={1}
              />
            </View>
          </View>

          <View>
            <Text className="font-medium text-gray-700 mb-1 mt-1">Subject</Text>
            <View className="flex-row items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
              <View className="bg-gray-50 p-3 border-r border-gray-300">
                <MaterialIcons name="book" size={20} color="#6b7280" />
              </View>
              <TextInput
                className="p-3 flex-1 bg-white"
                placeholder="Enter subject name"
                value={newClassroom.subject}
                onChangeText={(text) =>
                  setNewClassroom({ ...newClassroom, subject: text })
                }
                autoCapitalize="words"
              />
            </View>
          </View>

          <View className="flex-row items-center justify-between bg-blue-50 mt-3 px-3 py-3 rounded-lg border border-blue-100">
            <View className="flex-1">
              <View className="flex-row items-center">
                <MaterialCommunityIcons
                  name="shield-account"
                  size={20}
                  color="#2563eb"
                />
                <Text className="font-medium text-gray-800 ml-2">
                  Class Teacher
                </Text>
              </View>
            </View>
            <Switch
              value={newClassroom.classTeacher}
              onValueChange={(value) =>
                setNewClassroom({ ...newClassroom, classTeacher: value })
              }
              trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
              thumbColor={newClassroom.classTeacher ? "#2563eb" : "#f3f4f6"}
              ios_backgroundColor="#d1d5db"
            />
          </View>
        </View>
      </CustomModal>
    </SafeAreaView>
  );
}
