const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Car = require("../models/Car");
const User = require("../models/User");

// Add Review
router.post("/add", verifyToken, async (req, res) => {
  const { reviewedUserId, role, rating, comment } = req.body;

  try {
    if (req.user.id === reviewedUserId) {
      return res.status(400).json({ error: "You cannot review yourself." });
    }

    // Check for existing review
    const existing = await Review.findOne({
      reviewer: req.user.id,
      reviewedUser: reviewedUserId,
      role
    });

    if (existing) {
      return res.status(400).json({ error: "You already submitted a review." });
    }

    // Check if this reviewer had valid transaction with reviewed user
    const orders = await Order.find({
      $or: [
        { user: req.user.id }, // you bought something
        { "cars": { $exists: true } } // catch rentals too
      ]
    }).populate({
      path: "cars",
      populate: {
        path: "seller",
        model: "User"
      }
    });

    let hasLegitOrder = false;

    for (const order of orders) {
      // Check if you are the buyer and the reviewed user is seller
      for (const car of order.cars) {
        if (car.seller && car.seller._id.toString() === reviewedUserId) {
          if (role === "buyer") hasLegitOrder = true;
        }
      }
      // Check if you are the seller and the reviewed user is buyer
      if (order.user.toString() === reviewedUserId) {
        if (role === "seller") hasLegitOrder = true;
      }
    }

    if (!hasLegitOrder) {
      return res.status(403).json({ error: "You can only review users you bought from or sold to." });
    }

    const review = new Review({
      reviewer: req.user.id,
      reviewedUser: reviewedUserId,
      role,
      rating,
      comment
    });

    await review.save();
    res.json({ message: "Review submitted successfully", review });
  } catch (err) {
    console.error("Add review error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Edit Review
router.put("/edit/:id", verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ error: "Review not found" });

    if (review.reviewer.toString() !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    review.rating = req.body.rating;
    review.comment = req.body.comment;
    review.updatedAt = new Date();

    await review.save();
    res.json({ message: "Review updated", review });
  } catch (err) {
    console.error("Edit review error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get Reviews for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const reviews = await Review.find({ reviewedUser: req.params.userId })
      .populate("reviewer", "firstName lastName username profilePic verification")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("Get reviews error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
