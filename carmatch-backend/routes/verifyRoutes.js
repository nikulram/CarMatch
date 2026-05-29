// backend/routes/verifyRoutes.js
const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const User = require("../models/User");

// Multer Setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Cloudinary Setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload helper
const uploadToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ resource_type: "image" }, (err, result) => {
      if (err) return reject(err);
      resolve(result.secure_url);
    }).end(buffer);
  });
};

// Submit Verification
router.post(
  "/submit-verification",
  verifyToken,
  upload.fields([
    { name: "buyerSelfie", maxCount: 1 },
    { name: "buyerDocs" },
    { name: "sellerSelfie", maxCount: 1 },
    { name: "sellerDocs" },
    { name: "carDocs" },
  ]),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const updates = {};

      // Upload Buyer Verification Files
      if (req.files?.buyerSelfie || req.files?.buyerDocs) {
        updates["verification.buyer.status"] = "pending";

        if (req.files.buyerSelfie) {
          const buyerSelfieUrl = await uploadToCloudinary(req.files.buyerSelfie[0].buffer);
          updates["verification.buyer.selfie"] = buyerSelfieUrl;
        }

        if (req.files.buyerDocs) {
          const buyerDocsUrls = await Promise.all(
            req.files.buyerDocs.map((file) => uploadToCloudinary(file.buffer))
          );
          updates["verification.buyer.documents"] = buyerDocsUrls;
        }
      }

      // Upload Seller Verification Files
      if (req.files?.sellerSelfie || req.files?.sellerDocs || req.files?.carDocs) {
        updates["verification.seller.status"] = "pending";

        if (req.files.sellerSelfie) {
          const sellerSelfieUrl = await uploadToCloudinary(req.files.sellerSelfie[0].buffer);
          updates["verification.seller.selfie"] = sellerSelfieUrl;
        }

        if (req.files.sellerDocs) {
          const sellerDocsUrls = await Promise.all(
            req.files.sellerDocs.map((file) => uploadToCloudinary(file.buffer))
          );
          updates["verification.seller.documents"] = sellerDocsUrls;
        }

        if (req.files.carDocs) {
          const carDocsUrls = await Promise.all(
            req.files.carDocs.map((file) => uploadToCloudinary(file.buffer))
          );
          updates["verification.seller.carDocuments"] = carDocsUrls;
        }
      }

      // Apply Updates
      await User.findByIdAndUpdate(user._id, { $set: updates });

      res.json({ message: "Verification documents submitted successfully." });
    } catch (err) {
      console.error("Verification submission error:", err);
      res.status(500).json({ error: "Error submitting verification. Please try again." });
    }
  }
);

module.exports = router;
