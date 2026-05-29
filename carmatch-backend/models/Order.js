const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  cars: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car"
    }
  ],
  totalPaid: {
    type: Number,
    required: true
  },
  receiptId: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  isSubscription: {
    type: Boolean,
    default: false
  }
});

// Check if model already exists
module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
