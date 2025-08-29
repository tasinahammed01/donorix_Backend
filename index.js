require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const User = require("./Models/User");
const Request = require("./Models/Request");
const auth = require("./Middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
	.then(() => {
		console.log("MongoDB connected");
		app.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`));
	})
	.catch(err => {
		console.error("MongoDB connection error:", err.message);
		process.exit(1);
	});

// ---------------------
// AUTH ROUTES
// ---------------------


app.get("/", (req, res) => {
	res.send("Welcome to Donorix!");
});

// Register
app.post("/api/register", async (req, res) => {
	try {
		const { name, email, password, phone, bloodGroup, bloodGroupNeeded, city, role } = req.body;
		const hashedPassword = await bcrypt.hash(password, 10);

		const user = new User({
			name,
			email,
			password: hashedPassword,
			phone,
			bloodGroup: role === "donor" ? bloodGroup : null,
			bloodGroupNeeded: role === "recipient" ? bloodGroupNeeded : null,
			city,
			role,
		});

		await user.save();
		res.json({ message: "User registered successfully" });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// Login
app.post("/api/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) return res.status(404).json({ message: "User not found" });

		const valid = await bcrypt.compare(password, user.password);
		if (!valid) return res.status(400).json({ message: "Invalid password" });

		const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
		res.json({ token, role: user.role, name: user.name });
	} catch (err) {
		res.status(500).json({ message: err.message });
	}
});

// Get current user
app.get("/api/me", auth, async (req, res) => {
	const user = await User.findById(req.user.id).select("-password");
	res.json(user);
});

// ---------------------
// DONOR / RECIPIENT ROUTES
// ---------------------

// List all users (protected)
app.get("/api/users", auth, async (req, res) => {
	const users = await User.find().select("-password");
	res.json(users);
});

// List all requests (protected)
app.get("/api/requests", auth, async (req, res) => {
	const requests = await Request.find()
		.populate("recipient", "name email role")
		.populate("acceptedBy", "name email role");
	res.json(requests);
});

// Get donors by blood group and city
app.get("/api/donors", auth, async (req, res) => {
	const { bloodGroup, city } = req.query;
	const donors = await User.find({ role: "donor", bloodGroup, city });
	res.json(donors);
});

// Recipient creates blood request
app.post("/api/request", auth, async (req, res) => {
	const { bloodGroup, city } = req.body;
	if (req.user.role !== "recipient") return res.status(403).json({ message: "Only recipients can create requests" });

	const request = new Request({
		recipient: req.user.id,
		bloodGroup,
		city,
	});
	await request.save();
	res.json(request);
});

// Donor accepts a request
app.post("/api/request/:id/accept", auth, async (req, res) => {
	if (req.user.role !== "donor") return res.status(403).json({ message: "Only donors can accept requests" });

	const request = await Request.findById(req.params.id);
	if (!request) return res.status(404).json({ message: "Request not found" });

	request.status = "accepted";
	request.acceptedBy = req.user.id;
	await request.save();

	// Increment donor's donationsMade
	await User.findByIdAndUpdate(req.user.id, { $inc: { donationsMade: 1 } });

	res.json(request);
});

// Get top donors
app.get("/api/top-donors", async (req, res) => {
	const donors = await User.find({ role: "donor" }).sort({ donationsMade: -1 }).limit(10);
	res.json(donors);
});

// Start server moved to successful DB connection above
