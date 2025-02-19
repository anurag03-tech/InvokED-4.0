import { useState, useEffect } from "react";
import axios from "axios";
import StorageService from "../services/StorageService";
import NetworkService from "../services/NetworkService";

export const useParentDashboard = (token, API_URL) => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    loadData();
    setupNetworkListener();
  }, []);

  const setupNetworkListener = () => {
    // Set up network change listener
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      setIsOnline(state.isConnected);
      if (state.isConnected) {
        // Try to sync when connection is restored
        await fetchAndSyncData();
      }
    });

    return () => unsubscribe();
  };

  const loadData = async () => {
    // First try to load cached data
    const cachedData = await StorageService.getParentProfile();
    if (cachedData) {
      setProfileData(cachedData.data);
      setIsLoading(false);
    }

    // Check network status and fetch fresh data if online
    const isConnected = await NetworkService.isConnected();
    setIsOnline(isConnected);

    if (isConnected) {
      await fetchAndSyncData();
    }
  };

  const fetchAndSyncData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/parent/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const newProfileData = response.data.parent;

      // Save to local storage
      await StorageService.saveParentProfile(newProfileData);

      // Update state
      setProfileData(newProfileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profileData,
    isLoading,
    isOnline,
    refreshData: fetchAndSyncData,
  };
};
