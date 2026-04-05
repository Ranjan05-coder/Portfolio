require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const portfolioRoutes = require("./routes/portfolio");
const historyRoutes = require("./routes/history");
const messagesRoutes = require("./routes/messages");
const filesRoutes = require("./routes/files");
const analyticsRoutes = require("./routes/analytics");
const { createAdminUser } = require("./controllers/authController");

const app = express();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://192.168.0.103:3000",
      "http://192.168.0.108:3000"
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Backend is running" });
});

// MongoDB Connection with error handling
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  ssl: true,
  authSource: 'admin',
  maxPoolSize: 5,
  minPoolSize: 1,
  maxIdleTimeMS: 60000,
  waitQueueTimeoutMS: 10000,
  family: 4,
  heartbeatFrequencyMS: 30000
};

console.log("🔄 Attempting to connect to MongoDB...");
console.log("URI:", process.env.MONGODB_URI ? "✓ SET (connection string obfuscated)" : "❌ NOT SET");

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => {
    console.log("✓ MongoDB connected successfully");
    console.log("   Connection state:", mongoose.connection.readyState);
    // Create admin user on first run
    createAdminUser();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("   Error code:", err.code);
    console.error("   Error name:", err.name);
  });

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.warn("⚠️ MongoDB disconnected (attempting to reconnect...)");
});

mongoose.connection.on('reconnected', () => {
  console.log("✓ MongoDB reconnected successfully");
});

mongoose.connection.on('close', () => {
  console.warn("⚠️ MongoDB connection closed");
});

mongoose.connection.on('error', (err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
});
