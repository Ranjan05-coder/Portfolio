const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { trackEvent, getAnalytics, getAllTimeAnalytics } = require("../controllers/analyticsController");

const router = express.Router();

// Track analytics event (public - no auth needed)
router.post("/track", trackEvent);

// Get 7-day analytics (admin only)
router.get("/dashboard", authMiddleware, getAnalytics);

// Get all-time analytics (admin only)
router.get("/all-time", authMiddleware, getAllTimeAnalytics);

module.exports = router;
