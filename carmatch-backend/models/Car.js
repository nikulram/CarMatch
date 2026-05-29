const mongoose = require("mongoose");

const RentalSessionSchema = new mongoose.Schema({
  renter: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rentalStart: { type: Date, required: true },
  rentalEnd: { type: Date, required: true },
  returnedAt: { type: Date },
  totalPaid: { type: Number },
  lateFee: { type: Number, default: 0 },
});

const CarSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  price: { type: Number, required: true },
  mileage: { type: mongoose.Schema.Types.Mixed, default: "N/A" },

  condition: {
    type: String,
    enum: ["New", "Used", "Other"],
    required: true
  },

  location: { type: String },
  vehicleType: { type: String },
  description: { type: String },

  image: [{ type: String }], // Cloudinary image URLs

  supportsAR: { type: Boolean, default: false },
  arModelUrl: { type: String }, // URL to .glb model (Cloudinary)

  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  sold: { type: Boolean, default: false },

  rentalModeEnabled: { type: Boolean, default: false },
  isRented: { type: Boolean, default: false },
  rentalStart: { type: Date },
  rentalEnd: { type: Date },
  isReturned: { type: Boolean, default: true },
  keepListed: { type: Boolean, default: false },

  rentalHistory: [RentalSessionSchema],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Car", CarSchema);
