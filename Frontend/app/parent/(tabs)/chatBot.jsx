import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
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
import { Text } from "react-native";
import Markdown from "react-native-markdown-display";
import { GoogleGenerativeAI } from "@google/generative-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const GOOGLE_GEMINI_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Custom markdown styles
const markdownStyles = {
  body: {
    color: "black",
  },
  text: {
    color: "#333",
    fontSize: 16,
  },
  strong: {
    color: "#333",
    fontWeight: "bold",
  },
  em: {
    fontStyle: "italic",
  },
  heading1: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
    color: "#333",
  },
  heading2: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
    color: "#333",
  },
  bullet_list: {
    marginLeft: 8,
  },
  ordered_list: {
    marginLeft: 8,
  },
};

// User message markdown styles (white text for dark background)
const userMarkdownStyles = {
  ...markdownStyles,
  text: {
    color: "white",
    fontSize: 16,
  },
  strong: {
    color: "white",
    fontWeight: "bold",
  },
  em: {
    color: "white",
    fontStyle: "italic",
  },
  heading1: {
    ...markdownStyles.heading1,
    color: "white",
  },
  heading2: {
    ...markdownStyles.heading2,
    color: "white",
  },
  link: {
    color: "#b3e5fc",
  },
};

// Memoized Message component to prevent unnecessary re-renders
const Message = memo(
  ({ item }) => {
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
          {isUser ? (
            <Text className="text-base leading-6 text-white">{item.text}</Text>
          ) : (
            <Markdown style={isUser ? userMarkdownStyles : markdownStyles}>
              {item.text}
            </Markdown>
          )}
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
  },
  (prevProps, nextProps) => {
    // Only re-render if the message ID changes
    return prevProps.item.id === nextProps.item.id;
  }
);

// Memoized empty chat component
const EmptyChat = memo(() => (
  <View className="flex-1 justify-center items-center">
    <MaterialIcons name="chat" size={64} color="#9CA3AF" />
    <Text className="text-gray-500 text-base mt-4">Start a conversation</Text>
  </View>
));

