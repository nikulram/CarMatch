const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const verifyToken = require("../middleware/authMiddleware");
const User = require("../models/User");
const Car = require("../models/Car")
const nodemailer = require("nodemailer");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer config
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uploads/profile",
    allowed_formats: ["jpg", "jpeg", "png", "svg"],
  },
});
const upload = multer({ storage });

// PROFILE
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.post("/upload", verifyToken, upload.single("profilePic"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  return res.json({ success: true, url: req.file.path });
});


router.put("/", verifyToken, async (req, res) => {
  const { firstName, lastName, email, username, profilePic, bio, gender } = req.body;
  const userId = req.user.id;

  if (!firstName || !lastName || !email || !username)
    return res.status(400).json({ error: "All fields are required." });

  if (username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username))
    return res.status(400).json({ error: "Username max 20 characters. No spaces/special characters." });

  if (bio && bio.length > 300)
    return res.status(400).json({ error: "Bio must be 300 characters or less." });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const emailExists = await User.findOne({ email });
    if (emailExists && emailExists._id.toString() !== userId)
      return res.status(409).json({ error: "Email already in use." });

    const usernameExists = await User.findOne({ username });
    if (usernameExists && usernameExists._id.toString() !== userId)
      return res.status(409).json({ error: "Username already taken." });

    const oldEmail = user.email;

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.username = username;
    user.gender = gender || "Prefer not to say";
    user.bio = bio || "";
    user.profilePic = profilePic || user.profilePic;

    await user.save();

    if (oldEmail !== email) {
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Vahana" <${process.env.EMAIL}>`,
        to: oldEmail,
        subject: "Your Vahana email was changed",
        html: `<p>Your email was updated to <strong>${email}</strong>. If this wasn't you, please contact support.</p>`,
      });

      await transporter.sendMail({
        from: `"Vahana" <${process.env.EMAIL}>`,
        to: email,
        subject: "New email on Vahana",
        html: `<p>This is your new registered email on Vahana. If you did not request this, please contact support immediately.</p>`,
      });
    }

    res.json({ success: true, message: "Profile updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update profile." });
  }
});

// Public and user search
router.get("/public/:userId", async (req, res) => {
  try {
    const otherUser = await User.findById(req.params.userId).select("-password");
    if (!otherUser) return res.status(404).json({ error: "User not found" });
    res.json(otherUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch public profile" });
  }
});

router.get("/search/users", verifyToken, async (req, res) => {
  const raw = req.query.q || "";
  const query = raw.replace("@", "");
  const userId = req.user.id;

  if (query.length < 2) return res.json([]);

  try {
    const users = await User.find({
      username: { $regex: query, $options: "i" },
      _id: { $ne: userId },
    }).select("_id username firstName lastName profilePic");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to search users" });
  }
});

// FAVORITES / DISLIKED / CART
router.put("/favorites", verifyToken, async (req, res) => {
  const { carId, action } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const car = await Car.findById(carId);
    if (car && car.sold) {
      return res.status(400).json({ error: "Car is already sold and cannot be added to favorites." });
    }

    if (action === "add" && !user.favorites.includes(carId)) {
      user.favorites.push(carId);
    } else if (action === "remove") {
      user.favorites = user.favorites.filter(id => id.toString() !== carId);
    }

    await user.save();
    res.json({ success: true, favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ error: "Failed to update favorites" });
  }
});


// DISLIKED ROUTE
router.put("/disliked", verifyToken, async (req, res) => {
  const { carId, action } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const car = await Car.findById(carId); 
    if (car && car.sold) {
      return res.status(400).json({ error: "Car is already sold and cannot be added to dislikes." });
    }

    if (action === "add" && !user.disliked.includes(carId)) {
      user.disliked.push(carId);
    } else if (action === "remove") {
      user.disliked = user.disliked.filter(id => id.toString() !== carId);
    }

    await user.save();
    res.json({ success: true, disliked: user.disliked });
  } catch (err) {
    res.status(500).json({ error: "Failed to update disliked cars" });
  }
});


router.get("/disliked", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("disliked");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ disliked: user.disliked });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch disliked cars" });
  }
});

router.put("/cart", verifyToken, async (req, res) => {
  const { carId, action } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (action === "add" && !user.cart.includes(carId)) {
      user.cart.push(carId);
    } else if (action === "remove") {
      user.cart = user.cart.filter(id => id.toString() !== carId);
    }

    await user.save();
    res.json({ success: true, cart: user.cart });
  } catch (err) {
    res.status(500).json({ error: "Failed to update cart" });
  }
});

