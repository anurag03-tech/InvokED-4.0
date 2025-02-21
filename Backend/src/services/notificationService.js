const Notification = require("../models/notification");
const Student = require("../models/student");
const Parent = require("../models/parent");
const { Expo } = require("expo-server-sdk");

// Create a new Expo SDK client
const expo = new Expo();

const notificationService = {
  // Send notification to parents of students in a classroom
  async sendClassroomNotification(classroom, title, message, type) {
    try {
      // console.log(
      //   `Starting notification process for classroom ${classroom._id}`
      // );
      // console.log(`Students in classroom: ${classroom.students.length}`);

      // 1. Get all students in the classroom with their parents
      const students = await Student.find({
        _id: { $in: classroom.students },
      }).populate({
        path: "parents.parent",
        select: "name email pushToken",
      });

      // console.log(`Found ${students.length} students with populated parents`);

      // // Log student parents for debugging
      // students.forEach((student, index) => {
      //   // console.log(`Student ${index + 1}: ${student.name}`);
      //   // console.log(`  Parents: ${student.parents?.length || 0}`);
      //   if (student.parents?.length) {
      //     student.parents.forEach((p, i) => {
      //       console.log(`    Parent ${i + 1}: ${p.parent?.name || "Unknown"}`);
      //       console.log(`    Has push token: ${!!p.parent?.pushToken}`);
      //     });
      //   }
      // });

      // 2. Extract all parent IDs and push tokens
      const parentIds = new Set();
      const pushTokens = [];

      students.forEach((student) => {
        if (student.parents && student.parents.length) {
          student.parents.forEach((parentInfo) => {
            if (parentInfo.parent) {
              const parentId = parentInfo.parent._id.toString();
              parentIds.add(parentId);

              // Collect push tokens if available
              if (
                parentInfo.parent.pushToken &&
                Expo.isExpoPushToken(parentInfo.parent.pushToken)
              ) {
                pushTokens.push(parentInfo.parent.pushToken);
              }
            }
          });
        }
      });

      const parentIdsArray = Array.from(parentIds);
      // console.log(`Collected ${parentIdsArray.length} unique parent IDs`);
      // console.log(`Collected ${pushTokens.length} push tokens`);

      // Only proceed if we have parent recipients
      if (parentIdsArray.length === 0) {
        //console.log("No parents found for notification - skipping");
        return null;
      }

      // 3. Create notification in database
      const notification = await Notification.create({
        title,
        message,
        type,
        classroom: classroom._id,
        recipients: parentIdsArray,
      });

      //console.log(`Created notification with ID: ${notification._id}`);

      // 4. Send push notifications if tokens are available
      if (pushTokens.length > 0) {
        // console.log(
        //   `Sending push notifications to ${pushTokens.length} devices`
        // );

        // Create the messages for Expo push notification service
        const messages = pushTokens.map((token) => ({
          to: token,
          sound: "default",
          title: title,
          body: message,
          data: {
            type,
            classroomId: classroom._id.toString(),
            notificationId: notification._id.toString(),
          },
        }));

        // Send notifications in chunks to avoid Expo limits
        const chunks = expo.chunkPushNotifications(messages);
        //console.log(`Split into ${chunks.length} chunks for sending`);

        for (let [index, chunk] of chunks.entries()) {
          //console.log(`Sending chunk ${index + 1} of ${chunks.length}`);
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          // console.log(
          //   `Sent chunk ${index + 1}, received ${ticketChunk.length} tickets`
          // );

          // Check for errors
          ticketChunk.forEach((ticket, i) => {
            if (ticket.status === "error") {
              console.error(`Push notification error: ${ticket.message}`);
              console.error(`Details: ${JSON.stringify(ticket.details)}`);
            }
          });
        }
      } else {
        //console.log("No push tokens available to send notifications");
      }

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
      console.error(error.stack);
      throw error;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId, parentId) {
    try {
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        throw new Error("Notification not found");
      }

      // Check if already marked as read
      const alreadyRead = notification.read.some(
        (item) => item.parent.toString() === parentId
      );

      if (!alreadyRead) {
        notification.read.push({
          parent: parentId,
          readAt: new Date(),
        });
        await notification.save();
      }

      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  },

  // Get notifications for a parent
  async getParentNotifications(parentId, limit = 20, skip = 0) {
    try {
      // console.log(
      //   `Getting notifications for parent ${parentId}, limit ${limit}, skip ${skip}`
      // );

      const notifications = await Notification.find({
        recipients: parentId,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("classroom", "grade section subject");

      //console.log(`Found ${notifications.length} notifications for parent`);

      // Add read status for each notification
      const notificationsWithReadStatus = notifications.map((notification) => {
        const isRead = notification.read.some(
          (item) => item.parent.toString() === parentId
        );

        return {
          ...notification.toObject(),
          isRead,
        };
      });

      return notificationsWithReadStatus;
    } catch (error) {
      console.error("Error getting parent notifications:", error);
      throw error;
    }
  },
};

module.exports = notificationService;
