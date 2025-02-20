// import React from "react";
// import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
// import { useAuth } from "../../context/authContext";
// import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

// export default function ProfileScreen() {
//   const { user, logout } = useAuth();

//   const handleLogout = async () => {
//     try {
//       await logout();
//     } catch (error) {
//       console.log("Logout error:", error);
//     }
//   };

//   const teachingTips = [
//     {
//       id: 1,
//       tip: "Start each class with a quick review of previous concepts",
//       icon: "lightbulb",
//     },
//     {
//       id: 2,
//       tip: "Use real-world examples to make lessons more relatable",
//       icon: "puzzle-piece",
//     },
//     {
//       id: 3,
//       tip: "Incorporate group activities for better engagement",
//       icon: "users",
//     },
//   ];

//   return (
//     <ScrollView className="flex-1 bg-white">
//       <View className="items-center p-5">
//         {/* Profile Header */}
//         <View className="items-center flex-row gap-5 mb-4">
//           <View>
//             <Image
//               source={require("../../../assets/images/profile.jpg")}
//               className="w-32 h-32 rounded-full mb-4"
//             />
//           </View>
//           <View>
//             <Text className="text-2xl font-bold text-blue-600">
//               {user?.name || "User Profile"}
//             </Text>
//             <Text className="text-gray-500 mb-2">{user?.email}</Text>
//           </View>
//         </View>

//         {/* Thought of the Day */}
//         <View className="bg-blue-50 p-4 rounded-xl w-full mb-6">
//           <View className="flex-row items-center mb-2">
//             <MaterialIcons name="lightbulb" size={24} color="#1E40AF" />
//             <Text className="text-blue-800 font-bold text-lg ml-2">
//               Thought of the Day
//             </Text>
//           </View>
//           <Text className="text-gray-700 italic">
//             "Education is not the filling of a pail, but the lighting of a
//             fire."
//           </Text>
//           <Text className="text-gray-500 text-right mt-1">
//             - William Butler Yeats
//           </Text>
//         </View>

//         {/* Teaching Tips */}
//         <View className="w-full mb-6">
//           <Text className="text-xl font-bold text-blue-800 mb-4">
//             Teaching Tips
//           </Text>
//           {teachingTips.map((tip) => (
//             <View
//               key={tip.id}
//               className="flex-row items-center bg-gray-50 p-4 rounded-lg mb-3"
//             >
//               <FontAwesome5 name={tip.icon} size={20} color="#1E40AF" />
//               <Text className="text-gray-700 ml-3 flex-1">{tip.tip}</Text>
//             </View>
//           ))}
//         </View>

//         {/* Logout Button */}
//         <TouchableOpacity
//           className="border border-red-500 p-4 rounded-lg w-full bg-red"
//           onPress={handleLogout}
//         >
//           <Text className="text-red-500 text-center text-lg font-semibold">
//             Logout
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// }

import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { useAuth } from "../../context/authContext";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const teachingTips = [
    {
      id: 1,
      tip: "Start each class with a quick review of previous concepts",
      icon: "lightbulb",
    },
    {
      id: 2,
      tip: "Use real-world examples to make lessons more relatable",
      icon: "puzzle-piece",
    },
    {
      id: 3,
      tip: "Incorporate group activities for better engagement",
      icon: "users",
    },
  ];

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="items-center p-5">
        {/* Logout Button - Moved to top */}

        {/* Profile Header */}
        <View className="w-full bg-blue-50 rounded-2xl p-6 mb-6">
          <View className="items-center flex-row gap-5">
            <Image
              source={require("../../../assets/images/profile.jpg")}
              className="w-24 h-24 rounded-full border-4 border-white"
            />
            <View className="flex-1 gap-4">
              <View>
                <Text className="text-2xl font-bold text-blue-600">
                  <Text className="text-xl text-gray-500">Name: </Text>
                  {user?.name || "User Profile"}
                </Text>
                <Text className="text-gray-500"> Email: {user?.email}</Text>
              </View>
              <View className="w-1/2 ">
                <TouchableOpacity
                  className="flex-row items-center bg-red-50 px-4 py-2 rounded-full border border-red-200"
                  onPress={handleLogout}
                >
                  <MaterialIcons name="logout" size={20} color="#EF4444" />
                  <Text className="text-red-500 font-semibold ml-2">
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Thought of the Day */}
        <View className="bg-amber-50 p-5 rounded-2xl w-full mb-6 border border-amber-100">
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="lightbulb" size={24} color="#F59E0B" />
            <Text className="text-amber-800 font-bold text-lg ml-2">
              Thought of the Day
            </Text>
          </View>
          <Text className="text-gray-700 italic text-base">
            "Education is not the filling of a pail, but the lighting of a
            fire."
          </Text>
          <Text className="text-gray-500 text-right mt-2">
            - William Butler Yeats
          </Text>
        </View>

        {/* Teaching Tips */}
        <View className="w-full">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Teaching Tips
          </Text>
          {teachingTips.map((tip) => (
            <View
              key={tip.id}
              className="flex-row items-center bg-gray-50 p-4 rounded-xl mb-3 border border-gray-100"
            >
              <View className="bg-blue-100 p-2 rounded-full">
                <FontAwesome5 name={tip.icon} size={18} color="#2563EB" />
              </View>
              <Text className="text-gray-700 ml-3 flex-1">{tip.tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
