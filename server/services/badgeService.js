const StoreBadge = require("../models/storeBadge.model");
const CustomerNotification = require("../models/customerNotification.model");
const MSME = require("../models/msme.model");
const Product = require("../models/product.model");
const MSMEBlogPost = require("../models/msmeBlogPost.model");
const PageView = require("../models/pageview.model");

class BadgeService {
  // Store Badge Calculation Methods
  async calculateStoreBadge(storeId) {
    try {
      // Get or create current week's badge
      let badge = await StoreBadge.findOne({
        storeId: storeId,
        weekStart: { $lte: new Date() },
        weekEnd: { $gte: new Date() },
      });

      if (!badge) {
        badge = await StoreBadge.createWeeklyBadge(storeId);
      }

      // Calculate store rating
      const store = await MSME.findById(storeId);
      if (store && store.averageRating) {
        badge.criteria.storeRating.current = store.averageRating;
        badge.criteria.storeRating.met = store.averageRating >= 4.5;
      }

      // Calculate product ratings average
      const products = await Product.find({ msmeId: storeId });
      if (products.length > 0) {
        let totalRating = 0;
        let ratedProductsCount = 0;

        products.forEach((product) => {
          if (product.rating && product.rating > 0) {
            totalRating += product.rating;
            ratedProductsCount++;
          }
        });

        const avgRating =
          ratedProductsCount > 0 ? totalRating / ratedProductsCount : 0;
        badge.criteria.productRatings.current = avgRating;
        badge.criteria.productRatings.met = avgRating >= 4.0; // Slightly lower threshold
      }

      // Calculate profile views for current week
      const profileViews = await PageView.countDocuments({
        storeId: storeId,
        viewDate: {
          $gte: badge.weekStart,
          $lte: badge.weekEnd,
        },
      });
      badge.criteria.profileViews.current = profileViews;
      badge.criteria.profileViews.met = profileViews >= 25; // Updated threshold

      // Blog engagement removed - not required for badges

      // Check if all criteria are met
      badge.checkCriteria();

      await badge.save();
      return badge;
    } catch (error) {
      console.error("Error calculating store badge:", error);
      throw error;
    }
  }

  // Get active badges
  async getActiveStoreBadge(storeId) {
    return await StoreBadge.getActiveBadge(storeId);
  }

  // Check and award badges for all users (can be run as a cron job)
  async processAllBadges() {
    try {
      console.log("Starting badge processing for all users...");

      // Process all stores
      const stores = await MSME.find({ status: "approved" });
      for (const store of stores) {
        await this.calculateStoreBadge(store._id);
      }

      console.log("Badge processing completed");
    } catch (error) {
      console.error("Error processing badges:", error);
    }
  }

  // Clean up expired badges
  async cleanupExpiredBadges() {
    try {
      const now = new Date();

      // Deactivate expired store badges
      await StoreBadge.updateMany(
        {
          isActive: true,
          expiresAt: { $lt: now },
        },
        {
          isActive: false,
        }
      );

      console.log("Expired badges cleaned up");
    } catch (error) {
      console.error("Error cleaning up expired badges:", error);
    }
  }

  // Mark celebration as shown
  async markCelebrationShown(badgeType, badgeId) {
    try {
      if (badgeType === "store") {
        await StoreBadge.findByIdAndUpdate(badgeId, { celebrationShown: true });
      }
    } catch (error) {
      console.error("Error marking celebration as shown:", error);
    }
  }

  // Manually award a Top Store badge to a specific store
  async manuallyAwardStoreBadge(storeId) {
    try {
      // Check if store exists
      const store = await MSME.findById(storeId);
      if (!store) {
        throw new Error("Store not found");
      }

      // Check if store already has an active badge for current week
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      let existingBadge = await StoreBadge.findOne({
        storeId: storeId,
        weekStart: { $lte: now },
        weekEnd: { $gte: now },
        isActive: true,
        expiresAt: { $gt: now },
      });

      if (existingBadge) {
        return {
          success: false,
          message: "Store already has an active badge for this week",
        };
      }

      // Create or update badge for current week
      let badge = await StoreBadge.findOne({
        storeId: storeId,
        weekStart: { $lte: now },
        weekEnd: { $gte: now },
      });

      if (!badge) {
        badge = await StoreBadge.createWeeklyBadge(storeId);
      }

      // Manually set badge as active and qualified
      badge.isActive = true;
      badge.manuallyAwarded = true;
      badge.awardedAt = new Date();

      // Set all criteria as met for manually awarded badges
      badge.criteria.storeRating.met = true;
      badge.criteria.productRatings.met = true;
      badge.criteria.profileViews.met = true;

      await badge.save();

      console.log(
        `🏆 Manually awarded Top Store badge to ${store.businessName}`
      );

      return {
        success: true,
        message: "Badge awarded successfully",
        badge: badge,
      };
    } catch (error) {
      console.error("Error manually awarding store badge:", error);
      throw error;
    }
  }
}

module.exports = new BadgeService();
