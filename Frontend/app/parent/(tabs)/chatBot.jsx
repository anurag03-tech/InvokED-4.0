import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { GoogleGenerativeAI } from "@google/generative-ai";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GOOGLE_GEMINI_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY;

const BASE_PROMPT = `You are a helpful assistant. Please provide clear and concise responses in IMP* eng language ONLY`;

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  const generateGeminiResponse = async (userInput) => {
    const genAI = new GoogleGenerativeAI(GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      const fullPrompt = `${BASE_PROMPT}\n\nUser: ${userInput}`;
      const result = await model.generateContent(fullPrompt);
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

      // Save chat history to AsyncStorage
      const updatedMessages = [...messages, userMessage, botMessage];
      await AsyncStorage.setItem(
        "chatHistory",
        JSON.stringify(updatedMessages)
      );
    } catch (error) {
      console.error("Error in chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View
      className={`max-w-[80%] my-2 p-3 rounded-2xl ${
        item.sender === "user"
          ? "self-end bg-blue-500"
          : "self-start bg-gray-200"
      }`}
    >
      <Text
        className={`text-base ${
          item.sender === "user" ? "text-white" : "text-black"
        }`}
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        className="flex-1 px-4"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View className="flex-row p-3 bg-gray-100 border-t border-b border-gray-200 ">
        <TextInput
          className="flex-1 mr-2 p-3 bg-white border border-gray-400 rounded-lg text-base"
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          multiline
        />
        <TouchableOpacity
          className={`justify-center items-center px-4 rounded-2xl h-12 ${
            isLoading ? "bg-gray-400" : "bg-blue-500"
          }`}
          onPress={handleSend}
          disabled={isLoading}
        >
          <Text className="text-white text-base font-semibold">
            {isLoading ? "Sending..." : "Send"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatBot;
