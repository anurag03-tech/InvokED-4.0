import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadStoredAuthData();
  }, []);

  const loadStoredAuthData = async () => {
    try {
      const [storedUser, storedToken] = await AsyncStorage.multiGet([
        "user",
        "token",
      ]);

      if (storedUser[1] && storedToken[1]) {
        setUser(JSON.parse(storedUser[1]));
        setToken(storedToken[1]);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${storedToken[1]}`;
      }

      // Load role separately
      const storedRole = await AsyncStorage.getItem("userRole");
      if (storedRole) {
        setRole(storedRole);
      }
    } catch (error) {
      console.error("Error loading auth data:", error);
    } finally {
      setLoading(false);
    }
  };

  const setUserRole = async (selectedRole) => {
    try {
      await AsyncStorage.setItem("userRole", selectedRole);
      setRole(selectedRole);
    } catch (error) {
      console.error("Error setting user role:", error);
      throw error;
    }
  };

  const login = async (userData, userToken) => {
    try {
      await AsyncStorage.multiSet([
        ["user", JSON.stringify(userData)],
        ["token", userToken],
      ]);
      setUser(userData);
      setToken(userToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // If the user is a parent, clear their push token on the server before logging out
      if (role === "parent" && token) {
        try {
          await axios.put(
            `${API_URL}/api/parent/push-token`,
            { pushToken: null },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log("Push token cleared from server");
        } catch (clearTokenError) {
          console.error("Error clearing push token:", clearTokenError);
        }
      }

      setUser(null);
      setToken(null);
      setRole(null);
      delete axios.defaults.headers.common["Authorization"];
      await AsyncStorage.clear();
      console.log("Logging out...");
      router.replace("/role");
    } catch (error) {
      await AsyncStorage.clear();
      console.error("Error during logout:", error);
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        login,
        logout,
        setUser,
        setToken,
        setUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
