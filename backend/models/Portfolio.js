const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema({
  hero: {
    name: String,
    role: String,
    summary: String,
    tag: String,
    resumeUrl: String,
    profileImage: String,
    stats: [String]
  },
  about: String,
  skills: [mongoose.Schema.Types.Mixed], // Accept both strings and objects for backward compatibility
  projects: [
    {
      title: String,
      summary: String,
      tech: [String],
      imageUrl: String,
      live: String,
      code: String,
      visible: { type: Boolean, default: true },
      _id: false
    }
  ],
  experience: [
    {
      title: String,
      org: String,
      period: String,
      details: String,
      workUrl: String,
      visible: { type: Boolean, default: true },
      _id: false
    }
  ],
  certifications: [
    {
      name: String,
      imageUrl: String,
      link: String,
      _id: false
    }
  ],
  education: [
    {
      type: {
        type: String,
        enum: ["primary", "higher"],
        default: "primary"
      },
      degree: String,
      college: String,
      duration: String,
      cgpaType: String, // "cgpa" or "percentage"
      cgpaValue: String,
      url: String,
      _id: false
    }
  ],
  journey: [
    {
      year: Number,
      month: String,
      title: String,
      category: String, // "milestone", "learning", "achievement", "project"
      description: String,
      icon: String, // emoji or icon name
      details: String,
      color: String, // hex color for the milestone dot
      url: String,
      _id: false
    }
  ],
  skillsProgression: [
    {
      skill: String,
      startDate: String, // "2023-01" format
      proficiency: Number, // 0-100
      category: String // "frontend", "backend", "ai/ml", "tools", etc.
    }
  ],
  contact: [
    {
      label: String,
      value: String,
      contactType: String // "email", "phone", "location", "custom"  (renamed from 'type' to avoid Mongo reserved keyword)
    }
  ],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Portfolio", portfolioSchema);
