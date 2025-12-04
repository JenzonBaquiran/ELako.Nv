const express = require("express");
const router = express.Router();
const BadgeService = require("../services/badgeService");
const StoreBadge = require("../models/storeBadge.model");

// Get active store badge
router.get("/store/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const badge = await BadgeService.getActiveStoreBadge(storeId);

    if (badge) {
      res.json({
        success: true,
        badge: badge,
      });
    } else {
      res.json({
        success: false,
        message: "No active badge found",
      });
    }
  } catch (error) {
    console.error("Error fetching store badge:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch store badge",
    });
  }
});

// Calculate/update store badge
router.post("/store/:storeId/calculate", async (req, res) => {
  try {
    const { storeId } = req.params;
    const badge = await BadgeService.calculateStoreBadge(storeId);

    res.json({
      success: true,
      badge: badge,
      isNewBadge: badge.isActive && !badge.celebrationShown,
    });
  } catch (error) {
    console.error("Error calculating store badge:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate store badge",
    });
  }
});

// Mark celebration as shown
router.post("/celebration-shown", async (req, res) => {
  try {
    const { badgeType, badgeId } = req.body;

    if (!badgeType || !badgeId) {
      return res.status(400).json({
        success: false,
        message: "Badge type and ID are required",
      });
    }

    await BadgeService.markCelebrationShown(badgeType, badgeId);

    res.json({
      success: true,
      message: "Celebration marked as shown",
    });
  } catch (error) {
    console.error("Error marking celebration as shown:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark celebration as shown",
    });
  }
});

// Get all store badges (for admin)
router.get("/admin/stores", async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const badges = await StoreBadge.find(query)
      .populate("storeId", "businessName email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StoreBadge.countDocuments(query);

    res.json({
      success: true,
      badges: badges,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total: total,
    });
  } catch (error) {
    console.error("Error fetching store badges:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch store badges",
    });
  }
});

// Manual badge processing (for admin)
router.post("/admin/process-all", async (req, res) => {
  try {
    await BadgeService.processAllBadges();

    res.json({
      success: true,
      message: "Badge processing completed for all users",
    });
  } catch (error) {
    console.error("Error processing all badges:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process badges",
    });
  }
});

// Clean expired badges (for admin)
router.post("/admin/cleanup-expired", async (req, res) => {
  try {
    await BadgeService.cleanupExpiredBadges();

    res.json({
      success: true,
      message: "Expired badges cleaned up successfully",
    });
  } catch (error) {
    console.error("Error cleaning up expired badges:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clean up expired badges",
    });
  }
});

// Get badge statistics
router.get("/stats", async (req, res) => {
  try {
    const activeStoreBadges = await StoreBadge.countDocuments({
      isActive: true,
    });

    const totalStoreBadges = await StoreBadge.countDocuments();

    // Get this week's new badges
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const thisWeekStoreBadges = await StoreBadge.countDocuments({
      awardedAt: { $gte: weekStart },
    });

    res.json({
      success: true,
      stats: {
        active: {
          stores: activeStoreBadges,
        },
        total: {
          stores: totalStoreBadges,
        },
        thisWeek: {
          stores: thisWeekStoreBadges,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching badge statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch badge statistics",
    });
  }
});

module.exports = router;
