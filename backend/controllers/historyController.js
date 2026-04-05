const History = require("../models/History");
const Portfolio = require("../models/Portfolio");

// Get full history
const getHistory = async (req, res) => {
  try {
    const history = await History.find()
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get history for specific section
const getSectionHistory = async (req, res) => {
  try {
    const { section } = req.params;
    const history = await History.find({ section })
      .sort({ timestamp: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Rollback to previous version
const rollback = async (req, res) => {
  try {
    const { historyId } = req.params;
    const historyEntry = await History.findById(historyId);

    if (!historyEntry) {
      return res.status(404).json({ error: "History entry not found" });
    }

    const portfolio = await Portfolio.findOne();
    portfolio[historyEntry.section] = historyEntry.before;
    portfolio.lastUpdated = new Date();
    await portfolio.save();

    // Log the rollback action
    await History.create({
      action: "rollback",
      section: historyEntry.section,
      before: historyEntry.after,
      after: historyEntry.before,
      adminEmail: req.adminEmail,
      description: `Rolled back ${historyEntry.section} to previous state`
    });

    res.json({ message: "Rollback successful", portfolio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete history entry
const deleteHistory = async (req, res) => {
  try {
    const { historyId } = req.params;
    
    const historyEntry = await History.findById(historyId);
    if (!historyEntry) {
      return res.status(404).json({ error: "History entry not found" });
    }

    await History.findByIdAndDelete(historyId);
    res.json({ message: "History entry deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getHistory,
  getSectionHistory,
  rollback,
  deleteHistory
};
