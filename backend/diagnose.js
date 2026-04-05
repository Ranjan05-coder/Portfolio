/**
 * MongoDB Connection Diagnostic Tool
 * Run with: node diagnose.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

console.log("\n🔍 PORTFOLIO CMS - MONGODB DIAGNOSTIC TOOL\n");
console.log("=".repeat(60));

// Check environment variables
console.log("\n📋 Environment Check:");
console.log("   NODE_ENV:", process.env.NODE_ENV || "Not set");
console.log("   PORT:", process.env.PORT || "5000");
console.log("   MONGODB_URI:", process.env.MONGODB_URI ? "✓ SET" : "❌ NOT SET");

if (!process.env.MONGODB_URI) {
  console.error("\n❌ MONGODB_URI is not set in .env file!");
  console.log("   Please add it to .env file");
  process.exit(1);
}

console.log("\n🧪 MongoDB Connection Test:");
console.log("   URI Host:", process.env.MONGODB_URI.split("@")[1].split("/")[0]);
console.log("   Database:", process.env.MONGODB_URI.split("/").pop().split("?")[0]);

const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // Shorter timeout for diagnosis
  socketTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  ssl: true,
  authSource: 'admin',
  family: 4
};

console.log("\n⏳ Connecting to MongoDB...");

const startTime = Date.now();

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => {
    const elapsed = Date.now() - startTime;
    console.log(`\n✅ CONNECTION SUCCESSFUL in ${elapsed}ms`);
    console.log("   Ready State:", mongoose.connection.readyState);
    console.log("   Host:", mongoose.connection.host);
    console.log("   Database:", mongoose.connection.name);
    console.log("\n✓ Your backend should work now!");
    process.exit(0);
  })
  .catch((err) => {
    const elapsed = Date.now() - startTime;
    console.log(`\n❌ CONNECTION FAILED after ${elapsed}ms`);
    console.log("\n🔴 ERROR DETAILS:");
    console.log("   Name:", err.name);
    console.log("   Code:", err.code);
    console.log("   Message:", err.message);
    
    console.log("\n🔧 TROUBLESHOOTING STEPS:");
    
    if (err.message.includes("SSL") || err.message.includes("tls")) {
      console.log("   1. SSL/TLS Error detected");
      console.log("   2. Try: Update MongoDB driver with 'npm install mongodb@latest'");
      console.log("   3. Or disable SSL by removing 'ssl: true' from mongoOptions");
    }
    
    if (err.message.includes("ENOTFOUND") || err.message.includes("getaddrinfo")) {
      console.log("   1. DNS/Network Error detected");
      console.log("   2. Check your internet connection");
      console.log("   3. Verify MongoDB Atlas cluster name is correct");
    }
    
    if (err.message.includes("authentication failed")) {
      console.log("   1. Authentication Error detected");
      console.log("   2. Username/Password in URI is wrong");
      console.log("   3. Check MongoDB Atlas credentials");
    }
    
    if (err.message.includes("ip_whitelist")) {
      console.log("   1. IP Whitelist Error detected");
      console.log("   2. Your IP is blocked in MongoDB Atlas");
      console.log("   3. Add your IP to Atlas Security -> Network Access");
    }
    
    if (err.code === 13) {
      console.log("   1. Authentication/Authorization Error");
      console.log("   2. Create new database user in MongoDB Atlas");
    }
    
    console.log("\n📚 Quick Fixes:");
    console.log("   A. MongoDB Atlas Users:");
    console.log("      → Go to: MongoDB Atlas Dashboard");
    console.log("      → Database Access → Create user with password");
    console.log("      → Network Access → Add your IP (or 0.0.0.0/0 for dev)");
    console.log("      → Copy connection string and update .env");
    console.log("\n   B. Local MongoDB:");
    console.log("      → Start MongoDB service");
    console.log("      → Or install: brew services start mongodb-community");
    
    process.exit(1);
  });

// Timeout failsafe
setTimeout(() => {
  console.log("\n❌ Connection timeout - took too long!");
  process.exit(1);
}, 15000);
