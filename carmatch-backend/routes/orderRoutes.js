const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const User = require("../models/User");
const Car = require("../models/Car");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const generateInvoicePDF = require("../utils/invoiceGenerator");
const Notification = require("../models/Notification");


// Order model
const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  cars: [{ type: mongoose.Schema.Types.ObjectId, ref: "Car" }],
  totalPaid: Number,
  receiptId: String,
  date: { type: Date, default: Date.now },
  isSubscription: {
    type: Boolean,
    default: false
  }
});
const Order = mongoose.model("Order", OrderSchema);

// Email setup
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendBuyerConfirmation = (email, buyerName) => {
  return transporter.sendMail({
    from: `"CarMatch" <${process.env.EMAIL}>`,
    to: email,
    subject: "Thank you for your purchase!",
    html: `
      <h2>Thank you, ${buyerName}!</h2>
      <p>We hope you enjoy your new ride.</p>
      <p>Your receipt has been emailed and the order is confirmed.</p>
    `,
  });
};

const sendSubBuyerConfirmation = (email, buyerName) => {
  return transporter.sendMail({
    from: `"CarMatch" <${process.env.EMAIL}>`,
    to: email,
    subject: "Thank you for your purchase!",
    html: `
      <h2>Thank you, ${buyerName}!</h2>
      <p>Your receipt has been emailed and the order is confirmed.</p>
    `,
  });
};

const sendSellerNotification = (email, sellerName, car, amount) => {
  return transporter.sendMail({
    from: `"CarMatch Sales" <${process.env.EMAIL}>`,
    to: email,
    subject: "Your Vahana has been sold!",
    html: `
      <h2>Hi ${sellerName},</h2>
      <p>Your car <strong>${car.year} ${car.make} ${car.model}</strong> has been ${
        car.rentalModeEnabled ? "rented" : "sold"
      }.</p>
      <p>You’ve been credited <strong>$${amount.toLocaleString()}</strong> to your wallet.</p>
      <p>Thank you for using Vahana!</p>
    `,
  });
};

// POST /subscribe (Purchase a subscription plan)
router.put("/subscription", verifyToken, async (req, res) => {
  const { subscription } = req.body;

  if (!["free", "premium", "pro"].includes(subscription)) {
    return res.status(400).json({ error: "Invalid subscription plan." });
  }

  try {
    const user = await User.findById(req.user.id);
    const receiptId = "VH-" + Date.now().toString().slice(-6);

    // Update user subscription
    user.subscription = subscription;
    await user.save();

    // Create order
    const newOrder = await Order.create({
      user: user._id,
      cars: [], // No cars involved
      totalPaid: 0,
      receiptId,
      isSubscription: true
    });

    // Generate and send invoice
    try {
      const invoiceBuffer = await generateInvoicePDF(
        user,
        [], // No cars
        0,
        receiptId,
        newOrder.date
      );

      await transporter.sendMail({
        from: `Vahana <${process.env.EMAIL}>`,
        to: user.email,
        subject: `Your Vahana Subscription Receipt (${receiptId})`,
        text: `Thank you for subscribing to the ${subscription} plan! Your receipt ID is ${receiptId}.`,
        attachments: [
          {
            filename: `Vahana_Subscription_${receiptId}.pdf`,
            content: invoiceBuffer,
          },
        ],
      });

      await sendSubBuyerConfirmation(user.email, `${user.firstName} ${user.lastName}`);
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }

    res.json({
      success: true,
      message: `Successfully subscribed to ${subscription} plan.`,
      receiptId,
      orderId: newOrder._id
    });

  } catch (err) {
    console.error("Subscription purchase error:", err);
    res.status(500).json({ error: "Subscription purchase failed." });
  }
});


