const express = require("express");
const {
  register,
  login,
  getProfile,
  updateProfile,
  getClassroomDetails,
  getAllAssignments,
  getAllMarks,
} = require("../controllers/parentController");
const { isParentAuthenticated } = require("../middlewares/parentAuth");
const {
  getParentChildRemarks,
  addParentReply,
} = require("../controllers/remarkController");

const router = express.Router();

// Auth routes
router.post("/register", register);
router.post("/login", login);

// Profile routes
router.get("/profile", isParentAuthenticated, getProfile);
router.put("/profile", isParentAuthenticated, updateProfile);

// Classroom routes
router.get("/classroom/:id", isParentAuthenticated, getClassroomDetails);
router.get("/assignments", isParentAuthenticated, getAllAssignments);
router.get("/marks", isParentAuthenticated, getAllMarks);

// Remarks routes
router.get(
  "/classroom/:classroomId/remarks",
  isParentAuthenticated,
  getParentChildRemarks
);

router.post(
  "/classroom/:classroomId/reply",
  isParentAuthenticated,
  addParentReply
);

module.exports = router;
