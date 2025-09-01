const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Add this import to use fs for file handling
const { ObjectId } = require("mongodb");

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: "uploads/users", // Save user images here
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage });

/* ------------------------- GET ALL USERS ------------------------- */
router.get("/", async (req, res) => {
  const db = req.db;
  try {
    const users = await db.collection("users").find().toArray();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error });
  }
});

// Delete Profile Image Endpoint
router.delete("/:userId/profile-image", async (req, res) => {
  try {
    const { userId } = req.params;
    const db = req.db;

    // Find the user by their ID in the database
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.profileImage) {
      // Path to the image file (relative to where the image is stored)
      const imagePath = path.join(
        __dirname,
        "..",
        "uploads",
        user.profileImage.replace("/uploads", "")
      );

      // Remove the image file from the server
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      // Update the user's profileImage field to null in the database
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(userId) },
          { $set: { profileImage: null } }
        );

      return res
        .status(200)
        .json({ message: "Profile image deleted successfully" });
    }

    return res.status(400).json({ message: "No profile image to delete" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------- UPDATE SINGLE USER ------------------------- */
router.put("/:id", async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updatedData = req.body; // Data sent from frontend

  try {
    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: updatedData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user", error });
  }
});

/* ------------------------- UPDATE USER WITH IMAGE ------------------------- */
router.patch("/update/:id", upload.single("profileImage"), async (req, res) => {
  const { id } = req.params;
  const db = req.db;

  try {
    // Parse JSON fields (if donations were sent as stringified JSON)
    let updateData = { ...req.body };

    if (updateData.donations && typeof updateData.donations === "string") {
      try {
        updateData.donations = JSON.parse(updateData.donations);
      } catch {
        return res
          .status(400)
          .json({ message: "Invalid donations JSON format" });
      }
    }

    // If an image is uploaded, add it to updateData
    if (req.file) {
      updateData.profileImage = `/uploads/users/${req.file.filename}`;
    }

    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Failed to update user", error });
  }
});

/* ------------------------- DELETE USER ------------------------- */
router.delete("/:id", async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error });
  }
});

module.exports = router;
