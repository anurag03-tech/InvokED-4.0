import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Audio } from "expo-av";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

const Remark = () => {
  const route = useRoute();
  const params = route.params;
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [textMessage, setTextMessage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [remarks, setRemarks] = useState([]);
  const [token, setToken] = useState(null);
  const [sound, setSound] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getToken();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (token) {
      fetchStudents();
    }
  }, [token]);

  const getToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken);
    } catch (error) {
      console.error("Error getting token:", error);
      Alert.alert("Error", "Failed to get authentication token");
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/classroom/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setStudents(response.data.classroom.students || []);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      Alert.alert("Error", "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const fetchRemarks = useCallback(
    async (studentId) => {
      try {
        console.log(`Fetching remarks for student ${studentId}`);
        setLoadingMessages(true);

        const response = await axios.get(
          `${API_URL}/api/classroom/${params.id}/student/${studentId}/remark`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          if (response.data.remark) {
            console.log(
              `Found ${
                response.data.remark.messages?.length || 0
              } remarks for student ${studentId}`
            );
            // Sort messages by date in ascending order (oldest first)
            const sortedMessages = [
              ...(response.data.remark.messages || []),
            ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            setRemarks(sortedMessages);
          } else {
            console.log(`No remarks found for student ${studentId}`);
            setRemarks([]);
          }
        } else {
          console.warn(`Failed to fetch remarks: ${response.data.message}`);
          setRemarks([]);
        }
      } catch (error) {
        console.error(
          `Error fetching remarks for student ${studentId}:`,
          error
        );
        Alert.alert("Error", "Failed to fetch remarks");
        setRemarks([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, params.id]
  );

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Denied", "Please allow microphone access");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      Alert.alert("Error", "Failed to start recording");
    }
  }

  async function stopRecording() {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);

      if (uri) {
        await uploadVoiceMessage(uri);
      } else {
        throw new Error("Failed to get recording URI");
      }
    } catch (err) {
      console.error("Recording error:", err.message);
      Alert.alert("Error", "Failed to process recording");
    }
  }

  const playVoiceMessage = async (content) => {
    try {
      // Stop any existing playback
      if (sound) {
        await sound.unloadAsync();
      }

      // For base64 content with data URI prefix
      if (content.startsWith("data:audio")) {
        const { sound: newSound } = await Audio.Sound.createAsync({
          uri: content,
        });
        setSound(newSound);
        await newSound.playAsync();
      }
      // For backward compatibility with URL paths
      else {
        const { sound: newSound } = await Audio.Sound.createAsync({
          uri: content,
        });
        setSound(newSound);
        await newSound.playAsync();
      }
    } catch (error) {
      console.error("Error playing voice message:", error);
      Alert.alert("Error", "Failed to play voice message");
    }
  };

  const uploadVoiceMessage = async (uri) => {
    if (!selectedStudent) {
      console.error("No student selected for voice message upload");
      Alert.alert("Error", "No student selected");
      return;
    }

    try {
      setSending(true);
      console.log(`Preparing voice message for student ${selectedStudent._id}`);

      // Read the audio file as base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log(
        `Audio converted to base64, size: ${base64Audio.length} bytes`
      );

      // Get file extension from URI
      const extension = uri.split(".").pop();
      const mimeType = extension === "m4a" ? "audio/m4a" : "audio/mpeg";

      const formData = new FormData();

      // Add the audio file
      formData.append("file", {
        uri: uri,
        type: mimeType,
        name: `voice_message_${Date.now()}.${extension}`,
      });

      // Specify message type
      formData.append("type", "voice");

      const response = await fetch(
        `${API_URL}/api/classroom/${params.id}/student/${selectedStudent._id}/remark`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log(
          `Voice message uploaded successfully for student ${selectedStudent._id}`
        );

        // Add the new message locally instead of re-fetching
        if (data.remark && data.remark.messages) {
          const newMessage =
            data.remark.messages[data.remark.messages.length - 1];
          setRemarks((prevRemarks) => [...prevRemarks, newMessage]);
        } else {
          // Fallback to re-fetching if we can't get the new message directly
          fetchRemarks(selectedStudent._id);
        }
      } else {
        throw new Error(
          data.message || "Unknown error uploading voice message"
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message || "Failed to upload voice message");
    } finally {
      setSending(false);
    }
  };

  const sendTextMessage = async () => {
    if (!textMessage.trim() || !selectedStudent) return;

    Keyboard.dismiss();
    try {
      setSending(true);
      console.log(`Sending text message to student ${selectedStudent._id}`);

      // Only send necessary data - no studentId in payload
      const response = await axios.post(
        `${API_URL}/api/classroom/${params.id}/student/${selectedStudent._id}/remark`,
        {
          type: "text",
          content: textMessage.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        console.log(
          `Message sent successfully to student ${selectedStudent._id}`
        );

        // Optimistic update - add the new message locally
        const messageContent = textMessage.trim();
        setTextMessage("");

        // Get the new message from response or create a placeholder
        if (response.data.remark && response.data.remark.messages) {
          const newMessage =
            response.data.remark.messages[
              response.data.remark.messages.length - 1
            ];
          setRemarks((prevRemarks) => [...prevRemarks, newMessage]);
        } else {
          // Create an optimistic message if we can't get it from response
          const optimisticMessage = {
            _id: `temp-${Date.now()}`,
            type: "text",
            content: messageContent,
            sender: "teacher",
            createdAt: new Date().toISOString(),
          };
          setRemarks((prevRemarks) => [...prevRemarks, optimisticMessage]);
        }
      } else {
        throw new Error(response.data.message || "Failed to send message");
      }
    } catch (error) {
      console.error(
        "Error sending message:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  const closeRemarksModal = () => {
    setModalVisible(false);
    // Clear remarks and selected student when closing modal
    // This prevents old data from appearing for a new student
    setTimeout(() => {
      setRemarks([]);
      setSelectedStudent(null);
      setTextMessage("");
    }, 300); // Short delay to let the modal animation finish
  };

  const renderMessage = ({ item }) => (
    <View
      className={`px-4 py-2 mb-2 rounded-lg max-w-3/4
      ${
        item.sender === "teacher"
          ? "bg-blue-500 self-end"
          : "bg-gray-200 self-start"
      }`}
    >
      <Text
        className={`text-base ${
          item.sender === "teacher" ? "text-white" : "text-black"
        }`}
      >
        {item.type === "text" ? item.content : "Voice Message"}
      </Text>
      {item.type === "voice" && (
        <TouchableOpacity
          className="flex-row items-center mt-1"
          onPress={() => playVoiceMessage(item.content)}
        >
          <MaterialIcons
            name="play-circle-filled"
            size={24}
            color={item.sender === "teacher" ? "white" : "black"}
          />
          <Text
            className={`ml-2 ${
              item.sender === "teacher" ? "text-white" : "text-black"
            }`}
          >
            Play
          </Text>
        </TouchableOpacity>
      )}
      <Text
        className={`text-xs mt-1
        ${
          item.sender === "teacher" ? "text-white opacity-70" : "text-gray-500"
        }`}
      >
        {new Date(item.createdAt).toLocaleTimeString()}
      </Text>
    </View>
  );

  const renderStudent = ({ item }) => (
    <TouchableOpacity
      className="bg-white p-4 mb-3 rounded-lg shadow-sm"
      onPress={() => {
        // Clear previous state
        setRemarks([]);
        setTextMessage("");

        // Set new student and show modal
        setSelectedStudent(item);
        setModalVisible(true);

        // Fetch remarks after modal is visible
        fetchRemarks(item._id);
      }}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-lg font-semibold text-gray-800">
            {item.name}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Admission No: {item.admissionNumber}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item._id}
        contentContainerClassName="p-4"
        ListEmptyComponent={
          <View className="flex items-center justify-center py-8">
            <Text className="text-gray-500">No students found</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeRemarksModal}
      >
        <View className="flex-1 bg-black bg-opacity-50">
          <View className="flex-1 bg-white mt-16 rounded-t-3xl">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <View>
                <Text className="text-xl font-bold text-gray-800">
                  {selectedStudent?.name}
                </Text>
                <Text className="text-sm text-gray-500">
                  {selectedStudent?.admissionNumber}
                </Text>
              </View>
              <TouchableOpacity onPress={closeRemarksModal} className="p-2">
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Messages List - Now showing newest messages at bottom */}
            {selectedStudent && (
              <FlatList
                data={remarks}
                renderItem={renderMessage}
                keyExtractor={(item) => `${selectedStudent._id}-${item._id}`}
                contentContainerClassName="p-4 pb-2"
                inverted={false} // Changed to false to show newest at bottom
                ListEmptyComponent={
                  loadingMessages ? (
                    <View className="flex items-center justify-center py-8">
                      <ActivityIndicator size="small" color="#0066cc" />
                    </View>
                  ) : (
                    <View className="flex items-center justify-center py-8">
                      <Text className="text-gray-500">No messages yet</Text>
                    </View>
                  )
                }
                ListFooterComponent={<View className="h-4" />} // Add padding at bottom
              />
            )}

            {/* Input Area */}
            <View className="p-2 border-t border-gray-200 bg-white">
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 bg-gray-100 rounded-full p-3 mr-2 border border-gray-300"
                  value={textMessage}
                  onChangeText={setTextMessage}
                  placeholder="Type a message..."
                  multiline
                  editable={!sending}
                />

                <TouchableOpacity
                  onPress={isRecording ? stopRecording : startRecording}
                  className={`p-3 rounded-full mr-2
                    ${isRecording ? "bg-red-500" : "bg-blue-500"}`}
                  disabled={sending}
                >
                  <MaterialIcons
                    name={isRecording ? "stop" : "mic"}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>

                {textMessage.trim() && (
                  <TouchableOpacity
                    onPress={sendTextMessage}
                    className={`p-3 rounded-full ${
                      sending ? "bg-gray-400" : "bg-blue-500"
                    }`}
                    disabled={sending}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <MaterialIcons name="send" size={24} color="white" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Remark;
