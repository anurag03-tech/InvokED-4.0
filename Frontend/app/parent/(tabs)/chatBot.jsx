import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Keyboard,
  Dimensions,
} from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

const GOOGLE_GEMINI_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef(null);
  const chatRef = useRef(null);
  const classroomDataRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    loadChatHistory();
    initializeChat();
    loadProfileData();

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleInputChange = (text) => {
    setInputText(text);
  };

  const loadChatHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem("chatHistory");
      if (savedHistory) {
        setMessages(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const loadProfileData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("parentProfile");
      if (jsonValue != null) {
        const profileData = JSON.parse(jsonValue);
        classroomDataRef.current = simplifyClassroomData(profileData);
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  };

  const simplifyClassroomData = (profileData) => {
    if (!profileData || !profileData.students) return [];
    return profileData.students.flatMap((student) =>
      student.classrooms.map((classroom) => ({
        studentName: student.name,
        grade: classroom.grade,
        section: classroom.section,
        subject: classroom.subject,
        teacherName: classroom.teacher.name,
        isClassTeacher: classroom.classTeacher,
      }))
    );
  };

  const initializeChat = () => {
    const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
    chatRef.current = genAI
      .getGenerativeModel({ model: "gemini-pro" })
      .startChat({
        generationConfig: {
          maxOutputTokens: 100,
        },
      });
  };

  const generateGeminiResponse = async (userInput) => {
    try {
      const context = `You're an AI assistant helping parents with their child's education queries. For questions about the child's subjects, teachers, or classroom, use this data: ${JSON.stringify(
        classroomDataRef.current
      )}
      For other questions, give response based on your knowledge. ignore spelling mistakes`;

      const result = await chatRef.current.sendMessage(
        `${context}\n\nUser: ${userInput}`
      );
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating response:", error);
      return "Sorry, I encountered an error. Please try again.";
    }
  };

  const handleSend = async () => {
    if (inputText.trim() === "") return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const botResponse = await generateGeminiResponse(inputText);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
      };

      setMessages((prevMessages) => [...prevMessages, botMessage]);
      await AsyncStorage.setItem(
        "chatHistory",
        JSON.stringify([...messages, userMessage, botMessage])
      );
    } catch (error) {
      console.error("Error in chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === "user";
    return (
      <View
        className={`max-w-[80%] my-2 mx-4 ${
          isUser ? "self-end" : "self-start"
        }`}
      >
        <View
          className={`rounded-2xl px-4 py-3 shadow ${
            isUser ? "bg-blue-600" : "bg-white border border-gray-400"
          }`}
        >
          <Text
            className={`text-base leading-6 ${
              isUser ? "text-white" : "text-gray-800"
            }`}
          >
            {item.text}
          </Text>
        </View>
        <Text
          className={`text-xs text-gray-500 mt-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {isUser ? "You" : "Assistant"}
        </Text>
      </View>
    );
  };

  const Header = () => (
    <View className="bg-blue-600 px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <MaterialIcons name="chat" size={24} color="white" />
        <Text className="text-2xl font-semibold text-white ml-2">
          {t("Chat Bot")}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => {
          setMessages([]);
          AsyncStorage.removeItem("chatHistory");
        }}
      >
        <MaterialIcons name="delete-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  const EmptyChat = () => (
    <View className="flex-1 justify-center items-center">
      <MaterialIcons name="chat" size={64} color="#9CA3AF" />
      <Text className="text-gray-500 text-base mt-4">Start a conversation</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <Header />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View
          style={{
            maxHeight:
              SCREEN_HEIGHT -
              (Platform.OS === "ios" ? 190 : 160) -
              keyboardHeight,
          }}
          className="flex-1"
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 20,
            }}
            className="flex-1 px-4"
            ListEmptyComponent={EmptyChat}
          />
        </View>
        <View className="px-4 py-3 bg-white border-t border-gray-200">
          <View className="flex-row items-end gap-2">
            <TextInput
              className="flex-1 max-h-24 border rounded-3xl px-5 py-3 text-base border-blue-500"
              value={inputText}
              onChangeText={handleInputChange}
              placeholder="Type your message..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <TouchableOpacity
              className={`justify-center items-center w-12 h-12 rounded-full ${
                isLoading ? "bg-gray-400" : "bg-blue-600"
              }`}
              onPress={handleSend}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <MaterialIcons name="send" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatBot;
