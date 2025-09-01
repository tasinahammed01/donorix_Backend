const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const { MongoClient } = require("mongodb");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const donationRoutes = require("./routes/donation");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB client setup
const client = new MongoClient(process.env.MONGO_URI);
let db;

client
  .connect()
  .then(() => {
    db = client.db(); // default database
    console.log("MongoDB connected");
  })
  .catch((err) => console.error(err));

// Make db accessible in routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Routes
app.use("/api/auth", authRoutes);

app.use("/users", userRoutes);

app.use("/api/donations", donationRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => res.send("API running"));

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});
