const File = require("../models/File");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../uploads");

// Get file statistics
exports.getFileStats = async (req, res) => {
  try {
    const stats = await File.aggregate([
      {
        $group: {
          _id: "$section",
          count: { $sum: 1 },
          totalSize: { $sum: "$size" },
          totalDownloads: { $sum: "$downloads" }
        }
      }
    ]);

    res.json(stats);
  } catch (err) {
    console.error("[FileStats] Error:", err);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
};

// Get all files with metadata
exports.getAllFiles = async (req, res) => {
  try {
    const files = await File.find()
      .select("-storedName")
      .sort({ uploadedAt: -1 });

    res.json(files);
  } catch (err) {
    console.error("[GetAllFiles] Error:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
};

// Link file to history entry
exports.linkFileToHistory = async (req, res) => {
  try {
    const { fileId, historyId } = req.body;

    // Verify both file and history exist
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Update will be handled by history controller
    res.json({
      message: "File ready to link",
      fileId,
      historyId,
      fileName: file.originalName
    });
  } catch (err) {
    console.error("[LinkFile] Error:", err);
    res.status(500).json({ error: "Failed to link file" });
  }
};

// Clean up unused files (maintenance)
exports.cleanupUnusedFiles = async (req, res) => {
  try {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    // Find files older than 2 weeks with no downloads or references
    const unusedFiles = await File.find({
      uploadedAt: { $lt: twoWeeksAgo },
      downloads: 0
    });

    let deletedCount = 0;
    for (const file of unusedFiles) {
      const filePath = path.join(uploadsDir, file.storedName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await File.findByIdAndDelete(file._id);
      deletedCount++;
    }

    res.json({
      message: "Cleanup completed",
      deletedCount
    });
  } catch (err) {
    console.error("[Cleanup] Error:", err);
    res.status(500).json({ error: "Cleanup failed" });
  }
};

// Get file info
exports.getFileInfo = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.json(file);
  } catch (err) {
    console.error("[FileInfo] Error:", err);
    res.status(500).json({ error: "Failed to fetch file info" });
  }
};
