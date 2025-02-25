const Parent = require("../models/parent");
const Student = require("../models/student");
const Classroom = require("../models/classroom");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const translateBatch = require("../utils/translateBatch");

// Register parent
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, relation, children, language } =
      req.body;

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !relation ||
      !children ||
      !language ||
      children.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingParent = await Parent.findOne({ email });
    if (existingParent) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // First verify all children exist in the database
    for (const child of children) {
      const { school, admissionNumber, name } = child;

      const existingStudent = await Student.findOne({
        school: school.trim(),
        admissionNumber: admissionNumber.trim(),
        name: name.trim(),
      }).collation({ locale: "en", strength: 2 });

      if (!existingStudent) {
        return res.status(404).json({
          success: false,
          message: `${name} admission number ${admissionNumber} not found at ${school}. Please verify the details or contact the class teacher`,
        });
      }

      // Check if student already has a parent with same relation
      const hasParentWithSameRelation = existingStudent.parents.some(
        (p) => p.relation === relation
      );

      if (hasParentWithSameRelation) {
        return res.status(400).json({
          success: false,
          message: `Student ${existingStudent.name} already has a registered ${relation}`,
        });
      }
    }

    // If all validations pass, create parent
    const passwordHash = await bcrypt.hash(password, 10);

    const parent = await Parent.create({
      name,
      email,
      password: passwordHash,
      phone,
      language,
    });

    // Now link all children to parent
    const linkedStudents = [];
    for (const child of children) {
      const { school, admissionNumber } = child;

      const student = await Student.findOne({
        school,
        admissionNumber,
      });

      // Add parent to student's parents array
      student.parents.push({
        parent: parent._id,
        relation,
      });
      await student.save();

      // Add student to parent's students array
      parent.students.push(student._id);
      linkedStudents.push(student);
    }

    await parent.save();

    // Generate token
    const token = parent.generateToken();

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: parent,
      linkedStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Parent login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const parent = await Parent.findOne({ email }).select("+password");
    if (!parent) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await parent.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = parent.generateToken();

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: parent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get parent profile with populated students
exports.getProfile = async (req, res) => {
  try {
    const parent = await Parent.findById(req.user.id).populate({
      path: "students",
      select: "name school admissionNumber classrooms",
      populate: {
        path: "classrooms",
        select:
          "grade section subject teacher classTeacher attendance announcements timetable",
        populate: [
          {
            path: "teacher",
            select: "name email",
          },
          {
            path: "attendance.studentId",
            select: "name admissionNumber",
          },
        ],
      },
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    res.status(200).json({
      success: true,
      parent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        message: "Language is required",
      });
    }

    // Get parent ID from req.user instead of req.parent
    const parentId = req.user._id;

    // Update the parent document
    const updatedParent = await Parent.findByIdAndUpdate(
      parentId,
      { language },
      { new: true }
    );

    if (!updatedParent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Language updated successfully",
      user: updatedParent,
    });
  } catch (error) {
    console.error("Error updating language:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating language",
    });
  }
};

// classroom details

