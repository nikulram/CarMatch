const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Receiver
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who triggered it
  type: { type: String, enum: ["message", "order", "other"], default: "message" },
  message: { type: String, required: true },
  link: { type: String },
  seen: { type: Boolean, default: false },
  avatar: {
    type: String,
    default: "/default-profile.png",
  },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: "Car" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);

