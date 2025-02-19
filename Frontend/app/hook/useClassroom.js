// hooks/useClassroom.js
import { useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export const useClassroom = (classroomId, token, API_URL) => {
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe;

    const initializeData = async () => {
      try {
        // Set up network listener
        unsubscribe = NetInfo.addEventListener((state) => {
          if (isMounted) {
            setIsOnline(state.isConnected);
            if (state.isConnected) {
              fetchAndSyncData();
            }
          }
        });

        // Initial network check
        const networkState = await NetInfo.fetch();
        if (isMounted) {
          setIsOnline(networkState.isConnected);
        }

        // Try to load cached data first
        const cachedData = await getCachedData();
        if (isMounted && cachedData) {
          setClassroom(cachedData);
          setLoading(false);
        }

        // If online, fetch fresh data
        if (networkState.isConnected) {
          await fetchAndSyncData();
        } else {
          // If offline and no cached data, stop loading
          if (isMounted && !cachedData) {
            setLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      }
    };

    if (classroomId && token) {
      initializeData();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [classroomId, token]);

  const getCachedData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(`classroom_${classroomId}`);
      return jsonValue != null ? JSON.parse(jsonValue).data : null;
    } catch (error) {
      console.error("Error loading cached data:", error);
      return null;
    }
  };

  const fetchAndSyncData = async () => {
    if (!classroomId || !token) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/parent/classroom/${classroomId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const newClassroomData = response.data.classroom;

        // Save to local storage
        await AsyncStorage.setItem(
          `classroom_${classroomId}`,
          JSON.stringify({
            data: newClassroomData,
            lastUpdated: new Date().toISOString(),
          })
        );

        setClassroom(newClassroomData);
        setError(null);
      } else {
        throw new Error("Failed to fetch classroom data");
      }
    } catch (err) {
      console.error("Error fetching classroom details:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    classroom,
    loading,
    isOnline,
    error,
    refreshData: fetchAndSyncData,
  };
};
