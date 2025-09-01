const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  const db = req.db;

  try {
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      phone: "",
      location: "",
      profileImage: "",
      password: hashedPassword,
      role: role || "donor",
      totalDonated: 0,
      createdAt: new Date(),
      isSuspended: false,
      isActive: true,
      donations: {
        bloodGroup: "",
        lastDonationDate: null,
        weight: null,
        height: null,
        bmi: null,
        isEligible: null,
        nextDonationDate: null,
        age: null,
      },
      achievements: [],
      level: {
        current: 1,
        xp: 0,
        nextLevelXp: 5,
        levelBadge: "bronze",
      },
    };

    const result = await db.collection("users").insertOne(newUser);

    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- LOGIN ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const db = req.db;

  try {
    const user = await db.collection("users").findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        totalDonated: user.totalDonated,
        isActive: user.isActive,
        donations: user.donations,
        achievements: user.achievements,
        level: user.level,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
