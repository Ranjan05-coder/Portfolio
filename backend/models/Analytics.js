const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["page_view", "project_view", "contact_form", "file_download"],
      required: true,
    },
    referrer: String,
    userAgent: String,
    ip: String,
    projectId: String,
    projectTitle: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
analyticsSchema.index({ type: 1, timestamp: -1 });
analyticsSchema.index({ projectId: 1, timestamp: -1 });

module.exports = mongoose.model("Analytics", analyticsSchema);
