const express = require("express");
const multer = require("multer");
const path = require("path");
const { ObjectId } = require("mongodb");

const router = express.Router();

// Storage config
const storage = multer.diskStorage({
  destination: "uploads/admins",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Update admin with image upload
router.patch("/update/:id", upload.single("profileImage"), async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, location } = req.body;
  const updateData = { name, email, phone, location };

  if (req.file) {
    updateData.profileImage = `/uploads/admins/${req.file.filename}`;
  }

  await req.db
    .collection("users")
    .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

  res.json({ message: "Profile updated successfully" });
});
