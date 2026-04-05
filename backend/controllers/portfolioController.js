const Portfolio = require("../models/Portfolio");
const History = require("../models/History");
const Message = require("../models/Message");
const nodemailer = require("nodemailer");
const { sendEmailNotification } = require("./authController");

// Setup email service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Get current portfolio (public endpoint)
const getPortfolio = async (req, res) => {
  try {
    console.log("[Portfolio] GET request received");
    let portfolio = await Portfolio.findOne().maxTimeMS(30000);
    console.log("[Portfolio] Found portfolio:", portfolio ? "Yes" : "No (will create default)");
    
    if (!portfolio) {
      console.log("[Portfolio] Creating default portfolio...");
      // Create default portfolio if none exists
      portfolio = await Portfolio.create({
        hero: {
          name: "Prem Ranjan",
          role: "Btech (AIML) | Software Developer",
          summary: "Passionate about building innovative solutions with AI/ML and full-stack development. Always eager to learn and take on new challenges.",
          tag: "Open to internships",
          resumeUrl: "#",
          stats: ["5+ Projects", "Strong in ML", "Full-Stack"]
        },
        about: "I'm a B.Tech student in Computer Science and Engineering specializing in Artificial Intelligence and Machine Learning. I have experience in building web applications and working with AI/ML technologies.",
        skills: ["Python", "JavaScript", "React", "Node.js", "MongoDB", "Machine Learning", "TensorFlow", "REST APIs", "Git", "Docker"],
        projects: [
          {
            title: "Portfolio Admin CMS",
            summary: "A full-stack portfolio management system with admin dashboard, real-time updates, and MongoDB integration.",
            tech: ["Node.js", "Express", "MongoDB", "JWT", "REST API"],
            imageUrl: null,
            live: "#",
            code: "https://github.com/Ranjan05-coder"
          }
        ],
        experience: [
          {
            title: "Intern / Developer",
            org: "Your Company Name",
            period: "Month Year - Present",
            details: "Working on full-stack development and AI/ML projects. Contributing to production systems."
          }
        ],
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
        education: [
          {
            type: "higher",
            degree: "B.Tech in Computer Science and Engineering (AI/ML)",
            college: "Your College Name",
            duration: "2023 - 2027",
            cgpaType: "cgpa",
            cgpaValue: "8.4"
          }
        ],
        journey: [],
        skillsProgression: [],
        contact: [
          {
            label: "Email",
            value: "p5123ranjan@gmail.com",
            contactType: "email"
          },
          {
            label: "Phone",
            value: "9973305771",
            contactType: "phone"
          },
          {
            label: "Location",
            value: "Patna, Bihar",
            contactType: "location"
          },
          {
            label: "LinkedIn",
            value: "https://www.linkedin.com/in/prem-ranjan-6b0277253/",
            contactType: "custom"
          },
          {
            label: "GitHub",
            value: "https://github.com/Ranjan05-coder",
            contactType: "custom"
          },
          {
            label: "X",
            value: "https://x.com/p_ranjan05",
            contactType: "custom"
          }
        ]
      });
      console.log("[Portfolio] Default portfolio created");
    } else {
      console.log("[Portfolio] Existing portfolio loaded, checking contact info...");
      // Fix contact field if it's a string instead of array
      if (typeof portfolio.contact === 'string') {
        console.log("[Portfolio] Converting contact from string to array...");
        try {
          portfolio.contact = JSON.parse(portfolio.contact);
        } catch (parseErr) {
          console.log("[Portfolio] Failed to parse contact, creating new contact array...");
          portfolio.contact = [
            { label: "Email", value: "p5123ranjan@gmail.com", contactType: "email" },
            { label: "Phone", value: "9973305771", contactType: "phone" },
            { label: "Location", value: "Patna, Bihar", contactType: "location" },
            { label: "LinkedIn", value: "https://www.linkedin.com/in/prem-ranjan-6b0277253/", contactType: "custom" },
            { label: "GitHub", value: "https://github.com/Ranjan05-coder", contactType: "custom" },
            { label: "X", value: "https://x.com/p_ranjan05", contactType: "custom" }
          ];
        }
      }
      // Ensure contact info exists even in old portfolios
      if (!portfolio.contact || portfolio.contact.length === 0) {
        console.log("[Portfolio] Adding missing contact info...");
        portfolio.contact = [
          {
            label: "Email",
            value: "p5123ranjan@gmail.com",
            contactType: "email"
          },
          {
            label: "Phone",
            value: "9973305771",
            contactType: "phone"
          },
          {
            label: "Location",
            value: "Patna, Bihar",
            contactType: "location"
          },
          {
            label: "LinkedIn",
            value: "https://www.linkedin.com/in/prem-ranjan-6b0277253/",
            contactType: "custom"
          },
          {
            label: "GitHub",
            value: "https://github.com/Ranjan05-coder",
            contactType: "custom"
          },
          {
            label: "X",
            value: "https://x.com/p_ranjan05",
            contactType: "custom"
          }
        ];
        await portfolio.save();
      }
    }
    console.log("[Portfolio] Sending portfolio response");
    res.json(portfolio);
  } catch (err) {
    console.error("[Portfolio] FATAL ERROR:", err);
    console.error("[Portfolio] Error message:", err.message);
    console.error("[Portfolio] Error stack:", err.stack);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};

// Update portfolio (admin only)
const updatePortfolio = async (req, res) => {
  try {
    const updates = req.body;
    let portfolio = await Portfolio.findOne().maxTimeMS(30000);

    if (!portfolio) {
      portfolio = new Portfolio(updates);
    } else {
      // Simple update: only update fields that are being sent
      if (updates.certifications) portfolio.certifications = updates.certifications;
      if (updates.projects) portfolio.projects = updates.projects;
      if (updates.skills) portfolio.skills = updates.skills;
      if (updates.experience) portfolio.experience = updates.experience;
      if (updates.education) portfolio.education = updates.education;
      if (updates.hero) portfolio.hero = updates.hero;
      if (updates.about) portfolio.about = updates.about;
      if (updates.journey) portfolio.journey = updates.journey;
      if (updates.skillsProgression) portfolio.skillsProgression = updates.skillsProgression;
      
      // Handle contact safely
      if (updates.contact && Array.isArray(updates.contact)) {
        portfolio.contact = updates.contact;
      }
    }

    portfolio.lastUpdated = new Date();
    await portfolio.save();
    console.log("[Update] ✓ Portfolio saved successfully");

    res.json({ message: "Portfolio updated", portfolio });
  } catch (err) {
    console.error("[Update] Validation Error details:", err);
    console.error("[Update] Error message:", err.message);
    if (err.errors) {
      console.error("[Update] Validation errors:", err.errors);
    }
    res.status(500).json({ 
      error: err.message,
      validationErrors: err.errors || null
    });
  }
};

// Update specific section
const updateSection = async (req, res) => {
  try {
    const { section } = req.params;
    const data = req.body;

    let portfolio = await Portfolio.findOne();
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Log to history
    await History.create({
      action: "update",
      section,
      before: portfolio[section],
      after: data[section],
      adminEmail: req.adminEmail,
      description: `Updated ${section}`
    });

    // Update the specific section
    portfolio[section] = data[section];
    portfolio.lastUpdated = new Date();
    await portfolio.save();

    // Send email
    await sendEmailNotification("Updated", section, req.adminEmail);

    res.json({ message: `${section} updated`, portfolio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Handle contact form submission
const sendContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }

    console.log("[Contact] New message from:", name, "(" + email + ")");

    // Save message to database
    const newMessage = await Message.create({
      name,
      email,
      message,
      status: "new"
    });
    console.log("[Contact] ✓ Message saved to DB:", newMessage._id);

    // Send email to portfolio owner
    const mailOptionsToOwner = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `Portfolio Contact from ${name}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr/>
        <p><small>View all messages in your admin dashboard at localhost:3000/admin.html</small></p>
      `
    };

    // Send confirmation email to visitor
    const mailOptionsToVisitor = {
      from: `"Prem Ranjan Portfolio" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: process.env.EMAIL_USER,
      subject: "Thank you for reaching out! 🎉",
      headers: {
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        "Importance": "Normal"
      },
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for contacting me!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${name}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">
            Thank you for reaching out to me. I received your message and will get back to you as soon as possible.
          </p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Your message:</strong></p>
            <p style="margin: 5px 0; font-size: 14px;">${message}</p>
          </div>
          <p style="font-size: 14px; color: #666;">Best regards,<br><strong>Prem Ranjan</strong></p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="font-size: 12px; color: #999;">This is an automated response. If you have any urgent matters, please feel free to reach out directly.</p>
        </div>
      `
    };

    // Send both emails
    try {
      await transporter.sendMail(mailOptionsToOwner);
      console.log("[Contact] ✓ Email sent to admin:", process.env.ADMIN_EMAIL);
    } catch (emailErr) {
      console.warn("[Contact] ⚠️ Warning: Could not send admin email:", emailErr.message);
      console.error("[Contact] Admin email error details:", emailErr);
      // Don't fail the request even if email fails, message is saved in DB
    }

    try {
      await transporter.sendMail(mailOptionsToVisitor);
      console.log("[Contact] ✓ Confirmation email sent to:", email);
    } catch (emailErr) {
      console.error("[Contact] ❌ ERROR: Could not send visitor confirmation email to:", email);
      console.error("[Contact] Visitor email error:", emailErr.message);
      console.error("[Contact] Full error:", emailErr);
      // Don't fail - message is saved in DB and admin received it
    }

    res.json({ 
      message: "Thank you! Your message has been received and saved. We'll get back to you soon!",
      messageId: newMessage._id
    });
  } catch (err) {
    console.error("[Contact] ❌ Error:", err);
    res.status(500).json({ error: "Failed to process message", details: err.message });
  }
};

// Delete portfolio item (admin only)
const deletePortfolioItem = async (req, res) => {
  try {
    const { section, index } = req.params;
    console.log(`[Delete] Deleting item ${index} from section: ${section}`);

    let portfolio = await Portfolio.findOne();
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Handle array sections (projects, experience, certifications, skills)
    if (Array.isArray(portfolio[section])) {
      const idx = parseInt(index);
      if (idx < 0 || idx >= portfolio[section].length) {
        return res.status(400).json({ error: "Invalid item index" });
      }

      const deletedItem = portfolio[section][idx];
      portfolio[section].splice(idx, 1);
      
      // Log to history
      await History.create({
        action: "delete",
        section,
        before: deletedItem,
        after: null,
        adminEmail: req.adminEmail,
        description: `Deleted item from ${section}`
      });

      portfolio.lastUpdated = new Date();
      await portfolio.save();
      console.log(`[Delete] ✓ Item deleted from ${section}`);

      res.json({ message: `Item deleted from ${section}`, portfolio });
    } else {
      return res.status(400).json({ error: `Cannot delete from ${section}` });
    }
  } catch (err) {
    console.error("[Delete] ❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getPortfolio,
  updatePortfolio,
  updateSection,
  sendContactForm,
  deletePortfolioItem
};
