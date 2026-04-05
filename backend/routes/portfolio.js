const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getPortfolio,
  updatePortfolio,
  updateSection,
  sendContactForm,
  deletePortfolioItem
} = require("../controllers/portfolioController");

const router = express.Router();

// Public endpoints
router.get("/", getPortfolio);
router.post("/contact", sendContactForm);

// Admin only endpoints
router.post("/update", authMiddleware, updatePortfolio);
router.post("/section/:section", authMiddleware, updateSection);
router.delete("/:section/:index", authMiddleware, deletePortfolioItem);

module.exports = router;
