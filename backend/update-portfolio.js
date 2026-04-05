require("dotenv").config();
const mongoose = require("mongoose");
const Portfolio = require("./models/Portfolio");

async function updatePortfolio() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    console.log("Connected to MongoDB");

    // Update or create portfolio with contact info
    const portfolio = await Portfolio.findOneAndUpdate(
      {},
      {
        contact: {
          email: "p5123ranjan@gmail.com",
          phone: "9973305771",
          location: "Patna, Bihar",
          linkedin: "https://www.linkedin.com/in/prem-ranjan-6b0277253/",
          github: "https://github.com/Ranjan05-coder"
        }
      },
      { upsert: true, new: true }
    );

    console.log("✓ Portfolio contact updated:", portfolio.contact);
    await mongoose.connection.close();
    console.log("Done!");
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

updatePortfolio();
