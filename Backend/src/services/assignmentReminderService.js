const Classroom = require("../models/classroom");
const notificationService = require("./notificationService");
const translateBatch = require("../utils/translateBatch");

const sendAssignmentReminders = async () => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    console.log("Checking for assignments due within the next 24 hours...");

    const classrooms = await Classroom.find({
      "assignments.dueDate": { $gte: now, $lte: next24Hours },
    }).populate({
      path: "students",
      populate: {
        path: "parents.parent",
        select: "pushToken language",
      },
    });

    if (!classrooms.length) {
      console.log("No assignments due in the next 24 hours.");
      return;
    }

    for (const classroom of classrooms) {
      const assignmentsDue = classroom.assignments.filter(
        (assignment) =>
          new Date(assignment.dueDate) >= now &&
          new Date(assignment.dueDate) <= next24Hours
      );

      console.log(
        `Found ${assignmentsDue.length} assignments due in the next 24 hours for classroom ${classroom._id}`
      );

      for (const assignment of assignmentsDue) {
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
          let reminderTitle = "Assignment Reminder:";
          let reminderContent = `The assignment "${assignment.title}" is due within the next 24 hours. Please make sure to submit it on time.`;

          if (language !== "en") {
            try {
              const textsToTranslate = [
                { source: reminderTitle },
                { source: reminderContent },
              ];
              const translationResponse = await translateBatch(
                textsToTranslate,
                "en",
                language
              );

              if (
                translationResponse.output &&
                translationResponse.output.length >= 2
              ) {
                reminderTitle = translationResponse.output[0].target;
                reminderContent = translationResponse.output[1].target;
              }
            } catch (error) {
              console.error(
                `Translation error for language ${language}:`,
                error
              );
              continue;
            }
          }

          const pushTokens = parents
            .map((parent) => parent.pushToken)
            .filter(Boolean);

          console.log(
            `Sending notifications to ${pushTokens.length} devices for classroom ${classroom._id}`
          );

          if (pushTokens.length > 0) {
            await notificationService.sendClassroomNotification(
              classroom,
              reminderTitle,
              reminderContent,
              "assignment_reminder",
              pushTokens
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error sending assignment reminders:", error);
  }
};

// Run the reminder service every 30 minutes
setInterval(() => {
  console.log("Running assignment reminders...");
  sendAssignmentReminders();
}, 1000 * 60 * 30);

module.exports = { sendAssignmentReminders };
