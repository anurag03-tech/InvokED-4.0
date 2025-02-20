const express = require("express");
const { isParentAuthenticated } = require("../middlewares/parentAuth");
const notificationService = require("../services/notificationService");

const router = express.Router();

// Get notifications for logged-in parent
router.get("/", isParentAuthenticated, async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    const notifications = await notificationService.getParentNotifications(
      req.user.id,
      parseInt(limit),
      parseInt(skip)
    );

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Mark notification as read
router.post("/:id/read", isParentAuthenticated, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
