const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  action: String,           // ADD_CERTIFICATION, EDIT_CERTIFICATION, DELETE_CERTIFICATION, etc.
  section: String,          // certifications, projects, education, experience
  title: String,            // What was added/edited (cert name, project title, etc.)
  before: mongoose.Schema.Types.Mixed,
  after: mongoose.Schema.Types.Mixed,
  adminEmail: String,
  description: String,
  
  // Files attached to this action
  attachedFiles: [
    {
      fileName: String,
      fileType: String,           // image, pdf, document
      mimeType: String,           // image/jpeg, application/pdf, etc.
      fileData: String,           // base64 encoded file data
      purpose: String,            // certificate, screenshot, proof, evidence
      fileSize: Number,           // size in bytes
      uploadedAt: Date
    }
  ],
  
  metaData: {
    itemId: String,          // ID of the item being modified
    ipAddress: String,
    userAgent: String,
    duration: Number         // time taken for action
  }
});

module.exports = mongoose.model("History", historySchema);