exports.getClassroomDetails = async (req, res) => {
  try {
    const classroomId = req.params.id;
    const parentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid classroom ID format",
      });
    }

    const parent = await Parent.findById(parentId).populate({
      path: "students",
      select: "name admissionNumber classrooms",
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    const classroom = await Classroom.findById(classroomId)
      .populate("teacher", "name email")
      .populate("announcements")
      .populate("assignments")
      .populate({
        path: "marks",
        populate: {
          path: "student",
          select: "name admissionNumber",
        },
      });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    const hasChildInClassroom = parent.students.some((student) =>
      student.classrooms.map((c) => c.toString()).includes(classroomId)
    );

    if (!hasChildInClassroom) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this classroom",
      });
    }

    const studentIds = parent.students.map((student) => student._id.toString());
    const filteredMarks = classroom.marks.filter((mark) =>
      studentIds.includes(mark.student._id.toString())
    );

    const relevantStudents = parent.students.filter((student) =>
      student.classrooms.map((c) => c.toString()).includes(classroomId)
    );

    let announcements = classroom.announcements;
    let assignments = classroom.assignments;

    if (parent.language && parent.language !== "en") {
      try {
        let translatedAnnouncements = JSON.parse(
          JSON.stringify(classroom.announcements)
        );
        let translatedAssignments = JSON.parse(
          JSON.stringify(classroom.assignments)
        );

        const textsToTranslate = [];
        const textMappings = [];

        translatedAnnouncements.forEach((announcement, index) => {
          textsToTranslate.push({ source: announcement.title });
          textMappings.push({ type: "announcementTitle", index });
          textsToTranslate.push({ source: announcement.content });
          textMappings.push({ type: "announcementContent", index });
        });

        translatedAssignments.forEach((assignment, index) => {
          textsToTranslate.push({ source: assignment.title });
          textMappings.push({ type: "assignmentTitle", index });
          textsToTranslate.push({ source: assignment.description });
          textMappings.push({ type: "assignmentDescription", index });
        });

        if (textsToTranslate.length > 0) {
          const translationResponse = await translateBatch(
            textsToTranslate,
            "en",
            parent.language
          );

          if (
            translationResponse.output &&
            translationResponse.output.length > 0
          ) {
            translationResponse.output.forEach((translatedItem, index) => {
              const mapping = textMappings[index];
              if (mapping.type === "announcementTitle") {
                translatedAnnouncements[mapping.index].title =
                  translatedItem.target;
              } else if (mapping.type === "announcementContent") {
                translatedAnnouncements[mapping.index].content =
                  translatedItem.target;
              } else if (mapping.type === "assignmentTitle") {
                translatedAssignments[mapping.index].title =
                  translatedItem.target;
              } else if (mapping.type === "assignmentDescription") {
                translatedAssignments[mapping.index].description =
                  translatedItem.target;
              }
            });
          }
        }

        announcements = translatedAnnouncements;
        assignments = translatedAssignments;
      } catch (error) {
        console.error("Translation error:", error);
      }
    }

    const classroomData = {
      _id: classroom._id,
      subject: classroom.subject,
      grade: classroom.grade,
      section: classroom.section,
      teacher: classroom.teacher,
      announcements: announcements,
      assignments: assignments,
      marks: filteredMarks,
      students: relevantStudents.map((student) => ({
        _id: student._id,
        name: student.name,
        admissionNumber: student.admissionNumber,
      })),
    };

    res.status(200).json({
      success: true,
      classroom: classroomData,
    });
  } catch (error) {
    console.error("Classroom details error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all children's assignments
exports.getAllAssignments = async (req, res) => {
  try {
    const parent = await Parent.findById(req.user.id).populate({
      path: "students",
      populate: {
        path: "classrooms",
        populate: {
          path: "assignments",
        },
      },
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    const assignments = [];
    parent.students.forEach((student) => {
      student.classrooms.forEach((classroom) => {
        classroom.assignments.forEach((assignment) => {
          assignments.push({
            ...assignment.toObject(),
            studentName: student.name,
            subject: classroom.subject,
            grade: classroom.grade,
            section: classroom.section,
          });
        });
      });
    });

    res.status(200).json({
      success: true,
      assignments: assignments.sort(
        (a, b) => new Date(b.dueDate) - new Date(a.dueDate)
      ),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all children's marks
exports.getAllMarks = async (req, res) => {
  try {
    const parent = await Parent.findById(req.user.id).populate({
      path: "students",
      populate: {
        path: "classrooms",
        populate: [
          {
            path: "marks",
            match: { student: { $in: "$students" } },
          },
          {
            path: "teacher",
            select: "name",
          },
        ],
      },
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    const marks = [];
    parent.students.forEach((student) => {
      student.classrooms.forEach((classroom) => {
        classroom.marks
          .filter((mark) => mark.student.toString() === student._id.toString())
          .forEach((mark) => {
            marks.push({
              ...mark.toObject(),
              studentName: student.name,
              subject: classroom.subject,
              grade: classroom.grade,
              section: classroom.section,
              teacher: classroom.teacher.name,
            });
          });
      });
    });

    res.status(200).json({
      success: true,
      marks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get timetable for a specific classroom
exports.getClassroomTimetable = async (req, res) => {
  try {
    const classroomId = req.params.id;
    const parentId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid classroom ID format",
      });
    }

    const parent = await Parent.findById(parentId).populate({
      path: "students",
      select: "name admissionNumber classrooms",
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    // Check if any of the parent's children are in this classroom
    const hasChildInClassroom = parent.students.some((student) =>
      student.classrooms.map((c) => c.toString()).includes(classroomId)
    );

    if (!hasChildInClassroom) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this classroom's timetable",
      });
    }

    const classroom = await Classroom.findById(classroomId)
      .select("grade section subject timetable")
      .populate("teacher", "name");

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    if (!classroom.timetable || !classroom.timetable.image) {
      return res.status(404).json({
        success: false,
        message: "No timetable found for this classroom",
      });
    }

    res.status(200).json({
      success: true,
      timetable: {
        image: classroom.timetable.image,
        lastUpdated: classroom.timetable.lastUpdated,
        classInfo: {
          grade: classroom.grade,
          section: classroom.section,
          subject: classroom.subject,
          teacher: classroom.teacher.name,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// notifications
exports.updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;

    // Update to handle token removal
    const updateData =
      pushToken === null
        ? { $unset: { pushToken: "" } } // Remove the field entirely
        : { pushToken }; // Set the new token

    // Update the parent's push token
    const parent = await Parent.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message:
        pushToken === null
          ? "Push token removed successfully"
          : "Push token updated successfully",
    });
  } catch (error) {
    console.error("Error updating push token:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
