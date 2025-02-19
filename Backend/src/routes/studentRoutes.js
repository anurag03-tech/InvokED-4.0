const express = require("express");
const {
  getSchoolStudents,
  getStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const { isTeacherAuthenticated } = require("../middlewares/teacherAuth");

const router = express.Router();

// student routes
router.get("/school", isTeacherAuthenticated, getSchoolStudents);
router.get("/:id", isTeacherAuthenticated, getStudent);
router.put("/:id", isTeacherAuthenticated, updateStudent);
router.delete("/:id", isTeacherAuthenticated, deleteStudent);

module.exports = router;