//POST /checkout (Buy or Rent flow)
router.post("/checkout", verifyToken, async (req, res) => {
  const { selectedCars, method, total, rentalDates = {} } = req.body;

  if (!selectedCars || !method) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const user = await User.findById(req.user.id);
    const cars = await Car.find({ _id: { $in: selectedCars } });

    let dynamicTotal = 0;

    for (let car of cars) {
      if (car.rentalModeEnabled) {
        const { start, end } = rentalDates[car._id] || {};
        if (!start || !end) {
          return res.status(400).json({ error: `Missing rental dates for ${car.make} ${car.model}` });
        }

        const rentalStart = new Date(start);
        const rentalEnd = new Date(end);

        const startHour = rentalStart.getHours();
        const endHour = rentalEnd.getHours();

        if (startHour < 9 || startHour > 17 || endHour < 9 || endHour > 17) {
          return res.status(400).json({
            error: `Rental hours for ${car.make} ${car.model} must be between 9 AM and 5 PM.`,
          });
        }

        const rentalDurationHours = (rentalEnd - rentalStart) / (1000 * 60 * 60);
        if (rentalDurationHours < 1) {
          return res.status(400).json({ error: `Invalid rental duration for ${car.make} ${car.model}` });
        }

        const hourlyRate = Number(car.price) / 24;
        const baseRentalCost = hourlyRate * rentalDurationHours;

        dynamicTotal += baseRentalCost;
      } else {
        dynamicTotal += Number(car.price);
      }
    }

    if (method === "vahana") {
      if (user.walletBalance < dynamicTotal) {
        return res.status(400).json({ error: "Insufficient balance." });
      }
      user.walletBalance -= dynamicTotal;
    }

    user.cart = user.cart.filter(id => !selectedCars.includes(id.toString()));
    user.favorites = user.favorites.filter(id => !selectedCars.includes(id.toString()));
    await user.save();

    const receiptId = "VH-" + Date.now().toString().slice(-6);
    const newOrder = await Order.create({
      user: user._id,
      cars: selectedCars,
      totalPaid: dynamicTotal,
      receiptId,
    });

    for (let car of cars) {
      const seller = await User.findById(car.seller);
      const isRent = car.rentalModeEnabled;

      if (isRent) {
        const { start, end } = rentalDates[car._id];
        const rentalStart = new Date(start);
        const rentalEnd = new Date(end);

        const rentalDurationHours = (rentalEnd - rentalStart) / (1000 * 60 * 60);
        const hourlyRate = Number(car.price) / 24;
        const baseCost = hourlyRate * rentalDurationHours;

        car.isRented = true;
        car.rentalStart = rentalStart;
        car.rentalEnd = rentalEnd;
        car.isReturned = false;

        car.rentalHistory.push({
          renter: user._id,
          rentalStart,
          rentalEnd,
          totalPaid: baseCost,
          lateFee: 0, // updated later if applicable
        });

        if (seller) {
          seller.walletBalance += baseCost;
          await seller.save();
        }
      } else {
        car.sold = true;
        if (seller) {
          seller.walletBalance += car.price;
          await seller.save();
        }
      }

      await car.save();

      const favoritedUsers = await User.find({ favorites: car._id });
      const notifMessage = car.rentalModeEnabled
        ? `A car you favorited (${car.make} ${car.model}) has been rented.`
        : `A car you favorited (${car.make} ${car.model}) has been sold.`;

      if (!car?._id) throw new Error("Missing carId when creating notification");

      const notifications = favoritedUsers.map(favUser => ({
        user: favUser._id,
        sender: seller?._id,
        type: "order",
        message: notifMessage,
        link: `/cars/${car._id}`,
        carId: car._id,
      }));

      await Notification.insertMany(notifications);
    }

    try {
      const invoiceBuffer = await generateInvoicePDF(user, cars, dynamicTotal, receiptId, newOrder.date);

      await transporter.sendMail({
        from: `Vahana <${process.env.EMAIL}>`,
        to: user.email,
        subject: `Your Vahana Receipt (${receiptId})`,
        text: `Thank you for your purchase! Your receipt ID is ${receiptId}.`,
        attachments: [
          {
            filename: `Vahana_Receipt_${receiptId}.pdf`,
            content: invoiceBuffer,
          },
        ],
      });

      await sendBuyerConfirmation(user.email, `${user.firstName} ${user.lastName}`);
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }

    res.json({ success: true, receiptId });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Checkout failed." });
  }
});

// GET /history
router.get("/history", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ date: -1 })
      .populate("cars");
    res.json({ orders });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "Failed to load history." });
  }
});

// GET /rental-history
router.get("/rental-history", verifyToken, async (req, res) => {
  try {
    const allOrders = await Order.find({ user: req.user.id })
      .sort({ date: -1 })
      .populate("cars");

    const rentals = allOrders.filter(order =>
      order.cars.some(car => car.rentalModeEnabled === true)
    );

    res.json({ rentals });
  } catch (err) {
    console.error("Rental history error:", err);
    res.status(500).json({ error: "Failed to load rental history." });
  }
});

// GET /invoice/:receiptId
router.get("/invoice/:receiptId", verifyToken, async (req, res) => {
  try {
    const order = await Order.findOne({ receiptId: req.params.receiptId }).populate("cars");
    if (!order || order.user.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized or not found." });
    }

    const user = await User.findById(req.user.id);
    const invoiceBuffer = await generateInvoicePDF(
      user,
      order.cars,
      order.totalPaid,
      order.receiptId,
      order.date
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=Vahana_Receipt_${order.receiptId}.pdf`);
    res.send(invoiceBuffer);
  } catch (err) {
    console.error("Invoice error:", err);
    res.status(500).json({ error: "Failed to generate invoice." });
  }
});

module.exports = router;
