const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const File = require("../models/File");
const fileController = require("../controllers/fileController");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload file (admin only)
router.post("/upload", authMiddleware, async (req, res) => {
  try {
    const { section, filename, fileData, fileType } = req.body;

    if (!section || !filename || !fileData || !fileType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, "base64");
    const filePath = path.join(uploadsDir, `${Date.now()}-${filename}`);
    
    // Save file
    fs.writeFileSync(filePath, buffer);

    // Save metadata to database
    const file = await File.create({
      originalName: filename,
      storedName: path.basename(filePath),
      section,
      fileType,
      size: buffer.length,
      uploadedBy: req.adminEmail,
      uploadedAt: new Date()
    });

    res.json({
      message: "File uploaded successfully",
      file: {
        id: file._id,
        name: file.originalName,
        size: file.size,
        type: file.fileType,
        section: file.section,
        url: `/api/files/download/${file._id}`
      }
    });
  } catch (err) {
    console.error("[Upload] Error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// Get files by section
router.get("/section/:section", authMiddleware, async (req, res) => {
  try {
    const { section } = req.params;
    const files = await File.find({ section })
      .select("-storedName")
      .sort({ uploadedAt: -1 });

    res.json(files);
  } catch (err) {
    console.error("[GetFiles] Error:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Download file
router.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(uploadsDir, file.storedName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    // Update download count
    await File.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });

    res.download(filePath, file.originalName);
  } catch (err) {
    console.error("[Download] Error:", err);
    res.status(500).json({ error: "Download failed" });
  }
});

// Delete file (admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete from filesystem
    const filePath = path.join(uploadsDir, file.storedName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await File.findByIdAndDelete(req.params.id);

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("[Delete] Error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// View file (preview)
router.get("/view/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(uploadsDir, file.storedName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    // Set appropriate headers for different file types
    const fileExtension = path.extname(file.originalName).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(fileExtension)) {
      res.type(`image/${fileExtension.slice(1)}`);
    } else if (fileExtension === ".pdf") {
      res.type("application/pdf");
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error("[View] Error:", err);
    res.status(500).json({ error: "View failed" });
  }
});

// Get file statistics
router.get("/stats", fileController.getFileStats);

// Get all files with metadata
router.get("/all", authMiddleware, fileController.getAllFiles);

// Get file info
router.get("/info/:id", fileController.getFileInfo);

// Link file to history
router.post("/link", authMiddleware, fileController.linkFileToHistory);

// Cleanup unused files (admin only)
router.post("/cleanup", authMiddleware, fileController.cleanupUnusedFiles);

module.exports = router;
