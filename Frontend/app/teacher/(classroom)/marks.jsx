import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "../../context/authContext";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_MY_API_URL;

const Marks = () => {
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [createdExams, setCreatedExams] = useState([]);
  const [previousMarks, setPreviousMarks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  // For creating new exam
  const [newExam, setNewExam] = useState({
    name: "",
    totalMarks: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/classroom/${params.id}/marks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        setStudents(response.data.students || []);
        setPreviousMarks(response.data.marks || []);

        // Group previous marks by exam
        const existingExams = {};
        response.data.marks.forEach((mark) => {
          if (!existingExams[mark.exam]) {
            existingExams[mark.exam] = {
              name: mark.exam,
              totalMarks: mark.totalMarks,
              hasMarks: true,
              marks: [],
            };
          }
          existingExams[mark.exam].marks.push(mark);
        });

        setCreatedExams(Object.values(existingExams));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = () => {
    if (!newExam.name || !newExam.totalMarks) {
      Alert.alert("Error", "Please enter exam name and total marks");
      return;
    }

    // Check if exam with same name exists
    if (createdExams.some((exam) => exam.name === newExam.name)) {
      Alert.alert("Error", "An exam with this name already exists");
      return;
    }

    // Add to created exams (no API call yet)
    setCreatedExams([
      ...createdExams,
      {
        name: newExam.name,
        totalMarks: Number(newExam.totalMarks),
        hasMarks: false,
        marks: [],
      },
    ]);

    // Reset form
    setNewExam({ name: "", totalMarks: "" });
    Alert.alert("Success", "Exam created successfully");
  };

  const handleExamClick = (exam) => {
    // Initialize students with existing marks or empty marks
    const studentsWithMarks = students.map((student) => {
      const existingMark = exam.marks.find(
        (mark) => mark.student._id === student._id
      );
      return {
        ...student,
        marksObtained: existingMark ? String(existingMark.marksObtained) : "",
      };
    });

    setSelectedExam({
      ...exam,
      students: studentsWithMarks,
    });
    setModalVisible(true);
  };

  const handleSubmitMarks = async () => {
    if (!selectedExam) return;

    // Validate all students have valid marks
    const invalidMarks = selectedExam.students.some(
      (student) =>
        student.marksObtained === "" ||
        isNaN(student.marksObtained) ||
        Number(student.marksObtained) > Number(selectedExam.totalMarks)
    );

    if (invalidMarks) {
      Alert.alert("Error", "Please enter valid marks for all students");
      return;
    }

    try {
      const marksData = selectedExam.students.map((student) => ({
        student: student._id,
        exam: selectedExam.name,
        subject: params.subject,
        marksObtained: Number(student.marksObtained),
        totalMarks: Number(selectedExam.totalMarks),
      }));

      const response = await axios.post(
        `${API_URL}/api/classroom/${params.id}/marks`,
        { marks: marksData },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Success", "Marks added successfully");
        setModalVisible(false);
        setSelectedExam(null);
        fetchData(); // Refresh all data
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add marks");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 p-6">
        <Text className="text-2xl font-bold text-white">Marks</Text>
        <Text className="text-white mt-2">
          {params.subject} - Grade {params.grade} Section {params.section}
        </Text>
      </View>

      {/* Create New Exam */}
      <View className="p-4 bg-white mb-4">
        <Text className="text-lg font-bold mb-4">Create New Exam</Text>
        <TextInput
          className="border border-gray-300 p-2 rounded-lg mb-4"
          placeholder="Exam Name (e.g., Unit Test 1)"
          value={newExam.name}
          onChangeText={(text) => setNewExam({ ...newExam, name: text })}
        />
        <TextInput
          className="border border-gray-300 p-2 rounded-lg mb-4"
          placeholder="Total Marks"
          keyboardType="numeric"
          value={newExam.totalMarks}
          onChangeText={(text) => setNewExam({ ...newExam, totalMarks: text })}
        />
        <TouchableOpacity
          className="bg-blue-500 p-3 rounded-lg"
          onPress={handleCreateExam}
        >
          <Text className="text-white text-center font-semibold">
            Create Exam
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exams List */}
      <View className="p-4">
        <Text className="text-lg font-bold mb-4">Exams</Text>
        {createdExams.length > 0 ? (
          createdExams.map((exam, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white p-4 rounded-lg mb-3 border border-gray-300"
              onPress={() => handleExamClick(exam)}
            >
              <Text className="font-semibold">{exam.name}</Text>
              <Text className="text-gray-600">
                Total Marks: {exam.totalMarks}
              </Text>
              <Text className="text-gray-600">
                Status: {exam.hasMarks ? "Marks Added" : "Pending"}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-gray-500 text-center">
            No exams created yet
          </Text>
        )}
      </View>

      {/* Marks Entry/View Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedExam(null);
        }}
      >
        <View className="flex-1 bg-black/50 justify-center">
          <View className="bg-white m-4 rounded-lg max-h-[80%]">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-xl font-bold">{selectedExam?.name}</Text>
              <Text className="text-gray-600">
                Total Marks: {selectedExam?.totalMarks}
              </Text>
            </View>

            <ScrollView className="p-4">
              {selectedExam?.students?.map((student) => (
                <View
                  key={student._id}
                  className="bg-gray-50 p-4 rounded-lg mb-3"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="font-semibold">{student.name}</Text>
                      <Text className="text-gray-600">
                        Adm: {student.admissionNumber}
                      </Text>
                    </View>
                    {!selectedExam.hasMarks ? (
                      <TextInput
                        className="border border-gray-300 p-2 rounded-lg w-20 text-center"
                        placeholder="Marks"
                        keyboardType="numeric"
                        value={student.marksObtained}
                        onChangeText={(text) => {
                          const newStudents = [...selectedExam.students];
                          const index = newStudents.findIndex(
                            (s) => s._id === student._id
                          );
                          newStudents[index] = {
                            ...student,
                            marksObtained: text,
                          };
                          setSelectedExam({
                            ...selectedExam,
                            students: newStudents,
                          });
                        }}
                      />
                    ) : (
                      <View className="bg-gray-100 px-4 py-2 rounded-lg">
                        <Text className="font-semibold text-lg">
                          {student.marksObtained}/{selectedExam.totalMarks}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View className="p-4 border-t border-gray-200 flex-row justify-end space-x-4">
              <TouchableOpacity
                className="bg-gray-500 p-3 rounded-lg flex-1"
                onPress={() => {
                  setModalVisible(false);
                  setSelectedExam(null);
                }}
              >
                <Text className="text-white text-center font-semibold">
                  {selectedExam?.hasMarks ? "Close" : "Cancel"}
                </Text>
              </TouchableOpacity>
              {!selectedExam?.hasMarks && (
                <TouchableOpacity
                  className="bg-green-500 p-3 rounded-lg flex-1"
                  onPress={handleSubmitMarks}
                >
                  <Text className="text-white text-center font-semibold">
                    Submit Marks
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Marks;
