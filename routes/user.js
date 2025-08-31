const express = require("express");
const { ObjectId } = require("mongodb"); // For working with MongoDB IDs
const router = express.Router();

// GET ALL USERS
router.get("/", async (req, res) => {
  const db = req.db;
  try {
    const users = await db.collection("users").find().toArray();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error });
  }
});

// GET SINGLE USER BY ID
router.get("/:id", async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user", error });
  }
});

// UPDATE USER BY ID
router.put("/:id", async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const updateData = req.body;

  try {
    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user", error });
  }
});

// UPDATE USER BY ID
router.patch("/update/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const db = req.db;

  try {
    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE USER BY ID
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

router.patch(":id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const db = req.db;

  if (!["admin", "donor", "recipient"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: { role } });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id/suspend", async (req, res) => {
  const { id } = req.params;
  const { action } = req.body;
  const db = req.db; // ✅ use the same db

  const isSuspended = action === "suspend";

  try {
    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(id) }, { $set: { isSuspended } });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `User has been ${action}ed successfully` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
