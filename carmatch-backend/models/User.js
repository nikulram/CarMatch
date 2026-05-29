// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  username: {
    type: String,
    required: true,
    unique: true,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/, // Only letters, numbers, underscores
  },
  password:  { type: String, required: true },

  profilePic: {
    type: String,
    default: "/default-profile.png",
  },
  bio: {
    type: String,
    maxlength: 300,
    default: "",
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Non-binary", "Prefer not to say", "Other"],
    default: "Prefer not to say",
  },

  verificationCode: { type: String },
  isVerified: { type: Boolean, default: false },
  lastCodeSentAt: Date,
  role: { type: String, default: "user" },

  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
  disliked:  [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
  cart: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],

  walletBalance: { type: Number, default: 0 },
  savedCards: [
    {
      cardNumber: String,
      nameOnCard: String,
      expiry: String,
      isActive: { type: Boolean, default: false },
      addedAt: { type: Date, default: Date.now }
    }
  ],

  pinnedConversations: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  deletedConversations: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // NEW: Buyer and Seller Verification
  verification: {
    buyer: {
      status: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
      selfie: { type: String },  // Cloudinary URL of live face
      documents: [{ type: String }], // Array of Cloudinary links for ID uploads
      rejectionMessage: { type: String, default: "" }
    },
    seller: {
      status: { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
      selfie: { type: String },
      documents: [{ type: String }], // Identity docs (passport/license)
      carDocuments: [{ type: String }], // Car ownership proof (title/registration)
      rejectionMessage: { type: String, default: "" }
    }
  },

  subscription: {
    "type": String,
    enum: ["free", "premium", "pro"], 
    default: "free"
  },

});

module.exports = mongoose.model("User", UserSchema);
