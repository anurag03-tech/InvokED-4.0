import AsyncStorage from "@react-native-async-storage/async-storage";

class StorageService {
  static async saveParentProfile(profileData) {
    try {
      await AsyncStorage.setItem(
        "parentProfile",
        JSON.stringify({
          data: profileData,
          lastUpdated: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  }

  static async getParentProfile() {
    try {
      const data = await AsyncStorage.getItem("parentProfile");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting profile:", error);
      return null;
    }
  }
  static async saveClassroomData(classroomId, classroomData) {
    try {
      await AsyncStorage.setItem(
        `classroom_${classroomId}`,
        JSON.stringify({
          data: classroomData,
          lastUpdated: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Error saving classroom data:", error);
    }
  }

  static async getClassroomData(classroomId) {
    try {
      const data = await AsyncStorage.getItem(`classroom_${classroomId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting classroom data:", error);
      return null;
    }
  }
}
