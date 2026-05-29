const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_token";

// Email transport configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Utility: Generate 6-digit code
const generateCode = () => Math.floor(100000 + Math.random() * 900000);

// Utility: Send verification code email
const sendCodeEmail = (email, code) => {
  return transporter.sendMail({
    from: `"Vahana Verification" <${process.env.EMAIL}>`,
    to: email,
    subject: "Your Vahana 6-Digit Code",
    html: `
      <div style="font-family:sans-serif; padding:20px;">
        <h2>Vahana Verification</h2>
        <p>Use this 6-digit code to continue:</p>
        <div style="font-size:22px; letter-spacing:6px; margin:20px 0; padding:10px; background:#eee; text-align:center;">
          ${code}
        </div>
        <p style="font-size:14px; color:#888;">Do not share this code. It expires in 10 minutes.</p>
      </div>
    `,
  });
};

// Utility: Send confirmation after password reset
const sendPasswordResetConfirmation = (email) => {
  return transporter.sendMail({
    from: `"Vahana Support" <${process.env.EMAIL}>`,
    to: email,
    subject: "Your Vahana Password Was Changed",
    html: `
      <div style="font-family:sans-serif; padding:20px;">
        <h2>Password Reset Confirmation</h2>
        <p>Your password was successfully changed.</p>
        <p style="font-size:14px; color:#888;">If this wasn't you, please contact support immediately.</p>
      </div>
    `,
  });
};

// Validate strong password
const isStrongPassword = (pwd) =>
  pwd.length >= 8 &&
  /[A-Z]/.test(pwd) &&
  /[^A-Za-z0-9]/.test(pwd);

// Register user
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, username, password } = req.body;

  if (!firstName || !lastName || !email || !username || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: "Password too weak. Must be 8+ chars, 1 uppercase, 1 special char." });
  }

  if (/\s/.test(username)) {
    return res.status(400).json({ error: "Username cannot contain spaces." });
  }

  const emailExists = await User.findOne({ email });
  if (emailExists) return res.status(409).json({ error: "Email already registered." });

  const usernameExists = await User.findOne({ username });
  if (usernameExists) return res.status(409).json({ error: "Username already taken." });

  const code = generateCode();

  const newUser = new User({
    firstName,
    lastName,
    email,
    username,
    password,
    verificationCode: code,
    isVerified: false,
    lastCodeSentAt: new Date(),
    subscription: "free",
  });

  await newUser.save();
  await sendCodeEmail(email, code);

  res.status(201).json({ message: "Verification code sent to your email." });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    if (!user.isVerified) {
      return res.status(403).json({ error: "Please verify your email before logging in." });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const code = generateCode();
    user.verificationCode = code;
    user.lastCodeSentAt = new Date();
    await user.save();

    await sendCodeEmail(user.email, code);
    res.status(200).json({ message: "Verification code sent." });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login." });
  }
});

// Verify login/register code
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.verificationCode != code) {
    return res.status(400).json({ error: "Invalid verification code." });
  }

  user.isVerified = true;
  user.verificationCode = null;
  await user.save();

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "30d",
  });
  res.status(200).json({ token });
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "No user with this email." });

  const now = new Date();
  const diff = (now - (user.lastCodeSentAt || 0)) / 1000;
  if (diff < 60) return res.status(429).json({ error: "Wait 1 minute to request again." });

  const code = generateCode();
  user.verificationCode = code;
  user.lastCodeSentAt = now;
  await user.save();

  await sendCodeEmail(email, code);
  res.status(200).json({ message: "Reset code sent to your email." });
});

// Verify reset code
router.post("/verify-reset", async (req, res) => {
  const { email, code } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.verificationCode !== code) {
    return res.status(400).json({ error: "Invalid reset code." });
  }

  user.verificationCode = null;
  await user.save();

  res.status(200).json({ message: "Reset code verified." });
});

// Reset password
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({ error: "Password too weak." });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found." });

  user.password = newPassword;
  await user.save();

  await sendPasswordResetConfirmation(email);
  res.status(200).json({ message: "Password updated and confirmation email sent." });
});

// THIS IS THE MISSING PART - Get Current Profile (for Admin Check)
router.get("/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
});

module.exports = router;
