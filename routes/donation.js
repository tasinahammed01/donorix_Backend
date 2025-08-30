const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();

// --- ADD DONATION (Pending by default) ---
router.post("/donate/:userId", async (req, res) => {
  const { userId } = req.params;
  const { date, location, amount } = req.body; // status not included, default to pending
  const db = req.db;

  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: "User not found" });

    const donation = {
      id: (user.donations?.length || 0) + 1,
      date,
      location,
      amount,
      status: "Pending", // default
    };

    const updatedDonations = [...(user.donations || []), donation];

    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { donations: updatedDonations } }
      );

    res.json({ message: "Donation submitted (Pending approval)", donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- ADMIN APPROVE DONATION ---
router.patch("/approve/:userId/:donationId", async (req, res) => {
  const { userId, donationId } = req.params;
  const db = req.db;

  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: "User not found" });

    const donations = user.donations || [];
    const donationIndex = donations.findIndex(
      (d) => d.id === parseInt(donationId)
    );
    if (donationIndex === -1)
      return res.status(404).json({ message: "Donation not found" });

    // Mark donation as completed
    donations[donationIndex].status = "Completed";

    const totalDonated = donations.filter(
      (d) => d.status === "Completed"
    ).length;

    // Update level badge based on totalDonated
    let levelBadge = "bronze";
    if (totalDonated >= 10) levelBadge = "gold";
    else if (totalDonated >= 5) levelBadge = "silver";

    const updatedLevel = {
      current: Math.floor(totalDonated / 5) + 1,
      xp: totalDonated,
      nextLevelXp: (Math.floor(totalDonated / 5) + 1) * 5,
      levelBadge,
    };

    // Update MongoDB
    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { donations, totalDonated, level: updatedLevel } }
      );

    res.json({
      message: "Donation approved",
      donation: donations[donationIndex],
      level: updatedLevel,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- GET USER DONATIONS, LEVEL, ACHIEVEMENTS ---
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = req.db;

  try {
    const user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(userId) },
        { projection: { donations: 1, achievements: 1, level: 1, isActive: 1 } }
      );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      donations: user.donations || [],
      achievements: user.achievements || [],
      level: user.level || {
        current: 1,
        xp: 0,
        nextLevelXp: 5,
        levelBadge: "bronze",
      },
      isActive: user.isActive,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- UPDATE USER ACHIEVEMENTS ---
router.patch("/achievements/:userId", async (req, res) => {
  const { userId } = req.params;
  const { achievements } = req.body;
  const db = req.db;

  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: "User not found" });

    const updatedAchievements = [...(user.achievements || []), ...achievements];

    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { achievements: updatedAchievements } }
      );

    res.json({
      message: "Achievements updated",
      achievements: updatedAchievements,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- TOGGLE ACTIVE STATUS ---
router.patch("/toggle-active/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = req.db;

  try {
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ message: "User not found" });

    const updatedStatus = !user.isActive;

    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isActive: updatedStatus } }
      );

    res.json({ message: "Status updated", isActive: updatedStatus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
