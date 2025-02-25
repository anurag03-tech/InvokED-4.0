import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useNotification } from "../../context/notificationContext";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const NotificationItem = ({ notification, onPress }) => {
  const { t } = useTranslation();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get icon based on notification type
  const getIcon = (type) => {
    switch (type) {
      case "announcement":
        return <MaterialIcons name="campaign" size={24} color="#3b82f6" />;
      case "assignment":
        return <MaterialIcons name="assignment" size={24} color="#10b981" />;
      case "attendance":
        return (
          <MaterialIcons name="event-available" size={24} color="#f59e0b" />
        );
      case "remark":
        return <MaterialIcons name="comment" size={24} color="#8b5cf6" />;
      default:
        return <MaterialIcons name="notifications" size={24} color="#6b7280" />;
    }
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(notification)}
      className={`border-b-2 border-gray-300 ${
        notification.isRead ? "bg-white" : "bg-blue-50"
      }`}
    >
      <View className="flex-row p-2">
        <View className="mr-3 mt-1">{getIcon(notification.type)}</View>
        <View className="flex-1">
          <Text className="font-semibold text-base text-gray-900 mb-1">
            {notification.title}
          </Text>
          <Text className="text-gray-600 mb-2" numberOfLines={2}>
            {notification.message}
          </Text>

          {notification.classroom && (
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="class" size={16} color="#6b7280" />
              <Text className="text-xs text-gray-500 ml-1">
                {t("Class")} {notification.classroom.grade} -{" "}
                {notification.classroom.section}
                {notification.classroom.subject &&
                  ` • ${notification.classroom.subject}`}
              </Text>
            </View>
          )}

          <Text className="text-xs text-gray-400">
            {formatDate(notification.createdAt)}
          </Text>
        </View>

        {!notification.isRead && (
          <View className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1" />
        )}
      </View>
    </TouchableOpacity>
  );
};

const NotificationsScreen = () => {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    loadMoreNotifications,
  } = useNotification();

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  // Initial load
  useEffect(() => {
    loadInitialNotifications();
  }, []);

  // Refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      // Refresh notifications when tab is focused
      fetchNotifications();
      return () => {}; // cleanup
    }, [])
  );

  const loadInitialNotifications = async () => {
    setLoading(true);
    await fetchNotifications();
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !notifications.length) return;
    setLoadingMore(true);
    await loadMoreNotifications();
    setLoadingMore(false);
  };

  const handleNotificationPress = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === "announcement" && notification.classroom?._id) {
      router.push({
        pathname: `../(classroom)/classroomIndex`,
        params: {
          id: notification.classroom._id,
          grade: notification.classroom.grade,
          section: notification.classroom.section,
          subject: notification.classroom.subject,
          activeSection: "announcements",
        },
      });
    } else if (
      notification.type === "assignment" &&
      notification.classroom?._id
    ) {
      router.push({
        pathname: `../(classroom)/classroomIndex`,
        params: {
          id: notification.classroom._id,
          grade: notification.classroom.grade,
          section: notification.classroom.section,
          subject: notification.classroom.subject,
          activeSection: "assignments",
        },
      });
    } else if (notification.type === "remark" && notification.classroom?._id) {
      router.push({
        pathname: `../(classroom)/classroomIndex`,
        params: {
          id: notification.classroom._id,
          grade: notification.classroom.grade,
          section: notification.classroom.section,
          subject: notification.classroom.subject,
        },
      });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-800 px-4 py-2">
        <Text className="text-2xl font-bold text-white">
          {t("Notifications")}
        </Text>
        {unreadCount > 0 && (
          <Text className="text-white mt-1">
            {t("You have")} {unreadCount} {t("unread")}{" "}
            {unreadCount === 1 ? t("notification") : t("notifications")}
          </Text>
        )}
      </View>

      <View className="flex-1 px-1">
        {/* Notifications list */}
        {notifications.length > 0 ? (
          <FlatList
            data={notifications}
            keyExtractor={(item, index) =>
              item._id
                ? `notification-${item._id.toString()}-${index}`
                : `notification-${index}-${item.createdAt || Date.now()}`
            }
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                onPress={handleNotificationPress}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            extraData={notifications.length} // Force re-render when notifications change
            ListFooterComponent={
              loadingMore ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#3b82f6" />
                </View>
              ) : null
            }
          />
        ) : (
          <View className="flex-1 justify-center items-center p-6">
            <MaterialIcons name="notifications-off" size={64} color="#d1d5db" />
            <Text className="text-lg text-gray-500 mt-4 text-center">
              {t("No notifications yet")}
            </Text>
            <Text className="text-center text-gray-400 mt-2 mb-6">
              {t(
                "We'll notify you when there's an announcement or update from your child's teachers"
              )}
            </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-medium">{t("Refresh")}</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            className="flex-row items-center justify-center py-1.5 bg-blue-500"
          >
            <MaterialIcons name="done-all" size={24} color="white" />
            <Text className="text-white font-bold ml-2">
              {t("Mark all as read")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default NotificationsScreen;
