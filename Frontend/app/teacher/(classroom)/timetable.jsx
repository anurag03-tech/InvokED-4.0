// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
// } from "react-native";
// import { pickImage } from "../../../utils/imagePicker";
// import { convertToBase64 } from "../../../utils/imageConversion";
// import axios from "axios";

// const Timetable = () => {
//   const [image, setImage] = useState(null);
//   const [uploading, setUploading] = useState(false);

//   const handleImagePick = async () => {
//     try {
//       const imageUri = await pickImage();

//       if (imageUri) {
//         setUploading(true);
//         const base64Image = await convertToBase64(imageUri);

//         const response = await axios.post("/api/timetable/upload", {
//           image: base64Image,
//           className: "Class-A",
//         });

//         if (response.data.success) {
//           setImage(`data:image/jpeg;base64,${response.data.image}`);
//           Alert.alert("Success", "Timetable uploaded successfully!");
//         }
//       }
//     } catch (error) {
//       Alert.alert(
//         "Error",
//         error.response?.data?.message || "Failed to upload timetable"
//       );
//     } finally {
//       setUploading(false);
//     }
//   };

//   useEffect(() => {
//     const fetchTimetable = async () => {
//       try {
//         const response = await axios.get("/api/timetable");
//         if (response.data.image) {
//           setImage(`data:image/jpeg;base64,${response.data.image}`);
//         }
//       } catch (error) {
//         console.error("Failed to fetch timetable:", error);
//       }
//     };

//     fetchTimetable();
//   }, []);

//   return (
//     <View className="flex-1 p-5 bg-white">
//       <Text className="text-2xl font-bold mb-5 text-center">
//         Class Timetable
//       </Text>

//       {uploading ? (
//         <View className="flex-1 justify-center items-center">
//           <ActivityIndicator size="large" color="#0066cc" />
//           <Text className="mt-3 text-base text-gray-600">
//             Uploading timetable...
//           </Text>
//         </View>
//       ) : (
//         <>
//           {image ? (
//             <View className="flex-1 items-center">
//               <Image
//                 source={{ uri: image }}
//                 className="w-full h-4/5 rounded-lg mb-5"
//                 resizeMode="contain"
//               />
//               <TouchableOpacity
//                 className="bg-green-600 py-3 px-4 rounded-lg w-4/5 max-w-[300px]"
//                 onPress={handleImagePick}
//               >
//                 <Text className="text-white text-base font-bold text-center">
//                   Update Timetable
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           ) : (
//             <View className="flex-1 justify-center items-center">
//               <Text className="text-base text-gray-600 mb-5">
//                 No timetable uploaded yet
//               </Text>
//               <TouchableOpacity
//                 className="bg-blue-600 py-4 px-4 rounded-lg w-4/5 max-w-[300px]"
//                 onPress={handleImagePick}
//               >
//                 <Text className="text-white text-base font-bold text-center">
//                   Upload Timetable
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           )}
//         </>
//       )}
//     </View>
//   );
// };

// export default Timetable;

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { pickImage } from "../../../utils/imagePicker";
import { convertToBase64 } from "../../../utils/imageConversion";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/authContext";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

const Timetable = () => {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState(null);
  const params = useLocalSearchParams();
  const { token } = useAuth();

  const handleImagePick = async () => {
    try {
      const imageUri = await pickImage();

      if (imageUri) {
        setUploading(true);
        const base64Image = await convertToBase64(imageUri);

        const response = await axios.post(
          `${API_URL}/api/classroom/${params.id}/timetable`,
          { image: base64Image },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setImage(`data:image/jpeg;base64,${response.data.image}`);

          Alert.alert("Success", "Timetable uploaded successfully!");
        }
      }
    } catch (error) {
      console.error(
        "Upload error details:",
        JSON.stringify(error.response?.data || error.message, null, 2)
      );
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to upload timetable"
      );
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);

        if (!params.id || !token) {
          setErrorMessage("Missing classroom ID or authentication token");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${API_URL}/api/classroom/${params.id}/timetable`
        );

        if (response.data.success) {
          setImage(`data:image/jpeg;base64,${response.data.image}`);
        }
      } catch (error) {
        console.error("Fetch timetable error:", error);
        setErrorMessage(
          error.response?.data?.message || "Failed to load timetable"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [params.id, token]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-3 text-base text-gray-600">
          Loading timetable...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="bg-blue-600 p-6">
        <Text className="text-2xl font-bold text-white">Timetable</Text>
        <Text className="text-white mt-2">
          Class - {params.grade} {params.section}
        </Text>
      </View>
      <View className="p-5">
        {errorMessage && (
          <View className="bg-red-100 p-4 rounded-lg mb-4">
            <Text className="text-red-700 text-center">{errorMessage}</Text>
          </View>
        )}

        {uploading ? (
          <View className="justify-center items-center py-10">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="mt-3 text-base text-gray-600">
              Uploading timetable...
            </Text>
          </View>
        ) : (
          <>
            {image ? (
              <View className="items-center">
                <Image
                  source={{ uri: image }}
                  className="w-full aspect-auto h-96 rounded-lg mb-5"
                  resizeMode="contain"
                />

                <View className="flex-row justify-center w-full mb-10">
                  <TouchableOpacity
                    className="bg-green-600 py-3 px-4 rounded-lg mx-2 flex-1 max-w-36"
                    onPress={handleImagePick}
                  >
                    <Text className="text-white text-base font-bold text-center">
                      Update
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="justify-center items-center py-10">
                <Text className="text-base text-gray-600 mb-5">
                  No timetable uploaded yet
                </Text>
                <TouchableOpacity
                  className="bg-blue-600 py-4 px-4 rounded-lg w-4/5 max-w-60"
                  onPress={handleImagePick}
                >
                  <Text className="text-white text-base font-bold text-center">
                    Upload Timetable
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default Timetable;
