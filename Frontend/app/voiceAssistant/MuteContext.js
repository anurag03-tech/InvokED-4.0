// import React, { createContext, useContext, useState } from "react";
// import { View, TouchableOpacity } from "react-native";
// import { Ionicons } from "@expo/vector-icons";

// const MuteContext = createContext();

// export const MuteProvider = ({ children }) => {
//   const [isMuted, setIsMuted] = useState(false);

//   const toggleMute = () => {
//     setIsMuted((prev) => !prev);
//   };

//   return (
//     <MuteContext.Provider value={{ isMuted, toggleMute }}>
//       <View
//         style={{
//           position: "absolute",
//           top: 5,
//           right: 5,
//           zIndex: 1000,
//         }}
//       >
//         <TouchableOpacity
//           onPress={toggleMute}
//           style={{
//             backgroundColor: isMuted ? "white" : "#0096FF",
//             padding: 8,
//             borderRadius: 20,
//             borderWidth: 1,
//             borderColor: "black",
//           }}
//         >
//           <Ionicons
//             name={isMuted ? "volume-mute" : "volume-high"}
//             size={22}
//             color={isMuted ? "black" : "white"}
//           />
//         </TouchableOpacity>
//       </View>
//       {children}
//     </MuteContext.Provider>
//   );
// };

// export const useMute = () => {
//   const context = useContext(MuteContext);
//   if (!context) {
//     throw new Error("useMute must be used within a MuteProvider");
//   }
//   return context;
// };

// export default MuteContext;
import React, { createContext, useContext, useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";

const MuteContext = createContext();

export const MuteProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const pathname = usePathname();

  // Check if we're on a teacher route
  const isTeacherRoute = pathname.startsWith("/teacher");

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <MuteContext.Provider value={{ isMuted, toggleMute }}>
      {/* Only render the mute button UI if NOT on a teacher route */}
      {!isTeacherRoute && (
        <View
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            zIndex: 1000,
          }}
        >
          <TouchableOpacity
            onPress={toggleMute}
            style={{
              backgroundColor: isMuted ? "white" : "#0096FF",
              padding: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "black",
            }}
          >
            <Ionicons
              name={isMuted ? "volume-mute" : "volume-high"}
              size={22}
              color={isMuted ? "black" : "white"}
            />
          </TouchableOpacity>
        </View>
      )}
      {children}
    </MuteContext.Provider>
  );
};

export const useMute = () => {
  const context = useContext(MuteContext);
  if (!context) {
    throw new Error("useMute must be used within a MuteProvider");
  }
  return context;
};

export default MuteContext;
