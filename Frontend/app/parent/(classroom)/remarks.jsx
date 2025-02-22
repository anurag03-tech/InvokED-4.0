import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Audio } from "expo-av";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../context/authContext";
import { useTranslation } from "react-i18next";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

// Memoized message component with proper playback state handling
const MessageBubble = memo(
  ({ message, onPlayVoice, currentlyPlaying, playbackState }) => {
    const isThisPlaying = currentlyPlaying === message._id;
    const isPaused = isThisPlaying && playbackState === "paused";
    const isActive = isThisPlaying && playbackState === "playing";
    const { t } = useTranslation();
    // Choose the appropriate icon based on playback state
    const getPlaybackIcon = () => {
      if (isActive) return "pause-circle-filled";
      if (isPaused) return "play-circle-filled";
      return "play-circle-filled";
    };

    // Choose the appropriate text based on playback state
    const getPlaybackText = () => {
      if (isActive) return "Pause";
      if (isPaused) return "Resume";
      return "Play";
    };

    return (
      <View
        className={`px-4 py-3 mb-2 rounded-lg max-w-3/4
      ${
        message.sender === "parent"
          ? "bg-blue-500 self-end"
          : "bg-gray-200 self-start"
      }`}
      >
        <Text
          className={`text-base ${
            message.sender === "parent" ? "text-white" : "text-black"
          }`}
        >
          {t(message.type === "text" ? message.content : "Voice Message")}
        </Text>

        {message.type === "voice" && (
          <TouchableOpacity
            className="flex-row items-center mt-2"
            onPress={() => onPlayVoice(message.content, message._id)}
          >
            <MaterialIcons
              name={getPlaybackIcon()}
              size={22}
              color={message.sender === "parent" ? "white" : "black"}
            />
            <Text
              className={`ml-1 ${
                message.sender === "parent" ? "text-white" : "text-black"
              }`}
            >
              {t(getPlaybackText())}
            </Text>
          </TouchableOpacity>
        )}

        <Text
          className={`text-xs mt-1
        ${
          message.sender === "parent"
            ? "text-white opacity-70"
            : "text-gray-500"
        }`}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  }
);

// Memoized date header component
const DateHeader = memo(({ date, formatHeading }) => {
  return (
    <View className="my-3 flex items-center">
      <View className="bg-gray-300 rounded-full px-3 py-1">
        <Text className="text-xs text-gray-700 font-medium">
          {formatHeading(date)}
        </Text>
      </View>
    </View>
  );
});

// Memoized message group component
const MessageGroup = memo(
  ({
    group,
    onPlayVoice,
    formatDateHeading,
    currentlyPlaying,
    playbackState,
  }) => {
    return (
      <>
        <DateHeader date={group.date} formatHeading={formatDateHeading} />
        {group.messages.map((message) => (
          <MessageBubble
            key={message._id || `${message.createdAt}-${message.type}`}
            message={message}
            onPlayVoice={onPlayVoice}
            currentlyPlaying={currentlyPlaying}
            playbackState={playbackState}
          />
        ))}
      </>
    );
  }
);

const ParentRemark = () => {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const soundRef = useRef(null);
  const flatListRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [textMessage, setTextMessage] = useState("");
  const [remarks, setRemarks] = useState([]);
  const [groupedRemarks, setGroupedRemarks] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [student, setStudent] = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [playbackState, setPlaybackState] = useState("stopped");

  // Cleanup function
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Fetch remarks on component mount
  useEffect(() => {
    if (token && params.id) {
      fetchRemarks();
    }
  }, [token, params.id]);

  // Group messages by date whenever remarks change
  useEffect(() => {
    groupMessagesByDate(remarks);
  }, [remarks]);

  // Scroll to bottom when grouped remarks are updated
  useEffect(() => {
    if (groupedRemarks.length > 0 && initialLoadComplete) {
      scrollToBottom();
    }
  }, [groupedRemarks, initialLoadComplete]);

  // Memoized scroll function
  const scrollToBottom = useCallback((force = false) => {
    if (flatListRef.current) {
      setTimeout(
        () => {
          try {
            flatListRef.current.scrollToEnd({ animated: !force });
          } catch (error) {
            console.log("Scroll error:", error);
          }
        },
        force ? 50 : 200
      );
    }
  }, []);

  const groupMessagesByDate = useCallback((messages) => {
    if (!messages || messages.length === 0) {
      setGroupedRemarks([]);
      return;
    }

    // Sort messages chronologically (oldest to newest)
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    // Group by date
    const result = [];
    let currentDate = null;
    let currentGroup = [];

    sortedMessages.forEach((message) => {
      const messageDate = new Date(message.createdAt);
      // Format date consistently as ISO date string (YYYY-MM-DD) for grouping
      const dateString = messageDate.toISOString().split("T")[0];

      if (dateString !== currentDate) {
        // Start a new date group
        if (currentGroup.length > 0) {
          result.push({
            date: currentDate,
            messages: currentGroup,
          });
        }
        currentDate = dateString;
        currentGroup = [message];
      } else {
        // Add to current group
        currentGroup.push(message);
      }
    });

    // Add the last group
    if (currentGroup.length > 0) {
      result.push({
        date: currentDate,
        messages: currentGroup,
      });
    }

    setGroupedRemarks(result);
  }, []);

  const fetchRemarks = useCallback(async () => {
    if (!params.id) {
      console.error("No classroom ID provided");
      return;
    }

    try {
      setLoading(true);
      setLoadingMessages(true);
      console.log(`Fetching remarks for classroom ${params.id}`);

      const response = await axios.get(
        `${API_URL}/api/parent/classroom/${params.id}/remarks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        console.log("Remarks fetched successfully");

        if (response.data.remark) {
          setRemarks(response.data.remark.messages || []);
        } else {
          setRemarks([]);
        }

        // Store student info
        if (response.data.student) {
          setStudent(response.data.student);
        }

        // Get classroom details if needed
        if (params.subject) {
          setClassroom({
            subject: params.subject,
            grade: params.grade,
            section: params.section,
          });
        } else {
          // Fetch classroom details if not provided in params
          fetchClassroomDetails();
        }
      } else {
        console.warn("Failed to fetch remarks:", response.data.message);
        Alert.alert("Error", response.data.message || "Failed to load remarks");
      }
    } catch (error) {
      console.error("Error fetching remarks:", error);
      Alert.alert("Error", "Failed to fetch remarks. Please try again later.");
    } finally {
      setLoading(false);
      setLoadingMessages(false);
      // Mark initial load as complete, which will trigger scroll to bottom
      setInitialLoadComplete(true);
    }
  }, [params.id, token, params.subject, params.grade, params.section]);

  const fetchClassroomDetails = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/parent/classroom/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success && response.data.classroom) {
        setClassroom({
          subject: response.data.classroom.subject,
          grade: response.data.classroom.grade,
          section: response.data.classroom.section,
          teacher: response.data.classroom.teacher,
        });
      }
    } catch (error) {
      console.error("Error fetching classroom details:", error);
    }
  }, [params.id, token]);

  const playVoiceMessage = useCallback(
    async (content, messageId) => {
      try {
        // Ensure content is a base64 audio data URI
        if (!content.startsWith("data:audio")) {
          throw new Error("Invalid audio content");
        }

        // Check if we're trying to control the currently playing message
        if (currentlyPlaying === messageId && soundRef.current) {
          // Get the current status of the sound
          const status = await soundRef.current.getStatusAsync();

          if (status.isPlaying) {
            // If it's currently playing, pause it
            console.log("Pausing current audio");
            await soundRef.current.pauseAsync();
            setPlaybackState("paused");
            return; // Keep currentlyPlaying set so we know what's paused
          } else if (status.isLoaded && !status.isPlaying) {
            // If it's paused, resume playback
            console.log("Resuming paused audio");
            await soundRef.current.playAsync();
            setPlaybackState("playing");
            return; // Exit early, keeping the same sound loaded
          }
          // If it's not playing or paused (e.g., finished), we'll reload it below
        }

        // If we're playing a different message, stop any current playback
        if (soundRef.current) {
          console.log("Stopping previous audio");
          await soundRef.current.stopAsync().catch(() => {});
          await soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;

          // If we're switching to a different message, update the playing state
          if (currentlyPlaying !== messageId) {
            setCurrentlyPlaying(messageId);
            setPlaybackState("playing");
          } else {
            // If we're toggling the same message and it wasn't paused above,
            // it means playback finished, so reset the playing state
            setCurrentlyPlaying(null);
            setPlaybackState("stopped");
            return;
          }
        } else {
          // No sound was playing, set this as the current message
          setCurrentlyPlaying(messageId);
          setPlaybackState("playing");
        }

        // Create sound from base64 content
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: content },
          { progressUpdateIntervalMillis: 100 }
        );
        soundRef.current = newSound;

        // Set up status monitoring
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            // Reset currently playing when finished
            console.log("Playback finished");
            setCurrentlyPlaying(null);
            setPlaybackState("stopped");
          }
        });

        await newSound.playAsync();
      } catch (error) {
        console.error("Error playing voice message:", error);
        Alert.alert("Error", "Failed to play voice message");
        setCurrentlyPlaying(null);
        setPlaybackState("stopped");
      }
    },
    [currentlyPlaying, playbackState]
  );

  const startRecording = useCallback(async () => {
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
  }, []);

  const stopRecording = useCallback(async () => {
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
  }, [recording, uploadVoiceMessage]);

  const uploadVoiceMessage = useCallback(
    async (uri) => {
      if (!params.id) {
        Alert.alert("Error", "Missing classroom information");
        return;
      }

      try {
        setSending(true);

        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(uri);
        console.log("File info:", fileInfo);

        // Simple approach: read the file as base64 first
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Create optimistic voice message
        const optimisticId = `temp-voice-${Date.now()}`;
        const optimisticMessage = {
          _id: optimisticId,
          type: "voice",
          content: "data:audio/m4a;base64," + base64Audio.substring(0, 100), // Just enough to show as placeholder
          sender: "parent",
          createdAt: new Date().toISOString(),
        };

        setRemarks((prevRemarks) => [...prevRemarks, optimisticMessage]);

        // Force immediate scroll
        scrollToBottom(true);

        // Then use standard JSON for the request
        const response = await axios.post(
          `${API_URL}/api/parent/classroom/${params.id}/reply`,
          {
            type: "voice",
            content: base64Audio,
            mimeType: "audio/m4a",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          console.log("Voice message sent successfully");

          if (response.data.remark && response.data.remark.messages) {
            const newMessage =
              response.data.remark.messages[
                response.data.remark.messages.length - 1
              ];

            // Replace optimistic message with real one
            setRemarks((prevRemarks) =>
              prevRemarks.map((msg) =>
                msg._id === optimisticId ? newMessage : msg
              )
            );

            // Scroll again after update
            scrollToBottom();
          }
        } else {
          throw new Error(
            response.data.message || "Unknown error sending voice message"
          );
        }
      } catch (error) {
        console.error("Upload error:", error);
        console.error("Error details:", error.response?.data || error.message);
        Alert.alert("Error", "Failed to send voice message. Please try again.");

        // Remove failed optimistic message
        const tempId = `temp-voice-${Date.now()}`;
        setRemarks((prevRemarks) =>
          prevRemarks.filter((msg) => msg._id !== tempId)
        );
      } finally {
        setSending(false);
      }
    },
    [params.id, token, scrollToBottom]
  );

  const sendTextMessage = useCallback(async () => {
    if (!textMessage.trim() || !params.id) return;

    const messageToSend = textMessage.trim();
    setTextMessage("");
    Keyboard.dismiss();

    try {
      setSending(true);

      // Optimistically add message and force scroll before network request
      const optimisticId = `temp-${Date.now()}`;
      const optimisticMessage = {
        _id: optimisticId,
        type: "text",
        content: messageToSend,
        sender: "parent",
        createdAt: new Date().toISOString(),
      };

      setRemarks((prevRemarks) => [...prevRemarks, optimisticMessage]);

      // Force immediate scroll before sending
      scrollToBottom(true);

      const response = await axios.post(
        `${API_URL}/api/parent/classroom/${params.id}/reply`,
        {
          type: "text",
          content: messageToSend,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        console.log("Message sent successfully");

        if (response.data.remark && response.data.remark.messages) {
          // Replace optimistic message with real one
          const newMessage =
            response.data.remark.messages[
              response.data.remark.messages.length - 1
            ];

          setRemarks((prevRemarks) =>
            prevRemarks.map((msg) =>
              msg._id === optimisticId ? newMessage : msg
            )
          );

          // Scroll again after update
          scrollToBottom();
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
      // Restore the message if sending fails
      setTextMessage(messageToSend);

      // Remove optimistic message on failure
      const tempId = `temp-${Date.now()}`;
      setRemarks((prevRemarks) =>
        prevRemarks.filter((msg) => msg._id !== tempId)
      );
    } finally {
      setSending(false);
    }
  }, [textMessage, params.id, token, scrollToBottom]);

  // Format a date heading like WhatsApp - memoized
  const formatDateHeading = useCallback((dateStr) => {
    // Parse the ISO date string (YYYY-MM-DD)
    const messageDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Format dates to compare strings with date part only
    const messageDateString = messageDate.toISOString().split("T")[0];
    const todayString = today.toISOString().split("T")[0];
    const yesterdayString = yesterday.toISOString().split("T")[0];

    // Compare dates ignoring time
    if (messageDateString === todayString) {
      return "Today";
    } else if (messageDateString === yesterdayString) {
      return "Yesterday";
    } else {
      // For older dates, show full date
      return messageDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }, []);

  // Memoized function to render message groups with loading indicator
  const renderMessageGroups = useCallback(() => {
    if (loadingMessages) {
      return (
        <View className="flex items-center justify-center py-8">
          <ActivityIndicator size="small" color="#0066cc" />
          <Text className="text-gray-500 mt-3">{t("Loading messages")}...</Text>
        </View>
      );
    }

    if (groupedRemarks?.length === 0) {
      return (
        <View className="flex items-center justify-center py-8">
          <Text className="text-gray-500">{t("No messages yet")}</Text>
        </View>
      );
    }

    return groupedRemarks.map((group) => (
      <MessageGroup
        key={group.date}
        group={group}
        onPlayVoice={playVoiceMessage}
        formatDateHeading={formatDateHeading}
        currentlyPlaying={currentlyPlaying}
        playbackState={playbackState}
      />
    ));
  }, [
    groupedRemarks,
    playVoiceMessage,
    formatDateHeading,
    currentlyPlaying,
    playbackState,
    loadingMessages,
  ]);

  // Memoized flatlist item renderer
  const renderItem = useCallback(() => {
    return (
      <View className="flex-1 p-4">
        {renderMessageGroups()}
        <View className="h-4" />
      </View>
    );
  }, [renderMessageGroups]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 20}
    >
      <SafeAreaView className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="bg-blue-600 p-4">
          <Text className="text-xl font-bold text-white">
            {t("Teacher Remarks")}
          </Text>
          {classroom && (
            <Text className="text-white mt-1">
              {t("Subject")} : {classroom.subject}
            </Text>
          )}
        </View>

        {/* Messages List - WhatsApp style with scrollable container */}
        <FlatList
          ref={flatListRef}
          data={[{ key: "messages" }]} // Just one item that renders all messages
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          onContentSizeChange={() => initialLoadComplete && scrollToBottom()}
          onLayout={() => initialLoadComplete && scrollToBottom(true)}
          removeClippedSubviews={false} // Prevents content from disappearing
          windowSize={5} // Reduce window size to improve performance
        />

        {/* Input Area */}
        <View className="p-2 border-t border-gray-200 bg-white">
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 bg-gray-100 rounded-full p-3 mr-2 border border-gray-300"
              value={textMessage}
              onChangeText={setTextMessage}
              placeholder="Type a message..."
              multiline
              maxHeight={100}
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
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ParentRemark;
