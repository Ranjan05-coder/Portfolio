const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  storedName: {
    type: String,
    required: true,
    unique: true
  },
  section: {
    type: String,
    enum: ["portfolio", "history", "education", "certificates"],
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ["image", "pdf", "document"]
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  downloads: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("File", fileSchema);
