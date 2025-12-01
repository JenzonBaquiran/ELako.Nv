const Customer = require("../models/customer.model");
const MSME = require("../models/msme.model");
const Product = require("../models/product.model");
const { sendStoreActivityEmail } = require("./emailService");

class StoreActivityNotificationService {
  /**
   * Send email notifications to all followers of a store when a new product is added
   */
  static async notifyFollowersOfNewProduct(msmeId, productId) {
    try {
      console.log(
        `📧 Sending new product notifications for MSME ${msmeId}, Product ${productId}`
      );

      // Get store information
      const store = await MSME.findById(msmeId);
      if (!store) {
        console.error("Store not found:", msmeId);
        return;
      }

      // Get product information
      const product = await Product.findById(productId);
      if (!product) {
        console.error("Product not found:", productId);
        return;
      }

      // Get all customers following this store
      const followers = await Customer.find({ following: msmeId });
      console.log(
        `Found ${followers.length} followers for store ${store.businessName}`
      );

      // Send email to each follower
      const emailPromises = followers.map(async (customer) => {
        const activityData = {
          type: "NEW_PRODUCT",
          productName: product.productName,
          price: product.price,
          description: product.description,
          productUrl: "http://localhost:5173/",
        };

        const storeInfo = {
          businessName: store.businessName,
          businessDescription: store.businessDescription,
        };

        return sendStoreActivityEmail(
          customer.email,
          `${customer.firstname} ${customer.lastname}`,
          storeInfo,
          activityData
        );
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      const failed = results.length - successful;

      console.log(
        `📧 New product email notifications sent: ${successful} successful, ${failed} failed`
      );
    } catch (error) {
      console.error("Error sending new product notifications:", error);
    }
  }

  /**
   * Send email notifications to all followers when a product price changes
   */
  static async notifyFollowersOfPriceChange(
    msmeId,
    productId,
    oldPrice,
    newPrice
  ) {
    try {
      console.log(
        `📧 Sending price change notifications for MSME ${msmeId}, Product ${productId}`
      );

      // Get store information
      const store = await MSME.findById(msmeId);
      if (!store) {
        console.error("Store not found:", msmeId);
        return;
      }

      // Get product information
      const product = await Product.findById(productId);
      if (!product) {
        console.error("Product not found:", productId);
        return;
      }

      // Get all customers following this store
      const followers = await Customer.find({ following: msmeId });
      console.log(
        `Found ${followers.length} followers for store ${store.businessName}`
      );

      // Determine if it's a price increase or decrease
      const priceChangeType =
        newPrice > oldPrice ? "PRICE_INCREASE" : "PRICE_DECREASE";

      // Send email to each follower
      const emailPromises = followers.map(async (customer) => {
        const activityData = {
          type: priceChangeType,
          productName: product.productName,
          oldPrice: oldPrice,
          newPrice: newPrice,
          productUrl: "http://localhost:5173/",
        };

        const storeInfo = {
          businessName: store.businessName,
          businessDescription: store.businessDescription,
        };

        return sendStoreActivityEmail(
          customer.email,
          `${customer.firstname} ${customer.lastname}`,
          storeInfo,
          activityData
        );
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      const failed = results.length - successful;

      console.log(
        `📧 Price change email notifications sent: ${successful} successful, ${failed} failed`
      );
    } catch (error) {
      console.error("Error sending price change notifications:", error);
    }
  }

  /**
   * Send email notifications to all followers when a product becomes available again
   */
  static async notifyFollowersOfProductAvailability(msmeId, productId) {
    try {
      console.log(
        `📧 Sending product availability notifications for MSME ${msmeId}, Product ${productId}`
      );

      // Get store information
      const store = await MSME.findById(msmeId);
      if (!store) {
        console.error("Store not found:", msmeId);
        return;
      }

      // Get product information
      const product = await Product.findById(productId);
      if (!product) {
        console.error("Product not found:", productId);
        return;
      }

      // Get all customers following this store
      const followers = await Customer.find({ following: msmeId });
      console.log(
        `Found ${followers.length} followers for store ${store.businessName}`
      );

      // Send email to each follower
      const emailPromises = followers.map(async (customer) => {
        const activityData = {
          type: "PRODUCT_AVAILABLE",
          productName: product.productName,
          price: product.price,
          productUrl: "http://localhost:5173/",
        };

        const storeInfo = {
          businessName: store.businessName,
          businessDescription: store.businessDescription,
        };

        return sendStoreActivityEmail(
          customer.email,
          `${customer.firstname} ${customer.lastname}`,
          storeInfo,
          activityData
        );
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      const failed = results.length - successful;

      console.log(
        `📧 Product availability email notifications sent: ${successful} successful, ${failed} failed`
      );
    } catch (error) {
      console.error("Error sending product availability notifications:", error);
    }
  }

  /**
   * Send email notifications to all followers when a new blog post is published
   */
  static async notifyFollowersOfNewBlogPost(msmeId, blogPostId, blogPostData) {
    try {
      console.log(
        `📧 Sending new blog post notifications for MSME ${msmeId}, Blog Post ${blogPostId}`
      );

      // Get store information
      const store = await MSME.findById(msmeId);
      if (!store) {
        console.error("Store not found:", msmeId);
        return;
      }

      // Get all customers following this store
      const followers = await Customer.find({ following: msmeId });
      console.log(
        `Found ${followers.length} followers for store ${store.businessName}`
      );

      // Send email to each follower
      const emailPromises = followers.map(async (customer) => {
        const activityData = {
          type: "NEW_BLOG_POST",
          title: blogPostData.title,
          subtitle: blogPostData.subtitle,
          description: blogPostData.description,
          category: blogPostData.category,
          blogUrl: "http://localhost:5173/",
        };

        const storeInfo = {
          businessName: store.businessName,
          businessDescription: store.businessDescription,
        };

        return sendStoreActivityEmail(
          customer.email,
          `${customer.firstname} ${customer.lastname}`,
          storeInfo,
          activityData
        );
      });

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      const failed = results.length - successful;

      console.log(
        `📧 New blog post email notifications sent: ${successful} successful, ${failed} failed`
      );
    } catch (error) {
      console.error("Error sending new blog post notifications:", error);
    }
  }
}

module.exports = StoreActivityNotificationService;