router.get("/cart", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("cart");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ cart: user.cart });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cart cars" });
  }
});

// WALLET ROUTES
router.get("/wallet", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      walletBalance: user.walletBalance,
      savedCards: user.savedCards || []
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load wallet" });
  }
});

router.post("/wallet/card", verifyToken, async (req, res) => {
  const { cardNumber, nameOnCard, expiry } = req.body;

  if (!cardNumber || !nameOnCard || !expiry) {
    return res.status(400).json({ error: "All card fields are required." });
  }

  const [expMonth, expYear] = expiry.split("/").map((v) => parseInt(v));
  const currentDate = new Date();
  const expiryDate = new Date(`20${expYear}`, expMonth);

  if (isNaN(expMonth) || isNaN(expYear) || expiryDate < currentDate) {
    return res.status(400).json({ error: "Card is expired or invalid." });
  }

  try {
    const user = await User.findById(req.user.id);
    user.savedCards.push({
      cardNumber,
      nameOnCard,
      expiry,
      isActive: user.savedCards.length === 0,
      addedAt: new Date()
    });
    await user.save();
    res.json({ success: true, savedCards: user.savedCards });
  } catch (err) {
    res.status(500).json({ error: "Failed to add card" });
  }
});

router.put("/wallet/card/activate", verifyToken, async (req, res) => {
  const { index } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.savedCards[index]) return res.status(404).json({ error: "Card not found." });

    user.savedCards.forEach((card, i) => {
      card.isActive = i === index;
    });

    await user.save();
    res.json({ success: true, savedCards: user.savedCards });
  } catch (err) {
    res.status(500).json({ error: "Failed to set active card" });
  }
});

router.put("/wallet/card/edit", verifyToken, async (req, res) => {
  const { index, cardNumber, nameOnCard, expiry } = req.body;

  const [expMonth, expYear] = expiry.split("/").map((v) => parseInt(v));
  const currentDate = new Date();
  const expiryDate = new Date(`20${expYear}`, expMonth);

  if (isNaN(expMonth) || isNaN(expYear) || expiryDate < currentDate) {
    return res.status(400).json({ error: "Card expiry is invalid or expired." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user.savedCards[index]) return res.status(404).json({ error: "Card not found." });

    user.savedCards[index] = {
      ...user.savedCards[index],
      cardNumber,
      nameOnCard,
      expiry
    };

    await user.save();
    res.json({ success: true, savedCards: user.savedCards });
  } catch (err) {
    res.status(500).json({ error: "Failed to edit card" });
  }
});

router.delete("/wallet/card/:index", verifyToken, async (req, res) => {
  const index = parseInt(req.params.index);

  try {
    const user = await User.findById(req.user.id);
    if (!user || index < 0 || index >= user.savedCards.length) {
      return res.status(404).json({ error: "Card not found" });
    }

    const wasActive = user.savedCards[index].isActive;
    user.savedCards.splice(index, 1);

    if (wasActive && user.savedCards.length > 0) {
      user.savedCards[0].isActive = true;
    }

    await user.save();
    res.json({ success: true, savedCards: user.savedCards });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete card" });
  }
});

router.post("/wallet/promo", verifyToken, async (req, res) => {
  const { code } = req.body;
  const MAX_TEST_BALANCE = 100_000_000;

  if (code !== "VAHANA-TEST-100M") {
    return res.status(400).json({ error: "Invalid promo code." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (user.walletBalance >= MAX_TEST_BALANCE) {
      return res.status(400).json({ error: "You already have the maximum test balance." });
    }

    user.walletBalance = MAX_TEST_BALANCE;
    await user.save();

    res.json({ success: true, walletBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ error: "Failed to apply promo" });
  }
});

router.post("/wallet/transfer", verifyToken, async (req, res) => {
  const { amount, direction } = req.body;

  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const user = await User.findById(req.user.id);

    if (direction === "withdraw") {
      if (user.walletBalance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      user.walletBalance -= amount;
    } else if (direction === "deposit") {
      user.walletBalance += amount;
    } else {
      return res.status(400).json({ error: "Invalid direction" });
    }

    await user.save();
    res.json({ success: true, walletBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ error: "Failed to transfer funds" });
  }
});

module.exports = router;
