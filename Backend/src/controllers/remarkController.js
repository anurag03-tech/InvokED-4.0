const Remark = require("../models/remark");
const Classroom = require("../models/classroom");
const Student = require("../models/student");
const Parent = require("../models/parent");
const mongoose = require("mongoose");
const notificationService = require("../services/notificationService");

// exports.addMessage = async (req, res) => {
//   try {
//     const studentId = req.params.studentId;
//     const classroomId = req.params.id;
//     const { type } = req.body;

//     // Verify student and classroom existence
//     const student = await Student.findById(studentId);
//     if (!student) {
//       return res.status(404).json({
//         success: false,
//         message: "Student not found",
//       });
//     }

//     const classroom = await Classroom.findById(classroomId);
//     if (!classroom) {
//       return res.status(404).json({
//         success: false,
//         message: "Classroom not found",
//       });
//     }

//     let content;
//     if (type === "voice") {
//       if (!req.files || !req.files.file) {
//         return res.status(400).json({
//           success: false,
//           message: "Voice file is required",
//         });
//       }

//       const voiceFile = req.files.file;

//       const base64Audio = voiceFile.data.toString("base64");

//       // Store the base64 string directly in the database and Prefix with data URI for easier playback
//       content = `data:${voiceFile.mimetype};base64,${base64Audio}`;

//       //console.log(`Voice converted to base64, size: ${content.length} bytes`);
//     } else {
//       // Handle text message
//       if (!req.body.content) {
//         return res.status(400).json({
//           success: false,
//           message: "Content is required for text messages",
//         });
//       }
//       content = req.body.content;
//     }

//     // Find the specific remark for THIS student
//     let remark = await Remark.findOne({
//       student: studentId,
//       classroom: classroomId,
//     });

//     if (!remark) {
//       //console.log(`Creating new remark document for student: ${studentId}`);
//       remark = new Remark({
//         student: studentId,
//         classroom: classroomId,
//         messages: [],
//       });
//     } else {
//       //console.log(`Found existing remark document: ${remark._id}`);
//     }

//     // Add the message
//     remark.messages.push({
//       type,
//       content,
//       sender: "teacher",
//     });

//     await remark.save();

//     res.status(200).json({
//       success: true,
//       remark,
//     });
//   } catch (error) {
//     console.error("Server error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// Get remark thread for a student

exports.addMessage = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const classroomId = req.params.id;
    const { type } = req.body;

    // Verify student and classroom existence and populate only this student's parents
    const student = await Student.findById(studentId).populate({
      path: "parents.parent",
      select: "pushToken",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const classroom = await Classroom.findById(classroomId).populate({
      path: "students",
      match: { _id: studentId },
      populate: {
        path: "parents.parent",
        select: "pushToken",
      },
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: "Classroom not found",
      });
    }

    let content;
    if (type === "voice") {
      if (!req.files || !req.files.file) {
        return res.status(400).json({
          success: false,
          message: "Voice file is required",
        });
      }

      const voiceFile = req.files.file;
      const base64Audio = voiceFile.data.toString("base64");
      content = `data:${voiceFile.mimetype};base64,${base64Audio}`;
    } else {
      if (!req.body.content) {
        return res.status(400).json({
          success: false,
          message: "Content is required for text messages",
        });
      }
      content = req.body.content;
    }

    // Find the specific remark for THIS student
    let remark = await Remark.findOne({
      student: studentId,
      classroom: classroomId,
    });

    if (!remark) {
      remark = new Remark({
        student: studentId,
        classroom: classroomId,
        messages: [],
      });
    }

    remark.messages.push({
      type,
      content,
      sender: "teacher",
    });

    await remark.save();

    // Send notification to this specific student's parents only
    if (student?.parents?.length > 0) {
      const studentParentIds = student.parents
        .filter((p) => p?.parent && p.parent._id)
        .map((p) => p.parent._id.toString());

      if (studentParentIds.length > 0) {
        const notificationMessage =
          type === "voice"
            ? `Teacher has sent a voice remark for your child`
            : `Teacher's remark: ${content}`;

        try {
          await notificationService.sendClassroomNotification(
            classroom,
            "New Remark from Teacher",
            notificationMessage,
            "announcement",
            studentParentIds
          );
        } catch (notificationError) {
          console.warn(
            `Error sending notification for student ${studentId}:`,
            notificationError
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      remark,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getStudentRemark = async (req, res) => {
  try {
    const { studentId } = req.params;
    const classroomId = req.params.id;

    const remark = await Remark.findOne({
      student: studentId,
      classroom: classroomId,
    }).populate("student", "name admissionNumber");

    res.status(200).json({
      success: true,
      remark,
    });
  } catch (error) {
    console.error("Error getting student remark:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get remarks for a parent's child in a classroom
exports.getParentChildRemarks = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const parentId = req.user.id;

    // Validate if this is a valid classroom ID
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid classroom ID format",
      });
    }

    // Find the parent and their children
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

    // Check if any children are in this classroom
    const studentInClassroom = parent.students.find((student) =>
      student.classrooms.map((c) => c.toString()).includes(classroomId)
    );

    if (!studentInClassroom) {
      return res.status(403).json({
        success: false,
        message: "You have no children in this classroom",
      });
    }

    // Get the remarks for this student in this classroom
    const remark = await Remark.findOne({
      student: studentInClassroom._id,
      classroom: classroomId,
    }).populate("student", "name admissionNumber");

    res.status(200).json({
      success: true,
      remark,
      student: {
        _id: studentInClassroom._id,
        name: studentInClassroom.name,
        admissionNumber: studentInClassroom.admissionNumber,
      },
    });
  } catch (error) {
    console.error("Error getting parent child remarks:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// parent reply to a remark
exports.addParentReply = async (req, res) => {
  try {
    const { classroomId } = req.params;
    const parentId = req.user.id;
    const { type, content, mimeType } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Message type is required",
      });
    }

    let messageContent;

    if (type === "voice") {
      // For voice messages sent as JSON
      if (!content) {
        return res.status(400).json({
          success: false,
          message: "Voice content is required for voice messages",
        });
      }

      try {
        const actualMimeType = mimeType || "audio/m4a";
        messageContent = `data:${actualMimeType};base64,${content}`;
      } catch (fileError) {
        console.error("Error processing voice data:", fileError);
        return res.status(400).json({
          success: false,
          message: "Failed to process voice data",
          error: fileError.message,
        });
      }
    } else if (type === "text") {
      if (!content) {
        return res.status(400).json({
          success: false,
          message: "Content is required for text messages",
        });
      }
      messageContent = content;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid message type. Must be 'text' or 'voice'",
      });
    }

    // Find the parent and their children in this classroom
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

    const studentInClassroom = parent.students.find((student) =>
      student.classrooms.map((c) => c.toString()).includes(classroomId)
    );

    if (!studentInClassroom) {
      return res.status(403).json({
        success: false,
        message: "You have no children in this classroom",
      });
    }

    // Find or create a remark thread for this student
    let remark = await Remark.findOne({
      student: studentInClassroom._id,
      classroom: classroomId,
    });

    if (!remark) {
      remark = new Remark({
        student: studentInClassroom._id,
        classroom: classroomId,
        messages: [],
      });
    }

    remark.messages.push({
      type,
      content: messageContent,
      sender: "parent",
    });

    await remark.save();

    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      remark,
    });
  } catch (error) {
    console.error("Error adding parent reply:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
