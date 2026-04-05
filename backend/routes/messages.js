const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Message = require("../models/Message");

const router = express.Router();

// Get all messages (admin only)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a message (admin only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json({ message: "Message deleted", data: message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update message status (admin only)
router.patch("/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json({ message: "Status updated", data: message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
