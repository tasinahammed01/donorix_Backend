const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bloodGroup: { type: String, required: true },
    city: { type: String, required: true },
    status: { type: String, enum: ["pending", "accepted", "completed"], default: "pending" },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Request || mongoose.model("Request", requestSchema);
