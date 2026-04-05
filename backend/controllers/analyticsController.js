const Analytics = require("../models/Analytics");

// Track page visits
exports.trackEvent = async (req, res) => {
  try {
    // Handle both JSON and beacon data
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { type, projectId, projectTitle } = body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers['referer'];

    const analytics = new Analytics({
      type: type || "page_view",
      projectId,
      projectTitle,
      ip,
      userAgent,
      referrer,
    });

    await analytics.save();
    res.json({ success: true, message: "Event tracked" });
  } catch (err) {
    console.error("❌ Analytics tracking error:", err);
    // Send OK response even on error (for beacon compatibility)
    res.status(200).json({ success: false });
  }
};

// Get analytics dashboard data
exports.getAnalytics = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Total page views (last 7 days)
    const pageViews = await Analytics.countDocuments({
      type: "page_view",
      timestamp: { $gte: sevenDaysAgo },
    });

    // Project views breakdown
    const projectViews = await Analytics.aggregate([
      {
        $match: {
          type: "project_view",
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: "$projectTitle",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Total contacts
    const contacts = await Analytics.countDocuments({
      type: "contact_form",
      timestamp: { $gte: sevenDaysAgo },
    });

    // Unique visitors (by IP)
    const uniqueVisitors = await Analytics.distinct("ip", {
      timestamp: { $gte: sevenDaysAgo },
    });

    // Daily stats (last 7 days)
    const dailyStats = await Analytics.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalPageViews: pageViews,
        uniqueVisitors: uniqueVisitors.length,
        contactSubmissions: contacts,
        topProjects: projectViews,
        dailyStats: dailyStats,
        period: "Last 7 days",
      },
    });
  } catch (err) {
    console.error("❌ Analytics retrieval error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Get all time analytics
exports.getAllTimeAnalytics = async (req, res) => {
  try {
    const totalPageViews = await Analytics.countDocuments({ type: "page_view" });
    const totalProjectViews = await Analytics.countDocuments({
      type: "project_view",
    });
    const totalContacts = await Analytics.countDocuments({
      type: "contact_form",
    });
    const uniqueVisitors = await Analytics.distinct("ip");

    // Most viewed projects
    const topProjects = await Analytics.aggregate([
      { $match: { type: "project_view" } },
      {
        $group: {
          _id: "$projectTitle",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      stats: {
        totalPageViews,
        totalProjectViews,
        uniqueVisitors: uniqueVisitors.length,
        totalContacts,
        topProjects,
        period: "All time",
      },
    });
  } catch (err) {
    console.error("❌ Analytics retrieval error:", err);
    res.status(500).json({ error: err.message });
  }
};
