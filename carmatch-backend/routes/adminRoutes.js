const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const User = require("../models/User");
const Car = require("../models/Car");
const Message = require("../models/Message");
const nodemailer = require("nodemailer");

// Get all users
router.get("/users", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all cars
router.get("/cars", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const cars = await Car.find().populate("seller");
    res.json(cars);
  } catch (err) {
    console.error("Error fetching cars:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all messages
router.get("/messages", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const messages = await Message.find().populate("sender receiver");
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get pending verifications
router.get("/verifications", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const pendingUsers = await User.find({
      $or: [
        { "verification.buyer.status": "pending" },
        { "verification.seller.status": "pending" }
      ]
    });

    res.json(pendingUsers);
  } catch (err) {
    console.error("Error fetching verifications:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Approve verification
router.post("/approve-verification", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const { userId, type } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (type === "buyer") user.verification.buyer.status = "verified";
    if (type === "seller") user.verification.seller.status = "verified";

    await user.save();

    // Send approval email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Vahana Verification Approved",
      text: `Hi ${user.firstName},\n\nCongratulations! Your ${type} verification has been approved successfully.\n\nYou can now enjoy full features on Vahana.\n\n- Vahana Team`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: `${type} verification approved and email sent.` });
  } catch (err) {
    console.error("Error approving verification:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Reject verification
router.post("/reject-verification", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const { userId, type, reason } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (type === "buyer") {
      user.verification.buyer.status = "rejected";
      user.verification.buyer.rejectionMessage = reason;
    }
    if (type === "seller") {
      user.verification.seller.status = "rejected";
      user.verification.seller.rejectionMessage = reason;
    }

    await user.save();

    // Send rejection email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Vahana Verification Rejected",
      text: `Hi ${user.firstName},\n\nYour ${type} verification was rejected.\nReason: ${reason}\n\nYou can try again in the app.\n\n- Vahana Team`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: `${type} verification rejected and email sent.` });
  } catch (err) {
    console.error("Error rejecting verification:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
