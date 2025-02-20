const express = require("express");
const {
  createClassroom,
  getTeacherClassrooms,
  getClassroomDetails,
  updateClassroom,
  deleteClassroom,
  addAssignment,
  getAssignments,
  deleteAssignment,
  addAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  addMarks,
  getMarks,
  updateMarks,
  getAttendance,
  getAttendanceReport,
  markBulkAttendance,
  uploadTimetable,
  getTimetable,
} = require("../controllers/classroomController");
const {
  addStudent,
  removeFromClassroom,
} = require("../controllers/studentController");
const {
  addMessage,
  getStudentRemark,
} = require("../controllers/remarkController");
const { isTeacherAuthenticated } = require("../middlewares/teacherAuth");

const router = express.Router();

// Classroom routes
router.post("/create", isTeacherAuthenticated, createClassroom);
router.get("/all", isTeacherAuthenticated, getTeacherClassrooms);
router.get("/:id", isTeacherAuthenticated, getClassroomDetails);
router.put("/:id", isTeacherAuthenticated, updateClassroom);
router.delete("/:id", isTeacherAuthenticated, deleteClassroom);

// Assignment routes
router.post("/:id/assignment", isTeacherAuthenticated, addAssignment);
router.get("/:id/assignments", isTeacherAuthenticated, getAssignments);
router.delete(
  "/:id/assignment/:assignmentId",
  isTeacherAuthenticated,
  deleteAssignment
);

// Announcement routes
router.post("/:id/announcement", isTeacherAuthenticated, addAnnouncement);
router.get("/:id/announcements", isTeacherAuthenticated, getAnnouncements);
router.delete(
  "/:id/announcement/:announcementId",
  isTeacherAuthenticated,
  deleteAnnouncement
);

// Classroom-student management routes
router.post("/:id/student", isTeacherAuthenticated, addStudent);
router.delete(
  "/:id/student/:studentId",
  isTeacherAuthenticated,
  removeFromClassroom
);

// Marks routes
router.post("/:id/marks", isTeacherAuthenticated, addMarks);
router.get("/:id/marks", isTeacherAuthenticated, getMarks);
router.put("/:id/marks/:markId", isTeacherAuthenticated, updateMarks);

// Attendance routes
router.get("/:id/attendance/:date", isTeacherAuthenticated, getAttendance);
router.get(
  "/:id/attendance-report",
  isTeacherAuthenticated,
  getAttendanceReport
);
router.post("/:id/attendance/bulk", isTeacherAuthenticated, markBulkAttendance);

// Remark routes
router.post(
  "/:id/student/:studentId/remark",
  isTeacherAuthenticated,
  addMessage
);
router.get(
  "/:id/student/:studentId/remark",
  isTeacherAuthenticated,
  getStudentRemark
);

// Timetable routes
router.post("/:id/timetable", isTeacherAuthenticated, uploadTimetable);
router.get("/:id/timetable", isTeacherAuthenticated, getTimetable);
router.get("/:id/student-timetable");

module.exports = router;
