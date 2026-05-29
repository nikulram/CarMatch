const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const User = require("../models/User");
const verifyToken = require("../middleware/authMiddleware");

/**
 * GET /messages/conversations
 * Returns enhanced list of recent conversations with unreadCount
 */
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ timestamp: -1 });

    const convoMap = new Map();

    for (let msg of messages) {
      const otherUserId =
        msg.sender.toString() === userId ? msg.receiver.toString() : msg.sender.toString();

      if (
        user.deletedConversations.includes(otherUserId) ||
        convoMap.has(otherUserId)
      ) continue;

      const otherUser = await User.findById(otherUserId).select("firstName lastName profilePic");
      if (!otherUser) continue;

      const unreadCount = await Message.countDocuments({
        sender: otherUserId,
        receiver: userId,
        seenBy: { $ne: userId }
      });

      convoMap.set(otherUserId, {
        otherUserId,
        firstName: otherUser.firstName,
        lastName: otherUser.lastName,
        profilePic: otherUser.profilePic,
        lastMessage: msg.message,
        lastMessageTime: msg.timestamp,
        unreadCount,
        isPinned: user.pinnedConversations.includes(otherUserId)
      });
    }

    const allConversations = Array.from(convoMap.values());

    // Sort: pinned on top, then recent
    const sorted = allConversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });

    res.json(sorted);
  } catch (err) {
    console.error("GET /messages/conversations error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

/**
 * GET /messages/with/:otherUserId
 * Fetch full chat history with one user
 */
router.get("/with/:otherUserId", verifyToken, async (req, res) => {
  try {
    const otherUserId = req.params.otherUserId;

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.id }
      ]
    })
      .sort({ timestamp: 1 })
      .populate("sender", "firstName lastName");

    res.json(messages);
  } catch (err) {
    console.error("GET /messages/with/:otherUserId error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/**
 * POST /messages/send
 * Send a new message to another user
 */
router.post("/send", verifyToken, async (req, res) => {
  try {
    const { receiver, message } = req.body;
    if (!receiver || !message) {
      return res.status(400).json({ error: "Receiver and message are required." });
    }

    const sender = await User.findById(req.user.id);

    // Restore conversation if previously deleted
    const index = sender.deletedConversations.indexOf(receiver);
    if (index !== -1) {
      sender.deletedConversations.splice(index, 1);
      await sender.save();
    }

    const newMessage = await Message.create({
      sender: req.user.id,
      receiver,
      message,
      timestamp: new Date(),
      seenBy: [req.user.id]
    });

    const Notification = require("../models/Notification");
    if (receiver.toString() !== req.user.id) {
      await Notification.create({
        user: receiver,
        sender: req.user.id,
        type: "message",
        message: message,
        link: `/messages/with/${req.user.id}`
      });
    }

    res.json({ success: true, newMessage });
  } catch (err) {
    console.error("POST /messages/send error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

/**
 * PATCH /messages/seen/:otherUserId
 * Mark all received messages from otherUserId as seen
 */
router.patch("/seen/:otherUserId", verifyToken, async (req, res) => {
  try {
    const updated = await Message.updateMany(
      {
        sender: req.params.otherUserId,
        receiver: req.user.id,
        seenBy: { $ne: req.user.id }
      },
      { $push: { seenBy: req.user.id } }
    );

    res.json({ success: true, updated: updated.modifiedCount });
  } catch (err) {
    console.error("PATCH /messages/seen error:", err);
    res.status(500).json({ error: "Failed to mark messages as seen" });
  }
});

/**
 * DELETE /messages/with/:otherUserId
 * Soft-delete chat for current user
 */
router.delete("/with/:otherUserId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const otherId = req.params.otherUserId;

    if (!user.deletedConversations.includes(otherId)) {
      user.deletedConversations.push(otherId);
      await user.save();
    }

    return res.json({ success: true, message: "Conversation deleted for you." });
  } catch (err) {
    console.error("DELETE /messages/with/:otherUserId error:", err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

/**
 * PATCH /messages/pin/:otherUserId
 * Toggle pin/unpin chat
 */
router.patch("/pin/:otherUserId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const otherId = req.params.otherUserId;

    const index = user.pinnedConversations.indexOf(otherId);
    if (index !== -1) {
      user.pinnedConversations.splice(index, 1); // unpin
      await user.save();
      return res.json({ success: true, pinned: false });
    }

    user.pinnedConversations.push(otherId);
    await user.save();
    res.json({ success: true, pinned: true });
  } catch (err) {
    console.error("PATCH /messages/pin error:", err);
    res.status(500).json({ error: "Failed to pin/unpin conversation" });
  }
});

module.exports = router;
