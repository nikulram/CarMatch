// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// CORS: Allow localhost + Netlify
const allowedOrigins = [
  "http://localhost:3000",
  "https://vahana.netlify.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes Import
const hitchRoutes = require("./routes/hitchRoutes");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const carRoutes = require("./routes/carRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const profileRoutes = require("./routes/profileRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const orderRoutes = require("./routes/orderRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const verifyToken = require("./middleware/authMiddleware");

// Use Routes
app.use("/auth", authRoutes);
app.use("/messages", messageRoutes);
app.use("/cars", carRoutes);
app.use("/admin", adminRoutes);
app.use("/upload", uploadRoutes);
app.use("/profile", profileRoutes);
app.use("/verify", verifyRoutes); // For Buyer/Seller Verification
app.use("/api/hitch", hitchRoutes);
app.use("/api/orders", orderRoutes);
app.use("/notifications", notificationRoutes);
app.use("/reviews", reviewRoutes);

// Serve static uploads (optional if needed)
app.use("/uploads", express.static("uploads"));

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Test Protected Route
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "Protected route accessed!", user: req.user });
});

// Socket.IO Events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("sendMessage", (message) => {
    const receiverId = message.receiver;
    io.to(receiverId).emit("newMessage", message);
    io.to(receiverId).emit("newNotification", {
      type: "message",
      from: message.sender,
      message: message.message,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