// Memoized header component
const Header = memo(({ onClearChat, t }) => (
  <View className="bg-blue-600 px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
    <View className="flex-row items-center">
      <MaterialIcons name="chat" size={24} color="white" />
      <Text className="text-2xl font-semibold text-white ml-2">
        {t("Chat Bot")}
      </Text>
    </View>
    <TouchableOpacity onPress={onClearChat}>
      <MaterialIcons name="delete-outline" size={24} color="white" />
    </TouchableOpacity>
  </View>
));

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const flatListRef = useRef(null);
  const genAIRef = useRef(null);
  const modelRef = useRef(null);
  const chatHistoryRef = useRef([]);
  const classroomDataRef = useRef(null);
  const { t } = useTranslation();

  // Fixed content container style
  const contentContainerStyle = { flexGrow: 1, paddingBottom: 20 };

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
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleInputChange = (text) => {
    setInputText(text);
  };

  const loadChatHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem("chatHistory");
      const savedChatState = await AsyncStorage.getItem("chatState");

      if (savedHistory) {
        const parsedMessages = JSON.parse(savedHistory);
        setMessages(parsedMessages);
      }

      if (savedChatState) {
        const chatState = JSON.parse(savedChatState);
        chatHistoryRef.current = chatState.history || [];
        setIsInitialized(chatState.isInitialized || false);
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
        console.log("Profile data loaded:", profileData);
        classroomDataRef.current = simplifyClassroomData(profileData);
        console.log("Classroom data loaded:", classroomDataRef.current);
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  };

  const simplifyClassroomData = (profileData) => {
    // First check if profileData and students array exist
    if (
      !profileData ||
      !profileData.students ||
      !Array.isArray(profileData.students)
    ) {
      console.log("Profile data is missing or has invalid structure");
      return [];
    }

    return profileData.students.flatMap((student) => {
      // Check if student object is valid
      if (!student) {
        return [];
      }

      // Check if classrooms array exists and is properly structured
      if (!student.classrooms || !Array.isArray(student.classrooms)) {
        return [];
      }

      // Map each classroom with defensive null checking
      return student.classrooms
        .map((classroom) => {
          if (!classroom) {
            return null;
          }

          // Create a safe classroom object with null checks for each property
          return {
            studentName: student.name || "Unknown",
            admissionNo: student.admissionNumber || "Unknown",
            school: student.school || "Unknown",
            grade: classroom.grade || "Unknown",
            section: classroom.section || "Unknown",
            subject: classroom.subject || "Unknown",

            // Handle the teacher reference safely
            teacherName:
              classroom.teacher && typeof classroom.teacher === "object"
                ? classroom.teacher.name || "Unknown"
                : "Unknown",

            isClassTeacher: !!classroom.classTeacher,

            // Handle announcements with null checks
            announcements: Array.isArray(classroom.announcements)
              ? classroom.announcements
                  .filter((announcement) => announcement) // Filter out null announcements
                  .map((announcement) => ({
                    title: announcement.title || "Untitled",
                    content: announcement.content || "",
                    date: announcement.createdAt || new Date().toISOString(),
                  }))
              : [],

            // Handle marks with null checks
            marks: Array.isArray(classroom.marks)
              ? classroom.marks
                  .filter((mark) => mark) // Filter out null marks
                  .filter(
                    (mark) =>
                      (student._id && mark.student === student._id) ||
                      (student.admissionNumber &&
                        mark.student === student.admissionNumber)
                  )
                  .map((mark) => ({
                    exam: mark.exam || "Unknown",
                    subject: mark.subject || "Unknown",
                    marksObtained: mark.marksObtained || 0,
                    totalMarks: mark.totalMarks || 0,
                    highestMarks: mark.highestMarks || 0,
                    averageMarks: mark.averageMarks || 0,
                    date: mark.date || new Date().toISOString(),
                  }))
              : [],
          };
        })
        .filter((classroom) => classroom !== null); // Filter out any null classrooms
    });
  };
  const initializeChat = () => {
    try {
      genAIRef.current = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
      modelRef.current = genAIRef.current.getGenerativeModel({
        model: "gemini-1.5-pro",
      });
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  };

  const initializeChatHistory = async () => {
    if (!modelRef.current) {
      console.error("Model not initialized");
      return false;
    }

    try {
      const initialContext = `You are a helpful assistant for parents. You will be asked questions based on their child's school data or general queries. 

Use Markdown formatting for emphasis when needed. For example, use **bold** for important terms, *italics* for slight emphasis, and ## for section headings. Format lists properly with - or 1. prefixes.

CHILD DATA: 
${JSON.stringify(classroomDataRef.current || [])}

Keep your responses helpful, concise, and relevant to the parent's needs. When discussing academic performance, be supportive and constructive.`;

      // Start the chat with system prompt
      const chat = modelRef.current.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      // Add the initial context as the first message
      const result = await chat.sendMessage(initialContext);

      // Store the updated chat history
      chatHistoryRef.current = [
        { role: "user", parts: [{ text: initialContext }] },
        { role: "model", parts: [{ text: result.response.text() }] },
      ];

      // Save the chat state
      await AsyncStorage.setItem(
        "chatState",
        JSON.stringify({
          history: chatHistoryRef.current,
          isInitialized: true,
        })
      );

      setIsInitialized(true);
      return true;
    } catch (error) {
      console.error("Error initializing chat history:", error);
      return false;
    }
  };

  const generateGeminiResponse = async (userInput) => {
    try {
      if (!modelRef.current) {
        console.error("Model not initialized");
        return "Sorry, I encountered an error. Please try again later.";
      }

      // Initialize the chat history if not already done
      if (!isInitialized) {
        const success = await initializeChatHistory();
        if (!success) {
          return "Sorry, I couldn't initialize the chat. Please try again.";
        }
      }

      // Create chat with existing history
      const chat = modelRef.current.startChat({
        history: chatHistoryRef.current,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      // Send the new message
      const result = await chat.sendMessage(
        `${userInput} ["give response only in this indian LANGUAGE code:${i18n.language}" no excuse]`
      );
      const responseText = result.response.text();

      // Update chat history with this exchange
      chatHistoryRef.current.push(
        { role: "user", parts: [{ text: userInput }] },
        { role: "model", parts: [{ text: responseText }] }
      );

      // Keep chat history at a reasonable size (last 10 exchanges)
      if (chatHistoryRef.current.length > 20) {
        // Keep the first message (system prompt) and the last 19 messages
        chatHistoryRef.current = [
          chatHistoryRef.current[0],
          ...chatHistoryRef.current.slice(-19),
        ];
      }

      // Save updated chat history
      await AsyncStorage.setItem(
        "chatState",
        JSON.stringify({
          history: chatHistoryRef.current,
          isInitialized: true,
        })
      );

      return responseText;
    } catch (error) {
      console.error("Error generating response:", error);
      return `Sorry, I encountered an error: ${error.message}. Please try again.`;
    }
  };

  const handleSend = async () => {
    if (inputText.trim() === "") return;

    // Store the current input text before clearing it
    const currentInputText = inputText;

    const userMessage = {
      id: Date.now().toString(),
      text: currentInputText,
      sender: "user",
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const botResponse = await generateGeminiResponse(currentInputText);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: "bot",
      };

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, botMessage];
        // Save to AsyncStorage
        saveChatHistory(updatedMessages);
        return updatedMessages;
      });
    } catch (error) {
      console.error("Error in chat:", error);
      // Add error message to chat
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        sender: "bot",
      };
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, errorMessage];
        // Save to AsyncStorage
        saveChatHistory(updatedMessages);
        return updatedMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Extract AsyncStorage save operation to a separate function
  const saveChatHistory = async (messages) => {
    try {
      await AsyncStorage.setItem("chatHistory", JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving chat history:", error);
    }
  };

  const clearChat = useCallback(async () => {
    setMessages([]);
    // Keep the initial context message, reset everything else
    if (chatHistoryRef.current.length > 0) {
      chatHistoryRef.current = [chatHistoryRef.current[0]];
    }

    await AsyncStorage.removeItem("chatHistory");
    await AsyncStorage.setItem(
      "chatState",
      JSON.stringify({
        history: chatHistoryRef.current,
        isInitialized: isInitialized,
      })
    );
  }, [isInitialized]);

  // Optimize renderItem with useCallback
  const renderMessage = useCallback(({ item }) => <Message item={item} />, []);

  // Optimize keyExtractor with useCallback
  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <Header onClearChat={clearChat} t={t} />
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
            keyExtractor={keyExtractor}
            contentContainerStyle={contentContainerStyle}
            className="flex-1 px-4"
            ListEmptyComponent={EmptyChat}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            initialNumToRender={15}
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
