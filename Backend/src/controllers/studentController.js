const Student = require("../models/student");
const Teacher = require("../models/teacher");
const Classroom = require("../models/classroom");

// Add new student
exports.addStudent = async (req, res) => {
  try {
    const { name, admissionNumber } = req.body;
    const classroomId = req.params.id;
    const school = req.user.school;
    const teacherId = req.user.id;

    // Find the current classroom
    const currentClassroom = await Classroom.findById(classroomId);
    if (!currentClassroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the teacher is the class teacher
    if (!currentClassroom.classTeacher) {
      return res.status(403).json({
        success: false,
        message: "Only class teachers can add students",
      });
    }

    // Check if student already exists in this school
    let student = await Student.findOne({
      admissionNumber,
      school,
    });

    if (student) {
      if (student.classrooms.includes(classroomId)) {
        return res.status(400).json({
          success: false,
          message: "Student is already in this classroom",
        });
      }
    } else {
      // Create new student if doesn't exist
      student = await Student.create({
        name,
        admissionNumber,
        school,
        classrooms: [],
      });
    }

    // Add to current classroom (class teacher's classroom)
    if (!currentClassroom.students.includes(student._id)) {
      currentClassroom.students.push(student._id);
      await currentClassroom.save();
    }

    // Add current classroom to student's classrooms if not already there
    if (!student.classrooms.includes(classroomId)) {
      student.classrooms.push(classroomId);
    }

    // Find all subject classrooms of same grade & section in the same school
    const relatedClassrooms = await Classroom.find({
      grade: currentClassroom.grade,
      section: currentClassroom.section,
      school: school, // If school is stored directly in classroom
      _id: { $ne: classroomId }, // Exclude the current classroom
    });

    // Add student to all related classrooms
    for (const classroom of relatedClassrooms) {
      if (!classroom.students.includes(student._id)) {
        await Classroom.findByIdAndUpdate(classroom._id, {
          $addToSet: { students: student._id },
        });
      }

      if (!student.classrooms.includes(classroom._id)) {
        student.classrooms.push(classroom._id);
      }
    }

    await student.save();

    res.status(201).json({
      success: true,
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all students of school
exports.getSchoolStudents = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    const students = await Student.find({ school: teacher.school }).populate(
      "classrooms",
      "name grade section"
    );

    res.status(200).json({
      success: true,
      students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all students of school
exports.getSchoolStudents = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    const students = await Student.find({ school: teacher.school }).populate(
      "classrooms",
      "name grade section"
    );

    res.status(200).json({
      success: true,
      students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single student
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "classrooms",
      "name grade section"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Verify teacher belongs to same school
    const teacher = await Teacher.findById(req.user.id);
    if (student.school !== teacher.school) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this student's details",
      });
    }

    res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update student
exports.updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Verify teacher belongs to same school
    const teacher = await Teacher.findById(req.user.id);
    if (student.school !== teacher.school) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this student",
      });
    }

    // Don't allow updating school, admission number, or classrooms through this endpoint
    delete req.body.school;
    delete req.body.admissionNumber;
    delete req.body.classrooms;

    student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("classrooms", "name grade section");

    res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove student
exports.removeFromClassroom = async (req, res) => {
  try {
    const { id: classroomId, studentId } = req.params;

    const student = await Student.findById(studentId);
    const classroom = await Classroom.findById(classroomId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Verify teacher belongs to same school
    const teacher = await Teacher.findById(req.user.id);
    if (student.school !== teacher.school) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to remove this student",
      });
    }

    // Remove classroom from student's classrooms array
    student.classrooms = student.classrooms.filter(
      (classroom) => classroom.toString() !== classroomId
    );
    await student.save();

    // Remove student from classroom's students array
    classroom.students = classroom.students.filter(
      (student) => student.toString() !== studentId
    );
    await classroom.save();

    res.status(200).json({
      success: true,
      message: "Student removed from classroom successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete student entirely
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Verify teacher belongs to same school
    const teacher = await Teacher.findById(req.user.id);
    if (student.school !== teacher.school) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this student",
      });
    }

    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
