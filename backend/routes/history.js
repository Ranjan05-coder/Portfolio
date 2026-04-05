const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getHistory,
  getSectionHistory,
  rollback,
  deleteHistory
} = require("../controllers/historyController");

const router = express.Router();

// Admin only enforced on all history endpoints
router.get("/", authMiddleware, getHistory);
router.get("/section/:section", authMiddleware, getSectionHistory);
router.post("/rollback/:historyId", authMiddleware, rollback);
router.delete("/:historyId", authMiddleware, deleteHistory);

module.exports = router;
