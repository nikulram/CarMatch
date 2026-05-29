const mongoose = require("mongoose");

const VerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  username: String,
  password: String,
  code: String,
  createdAt: { type: Date, default: Date.now, expires: 600 } // Auto delete after 10 minutes
});

module.exports = mongoose.model("Verification", VerificationSchema);
