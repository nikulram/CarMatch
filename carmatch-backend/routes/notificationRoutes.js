const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const verifyToken = require("../middleware/authMiddleware");

router.get("/", verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("sender", "firstName lastName profilePic");
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Server error fetching notifications" });
  }
});

router.patch("/:id/seen", verifyToken, async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { seen: true },
      { new: true }
    );
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: "Error marking as seen" });
  }
});

module.exports = router;


