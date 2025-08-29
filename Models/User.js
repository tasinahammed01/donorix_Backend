// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["donor", "recipient"], required: true },
  phone: { type: String, required: true },
  bloodGroup: { type: String },
  bloodGroupNeeded: { type: String },
  city: { type: String },
  donationsMade: { type: Number, default: 0 },
});

// Check if model exists, else create
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
