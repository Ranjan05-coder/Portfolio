const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const nodemailer = require("nodemailer");

// Setup email service
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Initialize admin user on first run
const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    console.log(`[Admin Setup] Looking for admin with email: ${adminEmail}`);
    
    const adminExists = await Admin.findOne({ email: adminEmail });
    if (adminExists) {
      console.log(`✓ Admin user already exists: ${adminEmail}`);
      return;
    }
    
    console.log(`[Admin Setup] Creating new admin user...`);
    const newAdmin = await Admin.create({
      email: adminEmail,
      password: adminPassword
    });
    console.log(`✓ Admin user created successfully: ${adminEmail}`);
  } catch (err) {
    console.error("❌ Error creating admin user:", err.message);
  }
};

// Admin Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    console.log(`[Login] Attempting login with email: ${email}`);

    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log(`[Login] Admin not found with email: ${email}`);
      return res.status(401).json({ message: "Invalid credentials - admin user not found" });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      console.log(`[Login] Invalid password for email: ${email}`);
      return res.status(401).json({ message: "Invalid credentials - password mismatch" });
    }

    console.log(`[Login] ✓ Login successful for: ${email}`);
    
    const token = jwt.sign({ email: admin.email }, process.env.JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({
      message: "Login successful",
      token,
      email: admin.email
    });
  } catch (err) {
    console.error("[Login] Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Send email notification
const sendEmailNotification = async (action, section, adminEmail) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: `Portfolio Updated: ${section}`,
      html: `
        <h3>Portfolio Change Notification</h3>
        <p><strong>Action:</strong> ${action}</p>
        <p><strong>Section:</strong> ${section}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>Log in to your admin dashboard to see more details.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent to ${adminEmail}`);
  } catch (err) {
    console.error("Email send error:", err);
  }
};

module.exports = { login, createAdminUser, sendEmailNotification };
