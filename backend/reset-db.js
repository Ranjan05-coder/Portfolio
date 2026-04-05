require("dotenv").config();
const mongoose = require("mongoose");
const Portfolio = require("./models/Portfolio");

async function resetDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });

    console.log("🔄 Clearing old portfolio data...");
    const result = await Portfolio.deleteMany({});
    console.log("✅ Deleted " + result.deletedCount + " portfolio(s)");
    
    console.log("🔄 Creating new portfolio with certificate links...");
    const newPortfolio = await Portfolio.create({
      hero: {
        name: "Prem Ranjan",
        role: "Btech (AIML)",
        summary: "",
        tag: "Open to internships",
        resumeUrl: "#",
        stats: []
      },
      about: "",
      skills: [],
      projects: [],
      experience: [],
      certifications: [
        {
          name: "Machine Learning Specialization - Coursera",
          link: "https://coursera.org/verify/specialization",
          imageUrl: null
        },
        {
          name: "AWS Cloud Practitioner (or in progress)",
          link: "https://aws.amazon.com/certification/",
          imageUrl: null
        },
        {
          name: "Python for Data Science - NPTEL",
          link: "https://nptel.ac.in/",
          imageUrl: null
        },
        {
          name: "SQL (Intermediate) - HackerRank",
          link: "https://www.hackerrank.com/",
          imageUrl: null
        }
      ],
      education: {
        degree: "",
        college: "",
        duration: "",
        cgpa: ""
      },
      contact: [
        {
          label: "Email",
          value: "p5123ranjan@gmail.com",
          type: "email"
        },
        {
          label: "Phone",
          value: "+91-9973305771",
          type: "phone"
        },
        {
          label: "Location",
          value: "Patna, Bihar, India",
          type: "location"
        },
        {
          label: "LinkedIn",
          value: "https://www.linkedin.com/in/prem-ranjan-6b0277253/",
          type: "custom"
        },
        {
          label: "GitHub",
          value: "https://github.com/Ranjan05-coder",
          type: "custom"
        },
        {
          label: "X",
          value: "https://x.com/p_ranjan05",
          type: "custom"
        }
      ]
    });
    
    console.log("✅ Portfolio reset successfully!");
    console.log("📋 Certifications with links created:");
    newPortfolio.certifications.forEach((cert, i) => {
      console.log(`   ${i + 1}. ${cert.name} → ${cert.link}`);
    });
    
    await mongoose.connection.close();
    console.log("✓ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

resetDB();
