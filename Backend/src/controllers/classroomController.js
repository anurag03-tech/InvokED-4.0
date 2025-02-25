const Classroom = require("../models/classroom");
const Teacher = require("../models/teacher");
const Student = require("../models/student");
const notificationService = require("../services/notificationService");
const translateBatch = require("../utils/translateBatch");

exports.createClassroom = async (req, res) => {
  try {
    const { grade, section, subject, classTeacher } = req.body;

    // If creating as class teacher, check if one already exists
    if (classTeacher) {
      const existingClassTeacher = await Classroom.findOne({
        grade,
        section,
        classTeacher: true,
      }).populate("teacher", "school");

      if (
        existingClassTeacher &&
        existingClassTeacher.teacher.school === req.user.school
      ) {
        return res.status(400).json({
          success: false,
          message: "A class teacher already exists for this class and section",
        });
      }
    } else {
      // If not class teacher, find class teacher's classroom to copy students
      const classTeacherRoom = await Classroom.findOne({
        grade,
        section,
        classTeacher: true,
      }).populate("teacher", "school");

      if (
        classTeacherRoom &&
        classTeacherRoom.teacher.school === req.user.school
      ) {
        // Create classroom with class teacher's students
        const classroom = await Classroom.create({
          grade,
          section,
          subject,
          classTeacher: false,
          teacher: req.user.id,
          students: classTeacherRoom.students,
        });

        // Add to teacher's classrooms
        await Teacher.findByIdAndUpdate(req.user.id, {
          $push: { classrooms: classroom._id },
        });

        // Add this classroom to all students' classroom arrays
        if (classTeacherRoom.students.length > 0) {
          await Student.updateMany(
            { _id: { $in: classTeacherRoom.students } },
            { $addToSet: { classrooms: classroom._id } }
          );
        }

        return res.status(201).json({
          success: true,
          classroom,
        });
      }
    }

    // Create new classroom (either as class teacher or when no class teacher exists)
    const classroom = await Classroom.create({
      grade,
      section,
      subject,
      classTeacher: classTeacher || false,
      teacher: req.user.id,
    });

    // Add to teacher's classrooms
    await Teacher.findByIdAndUpdate(req.user.id, {
      $push: { classrooms: classroom._id },
    });

    res.status(201).json({
      success: true,
      classroom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getTeacherClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ teacher: req.user.id });

    res.status(200).json({
      success: true,
      classrooms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get single classroom details
exports.getClassroomDetails = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate("teacher", "name email school")
      .populate("students", "name admissionNumber");

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the classroom belongs to the logged-in teacher
    if (classroom.teacher._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this classroom",
      });
    }

    res.status(200).json({
      success: true,
      classroom,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete classroom
exports.deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the classroom belongs to the logged-in teacher
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this classroom",
      });
    }

    const teacher = await Teacher.findById(req.user.id);
    teacher.classrooms.pull(req.params.id);
    await teacher.save();

    await classroom.deleteOne();

    res.status(200).json({
      success: true,
      message: "Classroom deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add assignments
exports.addAssignment = async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    const classroom = await Classroom.findById(req.params.id).populate({
      path: "students",
      populate: {
        path: "parents.parent",
        select: "pushToken language",
      },
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add assignments",
      });
    }

    classroom.assignments.push({
      title,
      description,
      dueDate,
    });
    await classroom.save();

    const uniqueParents = new Map();

    classroom.students.forEach((student) => {
      student.parents.forEach((parentInfo) => {
        if (parentInfo.parent && parentInfo.parent._id) {
          const parentId = parentInfo.parent._id.toString();
          const language = parentInfo.parent.language || "en";
          const pushToken = parentInfo.parent.pushToken;

          if (!uniqueParents.has(parentId)) {
            uniqueParents.set(parentId, { language, pushToken });
          }
        }
      });
    });

    const languageGroups = new Map();
    for (const [parentId, { language, pushToken }] of uniqueParents) {
      if (!languageGroups.has(language)) {
        languageGroups.set(language, []);
      }
      languageGroups.get(language).push({ parentId, pushToken });
    }

    for (const [language, parents] of languageGroups) {
      let notificationTitle = title;
      let notificationContent = `Due Date: ${new Date(
        dueDate
      ).toLocaleDateString()}\n${description}`;
      let assignmentPrefix = "Assignment: ";
      let dueDatePrefix = "Due Date: ";

      if (language !== "en") {
        try {
          const textsToTranslate = [
            { source: title },
            { source: description },
            { source: assignmentPrefix },
            { source: dueDatePrefix },
          ];
          const translationResponse = await translateBatch(
            textsToTranslate,
            "en",
            language
          );

          if (
            translationResponse.output &&
            translationResponse.output.length > 0
          ) {
            notificationTitle = translationResponse.output[0].target;
            assignmentPrefix = translationResponse.output[2].target;
            dueDatePrefix = translationResponse.output[3].target;
            notificationContent = `${dueDatePrefix} ${new Date(
              dueDate
            ).toLocaleDateString()}\n${translationResponse.output[1].target}`;
          }
        } catch (error) {
          console.error(`Translation error for language ${language}:`, error);
          continue;
        }
      }

      const pushTokens = parents
        .map((parent) => parent.pushToken)
        .filter(Boolean);
      if (pushTokens.length > 0) {
        await notificationService.sendClassroomNotification(
          classroom,
          `${assignmentPrefix}${notificationTitle}`,
          notificationContent,
          "assignment",
          pushTokens
        );
      }
    }

    res.status(200).json({
      success: true,
      classroom,
    });
  } catch (error) {
    console.error("Error adding assignment:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all assignments for a classroom
exports.getAssignments = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the classroom belongs to the logged-in teacher
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view assignments",
      });
    }

    res.status(200).json({
      success: true,
      assignments: classroom.assignments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the classroom belongs to the logged-in teacher
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete assignments",
      });
    }

    classroom.assignments = classroom.assignments.filter(
      (assignment) => assignment._id.toString() !== req.params.assignmentId
    );

    await classroom.save();

    res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;

    const classroom = await Classroom.findById(req.params.id).populate({
      path: "students",
      populate: {
        path: "parents.parent",
        select: "pushToken language",
      },
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add announcements",
      });
    }

    classroom.announcements.push({ title, content });
    await classroom.save();

    const uniqueParents = new Map();

    classroom.students.forEach((student) => {
      student.parents.forEach((parentInfo) => {
        if (parentInfo.parent && parentInfo.parent._id) {
          const parentId = parentInfo.parent._id.toString();
          const language = parentInfo.parent.language || "en";
          const pushToken = parentInfo.parent.pushToken;

          if (!uniqueParents.has(parentId)) {
            uniqueParents.set(parentId, { language, pushToken });
          }
        }
      });
    });

    const languageGroups = new Map();
    for (const [parentId, { language, pushToken }] of uniqueParents) {
      if (!languageGroups.has(language)) {
        languageGroups.set(language, []);
      }
      languageGroups.get(language).push({ parentId, pushToken });
    }

    for (const [language, parents] of languageGroups) {
      let notificationTitle = title;
      let notificationContent = content;
      let announcementPrefix = "Announcement: ";

      if (language !== "en") {
        try {
          const textsToTranslate = [
            { source: title },
            { source: content },
            { source: announcementPrefix },
          ];
          const translationResponse = await translateBatch(
            textsToTranslate,
            "en",
            language
          );

          if (
            translationResponse.output &&
            translationResponse.output.length > 0
          ) {
            notificationTitle = translationResponse.output[0].target;
            notificationContent = translationResponse.output[1].target;
            announcementPrefix = translationResponse.output[2].target;
          }
        } catch (error) {
          console.error(`Translation error for language ${language}:`, error);
          continue;
        }
      }

      const pushTokens = parents
        .map((parent) => parent.pushToken)
        .filter(Boolean);
      if (pushTokens.length > 0) {
        await notificationService.sendClassroomNotification(
          classroom,
          `${announcementPrefix}${notificationTitle}`,
          notificationContent,
          "announcement",
          pushTokens
        );
      }
    }

    res.status(200).json({
      success: true,
      classroom,
    });
  } catch (error) {
    console.error("Error adding announcement:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view announcements",
      });
    }

    res.status(200).json({
      success: true,
      announcements: classroom.announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the classroom belongs to the logged-in teacher
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete announcements",
      });
    }

    classroom.announcements = classroom.announcements.filter(
      (announcement) =>
        announcement._id.toString() !== req.params.announcementId
    );

    await classroom.save();

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Marks
exports.addMarks = async (req, res) => {
  try {
    const { marks } = req.body; // Array of marks
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Verify teacher belongs to classroom
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add marks",
      });
    }

    // Calculate highest and average marks
    const highestMarks = Math.max(...marks.map((mark) => mark.marksObtained));
    const averageMarks =
      marks.reduce((sum, mark) => sum + mark.marksObtained, 0) / marks.length;

    // Add classroom's subject and stats to each mark entry
    const marksWithStats = marks.map((mark) => ({
      ...mark,
      subject: classroom.subject,
      highestMarks,
      averageMarks,
    }));

    // Add marks to classroom
    classroom.marks.push(...marksWithStats);
    await classroom.save();

    // Populate student details in response
    await classroom.populate("marks.student", "name admissionNumber");

    res.status(200).json({
      success: true,
      marks: classroom.marks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get marks for a classroom
exports.getMarks = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate("marks.student", "name admissionNumber")
      .populate("students", "name admissionNumber");

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    res.status(200).json({
      success: true,
      marks: classroom.marks,
      students: classroom.students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update marks
exports.updateMarks = async (req, res) => {
  try {
    const { markId } = req.params;
    const { marksObtained, totalMarks } = req.body;

    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    const mark = classroom.marks.id(markId);
    if (!mark) {
      return res.status(404).json({
        success: false,
        message: "Mark entry not found",
      });
    }

    // Get all marks for this exam to recalculate stats
    const examMarks = classroom.marks.filter((m) => m.exam === mark.exam);

    // Update current mark
    mark.marksObtained = marksObtained;
    mark.totalMarks = totalMarks;

    // Recalculate highest and average for all marks in this exam
    const highestMarks = Math.max(...examMarks.map((m) => m.marksObtained));
    const averageMarks =
      examMarks.reduce((sum, m) => sum + m.marksObtained, 0) / examMarks.length;

    // Update stats for all marks in this exam
    examMarks.forEach((m) => {
      m.highestMarks = highestMarks;
      m.averageMarks = averageMarks;
    });

    await classroom.save();

    res.status(200).json({
      success: true,
      mark,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Attendance
// Get attendance for a specific date
exports.getAttendance = async (req, res) => {
  try {
    const { date } = req.params;
    const classroom = await Classroom.findById(req.params.id)
      .populate("students", "name admissionNumber")
      .populate("attendance.studentId", "name admissionNumber");

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the classroom belongs to the logged-in teacher
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view attendance",
      });
    }

    // Convert date string to IST Date object
    const attendanceDate = new Date(date);
    // Add IST offset (5 hours and 30 minutes)
    attendanceDate.setHours(5, 30, 0, 0);

    // Find attendance records for this date
    const dateAttendance = classroom.attendance.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate.toDateString() === attendanceDate.toDateString();
    });

    // Create a map of student attendance status
    const attendanceMap = {};
    dateAttendance.forEach((record) => {
      attendanceMap[record.studentId.toString()] = record.status;
    });

    res.status(200).json({
      success: true,
      attendance: dateAttendance,
      attendanceMap,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get attendance report for a date range
exports.getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const classroom = await Classroom.findById(req.params.id)
      .populate("students", "name admissionNumber")
      .populate("attendance.studentId", "name admissionNumber");

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the classroom belongs to the logged-in teacher
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view attendance report",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Filter attendance records within the date range
    const attendanceRecords = classroom.attendance.filter(
      (record) => record.date >= start && record.date <= end
    );

    // Calculate attendance statistics for each student
    const report = classroom.students.map((student) => {
      const studentId = student._id.toString();
      const studentAttendance = attendanceRecords.filter(
        (record) => record.studentId.toString() === studentId
      );

      const totalDays = studentAttendance.length;
      const presentDays = studentAttendance.filter(
        (record) => record.status === "present"
      ).length;

      return {
        student: {
          _id: student._id,
          name: student.name,
          admissionNumber: student.admissionNumber,
        },
        totalDays,
        presentDays,
        absentDays: totalDays - presentDays,
        attendancePercentage:
          totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
      };
    });

    res.status(200).json({
      success: true,
      report,
      dateRange: {
        start,
        end,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// bulk attendance
exports.markBulkAttendance = async (req, res) => {
  try {
    const { attendance } = req.body; // Array of { studentId, date, status }
    const classroom = await Classroom.findById(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the classroom belongs to the logged-in teacher
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to mark attendance",
      });
    }

    // Convert date string to IST Date object for all records
    const attendanceDate = new Date(attendance[0].date);
    attendanceDate.setHours(5, 30, 0, 0);

    // Validate all students exist in classroom
    const validStudents = attendance.every((record) =>
      classroom.students.includes(record.studentId)
    );

    if (!validStudents) {
      return res.status(404).json({
        success: false,
        message: "One or more students not found in this classroom",
      });
    }

    // Remove existing attendance for this date
    classroom.attendance = classroom.attendance.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate.toDateString() !== attendanceDate.toDateString();
    });

    // Add new attendance records
    const newAttendanceRecords = attendance.map((record) => ({
      studentId: record.studentId,
      date: attendanceDate,
      status: record.status,
    }));

    classroom.attendance.push(...newAttendanceRecords);
    await classroom.save();

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//timetable
exports.uploadTimetable = async (req, res) => {
  try {
    const { image } = req.body;
    const classId = req.params.id; // Get ID from route params

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    // Find the classroom
    const classroom = await Classroom.findById(classId);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the classroom belongs to the logged-in teacher
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update timetable for this classroom",
      });
    }

    // Strip the data:image/jpeg;base64, prefix if present
    const base64Image = image.includes("base64,")
      ? image.split("base64,")[1]
      : image;

    // Update the timetable
    classroom.timetable = {
      image: base64Image,
      lastUpdated: Date.now(),
    };

    await classroom.save();

    res.status(200).json({
      success: true,
      message: "Timetable uploaded successfully",
      image: base64Image,
      lastUpdated: classroom.timetable.lastUpdated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get timetable image
exports.getTimetable = async (req, res) => {
  try {
    const classId = req.params.id;

    //console.log("Received Classroom ID:", classId);
    //console.log("Logged in User ID:", req.user.id);

    const classroom = await Classroom.findById(classId);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the classroom belongs to the logged-in teacher
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view timetable for this classroom",
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
      image: classroom.timetable.image,
      lastUpdated: classroom.timetable.lastUpdated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete timetable
exports.deleteTimetable = async (req, res) => {
  try {
    const { classId } = req.params;

    const classroom = await Classroom.findById(classId);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    // Check if the classroom belongs to the logged-in teacher
    if (classroom.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete timetable for this classroom",
      });
    }

    // Remove the timetable
    classroom.timetable = undefined;
    await classroom.save();

    res.status(200).json({
      success: true,
      message: "Timetable deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
