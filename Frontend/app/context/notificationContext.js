// import React, { createContext, useState, useContext, useEffect } from "react";
// import * as Notifications from "expo-notifications";
// import { useAuth } from "./authContext";
// import axios from "axios";

// const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

// // Configure notifications
// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// const NotificationContext = createContext();

// export const NotificationProvider = ({ children }) => {
//   const [notifications, setNotifications] = useState([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const { token, role } = useAuth();

//   // Set up notification listeners for parents
//   useEffect(() => {
//     if (role === "parent") {
//       // Listen for incoming notifications when app is running
//       const notificationListener =
//         Notifications.addNotificationReceivedListener((notification) => {
//           const newNotification = notification.request.content.data;
//           // Only add if it's a valid notification object with our expected structure
//           if (newNotification && newNotification.notificationId) {
//             setNotifications((prevNotifications) => [
//               newNotification,
//               ...prevNotifications,
//             ]);
//             setUnreadCount((count) => count + 1);
//           }
//         });

//       // Handle notification when tapped
//       const responseListener =
//         Notifications.addNotificationResponseReceivedListener((response) => {
//           const data = response.notification.request.content.data;
//           // Handle navigation based on notification type
//         });

//       // Cleanup
//       return () => {
//         Notifications.removeNotificationSubscription(notificationListener);
//         Notifications.removeNotificationSubscription(responseListener);
//       };
//     }
//   }, [role]);

//   // Fetch notifications when token changes (on login)
//   useEffect(() => {
//     if (token && role === "parent") {
//       fetchNotifications();
//     }
//   }, [token, role]);

//   // Fetch notifications from server
//   const fetchNotifications = async (limit = 20, skip = 0) => {
//     if (!token || role !== "parent") return;

//     try {
//       const response = await axios.get(
//         `${API_URL}/api/notifications?limit=${limit}&skip=${skip}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (response.data.success) {
//         const newNotifications =
//           skip === 0
//             ? response.data.notifications
//             : [...notifications, ...response.data.notifications];

//         setNotifications(newNotifications);

//         // Count unread notifications
//         const unread = newNotifications.filter(
//           (notification) => !notification.isRead
//         ).length;
//         setUnreadCount(unread);
//       }
//     } catch (error) {
//       console.error("Error fetching notifications:", error);
//     }
//   };

//   // Mark notification as read
//   const markAsRead = async (notificationId) => {
//     if (!token || role !== "parent") return;

//     try {
//       await axios.post(
//         `${API_URL}/api/notifications/${notificationId}/read`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       // Update local notification state
//       setNotifications((prevNotifications) =>
//         prevNotifications.map((notification) =>
//           notification._id === notificationId
//             ? { ...notification, isRead: true }
//             : notification
//         )
//       );

//       // Update unread count
//       setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
//     } catch (error) {
//       console.error("Error marking notification as read:", error);
//     }
//   };

//   // Mark all notifications as read
//   const markAllAsRead = async () => {
//     if (!token || role !== "parent" || notifications.length === 0) return;

//     try {
//       const unreadIds = notifications
//         .filter((n) => !n.isRead)
//         .map((n) => n._id);

//       if (unreadIds.length === 0) return;

//       // Call API for each unread notification
//       await Promise.all(
//         unreadIds.map((id) =>
//           axios.post(
//             `${API_URL}/api/notifications/${id}/read`,
//             {},
//             {
//               headers: {
//                 Authorization: `Bearer ${token}`,
//               },
//             }
//           )
//         )
//       );

//       // Update local state
//       setNotifications((prevNotifications) =>
//         prevNotifications.map((notification) => ({
//           ...notification,
//           isRead: true,
//         }))
//       );

//       setUnreadCount(0);
//     } catch (error) {
//       console.error("Error marking all notifications as read:", error);
//     }
//   };

//   // Load more notifications (pagination)
//   const loadMoreNotifications = () => {
//     fetchNotifications(20, notifications.length);
//   };

//   return (
//     <NotificationContext.Provider
//       value={{
//         notifications,
//         unreadCount,
//         fetchNotifications,
//         markAsRead,
//         markAllAsRead,
//         loadMoreNotifications,
//       }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// };

// export const useNotification = () => useContext(NotificationContext);

// export default NotificationContext;

import React, { createContext, useState, useContext, useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useAuth } from "./authContext";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationContext = createContext();

async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig.extra.eas.projectId,
      })
    ).data;

    if (__DEV__) {
      console.log("Expo Go Push Token:", token);
    } else {
      console.log("APK Push Token:", token);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { token, role } = useAuth();

  // Set up notification listeners for parents
  useEffect(() => {
    if (role === "parent") {
      registerForPushNotificationsAsync();

      // Listen for incoming notifications when app is running
      const notificationListener =
        Notifications.addNotificationReceivedListener((notification) => {
          const newNotification = notification.request.content.data;
          // Only add if it's a valid notification object with our expected structure
          if (newNotification && newNotification.notificationId) {
            setNotifications((prevNotifications) => [
              newNotification,
              ...prevNotifications,
            ]);
            setUnreadCount((count) => count + 1);
          }
        });

      // Handle notification when tapped
      const responseListener =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          // Handle navigation based on notification type
        });

      // Cleanup
      return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      };
    }
  }, [role]);

  // Fetch notifications when token changes (on login)
  useEffect(() => {
    if (token && role === "parent") {
      fetchNotifications();
    }
  }, [token, role]);

  // Fetch notifications from server
  const fetchNotifications = async (limit = 20, skip = 0) => {
    if (!token || role !== "parent") return;

    try {
      const response = await axios.get(
        `${API_URL}/api/notifications?limit=${limit}&skip=${skip}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const newNotifications =
          skip === 0
            ? response.data.notifications
            : [...notifications, ...response.data.notifications];

        setNotifications(newNotifications);

        // Count unread notifications
        const unread = newNotifications.filter(
          (notification) => !notification.isRead
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    if (!token || role !== "parent") return;

    try {
      await axios.post(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update local notification state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Update unread count
      setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!token || role !== "parent" || notifications.length === 0) return;

    try {
      const unreadIds = notifications
        .filter((n) => !n.isRead)
        .map((n) => n._id);

      if (unreadIds.length === 0) return;

      // Call API for each unread notification
      await Promise.all(
        unreadIds.map((id) =>
          axios.post(
            `${API_URL}/api/notifications/${id}/read`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Load more notifications (pagination)
  const loadMoreNotifications = () => {
    fetchNotifications(20, notifications.length);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        loadMoreNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

export default NotificationContext;
