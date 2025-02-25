const Remark = require("../models/remark");
const Classroom = require("../models/classroom");
const Student = require("../models/student");
const Parent = require("../models/parent");
const mongoose = require("mongoose");
const notificationService = require("../services/notificationService");
const translateBatch = require("../utils/translateBatch");

exports.addMessage = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const classroomId = req.params.id;
    const { type } = req.body;

    const student = await Student.findById(studentId).populate({
      path: "parents.parent",
      select: "pushToken language",
    });

    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const classroom = await Classroom.findById(classroomId).populate({
      path: "students",
      match: { _id: studentId },
      populate: {
        path: "parents.parent",
        select: "pushToken language",
      },
    });

    if (!classroom) {
      return res
        .status(404)
        .json({ success: false, message: "Classroom not found" });
    }

    let content;
    if (type === "voice") {
      if (!req.files || !req.files.file) {
        return res
          .status(400)
          .json({ success: false, message: "Voice file is required" });
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

    remark.messages.push({ type, content, sender: "teacher" });
    await remark.save();

    // Collect unique parents and their languages
    const uniqueParents = new Map();
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

    // Group parents by language
    const languageGroups = new Map();
    for (const [parentId, { language, pushToken }] of uniqueParents) {
      if (!languageGroups.has(language)) {
        languageGroups.set(language, []);
      }
      languageGroups.get(language).push({ parentId, pushToken });
    }

    // Translate & send notifications in parent’s language
    for (const [language, parents] of languageGroups) {
      let notificationTitle = "New Remark from Teacher";
      let notificationMessage =
        type === "voice"
          ? "Teacher has sent a voice remark for your child"
          : `Teacher's remark: ${content}`;

      if (language !== "en") {
        try {
          const textsToTranslate = [
            { source: notificationTitle },
            { source: notificationMessage },
          ];
          const translationResponse = await translateBatch(
            textsToTranslate,
            "en",
            language
          );

          if (
            translationResponse.output &&
            translationResponse.output.length > 1
          ) {
            notificationTitle = translationResponse.output[0].target;
            notificationMessage = translationResponse.output[1].target;
          }
        } catch (error) {
          console.error(`Translation error for language ${language}:`, error);
          continue;
        }
      }

      const pushTokens = parents.map((p) => p.pushToken).filter(Boolean);
      if (pushTokens.length > 0) {
        await notificationService.sendClassroomNotification(
          classroom,
          notificationTitle,
          notificationMessage,
          "remark",
          pushTokens
        );
      }
    }

    res.status(200).json({ success: true, remark });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, message: error.message });
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
// exports.getParentChildRemarks = async (req, res) => {
//   try {
//     const { classroomId } = req.params;
//     const parentId = req.user.id;

//     // Validate if this is a valid classroom ID
//     if (!mongoose.Types.ObjectId.isValid(classroomId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid classroom ID format",
//       });
//     }

//     // Find the parent and their children
//     const parent = await Parent.findById(parentId).populate({
//       path: "students",
//       select: "name admissionNumber classrooms",
//     });

//     if (!parent) {
//       return res.status(404).json({
//         success: false,
//         message: "Parent not found",
//       });
//     }

//     // Check if any children are in this classroom
//     const studentInClassroom = parent.students.find((student) =>
//       student.classrooms.map((c) => c.toString()).includes(classroomId)
//     );

//     if (!studentInClassroom) {
//       return res.status(403).json({
//         success: false,
//         message: "You have no children in this classroom",
//       });
//     }

//     // Get the remarks for this student in this classroom
//     const remark = await Remark.findOne({
//       student: studentInClassroom._id,
//       classroom: classroomId,
//     }).populate("student", "name admissionNumber");

//     if (!remark) {
//       return res.status(200).json({
//         success: true,
//         remark: null,
//         student: {
//           _id: studentInClassroom._id,
//           name: studentInClassroom.name,
//           admissionNumber: studentInClassroom.admissionNumber,
//         },
//       });
//     }

//     // Get parent's preferred language
//     const parentLanguage = parent.language || "en";

//     // If parent's language is not English, translate the remarks
//     if (parentLanguage !== "en") {
//       try {
//         const textsToTranslate = remark.messages.map((msg) => ({
//           source: msg.content,
//         }));

//         const translationResponse = await translateBatch(
//           textsToTranslate,
//           "en",
//           parentLanguage
//         );

//         if (
//           translationResponse.output &&
//           translationResponse.output.length > 0
//         ) {
//           remark.messages.forEach((msg, index) => {
//             msg.content =
//               translationResponse.output[index]?.target || msg.content;
//           });
//         }
//       } catch (error) {
//         console.error("Translation error for remarks:", error);
//       }
//     }

//     res.status(200).json({
//       success: true,
//       remark,
//       student: {
//         _id: studentInClassroom._id,
//         name: studentInClassroom.name,
//         admissionNumber: studentInClassroom.admissionNumber,
//       },
//     });
//   } catch (error) {
//     console.error("Error getting parent child remarks:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

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

    if (!remark) {
      return res.status(200).json({
        success: true,
        remark: null,
        student: {
          _id: studentInClassroom._id,
          name: studentInClassroom.name,
          admissionNumber: studentInClassroom.admissionNumber,
        },
      });
    }

    // Get parent's preferred language
    const parentLanguage = parent.language || "en";

    // If parent's language is not English, translate ONLY text messages
    if (parentLanguage !== "en") {
      try {
        // Filter only text messages for translation
        const textMessages = remark.messages.filter(
          (msg) => msg.type === "text"
        );

        // Only proceed with translation if there are text messages
        if (textMessages.length > 0) {
          const textsToTranslate = textMessages.map((msg) => ({
            source: msg.content,
          }));

          const translationResponse = await translateBatch(
            textsToTranslate,
            "en",
            parentLanguage
          );

          if (
            translationResponse.output &&
            translationResponse.output.length > 0
          ) {
            // Update only the text messages with translations
            textMessages.forEach((msg, index) => {
              msg.content =
                translationResponse.output[index]?.target || msg.content;
            });
          }
        }
      } catch (error) {
        console.error("Translation error for remarks:", error);
      }
    }

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
