// import React, { useEffect } from "react";
// import { Stack, useRouter, usePathname } from "expo-router";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { useAuth } from "./context/authContext";
// import "../global.css";
// import { AuthProvider } from "./context/authContext";
// import Header from "./teacher/header";
// import ParentHeader from "./parent/parentHeader";
// import UseVoiceRouteAssistant from "./voiceAssistant/UseVoiceRouteAssistant";
// import { MuteProvider } from "./voiceAssistant/MuteContext";
// import { VoiceProvider } from "./voiceAssistant/VoiceContext";
// import { useSegments } from "expo-router";
// import { NotificationProvider } from "./context/notificationContext";

// function ProtectedLayout() {
//   const { user, loading, role } = useAuth();
//   const router = useRouter();
//   const pathname = usePathname();

//   const isTeacherRoute = pathname.startsWith("/teacher");

//   useEffect(() => {
//     const protectedRoutes = [
//       "teacher/(tabs)/home",
//       "teacher/(tabs)/profile",
//       "teacher/(tabs)/audio-recorder",
//       "parent/(tabs)/home",
//       "parent/(tabs)/profile",
//     ];

//     const authRoutes = [
//       "/(auth)/login",
//       "/(auth)/registerTeacher",
//       "/(auth)/registerParent",
//       "index",
//       "/role",
//     ];

//     if (loading) return;

//     const isProtectedRoute = protectedRoutes.some((route) =>
//       pathname.startsWith(route)
//     );
//     const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

//     if (isProtectedRoute && !user) {
//       router.replace("index");
//     } else if (isAuthRoute && user && role === "teacher") {
//       router.replace("/teacher/(tabs)/home");
//     } else if (isAuthRoute && user && role === "parent") {
//       router.replace("/parent/(tabs)/home");
//     }
//   }, [user, loading, pathname, router, role]);

//   if (isTeacherRoute) {
//     // Return only the Stack for teacher routes without voice features
//     return (
//       <Stack
//         screenOptions={{
//           headerShown: false,
//           contentStyle: {
//             backgroundColor: "white",
//           },
//         }}
//       >
//         <Stack.Screen
//           name="teacher/(tabs)"
//           options={{
//             headerShown: true,
//             header: () => <Header />,
//           }}
//         />
//       </Stack>
//     );
//   }

//   // Return Stack with voice features for non-teacher routes (parent routes, auth routes, etc.)
//   return (
//     <MuteProvider>
//       <VoiceProvider>
//         <Stack
//           screenOptions={{
//             headerShown: false,
//             contentStyle: {
//               backgroundColor: "white",
//             },
//           }}
//         >
//           <Stack.Screen
//             name="index"
//             options={{
//               headerShown: false,
//             }}
//           />
//           <Stack.Screen
//             name="(auth)"
//             options={{
//               headerShown: false,
//             }}
//           />
//           <Stack.Screen
//             name="parent/(tabs)"
//             options={{
//               headerShown: true,
//               header: () => <ParentHeader />,
//             }}
//           />
//         </Stack>
//         <UseVoiceRouteAssistant />
//       </VoiceProvider>
//     </MuteProvider>
//   );
// }

// export default function RootLayout() {
//   const segments = useSegments();
//   const currentRoute = segments[segments.length - 1];
//   console.log("Current Route:==>", currentRoute);
//   return (
//     <AuthProvider>
//       <SafeAreaProvider>
//         <ProtectedLayout />
//       </SafeAreaProvider>
//     </AuthProvider>
//   );
// }

import React, { useEffect } from "react";
import { Stack, useRouter, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "./context/authContext";
import "../global.css";
import { AuthProvider } from "./context/authContext";
import Header from "./teacher/header";
import ParentHeader from "./parent/parentHeader";
import UseVoiceRouteAssistant from "./voiceAssistant/UseVoiceRouteAssistant";
import { MuteProvider } from "./voiceAssistant/MuteContext";
import { VoiceProvider } from "./voiceAssistant/VoiceContext";
import { useSegments } from "expo-router";
import { NotificationProvider } from "./context/notificationContext";

function ProtectedLayout() {
  const { user, loading, role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isTeacherRoute = pathname.startsWith("/teacher");

  useEffect(() => {
    const protectedRoutes = [
      "teacher/(tabs)/home",
      "teacher/(tabs)/profile",
      "teacher/(tabs)/audio-recorder",
      "parent/(tabs)/home",
      "parent/(tabs)/profile",
    ];

    const authRoutes = [
      "/(auth)/login",
      "/(auth)/registerTeacher",
      "/(auth)/registerParent",
      "index",
      "/role",
    ];

    if (loading) return;

    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute && !user) {
      router.replace("index");
    } else if (isAuthRoute && user && role === "teacher") {
      router.replace("/teacher/(tabs)/home");
    } else if (isAuthRoute && user && role === "parent") {
      router.replace("/parent/(tabs)/home");
    }
  }, [user, loading, pathname, router, role]);

  // Always use VoiceProvider for all routes, but UseVoiceRouteAssistant only for non-teacher routes
  return (
    <MuteProvider>
      <VoiceProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: "white",
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="parent/(tabs)"
            options={{
              headerShown: true,
              header: () => <ParentHeader />,
            }}
          />
          <Stack.Screen
            name="teacher/(tabs)"
            options={{
              headerShown: true,
              header: () => <Header />,
            }}
          />
        </Stack>
        {/* Only render the voice assistant on non-teacher routes */}
        {!isTeacherRoute && <UseVoiceRouteAssistant />}
      </VoiceProvider>
    </MuteProvider>
  );
}

export default function RootLayout() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  console.log("Current Route:==>", currentRoute);
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NotificationProvider>
          <ProtectedLayout />
        </NotificationProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
