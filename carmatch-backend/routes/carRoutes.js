const express = require("express");
const router = express.Router();
const multer = require("multer");
const verifyToken = require("../middleware/authMiddleware");
const Car = require("../models/Car");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/cloudinary");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/cars", async (req, res) => {
  try {
    const cars = await Car.find().populate("seller", "firstName lastName _id profilePic");
    res.json(cars);
  } catch (err) {
    console.error("Error fetching cars:", err);
    res.status(500).json({ error: "Failed to fetch cars" });
  }
});

router.get("/my-cars", async (req, res) => {
  try {
    const userId = req.query.userId;
    const { ObjectId } = require("mongoose").Types;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const cars = await Car.find({ seller: new ObjectId(userId) });
    res.json(cars);
  } catch (err) {
    console.error("Error fetching user's cars:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate("seller", "firstName lastName email profilePic");
    if (!car) return res.status(404).json({ error: "Car not found" });
    res.json(car);
  } catch (err) {
    console.error("Error fetching car:", err);
    res.status(500).json({ error: "Failed to fetch car" });
  }
});

// POST /sell - create new listing
router.post("/sell", verifyToken, upload.fields([{ name: "images", maxCount: 10 }, { name: "arModel", maxCount: 1 }]), async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      price,
      mileage,
      condition,
      location,
      type: vehicleType,
      description,
      supportsAR,
      rentalModeEnabled,
      keepListed
    } = req.body;

    const images = req.files?.images || [];
    if (images.length < 5) {
      return res.status(400).json({ error: "At least 5 images are required." });
    }

    const imageUrls = await Promise.all(
      images.map(file => uploadToCloudinary(file.buffer, file.originalname))
    );

    let arModelUrl = null;
    if ((supportsAR === "true" || supportsAR === true) && req.files?.arModel?.[0]) {
      const arFile = req.files.arModel[0];
      if (!arFile.originalname.endsWith(".glb")) {
        return res.status(400).json({ error: "Only .glb files are allowed for AR models." });
      }
      arModelUrl = await uploadToCloudinary(arFile.buffer, arFile.originalname);
    }

    const newCar = new Car({
      make,
      model,
      year,
      price,
      mileage: mileage?.trim() === "" ? "N/A" : mileage,
      condition,
      location,
      vehicleType,
      description,
      supportsAR: supportsAR === "true" || supportsAR === true,
      arModelUrl,
      rentalModeEnabled: rentalModeEnabled === "true" || rentalModeEnabled === true,
      keepListed: keepListed === "true" || keepListed === true,
      isReturned: true,
      image: imageUrls,
      seller: req.user.id,
    });

    await newCar.save();
    res.json({ success: true, car: newCar });
  } catch (err) {
    console.error("Listing error:", err);
    res.status(500).json({ error: "Failed to list car" });
  }
});

router.put("/rent/:id", verifyToken, async (req, res) => {
  try {
    const { rentalStart, rentalEnd, totalPaid } = req.body;

    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found." });

    if (!car.rentalModeEnabled || car.isRented) {
      return res.status(400).json({ error: "Car is not available for rent." });
    }

    car.isRented = true;
    car.isReturned = false;
    car.rentalStart = new Date(rentalStart);
    car.rentalEnd = new Date(rentalEnd);

    car.rentalHistory.push({
      renter: req.user.id,
      rentalStart: new Date(rentalStart),
      rentalEnd: new Date(rentalEnd),
      totalPaid,
    });

    await car.save();
    res.json({ success: true, message: "Rental confirmed", car });
  } catch (err) {
    console.error("Rental booking error:", err);
    res.status(500).json({ error: "Failed to rent car." });
  }
});

router.put("/return/:id", verifyToken, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });

    car.isRented = false;
    car.isReturned = true;
    car.rentalStart = null;
    car.rentalEnd = null;

    await car.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Return error:", err);
    res.status(500).json({ error: "Failed to return rental" });
  }
});

router.put("/unlist-rental/:id", verifyToken, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car || car.seller.toString() !== req.user.id)
      return res.status(403).json({ error: "Unauthorized" });

    car.keepListed = false;
    await car.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to unlist rental" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });
    if (car.seller.toString() !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    await car.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete car" });
  }
});

router.get("/admin/all", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const cars = await Car.find().populate("seller", "firstName lastName email");
    res.json(cars);
  } catch (err) {
    console.error("Admin fetch cars error:", err);
    res.status(500).json({ error: "Failed to fetch cars" });
  }
});

router.delete("/admin/delete/:id", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Access denied" });

    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: "Car not found" });

    await car.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete car error:", err);
    res.status(500).json({ error: "Failed to delete car" });
  }
});

module.exports = router;
