require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const http = require("http");
const socketIo = require("socket.io");
const cron = require("node-cron");

// Import Cloudinary configuration
const {
  cloudinary,
  productUpload,
  certificateUpload,
  blogMediaUpload,
  feedbackPhotosUpload,
  deleteFromCloudinary,
  getOptimizedUrl,
  generateResponsiveImages,
} = require("./config/cloudinary");

// Import Utils
const {
  maskCustomerName,
  maskCustomerFromObject,
  getAvatarLetter,
} = require("./utils/nameUtils");

// Import Models
const Customer = require("./models/customer.model");
const MSME = require("./models/msme.model");
const Admin = require("./models/admin.model");
const AuditLog = require("./models/auditLog.model");
const Product = require("./models/product.model");
const Dashboard = require("./models/dashboard.model");
const PageView = require("./models/pageview.model");
const Notification = require("./models/notification.model");
const CustomerNotification = require("./models/customerNotification.model");
const BlogPost = require("./models/blogPost.model");
const MsmeBlogPost = require("./models/msmeBlogPost.model");
const Message = require("./models/message.model");
const Conversation = require("./models/conversation.model");
const StoreBadge = require("./models/storeBadge.model");

// Import Services
const CustomerNotificationService = require("./services/customerNotificationService");
const {
  generateOTP,
  sendOTPEmail,
  sendWelcomeEmail,
} = require("./services/emailService");
const StoreActivityNotificationService = require("./services/storeActivityNotificationService");
const AuditLogService = require("./services/auditLogService");
const BadgeService = require("./services/badgeService");

const fs = require("fs");

const app = express();
const server = http.createServer(app);

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}
const port = process.env.PORT || 1337;

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Legacy upload alias for backward compatibility - now uses Cloudinary
const upload = blogMediaUpload;

// Certificate uploads now handled by Cloudinary (imported from config/cloudinary.js)

// Feedback photos uploads now handled by Cloudinary (imported from config/cloudinary.js)

// MongoDB Connection
mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb+srv://ElakoNvAdmin:%40Jenzon0108_@elakonv.q7jf9go.mongodb.net/ElakoNv",
  {}
);

mongoose.connection.on("connected", () => {
  console.log("✅ Connected to MongoDB");
});
mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err);
});

// --- Password Strength Validation ---
const isPasswordStrong = (password) => {
  if (!password || password.length < 8) return false;

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Require at least 3 out of 4 criteria for strong password
  const criteriaCount = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
  ].filter(Boolean).length;
  return criteriaCount >= 3;
};

// --- Validation Helpers ---
function validateCustomerInput(data) {
  const errors = [];
  if (!data.firstname || typeof data.firstname !== "string")
    errors.push("First name is required.");
  if (!data.lastname || typeof data.lastname !== "string")
    errors.push("Last name is required.");
  if (!data.username || typeof data.username !== "string")
    errors.push("Username is required.");
  if (!data.email || typeof data.email !== "string")
    errors.push("Email is required.");
  if (!data.contactNumber || typeof data.contactNumber !== "string")
    errors.push("Contact number is required.");
  if (!data.address || typeof data.address !== "string")
    errors.push("Address is required.");
  if (!data.password || typeof data.password !== "string")
    errors.push("Password is required.");
  else if (!isPasswordStrong(data.password))
    errors.push(
      "Password is too weak. Please create a stronger password with at least 8 characters including at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters."
    );
  return errors;
}

function validateMSMEInput(data) {
  const errors = [];
  if (
    !data.clientProfilingNumber ||
    typeof data.clientProfilingNumber !== "string"
  )
    errors.push("Client profiling number is required.");
  if (!data.category || !["food", "artisan"].includes(data.category))
    errors.push("Category must be 'food' or 'artisan'.");
  if (!data.businessName || typeof data.businessName !== "string")
    errors.push("Business name is required.");
  if (!data.username || typeof data.username !== "string")
    errors.push("Username is required.");
  if (!data.email || typeof data.email !== "string")
    errors.push("Email is required.");
  if (!data.password || typeof data.password !== "string")
    errors.push("Password is required.");
  else if (!isPasswordStrong(data.password))
    errors.push(
      "Password is too weak. Please create a stronger password with at least 8 characters including at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters."
    );

  // Validate email format
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid email format.");
    }
  }

  return errors;
}

// --- Customer Routes ---
app.post("/api/customers/register", async (req, res) => {
  const errors = validateCustomerInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    // Generate unique ID
    const id = `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const customer = new Customer({
      ...req.body,
      id,
    });

    await customer.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(customer.email, customer.firstname, "customer");
      console.log(`✅ Welcome email sent to new customer: ${customer.email}`);
    } catch (emailError) {
      console.error(
        `❌ Failed to send welcome email to ${customer.email}:`,
        emailError
      );
      // Continue with registration even if email fails
    }

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: { ...customer.toObject(), password: undefined }, // Don't return password
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/customers", async (req, res) => {
  try {
    const customers = await Customer.find({}, { password: 0 }); // Exclude password
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/customers/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    const customer = await Customer.findOne({ username });
    if (!customer || customer.password !== password) {
      // Plain text comparison
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    res.json({
      success: true,
      user: { ...customer.toObject(), password: undefined },
      userType: "customer",
    });
  } catch (error) {
    console.error("Customer login error:", error);
    res.status(500).json({ success: false, error: "Login error" });
  }
});

// Get customer profile by ID
app.get("/api/customers/:id/profile", async (req, res) => {
  try {
    const customer = await Customer.findOne(
      { id: req.params.id },
      { password: 0 }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Calculate reviews given by the customer
    const customerName = `${customer.firstname} ${customer.lastname}`.trim();

    // Count all feedback/reviews given by this customer across all products
    const reviewCount = await Product.aggregate([
      {
        $match: {
          $or: [
            { "feedback.userId": customer._id.toString() },
            { "feedback.userId": customer.id },
            { "feedback.user": customerName },
          ],
        },
      },
      {
        $unwind: "$feedback",
      },
      {
        $match: {
          $or: [
            { "feedback.userId": customer._id.toString() },
            { "feedback.userId": customer.id },
            { "feedback.user": customerName },
          ],
        },
      },
      {
        $count: "totalReviews",
      },
    ]);

    const reviewsGiven =
      reviewCount.length > 0 ? reviewCount[0].totalReviews : 0;

    // Calculate valid favorite products (only count products that still exist)
    let validFavoriteCount = 0;
    if (customer.favorites && customer.favorites.length > 0) {
      const validFavorites = await Product.find({
        _id: { $in: customer.favorites },
      });
      validFavoriteCount = validFavorites.length;
    }

    // Calculate valid followed stores (only count MSMEs that still exist)
    let validFollowingCount = 0;
    if (customer.following && customer.following.length > 0) {
      const validFollowing = await MSME.find({
        _id: { $in: customer.following },
      });
      validFollowingCount = validFollowing.length;
    }

    // Calculate additional profile statistics
    const stats = {
      reviewsGiven: reviewsGiven,
      followedStores: validFollowingCount,
      favoriteProducts: validFavoriteCount,
      memberSince: customer.createdAt
        ? new Date(customer.createdAt).getFullYear()
        : new Date().getFullYear(),
    };

    res.json({
      success: true,
      profile: {
        id: customer.id,
        username: customer.username,
        fullName: `${customer.firstname} ${customer.lastname}`.trim(),
        firstname: customer.firstname,
        lastname: customer.lastname,
        email: customer.email,
        contactNumber: customer.contactNumber || "",
        address: customer.address || "",
        bio:
          customer.bio || "Love discovering unique products from local MSMEs!",
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        termsAcceptedAt: customer.termsAcceptedAt,
        stats: stats,
      },
    });
  } catch (error) {
    console.error("Error fetching customer profile:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching profile",
    });
  }
});

// Update customer profile (by customer themselves)
app.put("/api/customers/:id/profile", async (req, res) => {
  try {
    const { firstname, lastname, email, contactNumber, address } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email) {
      return res.status(400).json({
        success: false,
        error: "First name, last name, and email are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Check if email is already taken by another customer
    const existingCustomer = await Customer.findOne({
      email: email,
      id: { $ne: req.params.id },
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: "Email is already taken by another customer",
      });
    }

    const updatedCustomer = await Customer.findOneAndUpdate(
      { id: req.params.id },
      {
        firstname,
        lastname,
        email,
        contactNumber: contactNumber || "",
        address: address || "",
        updatedAt: new Date(),
      },
      { new: true, select: "-password" }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        id: updatedCustomer.id,
        username: updatedCustomer.username,
        fullName:
          `${updatedCustomer.firstname} ${updatedCustomer.lastname}`.trim(),
        firstname: updatedCustomer.firstname,
        lastname: updatedCustomer.lastname,
        email: updatedCustomer.email,
        contactNumber: updatedCustomer.contactNumber,
        address: updatedCustomer.address,
        createdAt: updatedCustomer.createdAt,
        updatedAt: updatedCustomer.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating customer profile:", error);
    res.status(500).json({
      success: false,
      error: "Error updating profile",
    });
  }
});

// Change customer password
app.put("/api/customers/:id/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({
        success: false,
        error:
          "Password is too weak. Please create a stronger password with at least 8 characters including at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters.",
      });
    }

    const customer = await Customer.findOne({ id: req.params.id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Verify current password
    if (customer.password !== currentPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Update password
    await Customer.findOneAndUpdate(
      { id: req.params.id },
      {
        password: newPassword,
        updatedAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing customer password:", error);
    res.status(500).json({
      success: false,
      error: "Error changing password",
    });
  }
});

// Get customer's favorite products with details
app.get("/api/customers/:id/favorite-products", async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.params.id }).populate({
      path: "favorites",
      populate: {
        path: "msmeId",
        select: "businessName",
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const favoriteProducts = customer.favorites.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image:
        product.images && product.images.length > 0 ? product.images[0] : null,
      businessName: product.msmeId ? product.msmeId.businessName : "Unknown",
      addedAt: product.createdAt,
    }));

    res.json({
      success: true,
      favoriteProducts: favoriteProducts,
      total: favoriteProducts.length,
    });
  } catch (error) {
    console.error("Error fetching favorite products:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching favorite products",
    });
  }
});

// Get customer's followed stores with details
app.get("/api/customers/:id/followed-stores", async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.params.id }).populate({
      path: "following",
      select: "id businessName category address contactNumber createdAt",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const followedStores = customer.following.map((msme) => ({
      id: msme.id,
      businessName: msme.businessName,
      category: msme.category,
      address: msme.address,
      contactNumber: msme.contactNumber,
      followedAt: msme.createdAt,
    }));

    res.json({
      success: true,
      followedStores: followedStores,
      total: followedStores.length,
    });
  } catch (error) {
    console.error("Error fetching followed stores:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching followed stores",
    });
  }
});

// Get customer's review statistics
app.get("/api/customers/:id/review-stats", async (req, res) => {
  try {
    const customer = await Customer.findOne({ id: req.params.id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const customerName = `${customer.firstname} ${customer.lastname}`.trim();

    // Get detailed review statistics
    const reviewStats = await Product.aggregate([
      {
        $match: {
          $or: [
            { "feedback.userId": customer._id.toString() },
            { "feedback.userId": customer.id },
            { "feedback.user": customerName },
          ],
        },
      },
      {
        $unwind: "$feedback",
      },
      {
        $match: {
          $or: [
            { "feedback.userId": customer._id.toString() },
            { "feedback.userId": customer.id },
            { "feedback.user": customerName },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$feedback.rating" },
          ratingDistribution: {
            $push: "$feedback.rating",
          },
          latestReview: { $max: "$feedback.createdAt" },
        },
      },
    ]);

    const stats =
      reviewStats.length > 0
        ? {
            totalReviews: reviewStats[0].totalReviews,
            averageRating: Math.round(reviewStats[0].averageRating * 10) / 10,
            latestReview: reviewStats[0].latestReview,
            ratingDistribution: {
              1: reviewStats[0].ratingDistribution.filter((r) => r === 1)
                .length,
              2: reviewStats[0].ratingDistribution.filter((r) => r === 2)
                .length,
              3: reviewStats[0].ratingDistribution.filter((r) => r === 3)
                .length,
              4: reviewStats[0].ratingDistribution.filter((r) => r === 4)
                .length,
              5: reviewStats[0].ratingDistribution.filter((r) => r === 5)
                .length,
            },
          }
        : {
            totalReviews: 0,
            averageRating: 0,
            latestReview: null,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          };

    res.json({
      success: true,
      reviewStats: stats,
    });
  } catch (error) {
    console.error("Error fetching review statistics:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching review statistics",
    });
  }
});

// --- MSME Routes ---
app.post(
  "/api/msme/register",
  (req, res, next) => {
    certificateUpload.fields([
      { name: "mayorsPermit", maxCount: 1 },
      { name: "bir", maxCount: 1 },
      { name: "dti", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        if (err.message && err.message.includes("Invalid file type")) {
          return res.status(400).json({
            error: err.message,
          });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "File size too large. Maximum file size allowed is 10MB.",
          });
        }
        return res.status(400).json({
          error: "File upload error: " + err.message,
        });
      }
      next();
    });
  },
  async (req, res) => {
    const errors = validateMSMEInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      // Check if email is already taken
      const existingEmailMsme = await MSME.findOne({ email: req.body.email });
      if (existingEmailMsme) {
        return res.status(400).json({
          error:
            "Email is already registered. Please use a different email address.",
        });
      }

      // Check if username is already taken
      const existingUsernameMsme = await MSME.findOne({
        username: req.body.username,
      });
      if (existingUsernameMsme) {
        return res.status(400).json({
          error:
            "Username is already taken. Please choose a different username.",
        });
      }

      // Generate unique ID
      const id = `MSME_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      // Process uploaded certificate files (now using Cloudinary URLs)
      const certificates = {
        mayorsPermit: req.files?.mayorsPermit
          ? req.files.mayorsPermit[0].path
          : "",
        bir: req.files?.bir ? req.files.bir[0].path : "",
        dti: req.files?.dti ? req.files.dti[0].path : "",
        tinNumber: req.body.tinNumber || "",
      };

      const msme = new MSME({
        ...req.body,
        password: hashedPassword, // Use hashed password
        id,
        certificates,
      });

      await msme.save();

      // Send welcome email
      try {
        await sendWelcomeEmail(msme.email, msme.businessName, "msme");
        console.log(`✅ Welcome email sent to new MSME: ${msme.email}`);
      } catch (emailError) {
        console.error(
          `❌ Failed to send welcome email to ${msme.email}:`,
          emailError
        );
        // Continue with registration even if email fails
      }

      res.status(201).json({
        success: true,
        message: "MSME registered successfully",
        msme: { ...msme.toObject(), password: undefined },
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({
          error: "Client profiling number, email, or username already exists",
        });
      }
      res.status(400).json({ error: err.message });
    }
  }
);

app.get("/api/msme", async (req, res) => {
  try {
    const msmes = await MSME.find({}, { password: 0 });
    res.json(msmes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to view MSME certificates
app.get("/api/msme/:id/certificates", async (req, res) => {
  try {
    const msme = await MSME.findOne(
      { id: req.params.id },
      { certificates: 1, businessName: 1 }
    );
    if (!msme) {
      return res.status(404).json({ error: "MSME not found" });
    }
    res.json({
      success: true,
      businessName: msme.businessName,
      certificates: msme.certificates,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/msme/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    const msme = await MSME.findOne({ username });
    if (!msme) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Check if password is hashed or plain text
    const isPasswordHashed =
      msme.password.startsWith("$2a$") || msme.password.startsWith("$2b$");
    let isValidPassword = false;

    if (isPasswordHashed) {
      // Use bcrypt for hashed passwords
      isValidPassword = await bcrypt.compare(password, msme.password);
    } else {
      // Direct comparison for plain text passwords
      isValidPassword = password === msme.password;
    }

    if (!isValidPassword) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Check if MSME is visible (can log in)
    if (msme.isVisible === false) {
      return res.status(403).json({
        success: false,
        error:
          "Your account has been temporarily suspended. Please contact support.",
      });
    }

    res.json({
      success: true,
      user: { ...msme.toObject(), password: undefined },
      userType: "msme",
    });
  } catch (error) {
    console.error("MSME login error:", error);
    res.status(500).json({ success: false, error: "Login error" });
  }
});

// Update MSME status (for admin approval)
app.put("/api/msme/:id/status", async (req, res) => {
  const { status } = req.body;

  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const msme = await MSME.findOneAndUpdate(
      { id: req.params.id },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!msme) {
      return res.status(404).json({ error: "MSME not found" });
    }

    res.json({
      success: true,
      msme: { ...msme.toObject(), password: undefined },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get MSME profile by ID
app.get("/api/msme/:id/profile", async (req, res) => {
  try {
    const msme = await MSME.findOne({ id: req.params.id }, { password: 0 });

    if (!msme) {
      return res.status(404).json({
        success: false,
        error: "MSME not found",
      });
    }

    // Get dashboard information for this MSME
    const dashboard = await Dashboard.findOne({ msmeId: msme._id });

    // Get profile views count
    const profileViews = await PageView.countDocuments({ storeId: msme._id });

    // Get followers count
    const followersCount = await Customer.countDocuments({
      following: msme._id,
    });

    // Merge data from MSME model and Dashboard model
    const businessName = dashboard?.businessName || msme.businessName || "";
    const businessDescription =
      dashboard?.description || msme.businessDescription || "";
    const contactNumber = dashboard?.contactNumber || msme.contactNumber || "";
    const address = dashboard?.location || msme.address || "";

    // Calculate profile completeness based on combined data
    const requiredFields = [
      businessName,
      contactNumber,
      address,
      msme.category,
    ];
    const optionalFields = [
      businessDescription,
      msme.operatingHours,
      msme.specialties,
      msme.established,
    ];

    let completedRequired = 0;
    let completedOptional = 0;

    requiredFields.forEach((field) => {
      if (field && field.toString().trim() !== "") {
        completedRequired++;
      }
    });

    optionalFields.forEach((field) => {
      if (
        field &&
        ((Array.isArray(field) && field.length > 0) ||
          (!Array.isArray(field) && field.toString().trim() !== ""))
      ) {
        completedOptional++;
      }
    });

    const profileComplete = Math.round(
      (completedRequired / requiredFields.length) * 70 +
        (completedOptional / optionalFields.length) * 30
    );

    const stats = {
      profileViews: profileViews,
      followers: followersCount,
      rating: dashboard?.rating || msme.averageRating || 0,
      profileComplete: profileComplete,
    };

    res.json({
      success: true,
      profile: {
        id: msme.id,
        businessName: businessName,
        username: msme.username,
        email: msme.email || `${msme.username}@msme.local`, // Email from MSME signup or fallback
        contactNumber: contactNumber,
        address: address,
        businessDescription: businessDescription,
        category: msme.category,
        operatingHours: msme.operatingHours || "",

        specialties: msme.specialties || [],
        established: msme.established || "",
        storeLogo: dashboard?.storeLogo || null,
        createdAt: msme.createdAt,
        updatedAt: msme.updatedAt,
        termsAcceptedAt: msme.termsAcceptedAt,
      },
      stats: stats,
    });
  } catch (error) {
    console.error("Error fetching MSME profile:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching profile",
    });
  }
});

// Update MSME personal information
app.put("/api/msme/:id/profile/personal", async (req, res) => {
  try {
    const { businessName, email, contactNumber, address, businessDescription } =
      req.body;

    // Validate required fields
    if (!businessName) {
      return res.status(400).json({
        success: false,
        error: "Business name is required",
      });
    }

    // Validate email format if provided
    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email format",
        });
      }
    }

    // Find the MSME first
    const msme = await MSME.findOne({ id: req.params.id });
    if (!msme) {
      return res.status(404).json({
        success: false,
        error: "MSME not found",
      });
    }

    // Update MSME model (for email which is stored there)
    const updatedMsme = await MSME.findOneAndUpdate(
      { id: req.params.id },
      {
        email: email || "",
        updatedAt: new Date(),
      },
      { new: true, select: "-password" }
    );

    // Update or create Dashboard model (for business info)
    const dashboardUpdate = {
      businessName,
      contactNumber: contactNumber || "",
      location: address || "",
      description: businessDescription || "",
      updatedAt: new Date(),
    };

    const dashboard = await Dashboard.findOneAndUpdate(
      { msmeId: msme._id },
      dashboardUpdate,
      {
        new: true,
        upsert: true, // Create if doesn't exist
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      message: "Personal information updated successfully",
      profile: {
        businessName: dashboard.businessName,
        email: updatedMsme.email,
        contactNumber: dashboard.contactNumber,
        address: dashboard.location,
        businessDescription: dashboard.description,
      },
    });
  } catch (error) {
    console.error("Error updating MSME personal information:", error);
    res.status(500).json({
      success: false,
      error: "Error updating personal information",
    });
  }
});

// Update MSME business information
app.put("/api/msme/:id/profile/business", async (req, res) => {
  try {
    const { category, established, operatingHours, specialties } = req.body;

    // Validate category if provided
    if (category && !["food", "artisan"].includes(category)) {
      return res.status(400).json({
        success: false,
        error: "Category must be 'food' or 'artisan'",
      });
    }

    // Find the MSME first
    const msme = await MSME.findOne({ id: req.params.id });
    if (!msme) {
      return res.status(404).json({
        success: false,
        error: "MSME not found",
      });
    }

    // Update MSME model (for category, established, operating hours, specialties)
    const updatedMsme = await MSME.findOneAndUpdate(
      { id: req.params.id },
      {
        category: category || msme.category,
        established: established || "",
        operatingHours: operatingHours || "",
        specialties: Array.isArray(specialties) ? specialties : [],
        updatedAt: new Date(),
      },
      { new: true, select: "-password" }
    );

    // Update Dashboard model
    const dashboard = await Dashboard.findOneAndUpdate(
      { msmeId: msme._id },
      {
        updatedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      message: "Business information updated successfully",
      profile: {
        category: updatedMsme.category,
        established: updatedMsme.established,
        operatingHours: updatedMsme.operatingHours,

        specialties: updatedMsme.specialties,
      },
    });
  } catch (error) {
    console.error("Error updating MSME business information:", error);
    res.status(500).json({
      success: false,
      error: "Error updating business information",
    });
  }
});

// --- Admin Routes ---
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    await AuditLogService.logFailedLogin(
      username,
      req,
      "Missing username or password"
    );
    return res
      .status(400)
      .json({ error: "Username and password are required." });
  }

  try {
    // First check hardcoded admin credentials (for backward compatibility)
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "admin123";

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const adminData = {
        id: "admin",
        username: ADMIN_USERNAME,
        firstname: "Super",
        lastname: "Admin",
      };

      // Log successful login
      await AuditLogService.logLogin(adminData, req);

      res.json({
        success: true,
        user: {
          id: "admin",
          username: ADMIN_USERNAME,
          firstname: "Super",
          lastname: "Admin",
          userType: "admin",
        },
        userType: "admin",
      });
      return;
    }

    // Check database for created admins
    const admin = await Admin.findOne({ username });

    if (!admin) {
      await AuditLogService.logFailedLogin(username, req, "Admin not found");
      return res
        .status(401)
        .json({ success: false, error: "Invalid admin credentials" });
    }

    // Check if admin is active
    if (admin.status !== "active") {
      await AuditLogService.logFailedLogin(
        username,
        req,
        "Admin account not active"
      );
      return res
        .status(401)
        .json({ success: false, error: "Admin account is not active" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      await AuditLogService.logFailedLogin(username, req, "Invalid password");
      return res
        .status(401)
        .json({ success: false, error: "Invalid admin credentials" });
    }

    // Log successful login
    await AuditLogService.logLogin(
      {
        id: admin._id,
        username: admin.username,
        firstname: admin.firstname,
        lastname: admin.lastname,
      },
      req
    );

    // Login successful
    res.json({
      success: true,
      user: {
        id: admin._id,
        username: admin.username,
        firstname: admin.firstname,
        lastname: admin.lastname,
        email: admin.email,
        userType: "admin",
      },
      userType: "admin",
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    await AuditLogService.logFailedLogin(
      username,
      req,
      "Server error during login"
    );
    res.status(500).json({ success: false, error: "Error during admin login" });
  }
});

// Admin logout endpoint
app.post("/api/admin/logout", async (req, res) => {
  try {
    const { adminId, username, firstname, lastname, sessionDuration } =
      req.body;

    if (adminId && username) {
      await AuditLogService.logLogout(
        {
          id: adminId,
          username: username,
          firstname: firstname || "Unknown",
          lastname: lastname || "User",
        },
        req,
        sessionDuration
      );
    }

    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during admin logout:", error);
    res.json({ success: true, message: "Logged out successfully" }); // Still return success even if logging fails
  }
});

// Get audit logs (admin only)
app.get("/api/admin/audit-logs", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      adminId,
      adminUsername,
      action,
      status,
      startDate,
      endDate,
    } = req.query;

    const result = await AuditLogService.getLogs(
      {
        adminId,
        adminUsername,
        action,
        status,
        startDate,
        endDate,
      },
      {
        page: parseInt(page),
        limit: parseInt(limit),
      }
    );

    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res
      .status(500)
      .json({ success: false, error: "Error fetching audit logs" });
  }
});

// Get audit log statistics (admin only)
app.get("/api/admin/audit-logs/statistics", async (req, res) => {
  try {
    const { timeframe = "30d" } = req.query;
    const stats = await AuditLogService.getStatistics(timeframe);

    res.json({
      success: true,
      data: stats,
      timeframe,
    });
  } catch (error) {
    console.error("Error fetching audit statistics:", error);
    res
      .status(500)
      .json({ success: false, error: "Error fetching audit statistics" });
  }
});

// Get all users (admin only)
app.get("/api/admin/users", async (req, res) => {
  try {
    const customers = await Customer.find({}, { password: 0 });
    const msmeData = await MSME.find({}, { password: 0 });

    // Enhance MSME data with Dashboard information (contact number, etc.)
    const msmes = await Promise.all(
      msmeData.map(async (msme) => {
        try {
          // Get dashboard data for this MSME
          const dashboard = await Dashboard.findOne({ msmeId: msme._id });

          return {
            ...msme.toObject(),
            // Use Dashboard contact number if available, otherwise use MSME contact number
            contactNumber: dashboard?.contactNumber || msme.contactNumber || "",
            // Also include other dashboard data that might be useful
            businessName: dashboard?.businessName || msme.businessName,
            address: dashboard?.location || msme.address || "",
          };
        } catch (error) {
          console.error(
            `Error fetching dashboard for MSME ${msme._id}:`,
            error
          );
          // Return original MSME data if dashboard fetch fails
          return msme.toObject();
        }
      })
    );

    res.json({
      customers,
      msmes,
      total: customers.length + msmes.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get admin dashboard statistics
app.get("/api/admin/dashboard-stats", async (req, res) => {
  try {
    // Get counts for all user types
    const totalCustomers = await Customer.countDocuments();
    const totalMsmes = await MSME.countDocuments();
    const totalUsers = totalCustomers + totalMsmes;

    // Get active MSMEs (approved and verified)
    const activeMsmes = await MSME.countDocuments({
      status: { $in: ["approved", "verified"] },
    });

    // Get pending approvals (MSMEs with pending status)
    const pendingApprovals = await MSME.countDocuments({
      status: "pending",
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeMsmes,
        customers: totalCustomers,
        pendingApprovals,
      },
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching dashboard statistics",
    });
  }
});

// Get recent activities for admin dashboard
app.get("/api/admin/recent-activities", async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get recent MSME registrations
    const recentMsmes = await MSME.find({
      createdAt: { $gte: oneWeekAgo },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent customer registrations
    const recentCustomers = await Customer.find({
      createdAt: { $gte: oneWeekAgo },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent MSME status updates (approvals)
    const recentApprovals = await MSME.find({
      status: "approved",
      updatedAt: { $gte: oneWeekAgo },
    })
      .sort({ updatedAt: -1 })
      .limit(10);

    // Combine and format activities
    const activities = [];

    // Add MSME registrations
    recentMsmes.forEach((msme) => {
      activities.push({
        type: "msme_registration",
        title: "New MSME Registration",
        email: `${msme.username}@msme.com`,
        businessName: msme.businessName,
        category: msme.category || "General",
        status: msme.status,
        createdAt: msme.createdAt,
        avatar: msme.businessName.charAt(0).toUpperCase(),
      });
    });

    // Add customer registrations
    recentCustomers.forEach((customer) => {
      activities.push({
        type: "customer_registration",
        title: "New Customer Registration",
        email: `${customer.username}@customer.com`,
        name: `${customer.firstname} ${customer.lastname}`,
        status: "active",
        createdAt: customer.createdAt,
        avatar: customer.firstname.charAt(0).toUpperCase(),
      });
    });

    // Add MSME approvals
    recentApprovals.forEach((msme) => {
      activities.push({
        type: "msme_approval",
        title: "MSME Approved",
        email: `${msme.username}@msme.com`,
        businessName: msme.businessName,
        category: msme.category || "General",
        status: "approved",
        createdAt: msme.updatedAt,
        avatar: msme.businessName.charAt(0).toUpperCase(),
        rating: msme.averageRating || 0,
      });
    });

    // Sort all activities by date (newest first) and limit to 20
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedActivities = activities.slice(0, 20);

    res.json({
      success: true,
      activities: limitedActivities,
    });
  } catch (err) {
    console.error("Error fetching recent activities:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching recent activities",
    });
  }
});

// Delete customer account (customer self-delete)
app.delete("/api/customers/:id/delete-account", async (req, res) => {
  try {
    const customerId = req.params.id;

    // Find the customer first
    const customer = await Customer.findOne({ id: customerId });
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const customerObjectId = customer._id;

    // Delete related data
    await Promise.all([
      // Delete messages
      Message.deleteMany({
        $or: [{ senderId: customerObjectId }, { receiverId: customerObjectId }],
      }),

      // Delete conversations
      Conversation.deleteMany({
        participants: customerObjectId,
      }),

      // Delete customer notifications
      CustomerNotification.deleteMany({ customerId: customerObjectId }),

      // Remove customer from MSME followers lists
      MSME.updateMany(
        { followers: customerObjectId },
        { $pull: { followers: customerObjectId } }
      ),

      // Delete audit logs
      AuditLog.deleteMany({
        $or: [{ userId: customerObjectId }, { targetId: customerObjectId }],
      }),
    ]);

    // Finally, delete the customer account
    await Customer.findOneAndDelete({ id: customerId });

    res.json({
      success: true,
      message: "Account and all related data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer account:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting account",
    });
  }
});

// Delete customer (admin only)
app.delete("/api/admin/customers/:id", async (req, res) => {
  try {
    const result = await Customer.findOneAndDelete({ id: req.params.id });
    if (!result) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get single product by productId
app.get("/api/products/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).populate(
      "msmeId",
      "businessName username"
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    // Create a copy of the product to modify feedback
    const productData = product.toObject();

    // Mask customer names in feedback for privacy and filter out 1-star reviews for customer view
    if (productData.feedback && Array.isArray(productData.feedback)) {
      productData.feedback = productData.feedback
        .filter((fb) => fb.rating > 1) // Filter out 1-star reviews for customers
        .map((fb) => ({
          ...fb,
          user: maskCustomerName(fb.user), // Mask the customer name
        }));
    }

    res.json({ success: true, product: productData });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ success: false, error: "Error fetching product" });
  }
});

// Add feedback and rating to product (with optional photo uploads)
app.post(
  "/api/products/:productId/feedback",
  feedbackPhotosUpload.array("photos", 5),
  async (req, res) => {
    try {
      const { rating, comment, user, userId } = req.body;

      // Convert rating to number if it's a string
      const numericRating =
        typeof rating === "string" ? parseInt(rating) : rating;

      if (!numericRating || !comment || !user) {
        return res.status(400).json({
          success: false,
          error: "Rating, comment, and user are required",
        });
      }

      // Validate rating range
      if (numericRating < 1 || numericRating > 5) {
        return res
          .status(400)
          .json({ success: false, error: "Rating must be between 1 and 5" });
      }

      // Validate uploaded photos (additional server-side validation)
      if (req.files && req.files.length > 0) {
        const allowedImageTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/bmp",
          "image/svg+xml",
        ];

        for (let file of req.files) {
          // Validate MIME type
          if (!allowedImageTypes.includes(file.mimetype.toLowerCase())) {
            return res.status(400).json({
              success: false,
              error: `Invalid file type "${file.mimetype}". Only image files are allowed.`,
            });
          }

          // Validate file size
          if (file.size > 5 * 1024 * 1024) {
            return res.status(400).json({
              success: false,
              error: `File "${file.originalname}" is too large. Maximum size is 5MB per photo.`,
            });
          }

          // Validate minimum file size
          if (file.size < 1024) {
            return res.status(400).json({
              success: false,
              error: `File "${file.originalname}" is too small. Please select a valid image file.`,
            });
          }
        }

        // Validate number of files
        if (req.files.length > 5) {
          return res.status(400).json({
            success: false,
            error: "Maximum 5 photos are allowed per review.",
          });
        }
      }

      const product = await Product.findById(req.params.productId);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }

      // Extract variant and size information if provided (parse JSON strings from FormData)
      let selectedVariant = req.body.selectedVariant;
      let selectedSize = req.body.selectedSize;

      // Parse JSON strings if they exist
      if (selectedVariant && typeof selectedVariant === "string") {
        try {
          selectedVariant = JSON.parse(selectedVariant);
        } catch (e) {
          selectedVariant = null;
        }
      }

      if (selectedSize && typeof selectedSize === "string") {
        try {
          selectedSize = JSON.parse(selectedSize);
        } catch (e) {
          selectedSize = null;
        }
      }

      // Add feedback to product
      if (!Array.isArray(product.feedback)) product.feedback = [];

      // Process selectedVariant and selectedSize to match schema
      let processedVariant = null;
      let processedSize = null;

      if (selectedVariant) {
        processedVariant = {
          id: selectedVariant.id || selectedVariant._id,
          name: selectedVariant.name,
        };
      }

      if (selectedSize) {
        processedSize = {
          id: selectedSize.id || selectedSize._id,
          size: selectedSize.size,
          unit: selectedSize.unit,
        };
      }

      // Process uploaded photos (limit to 5) - now using Cloudinary URLs
      const photoFilenames = [];
      if (req.files && req.files.length > 0) {
        // Limit to maximum 5 photos
        const maxPhotos = Math.min(req.files.length, 5);
        for (let i = 0; i < maxPhotos; i++) {
          photoFilenames.push(req.files[i].path); // Cloudinary URL
        }
      }

      const feedbackEntry = {
        user,
        userId: userId || null,
        comment,
        rating: numericRating,
        selectedVariant: processedVariant,
        selectedSize: processedSize,
        photos: photoFilenames, // Add photos array
        createdAt: new Date(),
      };

      product.feedback.push(feedbackEntry);

      // Update average rating
      const ratings = product.feedback.map((fb) => fb.rating);
      product.rating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : null;

      await product.save();
      res.json({ success: true, message: "Feedback submitted successfully" });
    } catch (err) {
      console.error("Error submitting feedback:", err);
      res
        .status(500)
        .json({ success: false, error: "Error submitting feedback" });
    }
  }
);

// Update customer (admin only)
app.put("/api/admin/customers/:id/update", async (req, res) => {
  try {
    const { username, firstname, lastname, email, address, contactNumber } =
      req.body;

    const updatedCustomer = await Customer.findOneAndUpdate(
      { id: req.params.id },
      {
        username,
        firstname,
        lastname,
        email,
        address,
        contactNumber,
        updatedAt: new Date(),
      },
      { new: true, select: "-password" }
    );

    if (!updatedCustomer) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }

    res.json({
      success: true,
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (err) {
    console.error("Error updating customer:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete MSME (admin only)
app.delete("/api/admin/msme/:id", async (req, res) => {
  try {
    const result = await MSME.findOneAndDelete({ id: req.params.id });
    if (!result) {
      return res.status(404).json({ error: "MSME not found" });
    }
    res.json({ success: true, message: "MSME deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update MSME (admin only)
app.put("/api/admin/msme/:id/update", async (req, res) => {
  try {
    const {
      username,
      businessName,
      email,
      category,
      contactNumber,
      clientProfilingNumber,
    } = req.body;

    // Validate and handle email
    let updateFields = {
      username,
      businessName,
      category,
      contactNumber,
      clientProfilingNumber,
      updatedAt: new Date(),
    };

    // Only update email if it's provided and not empty
    if (email !== undefined) {
      if (email.trim() === "") {
        return res.status(400).json({
          success: false,
          error:
            "Email cannot be empty. Please provide a valid email or leave it blank.",
        });
      }

      if (email.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            error: "Invalid email format",
          });
        }

        // Check for duplicate email (excluding current record)
        const existingMSME = await MSME.findOne({
          email: email,
          id: { $ne: req.params.id },
        });

        if (existingMSME) {
          return res.status(400).json({
            success: false,
            error: "Email already exists. Please use a different email.",
          });
        }

        updateFields.email = email;
      }
    }

    const updatedMSME = await MSME.findOneAndUpdate(
      { id: req.params.id },
      updateFields,
      { new: true, select: "-password" }
    );

    if (!updatedMSME) {
      return res.status(404).json({ success: false, error: "MSME not found" });
    }

    // Also update the Dashboard model with the new business name and contact number
    if (businessName || contactNumber) {
      await Dashboard.findOneAndUpdate(
        { msmeId: updatedMSME._id },
        {
          ...(businessName && { businessName }),
          ...(contactNumber && { contactNumber }),
          updatedAt: new Date(),
        },
        {
          new: true,
          upsert: true, // Create if doesn't exist
          setDefaultsOnInsert: true,
        }
      );
    }

    res.json({
      success: true,
      message: "MSME updated successfully",
      msme: updatedMSME,
    });
  } catch (err) {
    console.error("Error updating MSME:", err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get admin profile by ID
app.get("/api/admin/:id/profile", async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id, { password: 0 });

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    res.json({
      success: true,
      profile: {
        id: admin._id,
        username: admin.username,
        firstname: admin.firstname,
        lastname: admin.lastname,
        fullName: `${admin.firstname} ${admin.lastname}`.trim(),
        email: admin.email,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching profile",
    });
  }
});

// --- Admin Management Routes ---
// Create new admin
app.post("/api/admin/create", async (req, res) => {
  try {
    const { username, password, firstname, lastname, email, createdBy } =
      req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }],
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: "Admin with this username or email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      username,
      password: hashedPassword,
      firstname,
      lastname,
      email,
      createdBy,
    });

    await newAdmin.save();

    // Return admin without password
    const adminResponse = {
      id: newAdmin._id,
      username: newAdmin.username,
      firstname: newAdmin.firstname,
      lastname: newAdmin.lastname,
      email: newAdmin.email,
      role: newAdmin.role,
      status: newAdmin.status,
      createdAt: newAdmin.createdAt,
      updatedAt: newAdmin.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: adminResponse,
    });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({
      success: false,
      error: "Error creating admin",
    });
  }
});

// Create new MSME (Admin only)
app.post("/api/admin/msme/create", async (req, res) => {
  try {
    const {
      username,
      password,
      businessName,
      email,
      category,
      address,
      contactNumber,
      clientProfilingNumber,
    } = req.body;

    // Validate required fields
    if (!username || !password || !businessName || !email || !category) {
      return res.status(400).json({
        success: false,
        error:
          "Username, password, business name, email, and category are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Validate category (only food and artisan allowed)
    if (!["food", "artisan"].includes(category)) {
      return res.status(400).json({
        success: false,
        error: "Category must be either 'food' or 'artisan'",
      });
    }

    // Check if MSME already exists by username or email
    const existingMSME = await MSME.findOne({
      $or: [{ username }, { email }],
    });

    if (existingMSME) {
      return res.status(400).json({
        success: false,
        error: "MSME with this username or email already exists",
      });
    }

    // Check if clientProfilingNumber already exists (if provided)
    if (clientProfilingNumber) {
      const existingCPN = await MSME.findOne({ clientProfilingNumber });
      if (existingCPN) {
        return res.status(400).json({
          success: false,
          error: "Client Profiling Number already exists",
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique ID
    const generateId = () => {
      return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    };

    // Create new MSME
    const newMSME = new MSME({
      id: generateId(),
      username,
      password: hashedPassword,
      businessName,
      email,
      category,
      address: address || "",
      contactNumber: contactNumber || "",
      clientProfilingNumber: clientProfilingNumber || "",
      status: "approved", // Auto-approve MSMEs created by admin
    });

    await newMSME.save();

    // Return MSME without password
    const msmeResponse = {
      id: newMSME.id,
      _id: newMSME._id,
      username: newMSME.username,
      businessName: newMSME.businessName,
      email: newMSME.email,
      category: newMSME.category,
      address: newMSME.address,
      contactNumber: newMSME.contactNumber,
      clientProfilingNumber: newMSME.clientProfilingNumber,
      status: newMSME.status,
      createdAt: newMSME.createdAt,
      updatedAt: newMSME.updatedAt,
    };

    res.status(201).json({
      success: true,
      message: "MSME created successfully",
      msme: msmeResponse,
    });
  } catch (err) {
    console.error("Error creating MSME:", err);
    res.status(500).json({
      success: false,
      error: "Error creating MSME",
    });
  }
});

// Get all admins
app.get("/api/admin/admins", async (req, res) => {
  try {
    const admins = await Admin.find({}, { password: 0 });
    res.json({
      success: true,
      admins,
    });
  } catch (err) {
    console.error("Error fetching admins:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching admins",
    });
  }
});

// Update admin status
app.put("/api/admin/admins/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const adminId = req.params.id;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { status },
      { new: true, select: "-password" }
    );

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    res.json({
      success: true,
      message: "Admin status updated successfully",
      admin: updatedAdmin,
    });
  } catch (err) {
    console.error("Error updating admin status:", err);
    res.status(500).json({
      success: false,
      error: "Error updating admin status",
    });
  }
});

// Update admin details
app.put("/api/admin/admins/:id", async (req, res) => {
  try {
    const { username, firstname, lastname, email } = req.body;
    const adminId = req.params.id;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      {
        username,
        firstname,
        lastname,
        email,
        updatedAt: new Date(),
      },
      { new: true, select: "-password" }
    );

    if (!updatedAdmin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    res.json({
      success: true,
      message: "Admin updated successfully",
      admin: updatedAdmin,
    });
  } catch (err) {
    console.error("Error updating admin:", err);
    res.status(500).json({
      success: false,
      error: "Error updating admin",
    });
  }
});

// Change admin password
app.put("/api/admin/:id/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.params.id;

    // Find admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await Admin.findByIdAndUpdate(adminId, {
      password: hashedNewPassword,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({
      success: false,
      error: "Error changing password",
    });
  }
});

// Delete admin account (self-deletion)
app.delete("/api/admin/:id", async (req, res) => {
  try {
    const adminId = req.params.id;

    // Don't allow deletion of hardcoded admin
    if (adminId === "admin") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete the main admin account",
      });
    }

    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting admin account:", err);
    res.status(500).json({
      success: false,
      error: "Error deleting account",
    });
  }
});

// Delete admin (admin management)
app.delete("/api/admin/admins/:id", async (req, res) => {
  try {
    const adminId = req.params.id;

    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    res.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res.status(500).json({
      success: false,
      error: "Error deleting admin",
    });
  }
});

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const { msmeId, category, availability, customerId } = req.query;

    let filter = {};
    if (msmeId) filter.msmeId = msmeId;
    if (category) filter.category = category;
    if (availability) filter.availability = availability === "true";

    const products = await Product.find(filter).populate(
      "msmeId",
      "businessName username"
    );

    // Add favorite status to products
    const productsWithFavoriteStatus = await addFavoriteStatusToProducts(
      products,
      customerId
    );

    // Mask customer names in feedback for privacy and filter out 1-star reviews for customer view
    const maskedProducts = productsWithFavoriteStatus.map((product) => {
      const productData = product.toObject ? product.toObject() : product;
      if (productData.feedback && Array.isArray(productData.feedback)) {
        productData.feedback = productData.feedback
          .filter((fb) => fb.rating > 1) // Filter out 1-star reviews for customers
          .map((fb) => ({
            ...fb,
            user: maskCustomerName(fb.user),
          }));
      }
      return productData;
    });

    res.json({
      success: true,
      products: maskedProducts,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching products",
    });
  }
});

// Get single product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "msmeId",
      "businessName username category averageRating"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Create a copy of the product to modify feedback
    const productData = product.toObject();

    // Mask customer names in feedback for privacy and filter out 1-star reviews for customer view
    if (productData.feedback && Array.isArray(productData.feedback)) {
      productData.feedback = productData.feedback
        .filter((fb) => fb.rating > 1) // Filter out 1-star reviews for customers
        .map((fb) => ({
          ...fb,
          user: maskCustomerName(fb.user), // Mask the customer name
        }));
    }

    res.json({
      success: true,
      product: productData,
    });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching product",
    });
  }
});

/*
// OLD DUPLICATE UPDATE ENDPOINT - DISABLED
// Update product
app.put("/api/products/:id", upload.array("pictures", 10), async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(
      "PUT /api/products/" + productId + " - OLD ENDPOINT WITHOUT ARTISTNAME - Update request received"
    );
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Files received:", req.files ? req.files.length : 0);

    const {
      productName,
      price,
      description,
      availability,
      visible,
      category,
      hashtags,
      variants,
      sizeOptions,
      keepExistingImages,
      existingImages,
    } = req.body;

    // Find existing product
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Parse hashtags if it's a string
    let parsedHashtags = existingProduct.hashtags;
    if (hashtags) {
      try {
        parsedHashtags =
          typeof hashtags === "string" ? JSON.parse(hashtags) : hashtags;
      } catch (e) {
        // Keep existing hashtags if parsing fails
      }
    }

    // Parse variants if it's a string
    let parsedVariants = existingProduct.variants || [];
    if (variants) {
      try {
        parsedVariants =
          typeof variants === "string" ? JSON.parse(variants) : variants;
      } catch (e) {
        parsedVariants = existingProduct.variants || [];
      }
    }

    // Parse size options if it's a string
    let parsedSizeOptions = existingProduct.sizeOptions || [];
    if (sizeOptions) {
      try {
        parsedSizeOptions =
          typeof sizeOptions === "string"
            ? JSON.parse(sizeOptions)
            : sizeOptions;
      } catch (e) {
        parsedSizeOptions = existingProduct.sizeOptions || [];
      }
    }

    // Handle multiple file uploads with existing image removal support
    let pictures = [];
    let singlePicture = null;

    // Parse existing images to keep (sent from frontend)
    let imagesToKeep = [];
    if (existingImages) {
      try {
        imagesToKeep =
          typeof existingImages === "string"
            ? JSON.parse(existingImages)
            : existingImages;
      } catch (e) {
        console.error("Error parsing existingImages:", e);
        imagesToKeep = existingProduct.pictures || [];
      }
    } else {
      // If no existingImages specified, keep all existing images (for backward compatibility)
      imagesToKeep = existingProduct.pictures || [];
    }

    console.log("Existing images to keep:", imagesToKeep);

    // Identify images to delete from filesystem
    const originalImages = existingProduct.pictures || [];
    const imagesToDelete = originalImages.filter(
      (img) => !imagesToKeep.includes(img)
    );

    // Delete removed images from filesystem
    if (imagesToDelete.length > 0) {
      console.log("Images to delete from filesystem:", imagesToDelete);
      imagesToDelete.forEach((imageFilename) => {
        const imagePath = path.join(__dirname, "uploads", imageFilename);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(`Error deleting image file ${imageFilename}:`, err);
          } else {
            console.log(`Successfully deleted image file: ${imageFilename}`);
          }
        });
      });
    }

    // Start with existing images that should be kept
    pictures = [...imagesToKeep];

    // Add newly uploaded images
    if (req.files && req.files.length > 0) {
      const newPictures = req.files.map((file) => file.filename);
      pictures = [...pictures, ...newPictures];
      console.log("Added new images:", newPictures);
    }

    // Update single picture for backward compatibility
    singlePicture = pictures.length > 0 ? pictures[0] : null;

    console.log("Final pictures array:", pictures);

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        productName: productName || existingProduct.productName,
        price: price ? parseFloat(price) : existingProduct.price,
        description: description || existingProduct.description,
        availability:
          availability !== undefined
            ? availability === "true" || availability === true
            : existingProduct.availability,
        visible:
          visible !== undefined
            ? visible === "true" || visible === true
            : existingProduct.visible,
        picture: singlePicture,
        pictures: pictures,
        variants: parsedVariants,
        sizeOptions: parsedSizeOptions,
        hashtags: parsedHashtags,
        category: category !== undefined ? category : existingProduct.category,
        updatedAt: new Date(),
      },
      { new: true }
    );

    // Check for price changes and availability changes to send notifications
    try {
      const oldPrice = existingProduct.price;
      const newPrice = updatedProduct.price;
      const oldAvailability = existingProduct.availability;
      const newAvailability = updatedProduct.availability;

      // Send price change notification if price changed
      if (price && parseFloat(price) !== oldPrice) {
        console.log(
          `Price changed for product ${updatedProduct.productName}: ${oldPrice} -> ${newPrice}`
        );
        await StoreActivityNotificationService.notifyFollowersOfPriceChange(
          updatedProduct.msmeId,
          updatedProduct._id,
          oldPrice,
          newPrice
        );
      }

      // Send availability notification if product became available
      if (!oldAvailability && newAvailability) {
        console.log(
          `Product ${updatedProduct.productName} became available again`
        );
        await StoreActivityNotificationService.notifyFollowersOfProductAvailability(
          updatedProduct.msmeId,
          updatedProduct._id
        );
      }
    } catch (notificationError) {
      console.error(
        "Error sending product update notifications:",
        notificationError
      );
      // Continue with product update response even if notifications fail
    }

    console.log("Product updated successfully:", {
      id: updatedProduct._id,
      name: updatedProduct.productName,
      picturesCount: updatedProduct.pictures?.length || 0,
      variants: updatedProduct.variants?.length || 0,
      sizeOptions: updatedProduct.sizeOptions?.length || 0,
    });

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({
      success: false,
      error: "Error updating product",
    });
  }
});
*/

// Delete product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({
      success: false,
      error: "Error deleting product",
    });
  }
});

// Toggle product visibility
app.put("/api/products/:id/visibility", async (req, res) => {
  try {
    const productId = req.params.id;
    const { visible } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Update visibility
    product.visible = visible !== undefined ? visible : !product.visible;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.visible ? "shown" : "hidden"} successfully`,
      product: product,
    });
  } catch (err) {
    console.error("Error toggling product visibility:", err);
    res.status(500).json({
      success: false,
      error: "Error updating product visibility",
    });
  }
});

// Toggle MSME visibility (controls homepage display and login access)
app.put("/api/admin/msme/:id/visibility", async (req, res) => {
  try {
    const msmeId = req.params.id;
    const { isVisible } = req.body;

    // Try to find by MongoDB _id first, then by custom id field
    let msme = await MSME.findById(msmeId);
    if (!msme) {
      msme = await MSME.findOne({ id: msmeId });
    }

    if (!msme) {
      return res.status(404).json({
        success: false,
        error: "MSME not found",
      });
    }

    // Update visibility
    msme.isVisible = isVisible !== undefined ? isVisible : !msme.isVisible;
    msme.updatedAt = new Date();
    await msme.save();

    res.json({
      success: true,
      message: `MSME ${msme.isVisible ? "shown" : "hidden"} successfully. ${
        msme.isVisible
          ? "They can now log in and appear on homepage."
          : "They cannot log in or appear on homepage."
      }`,
      msme: {
        id: msme.id,
        _id: msme._id,
        businessName: msme.businessName,
        username: msme.username,
        isVisible: msme.isVisible,
        status: msme.status,
      },
    });
  } catch (err) {
    console.error("Error toggling MSME visibility:", err);
    res.status(500).json({
      success: false,
      error: "Error updating MSME visibility",
    });
  }
});

// Get products by MSME ID
app.get("/api/msme/:msmeId/products", async (req, res) => {
  try {
    const { msmeId } = req.params;
    const { category, availability } = req.query;

    let filter = { msmeId };
    if (category && category !== "all") filter.category = category;
    if (availability && availability !== "all")
      filter.availability = availability === "true";

    const products = await Product.find(filter).sort({ createdAt: -1 });

    // Mask customer names in feedback for privacy and filter out 1-star reviews for customer view
    const maskedProducts = products.map((product) => {
      const productData = product.toObject();
      if (productData.feedback && Array.isArray(productData.feedback)) {
        productData.feedback = productData.feedback
          .filter((fb) => fb.rating > 1) // Filter out 1-star reviews for customers
          .map((fb) => ({
            ...fb,
            user: maskCustomerName(fb.user),
          }));
      }
      return productData;
    });

    res.json({
      success: true,
      products: maskedProducts,
    });
  } catch (err) {
    console.error("Error fetching MSME products:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching MSME products",
    });
  }
});

// Get products by MSME ID for store owner (shows ALL reviews including 1-star)
app.get("/api/msme/:msmeId/products/owner", async (req, res) => {
  try {
    const { msmeId } = req.params;
    const { category, availability, visible } = req.query;

    let filter = { msmeId };
    if (category && category !== "all") filter.category = category;
    if (availability && availability !== "all")
      filter.availability = availability === "true";
    if (visible && visible !== "all") filter.isVisible = visible === "true";

    const products = await Product.find(filter).sort({ createdAt: -1 });

    // Mask customer names in feedback for privacy but show ALL reviews (including 1-star)
    const maskedProducts = products.map((product) => {
      const productData = product.toObject();
      if (productData.feedback && Array.isArray(productData.feedback)) {
        productData.feedback = productData.feedback.map((fb) => ({
          ...fb,
          user: maskCustomerName(fb.user),
        }));
      }
      return productData;
    });

    res.json({
      success: true,
      products: maskedProducts,
    });
  } catch (err) {
    console.error("Error fetching MSME products for owner:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching MSME products for owner",
    });
  }
});

// Search products by hashtag
app.get("/api/products/search/hashtag/:hashtag", async (req, res) => {
  try {
    const { hashtag } = req.params;

    const products = await Product.findByHashtag(hashtag).populate(
      "msmeId",
      "businessName username"
    );

    res.json({
      success: true,
      products,
    });
  } catch (err) {
    console.error("Error searching products by hashtag:", err);
    res.status(500).json({
      success: false,
      error: "Error searching products",
    });
  }
});

// Helper function to extract location info from Google Maps embed URL
function extractLocationFromMapsUrl(googleMapsUrl) {
  if (!googleMapsUrl) return [];

  try {
    // Decode URL and extract location names
    const decodedUrl = decodeURIComponent(googleMapsUrl);
    const locations = [];

    // Look for place names in the URL (after !2s or similar patterns)
    const placeMatches = decodedUrl.match(/!2s([^!]+)/g);
    if (placeMatches) {
      placeMatches.forEach((match) => {
        const placeName = match.replace("!2s", "").trim();
        if (placeName && placeName.length > 2) {
          locations.push(placeName);
        }
      });
    }

    // Also look for %20 encoded space-separated words which might be location names
    const urlParts = googleMapsUrl.split(/[!&]/);
    urlParts.forEach((part) => {
      if (part.includes("%20") && part.length > 10) {
        try {
          const decoded = decodeURIComponent(part);
          // Look for patterns that might be location names
          const words = decoded
            .split(/\s+/)
            .filter((word) => word.length > 3 && /^[A-Za-z]/.test(word));
          if (words.length > 0) {
            locations.push(...words);
          }
        } catch (e) {
          // Skip malformed parts
        }
      }
    });

    return [...new Set(locations)]; // Remove duplicates
  } catch (error) {
    console.error("Error extracting location from maps URL:", error);
    return [];
  }
}

// Universal search endpoint for products, stores, and MSMEs
app.get("/api/search", async (req, res) => {
  try {
    const { q: query, type, limit = 10 } = req.query;

    if (!query || query.length < 1) {
      return res.json({
        success: true,
        suggestions: [],
        results: {
          products: [],
          stores: [],
          total: 0,
        },
      });
    }

    const searchLimit = Math.min(parseInt(limit), 20); // Max 20 results
    const results = {
      products: [],
      stores: [],
      total: 0,
    };

    // Search products if type is 'all' or 'products'
    if (!type || type === "all" || type === "products") {
      let products = [];

      // Check if it's a hashtag search
      if (query.startsWith("#")) {
        const hashtag = query.substring(1).toLowerCase().trim();

        // First, find products with the exact hashtag
        products = await Product.find({
          $and: [
            { visible: true },
            { availability: true },
            { hashtags: hashtag },
          ],
        })
          .populate("msmeId", "businessName username category")
          .sort({ createdAt: -1 });

        // If we have products with this hashtag, get all hashtags from these products
        if (products.length > 0) {
          const allHashtags = [...new Set(products.flatMap((p) => p.hashtags))];

          // Find all products that share any of these hashtags (variations)
          products = await Product.find({
            $and: [
              { visible: true },
              { availability: true },
              { hashtags: { $in: allHashtags } },
            ],
          })
            .populate("msmeId", "businessName username category")
            .sort({ createdAt: -1 });
        }
      } else {
        // Regular search
        const productSearchRegex = new RegExp(query, "i");

        // First, check if the query might be a municipality name by searching MSMEs and their dashboard locations
        const municipalityMSMEs = await MSME.find({
          $and: [
            { status: "approved" },
            {
              $or: [
                { municipality: productSearchRegex },
                { address: productSearchRegex },
              ],
            },
          ],
        }).select("_id");

        // Also search in Dashboard locations (embedded map data)
        const dashboardsWithLocation = await Dashboard.find({
          location: productSearchRegex,
        }).select("msmeId");

        // Search in embedded Google Maps URLs for additional location matches
        const allDashboards = await Dashboard.find({
          googleMapsUrl: { $exists: true, $ne: "" },
        }).select("msmeId googleMapsUrl");

        const dashboardsWithMapsLocation = allDashboards.filter((dashboard) => {
          const extractedLocations = extractLocationFromMapsUrl(
            dashboard.googleMapsUrl
          );
          return extractedLocations.some((location) =>
            location.toLowerCase().includes(query.toLowerCase())
          );
        });

        // Combine MSME IDs from all searches
        const msmeIdsFromMSME = municipalityMSMEs.map((msme) => msme._id);
        const msmeIdsFromDashboard = dashboardsWithLocation.map(
          (dashboard) => dashboard.msmeId
        );
        const msmeIdsFromMapsUrl = dashboardsWithMapsLocation.map(
          (dashboard) => dashboard.msmeId
        );
        const allMunicipalityMSMEIds = [
          ...new Set([
            ...msmeIdsFromMSME,
            ...msmeIdsFromDashboard,
            ...msmeIdsFromMapsUrl,
          ]),
        ];

        // Search for products - include municipality-based results from both MSME and Dashboard data
        const searchCriteria = {
          $and: [
            { visible: true },
            { availability: true },
            {
              $or: [
                { productName: productSearchRegex },
                { description: productSearchRegex },
                { category: productSearchRegex },
                { hashtags: { $elemMatch: { $regex: productSearchRegex } } },
                // Add variant-based search for flavors and types
                { "variants.name": productSearchRegex },
                // Add size options search
                { "sizeOptions.unit": productSearchRegex },
                // Add artist name search for creative products
                { artistName: productSearchRegex },
                // Add broad category searches
                ...(query.toLowerCase().includes("food")
                  ? [
                      {
                        category: {
                          $in: [
                            "processed-foods",
                            "baked-goods",
                            "confectionery",
                            "beverages",
                          ],
                        },
                      },
                    ]
                  : []),
                ...(query.toLowerCase().includes("clothes") ||
                query.toLowerCase().includes("clothing")
                  ? [
                      {
                        category: {
                          $in: ["apparel", "accessories", "fashion"],
                        },
                      },
                    ]
                  : []),
                ...(query.toLowerCase().includes("creative") ||
                query.toLowerCase().includes("art") ||
                query.toLowerCase().includes("painting")
                  ? [
                      {
                        category: {
                          $in: ["paintings", "artworks", "crafts", "creative"],
                        },
                      },
                    ]
                  : []),
                // Add municipality-based search using both MSME and Dashboard location data
                ...(allMunicipalityMSMEIds.length > 0
                  ? [{ msmeId: { $in: allMunicipalityMSMEIds } }]
                  : []),
              ],
            },
          ],
        };

        products = await Product.find(searchCriteria)
          .populate(
            "msmeId",
            "businessName username category municipality address"
          )
          .limit(searchLimit)
          .sort({ createdAt: -1 });

        // Fetch dashboard data for each product to get embedded map location
        const productsWithDashboard = await Promise.all(
          products.map(async (product) => {
            const dashboard = await Dashboard.findOne({
              msmeId: product.msmeId?._id,
            });

            let enhancedLocation = dashboard?.location || "";

            // If we have a Google Maps URL, extract additional location info
            if (dashboard?.googleMapsUrl && !enhancedLocation) {
              const extractedLocations = extractLocationFromMapsUrl(
                dashboard.googleMapsUrl
              );
              if (extractedLocations.length > 0) {
                enhancedLocation = extractedLocations[0];
              }
            }

            return {
              ...product.toObject(),
              dashboardLocation: enhancedLocation,
              extractedMapLocations: dashboard?.googleMapsUrl
                ? extractLocationFromMapsUrl(dashboard.googleMapsUrl)
                : [],
            };
          })
        );

        products = productsWithDashboard;
      }

      results.products = products.map((product) => ({
        _id: product._id,
        type: "product",
        name: product.productName,
        description: product.description,
        price: product.price,
        imageUrl:
          product.pictures && product.pictures.length > 0
            ? product.pictures[0]
            : null,
        category: product.category,
        variants: product.variants || [],
        sizeOptions: product.sizeOptions || [],
        artistName: product.artistName,
        storeName: product.msmeId?.businessName,
        storeId: product.msmeId?._id,
        storeCategory: product.msmeId?.category,
        storeMunicipality: product.msmeId?.municipality,
        storeLocation: product.msmeId?.address,
        dashboardLocation: product.dashboardLocation || "", // Include embedded map location
        storeRating: product.msmeId?.averageRating || 0,
        storeUsername: product.msmeId?.username,
        rating: product.rating || 0,
        hashtags: product.hashtags,
      }));
    }

    // Search stores/MSMEs if type is 'all' or 'stores' or 'artists'
    if (!type || type === "all" || type === "stores" || type === "artists") {
      const storeSearchRegex = new RegExp(query, "i");

      // Also search in Dashboard locations for stores
      const dashboardsWithLocationForStores = await Dashboard.find({
        location: storeSearchRegex,
      }).select("msmeId");

      // Search in embedded Google Maps URLs for stores
      const allDashboardsForStores = await Dashboard.find({
        googleMapsUrl: { $exists: true, $ne: "" },
      }).select("msmeId googleMapsUrl");

      const dashboardsWithMapsLocationForStores = allDashboardsForStores.filter(
        (dashboard) => {
          const extractedLocations = extractLocationFromMapsUrl(
            dashboard.googleMapsUrl
          );
          return extractedLocations.some((location) =>
            location.toLowerCase().includes(query.toLowerCase())
          );
        }
      );

      const msmeIdsFromDashboardSearch = dashboardsWithLocationForStores.map(
        (dashboard) => dashboard.msmeId
      );
      const msmeIdsFromMapsUrlSearch = dashboardsWithMapsLocationForStores.map(
        (dashboard) => dashboard.msmeId
      );
      const allMsmeIdsFromLocationSearch = [
        ...new Set([
          ...msmeIdsFromDashboardSearch,
          ...msmeIdsFromMapsUrlSearch,
        ]),
      ];

      const stores = await MSME.find({
        $and: [
          { status: "approved" },
          {
            $or: [
              { businessName: storeSearchRegex },
              { username: storeSearchRegex },
              { category: storeSearchRegex },
              { businessDescription: storeSearchRegex },
              { municipality: storeSearchRegex },
              { address: storeSearchRegex },
              { specialties: { $elemMatch: { $regex: storeSearchRegex } } },
              // Add dashboard location search (including embedded maps)
              ...(allMsmeIdsFromLocationSearch.length > 0
                ? [{ _id: { $in: allMsmeIdsFromLocationSearch } }]
                : []),
            ],
          },
        ],
      })
        .limit(searchLimit)
        .sort({ createdAt: -1 });

      // Fetch dashboard data for each store to get embedded map location
      const storesWithDashboard = await Promise.all(
        stores.map(async (store) => {
          const dashboard = await Dashboard.findOne({ msmeId: store._id });

          let enhancedLocation = dashboard?.location || "";

          // If we have a Google Maps URL, extract additional location info
          if (dashboard?.googleMapsUrl && !enhancedLocation) {
            const extractedLocations = extractLocationFromMapsUrl(
              dashboard.googleMapsUrl
            );
            if (extractedLocations.length > 0) {
              enhancedLocation = extractedLocations[0];
            }
          }

          return {
            ...store.toObject(),
            dashboardLocation: enhancedLocation,
            extractedMapLocations: dashboard?.googleMapsUrl
              ? extractLocationFromMapsUrl(dashboard.googleMapsUrl)
              : [],
          };
        })
      );

      results.stores = storesWithDashboard.map((store) => ({
        _id: store._id,
        type: store.category === "artisan" ? "artist" : "store",
        name: store.businessName,
        username: store.username,
        description: store.businessDescription,
        category: store.category,
        businessType: store.category,
        location: store.address,
        municipality: store.municipality,
        dashboardLocation: store.dashboardLocation || "", // Include embedded map location
        imageUrl: store.businessPicture,
        rating: store.averageRating || 0,
        followers: store.followers?.length || 0,
      }));
    }

    results.total = results.products.length + results.stores.length;

    // Generate suggestions for autocomplete (first 5 items of each type)
    const suggestions = [];

    // Check if query seems to be a municipality search (check MSME data, dashboard locations, and embedded maps)
    let isMunicipalityQuery =
      (await MSME.exists({
        $and: [
          { status: "approved" },
          {
            $or: [
              { municipality: new RegExp(query, "i") },
              { address: new RegExp(query, "i") },
            ],
          },
        ],
      })) ||
      (await Dashboard.exists({
        location: new RegExp(query, "i"),
      }));

    // Also check embedded Google Maps URLs for location matches
    if (!isMunicipalityQuery) {
      const dashboardsWithMaps = await Dashboard.find({
        googleMapsUrl: { $exists: true, $ne: "" },
      }).select("googleMapsUrl");

      isMunicipalityQuery = dashboardsWithMaps.some((dashboard) => {
        const extractedLocations = extractLocationFromMapsUrl(
          dashboard.googleMapsUrl
        );
        return extractedLocations.some((location) =>
          location.toLowerCase().includes(query.toLowerCase())
        );
      });
    }

    // Add product suggestions (prioritize municipality-based if applicable)
    const productSuggestions = results.products.slice(0, 5);

    // If it's a municipality query, sort products by relevance (municipality match first)
    if (isMunicipalityQuery) {
      productSuggestions.sort((a, b) => {
        const queryRegex = new RegExp(query, "i");

        // Check both municipality field and dashboard location
        const aMunicipalityMatch =
          queryRegex.test(a.storeMunicipality || "") ||
          queryRegex.test(a.dashboardLocation || "");
        const bMunicipalityMatch =
          queryRegex.test(b.storeMunicipality || "") ||
          queryRegex.test(b.dashboardLocation || "");

        if (aMunicipalityMatch && !bMunicipalityMatch) return -1;
        if (!aMunicipalityMatch && bMunicipalityMatch) return 1;
        return 0;
      });
    }

    productSuggestions.forEach((product) => {
      // Prioritize dashboard location (embedded map) over municipality field
      const primaryLocation =
        product.dashboardLocation || product.storeMunicipality || "";
      const locationInfo = primaryLocation
        ? `${product.storeName} • ${primaryLocation}`
        : product.storeName;

      // Check if the search query matches any variant
      const matchingVariant = product.variants?.find((variant) =>
        variant.name.toLowerCase().includes(query.toLowerCase())
      );

      // Build subtitle with variant information if applicable
      let subtitle = `₱${product.price} • ${locationInfo}`;
      if (matchingVariant) {
        subtitle = `${matchingVariant.name} variant • ₱${product.price} • ${locationInfo}`;
      } else if (product.variants && product.variants.length > 0) {
        // Show available variants if query doesn't match specific variant
        const variantNames = product.variants
          .map((v) => v.name)
          .slice(0, 2)
          .join(", ");
        const moreVariants =
          product.variants.length > 2
            ? `, +${product.variants.length - 2} more`
            : "";
        subtitle = `Variants: ${variantNames}${moreVariants} • ₱${product.price} • ${locationInfo}`;
      }

      suggestions.push({
        type: "product",
        title: product.name,
        subtitle: subtitle,
        id: product._id,
        imageUrl: product.imageUrl,
        matchingVariant: matchingVariant || null,
        allVariants: product.variants || [],
        category: product.category,
        artistName: product.artistName,
      });
    });

    // Add store/artist suggestions
    results.stores.slice(0, 5).forEach((store) => {
      // Prioritize dashboard location (embedded map) over municipality field
      const primaryLocation =
        store.dashboardLocation || store.municipality || "";
      const locationInfo = primaryLocation
        ? `${store.businessType || store.category} • ${primaryLocation}`
        : store.businessType || store.category;

      suggestions.push({
        type: store.type,
        title: store.name,
        subtitle: locationInfo,
        id: store._id,
        imageUrl: store.imageUrl,
      });
    });

    res.json({
      success: true,
      query,
      suggestions: suggestions.slice(0, 10), // Limit to 10 suggestions
      results,
    });
  } catch (err) {
    console.error("Error in universal search:", err);
    res.status(500).json({
      success: false,
      error: "Error performing search",
    });
  }
});

// Get available products only
app.get("/api/products/available", async (req, res) => {
  try {
    const products = await Product.findAvailable().populate(
      "msmeId",
      "businessName username"
    );

    res.json({
      success: true,
      products,
    });
  } catch (err) {
    console.error("Error fetching available products:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching available products",
    });
  }
});

// --- Dashboard Routes ---

// Get individual store details (for customer store view)
app.get("/api/stores/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    // Find the MSME store
    const store = await MSME.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    // Only show visible stores to customers
    if (store.isVisible === false || store.status !== "approved") {
      return res.status(404).json({
        success: false,
        error: "Store not available",
      });
    }

    // Find the dashboard information
    let dashboard = await Dashboard.findByMsmeId(storeId);

    // If no dashboard exists, create a minimal one with store data
    if (!dashboard) {
      dashboard = {
        businessName: store.businessName,
        description: "",
        coverPhoto: null,
        storeLogo: null,
        contactNumber: store.contactNumber || "",
        location: store.address || "",
        googleMapsUrl: "",
        coordinates: { lat: null, lng: null },
        socialLinks: {
          facebook: "",
          instagram: "",
        },
        ecommercePlatforms: {
          shopee: { enabled: false, url: "" },
          lazada: { enabled: false, url: "" },
          tiktok: { enabled: false, url: "" },
        },
        governmentApprovals: {
          dole: false,
          dost: false,
          dti: false,
          others: false,
          otherAgencies: [],
        },
        rating: 0,
      };
    }

    // Combine store and dashboard data, prioritizing dashboard info but keeping MSME ratings
    const storeWithDashboard = {
      ...store.toObject(),
      // Use dashboard information for business details
      businessName: dashboard.businessName || store.businessName,
      username: store.username, // Always from MSME model
      // Keep MSME rating data
      averageRating: store.averageRating || 0,
      totalRatings: store.totalRatings || 0,
      ratings: store.ratings || [],
      dashboard: {
        description: dashboard.description || "",
        coverPhoto: dashboard.coverPhoto,
        storeLogo: dashboard.storeLogo,
        contactNumber: dashboard.contactNumber || store.contactNumber || "",
        location: dashboard.location || store.address || "",
        googleMapsUrl: dashboard.googleMapsUrl || "",
        coordinates: dashboard.coordinates || { lat: null, lng: null },
        socialLinks: dashboard.socialLinks || {
          facebook: "",
          instagram: "",
        },
        ecommercePlatforms: dashboard.ecommercePlatforms || {
          shopee: { enabled: false, url: "" },
          lazada: { enabled: false, url: "" },
          tiktok: { enabled: false, url: "" },
        },
        governmentApprovals: dashboard.governmentApprovals || {
          dole: false,
          dost: false,
          dti: false,
          others: false,
        },
        // Use MSME rating for display, not dashboard rating
        rating: store.averageRating || 0,
        totalRatings: store.totalRatings || 0,
      },
    };

    res.json({
      success: true,
      store: storeWithDashboard,
    });
  } catch (error) {
    console.error("Error fetching store details:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Record page view for store
app.post("/api/stores/:storeId/view", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required",
      });
    }

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Validate store exists
    const store = await MSME.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    // Get IP address and user agent for tracking
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get("User-Agent");

    // Record the page view (will automatically handle one-per-day logic)
    const result = await PageView.recordView(
      storeId,
      customerId,
      ipAddress,
      userAgent
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error recording page view:", error);
    res.status(500).json({
      success: false,
      error: "Error recording page view",
    });
  }
});

// Get page view statistics for a store (for MSME dashboard)
app.get("/api/stores/:storeId/analytics", async (req, res) => {
  try {
    const { storeId } = req.params;

    // Validate store exists
    const store = await MSME.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    // Get page view statistics
    const stats = await PageView.getStoreStats(storeId);

    // Get follower count
    const followerCount = await Customer.countDocuments({
      following: storeId,
    });

    // Calculate weekly rating analysis
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    // Get ratings for the last 4 weeks
    const thisWeekRatings = store.ratings.filter(
      (r) => r.createdAt >= oneWeekAgo
    );
    const lastWeekRatings = store.ratings.filter(
      (r) => r.createdAt >= twoWeeksAgo && r.createdAt < oneWeekAgo
    );
    const twoWeeksAgoRatings = store.ratings.filter(
      (r) => r.createdAt >= threeWeeksAgo && r.createdAt < twoWeeksAgo
    );
    const threeWeeksAgoRatings = store.ratings.filter(
      (r) => r.createdAt >= fourWeeksAgo && r.createdAt < threeWeeksAgo
    );

    // Calculate average ratings for each week
    const calculateWeeklyAverage = (ratings) => {
      if (ratings.length === 0) return 0;
      return (
        Math.round(
          (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) * 10
        ) / 10
      );
    };

    const ratingAnalysis = {
      currentAverage: store.averageRating || 0,
      totalRatings: store.totalRatings || 0,
      weeklyBreakdown: [
        {
          week: "This Week",
          average: calculateWeeklyAverage(thisWeekRatings),
          count: thisWeekRatings.length,
          period: "current",
        },
        {
          week: "Last Week",
          average: calculateWeeklyAverage(lastWeekRatings),
          count: lastWeekRatings.length,
          period: "last",
        },
        {
          week: "2 Weeks Ago",
          average: calculateWeeklyAverage(twoWeeksAgoRatings),
          count: twoWeeksAgoRatings.length,
          period: "two",
        },
        {
          week: "3 Weeks Ago",
          average: calculateWeeklyAverage(threeWeeksAgoRatings),
          count: threeWeeksAgoRatings.length,
          period: "three",
        },
      ],
      trend:
        thisWeekRatings.length > 0 && lastWeekRatings.length > 0
          ? (
              calculateWeeklyAverage(thisWeekRatings) -
              calculateWeeklyAverage(lastWeekRatings)
            ).toFixed(1)
          : 0,
    };

    res.json({
      success: true,
      analytics: {
        pageViews: stats,
        followers: followerCount,
        ratings: ratingAnalysis,
      },
    });
  } catch (error) {
    console.error("Error fetching store analytics:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching analytics",
    });
  }
});

// Get product rating analytics for a specific store
app.get("/api/stores/:storeId/analytics/products", async (req, res) => {
  try {
    const { storeId } = req.params;

    // Validate store exists
    const store = await MSME.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    // Get all products for this store
    const products = await Product.find({ msmeId: storeId });

    if (!products || products.length === 0) {
      return res.json({
        success: true,
        data: {
          productRatings: [],
          summary: {
            totalProducts: 0,
            averageRating: 0,
            totalReviews: 0,
          },
        },
      });
    }

    // Process each product's ratings over time
    const productRatingsData = [];
    let totalRating = 0;
    let totalReviews = 0;

    for (const product of products) {
      if (product.feedback && product.feedback.length > 0) {
        // Calculate ratings over the last 4 weeks for trend visualization
        const now = new Date();
        const weeks = [];

        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(
            now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000
          );
          const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

          const weekRatings = product.feedback.filter((fb) => {
            const feedbackDate = new Date(fb.createdAt);
            return feedbackDate >= weekStart && feedbackDate < weekEnd;
          });

          const weekAverage =
            weekRatings.length > 0
              ? weekRatings.reduce((sum, fb) => sum + fb.rating, 0) /
                weekRatings.length
              : 0;

          weeks.push({
            week: `Week ${4 - i}`,
            rating: Math.round(weekAverage * 10) / 10,
            reviewCount: weekRatings.length,
          });
        }

        // Calculate overall product rating
        const productRating =
          product.feedback.reduce((sum, fb) => sum + fb.rating, 0) /
          product.feedback.length;

        productRatingsData.push({
          productId: product._id,
          productName: product.productName,
          overallRating: Math.round(productRating * 10) / 10,
          totalReviews: product.feedback.length,
          weeklyData: weeks,
          category: product.category || "Uncategorized",
        });

        totalRating += productRating;
        totalReviews += product.feedback.length;
      }
    }

    // Calculate summary statistics
    const averageRating =
      productRatingsData.length > 0
        ? Math.round((totalRating / productRatingsData.length) * 10) / 10
        : 0;

    // Sort products by rating (highest first)
    productRatingsData.sort((a, b) => b.overallRating - a.overallRating);

    res.json({
      success: true,
      data: {
        productRatings: productRatingsData,
        summary: {
          totalProducts: products.length,
          ratedProducts: productRatingsData.length,
          averageRating: averageRating,
          totalReviews: totalReviews,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching product rating analytics:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching product rating analytics",
    });
  }
});

// Get all stores with dashboard information for customer view
app.get("/api/stores", async (req, res) => {
  try {
    const { customerId } = req.query; // Get customerId from query params

    // Fetch all visible and approved MSMEs
    const msmes = await MSME.find({
      status: "approved",
      isVisible: true,
    }).sort({ createdAt: -1 });

    // If customerId is provided, get customer's following list to exclude
    let excludeStoreIds = [];
    if (customerId) {
      try {
        const customer = await Customer.findById(customerId).select(
          "following"
        );
        if (customer && customer.following) {
          excludeStoreIds = customer.following.map((id) => id.toString());
        }
      } catch (customerError) {
        console.warn(
          "Warning: Could not fetch customer following list:",
          customerError
        );
        // Continue without exclusion if customer lookup fails
      }
    }

    // Filter out followed stores if exclusion list exists
    const filteredMsmes =
      excludeStoreIds.length > 0
        ? msmes.filter((msme) => !excludeStoreIds.includes(msme._id.toString()))
        : msmes;

    // Fetch dashboard information for each MSME
    const storesWithDashboards = await Promise.all(
      filteredMsmes.map(async (msme) => {
        try {
          let dashboard = await Dashboard.findByMsmeId(msme._id);

          // If no dashboard exists, create and save a new one
          if (!dashboard) {
            console.log(
              `Creating new dashboard for MSME: ${msme.businessName}`
            );
            dashboard = new Dashboard({
              msmeId: msme._id,
              businessName: msme.businessName,
              description: "",
              coverPhoto: null,
              storeLogo: null,
              contactNumber: msme.contactNumber || "",
              location: msme.address || "",
              googleMapsUrl: "",
              coordinates: { lat: null, lng: null },
              socialLinks: {
                facebook: "",
                instagram: "",
              },
              ecommercePlatforms: {
                shopee: { enabled: false, url: "" },
                lazada: { enabled: false, url: "" },
                tiktok: { enabled: false, url: "" },
              },
              governmentApprovals: {
                dole: false,
                dost: false,
                dti: false,
                others: false,
              },
              rating: 0,
              isPublic: true,
            });

            try {
              await dashboard.save();
              console.log(`✅ Dashboard created for ${msme.businessName}`);
            } catch (saveError) {
              console.error(
                `❌ Error saving dashboard for ${msme.businessName}:`,
                saveError
              );
              // Continue with the unsaved dashboard object
            }
          } else {
            console.log(`✅ Dashboard found for ${msme.businessName}:`, {
              storeLogo: dashboard.storeLogo,
              coverPhoto: dashboard.coverPhoto,
              description: dashboard.description,
              location: dashboard.location,
            });
          }

          // Get product count for this store
          const productCount = await Product.countDocuments({
            msmeId: msme._id,
          });

          // Get follower count for this store
          const followerCount = await Customer.countDocuments({
            following: msme._id,
          });

          return {
            _id: msme._id,
            msmeId: msme._id,
            businessName: dashboard.businessName || msme.businessName,
            category: msme.category,
            username: msme.username,
            status: msme.status,
            createdAt: msme.createdAt,
            address: msme.address, // Include MSME address as fallback
            // Include MSME rating data
            averageRating: msme.averageRating || 0,
            totalRatings: msme.totalRatings || 0,
            ratings: msme.ratings || [],
            // Include store statistics
            productCount: productCount,
            followerCount: followerCount,
            dashboard: {
              businessName: dashboard.businessName || msme.businessName,
              description: dashboard.description || "",
              coverPhoto: dashboard.coverPhoto,
              storeLogo: dashboard.storeLogo,
              contactNumber:
                dashboard.contactNumber || msme.contactNumber || "",
              location: dashboard.location || msme.address || "",
              socialLinks: dashboard.socialLinks || {
                facebook: "",
                instagram: "",
              },
              // Override dashboard rating with MSME rating
              rating: msme.averageRating || 0,
              totalRatings: msme.totalRatings || 0,
              isPublic: dashboard.isPublic !== false, // Default to true
              createdAt: dashboard.createdAt,
              updatedAt: dashboard.updatedAt,
            },
          };
        } catch (error) {
          console.error(
            `Error fetching dashboard for ${msme.businessName}:`,
            error
          );

          // Get product count and follower count even in error case
          const productCount = await Product.countDocuments({
            msmeId: msme._id,
          }).catch(() => 0);
          const followerCount = await Customer.countDocuments({
            following: msme._id,
          }).catch(() => 0);

          return {
            _id: msme._id,
            msmeId: msme._id,
            businessName: msme.businessName,
            category: msme.category,
            username: msme.username,
            status: msme.status,
            createdAt: msme.createdAt,
            // Include MSME rating data even in error case
            averageRating: msme.averageRating || 0,
            totalRatings: msme.totalRatings || 0,
            ratings: msme.ratings || [],
            // Include store statistics
            productCount: productCount,
            followerCount: followerCount,
            dashboard: {
              businessName: msme.businessName,
              description: "",
              coverPhoto: null,
              storeLogo: null,
              contactNumber: msme.contactNumber || "",
              location: msme.address || "",
              socialLinks: {
                facebook: "",
                instagram: "",
              },
              rating: msme.averageRating || 0,
              totalRatings: msme.totalRatings || 0,
              isPublic: true,
            },
          };
        }
      })
    );

    res.json({
      success: true,
      stores: storesWithDashboards,
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stores",
    });
  }
});

// Follow/Unfollow store endpoint
app.post("/api/stores/:storeId/follow", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { customerId, action } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required",
      });
    }

    console.log(
      "Follow/unfollow request - Store:",
      storeId,
      "Customer:",
      customerId,
      "Action:",
      action
    );

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      console.log("Customer not found:", customerId);
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Validate store exists
    const store = await MSME.findById(storeId);
    if (!store) {
      console.log("Store not found:", storeId);
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    console.log("Before update - Customer following:", customer.following);
    const isFollowing = customer.following.includes(storeId);

    if (action === "follow") {
      if (!isFollowing) {
        customer.following.push(storeId);
        await customer.save();
        console.log("Added to following, new array:", customer.following);

        // Create notification for store owner
        await createNotification(storeId, customerId, "store_follow");
      }

      res.json({
        success: true,
        message: `Now following ${store.businessName}!`,
        following: true,
      });
    } else if (action === "unfollow") {
      if (isFollowing) {
        customer.following = customer.following.filter(
          (id) => id.toString() !== storeId
        );
        await customer.save();
        console.log("Removed from following, new array:", customer.following);
      }

      res.json({
        success: true,
        message: `Unfollowed ${store.businessName}`,
        following: false,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid action. Use 'follow' or 'unfollow'",
      });
    }
  } catch (error) {
    console.error("Error following/unfollowing store:", error);
    res.status(500).json({
      success: false,
      error: "Error processing follow request",
    });
  }
});

// Check if customer is following a store
app.get("/api/stores/:storeId/follow-status/:customerId", async (req, res) => {
  try {
    const { storeId, customerId } = req.params;

    console.log(
      "Checking follow status for store:",
      storeId,
      "customer:",
      customerId
    );

    const customer = await Customer.findById(customerId);
    if (!customer) {
      console.log("Customer not found:", customerId);
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    console.log("Customer following array:", customer.following);
    const isFollowing = customer.following.includes(storeId);
    console.log("Is following result:", isFollowing);

    res.json({
      success: true,
      following: isFollowing,
    });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({
      success: false,
      error: "Error checking follow status",
    });
  }
});

// Get customer's followed stores
app.get("/api/customers/:customerId/following", async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId).populate({
      path: "following",
      match: { status: "approved", isVisible: true },
      select:
        "businessName username category address createdAt averageRating totalRatings",
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Filter out any null following (in case of deleted stores)
    const validFollowing = customer.following.filter((store) => store != null);

    // Add product count, follower count, and dashboard info for each store
    const followingWithStats = await Promise.all(
      validFollowing.map(async (store) => {
        const productCount = await Product.countDocuments({
          msmeId: store._id,
        });
        const followerCount = await Customer.countDocuments({
          following: store._id,
        });

        // Get dashboard information for better location data
        let dashboard = await Dashboard.findByMsmeId(store._id);
        if (!dashboard) {
          dashboard = {
            location: store.address || "",
            description: "",
          };
        }

        return {
          ...store.toObject(),
          productCount,
          followerCount,
          dashboard: {
            location:
              dashboard.location || store.address || "Location not specified",
            description:
              dashboard.description || "A great store with quality products",
          },
        };
      })
    );

    res.json({
      success: true,
      following: followingWithStats,
    });
  } catch (error) {
    console.error("Error fetching followed stores:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching followed stores",
    });
  }
});

// Follow/Unfollow store endpoint (Alternative URL pattern)
app.post(
  "/api/customers/:customerId/follow-store/:storeId",
  async (req, res) => {
    try {
      const { customerId, storeId } = req.params;

      console.log(
        "Follow/unfollow toggle - Customer:",
        customerId,
        "Store:",
        storeId
      );

      // Validate customer exists
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: "Customer not found",
        });
      }

      // Validate store exists
      const store = await MSME.findById(storeId);
      if (!store) {
        return res.status(404).json({
          success: false,
          error: "Store not found",
        });
      }

      const isFollowing = customer.following.includes(storeId);

      if (isFollowing) {
        // Unfollow
        customer.following = customer.following.filter(
          (id) => id.toString() !== storeId
        );
        await customer.save();

        res.json({
          success: true,
          action: "unfollowed",
          message: `Unfollowed ${store.businessName}`,
          following: false,
        });
      } else {
        // Follow
        customer.following.push(storeId);
        await customer.save();

        // Create notification for store owner
        await createNotification(storeId, customerId, "store_follow");

        res.json({
          success: true,
          action: "followed",
          message: `Now following ${store.businessName}!`,
          following: true,
        });
      }
    } catch (error) {
      console.error("Error toggling follow store:", error);
      res.status(500).json({
        success: false,
        error: "Error processing follow request",
      });
    }
  }
);

// Store rating endpoint
app.post("/api/stores/:storeId/rating", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { rating, user, userId, userType } = req.body;

    console.log("Store rating request:", {
      storeId,
      rating,
      user,
      userId,
      userType,
    });

    // Validation
    if (!rating || !user || !userId) {
      return res.status(400).json({
        success: false,
        error: "Rating, user, and userId are required",
      });
    }

    // Check if user type is customer (only customers can rate stores)
    if (userType !== "customer") {
      return res.status(403).json({
        success: false,
        error: "Only customers can rate stores",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    // Find the store
    const store = await MSME.findById(storeId);
    if (!store) {
      console.log("Store not found:", storeId);
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    console.log("Found store:", store.businessName);

    // Initialize ratings array if it doesn't exist
    if (!store.ratings) {
      store.ratings = [];
    }

    // Check if user already rated this store
    const existingRatingIndex = store.ratings.findIndex(
      (r) => r.userId === userId
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      store.ratings[existingRatingIndex].rating = rating;
      store.ratings[existingRatingIndex].userName = user; // Make sure userName is set when updating
      store.ratings[existingRatingIndex].createdAt = new Date();
      console.log("Updated existing rating");
    } else {
      // Add new rating
      console.log("Adding new rating with user:", user, "userId:", userId);
      const newRating = {
        userId,
        userName: user,
        rating,
        createdAt: new Date(),
      };
      console.log("New rating object:", newRating);
      store.ratings.push(newRating);
      console.log("Added new rating");
    }

    // Recalculate average rating
    store.calculateAverageRating();
    await store.save();

    console.log("Rating saved successfully. Average:", store.averageRating);

    // Create notification for the MSME owner
    try {
      const notificationMessage =
        existingRatingIndex !== -1
          ? `${user} updated their rating to ${rating} star${
              rating > 1 ? "s" : ""
            } for your store`
          : `${user} rated your store ${rating} star${rating > 1 ? "s" : ""}!`;

      const notification = new Notification({
        recipientId: store._id,
        recipientType: "msme",
        senderId: userId,
        senderType: "customer",
        type: "rating",
        title: "New Store Rating",
        message: notificationMessage,
        data: {
          storeId: store._id,
          storeName: store.businessName,
          rating: rating,
          customerName: user,
        },
      });

      await notification.save();
      console.log("Rating notification created for MSME");
    } catch (notificationError) {
      console.error("Error creating rating notification:", notificationError);
      // Don't fail the rating submission if notification fails
    }

    res.json({
      success: true,
      message: "Rating submitted successfully!",
      averageRating: store.averageRating,
      totalRatings: store.totalRatings,
    });
  } catch (error) {
    console.error("Error submitting store rating:", error);
    res.status(500).json({
      success: false,
      error: "Error submitting rating",
    });
  }
});

// Get user's existing rating for a store
app.get("/api/stores/:storeId/rating/:userId", async (req, res) => {
  try {
    const { storeId, userId } = req.params;

    console.log("Getting user rating for store:", { storeId, userId });

    // Find the store
    const store = await MSME.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    // Find user's rating
    const userRating = store.ratings?.find(
      (rating) => rating.userId === userId
    );

    if (userRating) {
      res.json({
        success: true,
        rating: userRating.rating,
        createdAt: userRating.createdAt,
        hasRated: true,
      });
    } else {
      res.json({
        success: true,
        rating: 0,
        hasRated: false,
      });
    }
  } catch (error) {
    console.error("Error fetching user rating:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching rating",
    });
  }
});

// Get top rated products from a store
app.get("/api/msme/:storeId/products/top-rated", async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log("Fetching top-rated products for store:", storeId);

    // Find all visible products from this store
    const products = await Product.find({
      msmeId: storeId,
      visible: true,
    });

    console.log("Found products:", products.length);

    // Calculate rating for products that have feedback but no rating field
    const productsWithRatings = products.map((product) => {
      let calculatedRating = product.rating;

      // If no rating but has feedback, calculate from feedback
      if (
        !calculatedRating &&
        product.feedback &&
        product.feedback.length > 0
      ) {
        const sum = product.feedback.reduce((acc, fb) => acc + fb.rating, 0);
        calculatedRating = sum / product.feedback.length;
      }

      // Filter out 1-star reviews for customer view but keep rating calculation intact
      const customerFeedback = product.feedback
        ? product.feedback.filter((fb) => fb.rating > 1)
        : [];

      return {
        ...product.toObject(),
        feedback: customerFeedback, // Show only 2+ star reviews to customers
        rating: calculatedRating || 0, // Keep original rating calculation
        feedbackCount: product.feedback ? product.feedback.length : 0, // Original count for accuracy
      };
    });

    // Filter products with ratings > 0 and sort by rating
    const topRatedProducts = productsWithRatings
      .filter((product) => product.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4); // Get top 4

    console.log("Top rated products:", topRatedProducts.length);

    res.json({
      success: true,
      products: topRatedProducts,
    });
  } catch (error) {
    console.error("Error fetching top rated products:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching top rated products",
    });
  }
});

// Get product feedbacks from a store
app.get("/api/msme/:storeId/products/feedbacks", async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log("Fetching product feedbacks for store:", storeId);

    // Find all visible products from this store that have feedback
    const products = await Product.find({
      msmeId: storeId,
      visible: true,
      feedback: { $exists: true, $not: { $size: 0 } },
    });

    console.log("Found products with feedback:", products.length);

    // Extract all feedbacks with product information
    const allFeedbacks = [];

    products.forEach((product) => {
      if (product.feedback && product.feedback.length > 0) {
        // Filter out hidden reviews and 1-star reviews from customer view
        const visibleFeedbacks = product.feedback.filter(
          (feedback) => !feedback.hidden && feedback.rating > 1
        );

        visibleFeedbacks.forEach((feedback) => {
          // Mask the customer name for privacy
          const maskedUserName = maskCustomerName(feedback.user);

          console.log("Processing feedback:", {
            userName: maskedUserName, // Use masked name
            feedback: feedback.comment, // Changed from feedback to comment
            rating: feedback.rating,
            productName: product.productName,
          });
          allFeedbacks.push({
            ...feedback.toObject(),
            // Map the correct field names with masked user name
            userName: maskedUserName, // Map masked user to userName for frontend
            feedback: feedback.comment, // Map comment to feedback for frontend
            productId: product._id,
            productName: product.productName,
            productImage: product.picture,
            productPrice: product.price,
          });
        });
      }
    });

    // Sort feedbacks by date (newest first) and limit to recent ones
    const sortedFeedbacks = allFeedbacks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10); // Get latest 10 feedbacks

    console.log("Total feedbacks found:", sortedFeedbacks.length);

    res.json({
      success: true,
      feedbacks: sortedFeedbacks,
    });
  } catch (error) {
    console.error("Error fetching product feedbacks:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching product feedbacks",
    });
  }
});

// Get top rated products from a store (OWNER VERSION - includes all reviews for accurate ratings)
app.get("/api/msme/:storeId/products/top-rated/owner", async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log("Fetching top-rated products for store owner:", storeId);

    // Find all visible products from this store
    const products = await Product.find({
      msmeId: storeId,
      visible: true,
    });

    console.log("Found products:", products.length);

    // Calculate rating for products that have feedback but no rating field
    const productsWithRatings = products.map((product) => {
      let calculatedRating = product.rating;

      // If no rating but has feedback, calculate from ALL feedback (including 1-star)
      if (
        !calculatedRating &&
        product.feedback &&
        product.feedback.length > 0
      ) {
        const sum = product.feedback.reduce((acc, fb) => acc + fb.rating, 0);
        calculatedRating = sum / product.feedback.length;
      }

      return {
        ...product.toObject(),
        rating: calculatedRating || 0,
        feedbackCount: product.feedback ? product.feedback.length : 0,
      };
    });

    // Filter products with ratings > 0 and sort by rating
    const topRatedProducts = productsWithRatings
      .filter((product) => product.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 4); // Get top 4

    console.log("Top rated products for owner:", topRatedProducts.length);

    res.json({
      success: true,
      products: topRatedProducts,
    });
  } catch (error) {
    console.error("Error fetching top rated products for owner:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching top rated products for owner",
    });
  }
});

// Get product feedbacks from a store (OWNER VERSION - includes all reviews)
app.get("/api/msme/:storeId/products/feedbacks/owner", async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log("Fetching product feedbacks for store owner:", storeId);

    // Find all visible products from this store that have feedback
    const products = await Product.find({
      msmeId: storeId,
      visible: true,
      feedback: { $exists: true, $not: { $size: 0 } },
    });

    console.log("Found products with feedback:", products.length);

    // Extract all feedbacks with product information
    const allFeedbacks = [];

    products.forEach((product) => {
      if (product.feedback && product.feedback.length > 0) {
        // Show ALL reviews for store owner (only filter out truly hidden ones)
        const visibleFeedbacks = product.feedback.filter(
          (feedback) => !feedback.hidden
        );

        visibleFeedbacks.forEach((feedback) => {
          // Mask the customer name for privacy
          const maskedUserName = maskCustomerName(feedback.user);

          console.log("Processing feedback for owner:", {
            userName: maskedUserName,
            feedback: feedback.comment,
            rating: feedback.rating,
            productName: product.productName,
          });
          allFeedbacks.push({
            ...feedback.toObject(),
            userName: maskedUserName,
            feedback: feedback.comment,
            productId: product._id,
            productName: product.productName,
            productImage: product.picture,
            productPrice: product.price,
          });
        });
      }
    });

    // Sort feedbacks by date (newest first) and limit to recent ones
    const sortedFeedbacks = allFeedbacks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10); // Get latest 10 feedbacks

    console.log("Total feedbacks found for owner:", sortedFeedbacks.length);

    res.json({
      success: true,
      feedbacks: sortedFeedbacks,
    });
  } catch (error) {
    console.error("Error fetching product feedbacks for owner:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching product feedbacks for owner",
    });
  }
});

// Get dashboard by MSME ID
app.get("/api/msme/:msmeId/dashboard", async (req, res) => {
  try {
    const { msmeId } = req.params;

    // Get MSME data first to access rating information
    const msme = await MSME.findById(msmeId);
    if (!msme) {
      return res.status(404).json({
        success: false,
        error: "MSME not found",
      });
    }

    let dashboard = await Dashboard.findByMsmeId(msmeId);

    // If no dashboard exists, create a default one
    if (!dashboard) {
      dashboard = new Dashboard({
        msmeId,
        businessName: msme.businessName || msme.username,
        description: `Welcome to ${msme.businessName || msme.username}!`,
        contactNumber: msme.contactNumber || "",
        location: msme.address || "",
        googleMapsUrl: "",
        coordinates: { lat: null, lng: null },
        socialLinks: {
          facebook: "",
          instagram: "",
        },
        ecommercePlatforms: {
          shopee: { enabled: false, url: "" },
          lazada: { enabled: false, url: "" },
          tiktok: { enabled: false, url: "" },
        },
        governmentApprovals: {
          dole: false,
          dost: false,
          dti: false,
          others: false,
        },
        rating: msme.averageRating || 0,
      });
      await dashboard.save();
    }

    // Always update dashboard with current MSME rating data
    dashboard.rating = msme.averageRating || 0;
    dashboard.totalRatings = msme.totalRatings || 0;

    res.json({
      success: true,
      dashboard: {
        ...dashboard.toObject(),
        rating: msme.averageRating || 0,
        totalRatings: msme.totalRatings || 0,
      },
    });
  } catch (err) {
    console.error("Error fetching dashboard:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching dashboard",
    });
  }
});

// Create or update dashboard
app.post(
  "/api/msme/dashboard",
  upload.fields([
    { name: "coverPhoto", maxCount: 1 },
    { name: "storeLogo", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        msmeId,
        businessName,
        description,
        contactNumber,
        location,
        googleMapsUrl,
        coordinates,
        socialLinks,
        ecommercePlatforms,
        governmentApprovals,
        isPublic,
      } = req.body;

      if (!msmeId) {
        return res.status(400).json({
          success: false,
          error: "MSME ID is required",
        });
      }

      // Parse socialLinks if it's a string
      let parsedSocialLinks = {};
      if (socialLinks) {
        try {
          parsedSocialLinks =
            typeof socialLinks === "string"
              ? JSON.parse(socialLinks)
              : socialLinks;
        } catch (error) {
          console.error("Error parsing socialLinks:", error);
          parsedSocialLinks = {};
        }
      }

      // Parse coordinates if it's a string
      let parsedCoordinates = { lat: null, lng: null };
      if (coordinates) {
        try {
          parsedCoordinates =
            typeof coordinates === "string"
              ? JSON.parse(coordinates)
              : coordinates;
        } catch (error) {
          console.error("Error parsing coordinates:", error);
          parsedCoordinates = { lat: null, lng: null };
        }
      }

      // Parse ecommercePlatforms if it's a string
      let parsedEcommercePlatforms = {
        shopee: { enabled: false, url: "" },
        lazada: { enabled: false, url: "" },
        tiktok: { enabled: false, url: "" },
      };
      if (ecommercePlatforms) {
        try {
          parsedEcommercePlatforms =
            typeof ecommercePlatforms === "string"
              ? JSON.parse(ecommercePlatforms)
              : ecommercePlatforms;
        } catch (error) {
          console.error("Error parsing ecommercePlatforms:", error);
          parsedEcommercePlatforms = {
            shopee: { enabled: false, url: "" },
            lazada: { enabled: false, url: "" },
            tiktok: { enabled: false, url: "" },
          };
        }
      }

      // Parse governmentApprovals if it's a string
      let parsedGovernmentApprovals = {
        dole: false,
        dost: false,
        dti: false,
        others: false,
      };
      if (governmentApprovals) {
        try {
          parsedGovernmentApprovals =
            typeof governmentApprovals === "string"
              ? JSON.parse(governmentApprovals)
              : governmentApprovals;
        } catch (error) {
          console.error("Error parsing governmentApprovals:", error);
          parsedGovernmentApprovals = {
            dole: false,
            dost: false,
            dti: false,
            others: false,
          };
        }
      }

      // Get current dashboard to preserve business name if user is not admin
      let existingDashboard = await Dashboard.findOne({ msmeId });

      // Prepare update data - only allow admins to change business name
      const updateData = {
        businessName:
          req.body.userType === "admin"
            ? businessName
            : existingDashboard?.businessName || businessName,
        description,
        contactNumber,
        location,
        googleMapsUrl,
        coordinates: parsedCoordinates,
        socialLinks: parsedSocialLinks,
        ecommercePlatforms: parsedEcommercePlatforms,
        governmentApprovals: parsedGovernmentApprovals,
        isPublic: isPublic === "true" || isPublic === true,
      };

      // Handle file uploads
      if (req.files) {
        if (req.files.coverPhoto) {
          updateData.coverPhoto = req.files.coverPhoto[0].filename;
        }
        if (req.files.storeLogo) {
          updateData.storeLogo = req.files.storeLogo[0].filename;
        }
      }

      // Update or create dashboard
      let dashboard = existingDashboard;

      if (dashboard) {
        // Update existing dashboard
        Object.assign(dashboard, updateData);
        await dashboard.save();
      } else {
        // Create new dashboard - for new dashboards, we need to get business name from MSME record
        if (req.body.userType !== "admin") {
          // If not admin, get business name from MSME record instead of request
          const msme = await MSME.findById(msmeId);
          updateData.businessName = msme?.businessName || businessName;
        }
        dashboard = new Dashboard({
          msmeId,
          ...updateData,
          rating: 4.0, // Default rating
        });
        await dashboard.save();
      }

      res.json({
        success: true,
        message: "Dashboard updated successfully",
        dashboard,
      });
    } catch (err) {
      console.error("Error updating dashboard:", err);
      res.status(500).json({
        success: false,
        error: "Error updating dashboard",
      });
    }
  }
);

// Update store logo only
app.put(
  "/api/msme/:id/profile/storeLogo",
  upload.single("storeLogo"),
  async (req, res) => {
    try {
      const msmeId = req.params.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No image file provided",
        });
      }

      // Find the MSME to get the ObjectId
      const msme = await MSME.findOne({ id: msmeId });
      if (!msme) {
        return res.status(404).json({
          success: false,
          error: "MSME not found",
        });
      }

      // Update or create dashboard with new store logo
      let dashboard = await Dashboard.findOne({ msmeId: msme._id });

      if (dashboard) {
        // Update existing dashboard
        dashboard.storeLogo = req.file.filename;
        await dashboard.save();
      } else {
        // Create new dashboard with basic info
        dashboard = new Dashboard({
          msmeId: msme._id,
          businessName: msme.businessName,
          storeLogo: req.file.filename,
          rating: 4.0,
        });
        await dashboard.save();
      }

      res.json({
        success: true,
        message: "Store logo updated successfully",
        storeLogo: req.file.filename,
      });
    } catch (error) {
      console.error("Error updating store logo:", error);
      res.status(500).json({
        success: false,
        error: "Error updating store logo",
      });
    }
  }
);

// Get all public dashboards
app.get("/api/dashboards/public", async (req, res) => {
  try {
    const dashboards = await Dashboard.findPublic();

    res.json({
      success: true,
      dashboards,
    });
  } catch (err) {
    console.error("Error fetching public dashboards:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching public dashboards",
    });
  }
});

// Get specific public dashboard by MSME ID
app.get("/api/dashboard/public/:msmeId", async (req, res) => {
  try {
    const { msmeId } = req.params;

    const dashboard = await Dashboard.findOne({
      msmeId,
      isPublic: true,
    }).populate("msmeId", "businessName username");

    if (!dashboard) {
      return res.status(404).json({
        success: false,
        error: "Public dashboard not found",
      });
    }

    // Also get the products for this MSME
    const products = await Product.find({
      msmeId,
      visible: true,
      availability: true,
    });

    res.json({
      success: true,
      dashboard,
      products,
    });
  } catch (err) {
    console.error("Error fetching public dashboard:", err);
    res.status(500).json({
      success: false,
      error: "Error fetching public dashboard",
    });
  }
});

// Get MSME statistics (products count, rating, followers count)
app.get("/api/admin/msme-statistics", async (req, res) => {
  try {
    // Get all MSMEs
    const msmes = await MSME.find({});

    // Get statistics for each MSME
    const msmeStats = await Promise.all(
      msmes.map(async (msme) => {
        // Count products for this MSME
        const productCount = await Product.countDocuments({ msmeId: msme._id });

        // Get store rating directly from MSME model (not product ratings)
        const storeRating = msme.averageRating || 0;

        // Count followers (customers who follow this MSME)
        const followerCount = await Customer.countDocuments({
          following: msme._id,
        });

        return {
          msmeId: msme._id,
          products: productCount,
          rating: storeRating,
          followers: followerCount,
        };
      })
    );

    res.json({
      success: true,
      statistics: msmeStats,
    });
  } catch (error) {
    console.error("Error fetching MSME statistics:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching MSME statistics",
    });
  }
});

// Get MSME reports for admin dashboard
app.get("/api/admin/msme-reports", async (req, res) => {
  try {
    console.log("Fetching MSME reports...");

    // Get all MSMEs with detailed information
    const msmes = await MSME.find({}).lean();
    console.log(`Found ${msmes.length} MSMEs in database`);

    // Get comprehensive reports for each MSME
    const msmeReports = await Promise.all(
      msmes.map(async (msme) => {
        try {
          console.log(`Processing MSME: ${msme.businessName}`);

          // Count products for this MSME
          const totalProducts = await Product.countDocuments({
            msmeId: msme._id,
          });

          // Calculate average product rating
          const products = await Product.find({ msmeId: msme._id });
          let totalProductRating = 0;
          let totalRatings = 0;

          products.forEach((product) => {
            if (product.feedback && product.feedback.length > 0) {
              product.feedback.forEach((feedback) => {
                if (feedback.rating && typeof feedback.rating === "number") {
                  totalProductRating += feedback.rating;
                  totalRatings++;
                }
              });
            }
          });

          const averageProductRating =
            totalRatings > 0 ? totalProductRating / totalRatings : 0;

          // Count total customers/followers
          const totalCustomers = await Customer.countDocuments({
            following: msme._id,
          });

          // Count blog posts and calculate blog views
          const blogPosts = await MsmeBlogPost.find({
            msmeId: msme._id,
          }).lean();
          const totalBlogs = blogPosts.length;
          const blogViews = blogPosts.reduce(
            (total, blog) => total + (blog.views || 0),
            0
          );

          // Get page views for customer engagement (fallback to mock data if no PageView collection)
          let pageViews = 0;
          try {
            pageViews = await PageView.countDocuments({ msmeId: msme._id });
          } catch (pageViewError) {
            // If PageView collection doesn't exist, generate realistic mock data
            pageViews = Math.floor(Math.random() * 1000) + 200;
          }

          // Store rating (from MSME model)
          const storeRating = msme.averageRating || 0;

          // Determine rating categories
          const getPerformanceCategory = (rating) => {
            if (rating >= 4.5) return "excellent";
            if (rating >= 3.5) return "good";
            if (rating >= 2.5) return "average";
            return "poor";
          };

          // Calculate customer engagement score (combination of page views, followers, and interactions)
          const baseEngagement =
            pageViews + totalCustomers * 10 + Math.floor(blogViews * 0.1);
          const customerEngagement = Math.max(
            baseEngagement,
            totalCustomers * 50
          ); // Ensure minimum engagement

          // Calculate additional metrics for modal
          let storeReviewCount = 0;
          try {
            const totalStoreReviews = await Product.aggregate([
              { $match: { msmeId: msme._id } },
              { $unwind: "$feedback" },
              { $count: "total" },
            ]);
            storeReviewCount =
              totalStoreReviews.length > 0 ? totalStoreReviews[0].total : 0;
          } catch (aggregateError) {
            // Fallback to manual count
            storeReviewCount = totalRatings;
          }

          // Extract owner name more reliably
          let ownerName = "Unknown Owner";
          if (msme.firstname || msme.lastname) {
            ownerName = `${msme.firstname || ""} ${msme.lastname || ""}`.trim();
          } else if (msme.email) {
            ownerName = msme.email.split("@")[0];
          }

          const reportData = {
            _id: msme._id.toString(),
            businessName: msme.businessName || "Unnamed Business",
            ownerName: ownerName,
            businessType: msme.category || msme.businessType || "General",

            // Customer Engagement
            customerEngagement: Math.round(customerEngagement),
            profileViews: pageViews, // Keep for backward compatibility
            totalCustomers,
            storeVisits: pageViews,
            customerRetention:
              totalCustomers > 0
                ? Math.min(
                    Math.round((totalCustomers / Math.max(pageViews, 1)) * 100),
                    100
                  )
                : 0,

            // Media Marketing
            totalBlogs,
            blogViews,

            // Product Performance
            totalProducts,
            productRating: Number(averageProductRating.toFixed(1)),
            productRatingCategory: getPerformanceCategory(averageProductRating),

            // Store Performance
            storeRating: Number(storeRating.toFixed(1)),
            storePerformance: Number(storeRating.toFixed(1)), // Keep for backward compatibility
            storePerformanceCategory: getPerformanceCategory(storeRating),
            totalStoreReviews: storeReviewCount,
            responseRate: Math.floor(Math.random() * 30) + 70, // Mock response rate 70-100%

            // Status and metadata
            status:
              msme.status === "approved" ? "active" : msme.status || "pending",
            createdAt: msme.createdAt,
            lastActivity: msme.updatedAt || msme.createdAt,

            // Financial metrics (mock data - replace with real data when available)
            averageOrderValue: Math.floor(Math.random() * 2500) + 1500,
            monthlyRevenue: Math.floor(Math.random() * 80000) + 40000,
          };

          console.log(
            `Processed ${msme.businessName}: ${totalProducts} products, ${totalBlogs} blogs, ${totalCustomers} customers`
          );
          return reportData;
        } catch (error) {
          console.error(
            `Error processing MSME ${msme.businessName || msme._id}:`,
            error
          );
          return null;
        }
      })
    );

    // Filter out null results from errors
    const validReports = msmeReports.filter((report) => report !== null);

    console.log(`Successfully processed ${validReports.length} MSME reports`);

    res.json({
      success: true,
      data: validReports,
      count: validReports.length,
      message: `Retrieved ${validReports.length} MSME reports successfully`,
    });
  } catch (error) {
    console.error("Error fetching MSME reports:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching MSME reports: " + error.message,
      data: [],
    });
  }
});

// Get monthly growth data for analytics charts
app.get("/api/admin/analytics/monthly-growth", async (req, res) => {
  try {
    console.log("Fetching monthly growth data for analytics...");

    // Get all approved MSMEs
    const msmes = await MSME.find({ status: "approved" });
    console.log(`Found ${msmes.length} approved MSMEs`);

    // Generate data for the last 12 months
    const now = new Date();
    const months = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: monthNames[monthDate.getMonth()],
        date: monthDate,
        year: monthDate.getFullYear(),
      });
    }

    const monthlyData = {
      months: months.map((m) => m.name),
      stores: [],
    };

    // Process each MSME
    for (const msme of msmes) {
      const storeData = {
        name: msme.businessName,
        ratings: [],
        views: [],
        color: getStoreColor(msme.businessName),
      };

      // Get products for rating data
      const products = await Product.find({ msmeId: msme._id });

      // Generate monthly data for each month
      for (let i = 0; i < months.length; i++) {
        const currentMonth = months[i];
        const nextMonth =
          i === months.length - 1
            ? now
            : new Date(
                months[i + 1].year,
                monthNames.indexOf(months[i + 1].name),
                1
              );

        // Calculate average rating for products in this month
        let monthRating = 0;
        let totalRatings = 0;

        products.forEach((product) => {
          if (product.feedback && product.feedback.length > 0) {
            const monthFeedbacks = product.feedback.filter((feedback) => {
              const feedbackDate = new Date(feedback.createdAt);
              return (
                feedbackDate >= currentMonth.date && feedbackDate < nextMonth
              );
            });

            if (monthFeedbacks.length > 0) {
              const avgRating =
                monthFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) /
                monthFeedbacks.length;
              monthRating += avgRating;
              totalRatings++;
            }
          }
        });

        // Calculate rating (use actual data or store's average rating)
        const finalRating =
          totalRatings > 0
            ? monthRating / totalRatings
            : msme.averageRating || 4.0;

        storeData.ratings.push(Math.round(finalRating * 10) / 10);

        // Get real PageView data for this month
        try {
          const monthViews = await PageView.countDocuments({
            storeId: msme._id,
            viewDate: {
              $gte: currentMonth.date,
              $lt: nextMonth,
            },
          });
          storeData.views.push(monthViews);
        } catch (error) {
          console.error(
            `Error getting PageView data for ${msme.businessName}:`,
            error
          );
          // Fallback to a small realistic number if PageView query fails
          storeData.views.push(0);
        }
      }

      monthlyData.stores.push(storeData);
    }

    function getStoreColor(businessName) {
      const colors = [
        "#313131",
        "#7ed957",
        "#f59e0b",
        "#8b5cf6",
        "#ef4444",
        "#06b6d4",
      ];
      const hash = businessName.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      return colors[Math.abs(hash) % colors.length];
    }

    console.log("Monthly growth data generated successfully");

    res.json({
      success: true,
      monthlyData: monthlyData,
    });
  } catch (error) {
    console.error("Error fetching monthly growth data:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching monthly growth data",
    });
  }
});

// Get hot picks products for analytics
app.get("/api/admin/hot-picks", async (req, res) => {
  try {
    console.log("Fetching hot picks products...");

    // Get all products with their MSME data
    const products = await Product.find({})
      .populate("msmeId", "businessName")
      .exec();

    console.log(`Found ${products.length} total products`);

    // Calculate engagement score for each product
    const productScores = products.map((product) => {
      let score = 0;
      let ratingSum = 0;
      let ratingCount = 0;

      // Factor in feedback ratings
      if (product.feedback && product.feedback.length > 0) {
        product.feedback.forEach((feedback) => {
          ratingSum += feedback.rating;
          ratingCount++;
        });
        const avgRating = ratingSum / ratingCount;
        score += avgRating * 20; // Weight ratings heavily
      }

      // Factor in pageviews
      if (product.pageviews && product.pageviews.length > 0) {
        score += product.pageviews.length * 2; // Each pageview adds 2 points
      }

      // Factor in recent activity (more recent = higher score)
      const now = new Date();
      const daysDiff =
        (now - new Date(product.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysDiff < 30) score += 10; // Bonus for recent products
      if (daysDiff < 7) score += 20; // Extra bonus for very recent

      return {
        _id: product._id,
        productName: product.productName,
        storeName: product.msmeId
          ? product.msmeId.businessName
          : "Unknown Store",
        score: score,
        rating: ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : null,
        totalViews: product.pageviews ? product.pageviews.length : 0,
        totalReviews: product.feedback ? product.feedback.length : 0,
      };
    });

    // Sort by score and take top products
    const topProducts = productScores
      .filter((product) => product.score > 0) // Only products with some engagement
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 products

    console.log(`Found ${topProducts.length} top products`);

    // Calculate percentages
    const totalScore = topProducts.reduce(
      (sum, product) => sum + product.score,
      0
    );
    const productsWithPercentages = topProducts.map((product) => ({
      ...product,
      percentage:
        totalScore > 0
          ? ((product.score / totalScore) * 100).toFixed(1)
          : "0.0",
    }));

    console.log("Hot picks data generated successfully");

    res.json({
      success: true,
      products: productsWithPercentages,
    });
  } catch (error) {
    console.error("Error fetching hot picks data:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching hot picks data",
    });
  }
});

// Get customer's reviews/feedback
app.get("/api/customers/:customerId/reviews", async (req, res) => {
  try {
    const { customerId } = req.params;

    // Try to find customer by MongoDB _id first, then by custom id field
    let customer = await Customer.findById(customerId);
    if (!customer) {
      customer = await Customer.findOne({ id: customerId });
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    console.log(
      `Looking for reviews for customer: ${customer.firstname} ${customer.lastname} (MongoDB ID: ${customer._id}, Custom ID: ${customer.id})`
    );

    // Find all products that have feedback from this customer
    const customerName = `${customer.firstname} ${customer.lastname}`.trim();

    // Search by both MongoDB _id and custom id
    const products = await Product.find({
      $or: [
        { "feedback.userId": customer._id.toString() },
        { "feedback.userId": customer.id },
        { "feedback.user": customerName },
      ],
    }).populate("msmeId", "businessName username");

    console.log(
      `Found ${products.length} products with feedback for customer ${customerName}`
    );

    // Extract reviews made by this customer
    const customerReviews = [];

    products.forEach((product) => {
      const customerFeedback = product.feedback.filter(
        (fb) =>
          fb.userId === customer._id.toString() ||
          fb.userId === customer.id ||
          fb.user === customerName
      );

      console.log(
        `Product ${product.productName}: found ${customerFeedback.length} reviews`
      );

      customerFeedback.forEach((feedback) => {
        customerReviews.push({
          _id: feedback._id,
          productId: product._id,
          productName: product.productName,
          productImage: product.picture,
          rating: feedback.rating,
          comment: feedback.comment,
          createdAt: feedback.createdAt,
          store: product.msmeId,
          selectedVariant: feedback.selectedVariant || null,
          selectedSize: feedback.selectedSize || null,
        });
      });
    });

    console.log(`Total customer reviews found: ${customerReviews.length}`);

    // Sort by most recent first
    customerReviews.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      reviews: customerReviews,
    });
  } catch (error) {
    console.error("Error fetching customer reviews:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching reviews",
    });
  }
});

// Edit customer review
app.put("/api/reviews/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, customerId } = req.body;

    // Validate input
    if (!rating || !comment || !customerId) {
      return res.status(400).json({
        success: false,
        error: "Rating, comment, and customer ID are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    // Find the product that contains this review
    const product = await Product.findOne({
      "feedback._id": reviewId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    // Find the specific review
    const review = product.feedback.id(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    // Verify that the customer owns this review
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const customerName = `${customer.firstname} ${customer.lastname}`.trim();
    const isOwner =
      review.userId === customer._id.toString() ||
      review.userId === customer.id ||
      review.user === customerName;

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: "You can only edit your own reviews",
      });
    }

    // Update the review
    review.rating = rating;
    review.comment = comment;
    review.updatedAt = new Date();

    // Save the product with updated review
    await product.save();

    // Recalculate product rating
    const ratings = product.feedback.map((fb) => fb.rating);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null;

    product.rating = averageRating;
    await product.save();

    console.log(`Review ${reviewId} updated by customer ${customerName}`);

    res.json({
      success: true,
      message: "Review updated successfully",
      review: {
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        updatedAt: review.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({
      success: false,
      error: "Error updating review",
    });
  }
});

// Delete customer review
app.delete("/api/reviews/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { customerId } = req.body;

    // Validate customer ID
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required",
      });
    }

    // Find the product that contains this review
    const product = await Product.findOne({
      "feedback._id": reviewId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    // Find the specific review
    const review = product.feedback.id(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    // Verify that the customer owns this review
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const customerName = `${customer.firstname} ${customer.lastname}`.trim();
    const isOwner =
      review.userId === customer._id.toString() ||
      review.userId === customer.id ||
      review.user === customerName;

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own reviews",
      });
    }

    // Remove the review
    product.feedback.pull({ _id: reviewId });

    // Recalculate product rating
    const ratings = product.feedback.map((fb) => fb.rating);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null;

    product.rating = averageRating;

    // Save the product
    await product.save();

    console.log(`Review ${reviewId} deleted by customer ${customerName}`);

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting review",
    });
  }
});

// Toggle review visibility (hide/show) for MSME
app.put("/api/reviews/:reviewId/visibility", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { msmeId, hidden } = req.body;

    // Validate MSME ID
    if (!msmeId) {
      return res.status(400).json({
        success: false,
        error: "MSME ID is required",
      });
    }

    // Find the product that contains this review
    const product = await Product.findOne({
      "feedback._id": reviewId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    // Verify that the MSME owns this product
    if (product.msmeId.toString() !== msmeId) {
      return res.status(403).json({
        success: false,
        error: "You can only manage reviews for your own products",
      });
    }

    // Find the specific review
    const review = product.feedback.id(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        error: "Review not found",
      });
    }

    // Toggle or set hidden status
    review.hidden = hidden !== undefined ? hidden : !review.hidden;

    // Save the product
    await product.save();

    console.log(
      `Review ${reviewId} ${
        review.hidden ? "hidden" : "shown"
      } by MSME ${msmeId}`
    );

    res.json({
      success: true,
      message: `Review ${review.hidden ? "hidden" : "shown"} successfully`,
      reviewId: reviewId,
      hidden: review.hidden,
    });
  } catch (error) {
    console.error("Error toggling review visibility:", error);
    res.status(500).json({
      success: false,
      error: "Error toggling review visibility",
    });
  }
});

// Get store reviews for MSME (all reviews for products belonging to the store)
app.get("/api/stores/:storeId/reviews", async (req, res) => {
  try {
    const { storeId } = req.params;

    // Validate store exists
    const store = await MSME.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        error: "Store not found",
      });
    }

    // Get all products belonging to this store
    const storeProducts = await Product.find({ msmeId: storeId });
    const productIds = storeProducts.map((product) => product._id);

    if (productIds.length === 0) {
      return res.json({
        success: true,
        reviews: [],
        message: "No products found for this store",
      });
    }

    // Find all reviews for the store's products
    const reviews = [];

    for (const product of storeProducts) {
      if (product.feedback && product.feedback.length > 0) {
        // Filter out hidden reviews from customer view
        const visibleFeedbacks = product.feedback.filter(
          (feedback) => !feedback.hidden
        );

        for (const feedback of visibleFeedbacks) {
          // Get customer details if userId exists
          let customer = null;
          if (feedback.userId) {
            try {
              customer = await Customer.findById(feedback.userId).select(
                "firstname lastname"
              );
            } catch (customerError) {
              console.warn(
                `Could not find customer with ID: ${feedback.userId}`,
                customerError.message
              );
              customer = null;
            }
          }

          // Create masked customer info for privacy
          let maskedCustomer = null;
          if (customer) {
            maskedCustomer = {
              firstname: maskCustomerFromObject(customer),
              lastname: "", // Don't show lastname separately
              maskedName: maskCustomerFromObject(customer),
            };
          } else if (feedback.user) {
            // Handle legacy reviews that have user name directly
            maskedCustomer = {
              firstname: maskCustomerName(feedback.user),
              lastname: "",
              maskedName: maskCustomerName(feedback.user),
            };
          }

          reviews.push({
            _id: feedback._id || `${product._id}_${reviews.length}`,
            productId: product._id,
            product: {
              productName: product.productName,
              picture: product.picture,
            },
            customer: maskedCustomer,
            userName: maskedCustomer ? maskedCustomer.maskedName : "Anonymous",
            rating: feedback.rating,
            comment: feedback.comment,
            createdAt: feedback.createdAt || new Date(),
          });
        }
      }
    }

    // Sort reviews by creation date (newest first)
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(
      `Found ${reviews.length} reviews for store ${store.businessName}`
    );

    res.json({
      success: true,
      reviews: reviews,
      totalReviews: reviews.length,
      storeName: store.businessName,
    });
  } catch (error) {
    console.error("Error fetching store reviews:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching store reviews",
    });
  }
});

// --- Customer Favorites Routes ---
// Toggle product favorite (add/remove)
app.post(
  "/api/customers/:customerId/favorites/:productId",
  async (req, res) => {
    try {
      const { customerId, productId } = req.params;

      // Validate customer exists
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: "Customer not found",
        });
      }

      // Validate product exists
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Product not found",
        });
      }

      // Check if product is already in favorites
      const isFavorite = customer.favorites.includes(productId);

      if (isFavorite) {
        // Remove from favorites
        customer.favorites = customer.favorites.filter(
          (id) => id.toString() !== productId
        );
        await customer.save();

        res.json({
          success: true,
          message: `${product.productName} removed from favorites`,
          action: "removed",
          isFavorite: false,
        });
      } else {
        // Add to favorites
        customer.favorites.push(productId);
        await customer.save();

        // Create notification for store owner
        await createNotification(
          product.msmeId,
          customerId,
          "product_favorite",
          productId
        );

        res.json({
          success: true,
          message: `${product.productName} added to favorites`,
          action: "added",
          isFavorite: true,
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({
        success: false,
        error: "Error updating favorites",
      });
    }
  }
);

// Get customer's favorite products
app.get("/api/customers/:customerId/favorites", async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId).populate({
      path: "favorites",
      populate: {
        path: "msmeId",
        select: "businessName username",
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Filter out any null favorites (in case of deleted products)
    const validFavorites = customer.favorites.filter((fav) => fav != null);

    res.json({
      success: true,
      favorites: validFavorites,
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching favorites",
    });
  }
});

// Check if product is favorited by customer
app.get(
  "/api/customers/:customerId/favorites/:productId/check",
  async (req, res) => {
    try {
      const { customerId, productId } = req.params;

      const customer = await Customer.findById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: "Customer not found",
        });
      }

      const isFavorite = customer.favorites.includes(productId);

      res.json({
        success: true,
        isFavorite,
      });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({
        success: false,
        error: "Error checking favorite status",
      });
    }
  }
);

// Get favorites count for customer
app.get("/api/customers/:customerId/favorites/count", async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    const count = customer.favorites ? customer.favorites.length : 0;

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error fetching favorites count:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching favorites count",
    });
  }
});

// --- Notification Routes ---

// Get notifications for a store
app.get("/api/notifications/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const notifications = await Notification.find({ storeId })
      .populate("customerId", "name")
      .populate("productId", "name")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const unreadCount = await Notification.countDocuments({
      storeId,
      isRead: false,
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching notifications",
    });
  }
});

// Mark notification as read
app.put("/api/notifications/:notificationId/read", async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndUpdate(notificationId, { isRead: true });

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      error: "Error marking notification as read",
    });
  }
});

// Mark all notifications as read for a store
app.put("/api/notifications/:storeId/read-all", async (req, res) => {
  try {
    const { storeId } = req.params;

    await Notification.updateMany({ storeId, isRead: false }, { isRead: true });

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      error: "Error marking all notifications as read",
    });
  }
});

// Delete single notification
app.delete("/api/notifications/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;

    const deletedNotification = await Notification.findByIdAndDelete(
      notificationId
    );

    if (!deletedNotification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting notification",
    });
  }
});

// Delete multiple notifications
app.delete("/api/notifications/delete-multiple", async (req, res) => {
  try {
    const { notificationIds, storeId } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        error: "Invalid notification IDs provided",
      });
    }

    // Delete notifications that belong to the store
    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      storeId: storeId,
    });

    res.json({
      success: true,
      message: `${result.deletedCount} notifications deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting multiple notifications:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting notifications",
    });
  }
});

// Delete all notifications for a store
app.delete("/api/notifications/:storeId/delete-all", async (req, res) => {
  try {
    const { storeId } = req.params;

    const result = await Notification.deleteMany({ storeId });

    res.json({
      success: true,
      message: `All ${result.deletedCount} notifications deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting all notifications",
    });
  }
});

// Create notification (internal helper function)
async function createNotification(storeId, customerId, type, productId = null) {
  try {
    console.log("Creating notification:", {
      storeId,
      customerId,
      type,
      productId,
    });

    const customer = await Customer.findById(customerId);
    if (!customer) {
      console.log("Customer not found for notification:", customerId);
      return;
    }

    // Create customer display name
    const customerName =
      customer.firstname && customer.lastname
        ? `${customer.firstname} ${customer.lastname}`
        : customer.username || "A customer";

    let message;
    if (type === "store_follow") {
      message = `${customerName} started following your store`;
    } else if (type === "product_favorite") {
      const product = await Product.findById(productId);
      const productName =
        product?.productName || product?.name || "Unknown Product";
      message = `${customerName} favorited your product "${productName}"`;
    }

    const notification = new Notification({
      storeId,
      customerId,
      type,
      productId,
      message,
    });

    await notification.save();
    console.log(`✅ Notification created successfully: ${message}`);
  } catch (error) {
    console.error("❌ Error creating notification:", error);
  }
}

// Debug endpoint to check dashboard data
app.get("/api/debug/dashboards", async (req, res) => {
  try {
    const dashboards = await Dashboard.find({})
      .populate("msmeId", "businessName username")
      .limit(10);

    const dashboardInfo = dashboards.map((dashboard) => ({
      msmeId: dashboard.msmeId?._id,
      businessName: dashboard.msmeId?.businessName || dashboard.businessName,
      username: dashboard.msmeId?.username,
      storeLogo: dashboard.storeLogo,
      coverPhoto: dashboard.coverPhoto,
      description: dashboard.description,
      location: dashboard.location,
      hasStoreLogo: !!dashboard.storeLogo,
      hasCoverPhoto: !!dashboard.coverPhoto,
      createdAt: dashboard.createdAt,
    }));

    res.json({
      success: true,
      count: dashboards.length,
      dashboards: dashboardInfo,
    });
  } catch (error) {
    console.error("Error fetching dashboard debug info:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching dashboard data",
    });
  }
});

// --- Customer Notification Routes ---

// Get notifications for a customer
app.get("/api/customer-notifications/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const notifications =
      await CustomerNotificationService.getCustomerNotifications(
        customerId,
        parseInt(limit),
        parseInt(offset)
      );

    const unreadCount = await CustomerNotificationService.getUnreadCount(
      customerId
    );

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching customer notifications:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching notifications",
    });
  }
});

// Get unread notification count for a customer
app.get(
  "/api/customer-notifications/:customerId/unread-count",
  async (req, res) => {
    try {
      const { customerId } = req.params;
      const unreadCount = await CustomerNotificationService.getUnreadCount(
        customerId
      );

      res.json({
        success: true,
        unreadCount,
      });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({
        success: false,
        error: "Error fetching unread count",
      });
    }
  }
);

// Mark customer notification as read
app.put(
  "/api/customer-notifications/:notificationId/read",
  async (req, res) => {
    try {
      const { notificationId } = req.params;
      const { customerId } = req.body;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: "Customer ID is required",
        });
      }

      await CustomerNotificationService.markAsRead(notificationId, customerId);

      res.json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (error) {
      console.error("Error marking customer notification as read:", error);
      res.status(500).json({
        success: false,
        error: "Error marking notification as read",
      });
    }
  }
);

// Mark all customer notifications as read
app.put(
  "/api/customer-notifications/:customerId/read-all",
  async (req, res) => {
    try {
      const { customerId } = req.params;

      await CustomerNotificationService.markAllAsRead(customerId);

      res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all customer notifications as read:", error);
      res.status(500).json({
        success: false,
        error: "Error marking all notifications as read",
      });
    }
  }
);

// Delete a customer notification
app.delete("/api/customer-notifications/:notificationId", async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required",
      });
    }

    await CustomerNotificationService.deleteNotification(
      notificationId,
      customerId
    );

    res.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer notification:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting notification",
    });
  }
});

// Delete multiple customer notifications
app.delete("/api/customer-notifications/delete-multiple", async (req, res) => {
  try {
    const { notificationIds, customerId } = req.body;

    if (!customerId || !notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        error: "Customer ID and notification IDs array are required",
      });
    }

    if (notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one notification ID is required",
      });
    }

    // Delete multiple notifications
    const result = await CustomerNotification.deleteMany({
      _id: { $in: notificationIds },
      customerId: customerId,
    });

    res.json({
      success: true,
      message: `${result.deletedCount} notifications deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting multiple customer notifications:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting notifications",
    });
  }
});

// Delete all customer notifications
app.delete(
  "/api/customer-notifications/:customerId/delete-all",
  async (req, res) => {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          error: "Customer ID is required",
        });
      }

      // Delete all notifications for the customer
      const result = await CustomerNotification.deleteMany({
        customerId: customerId,
      });

      res.json({
        success: true,
        message: `All ${result.deletedCount} notifications deleted successfully`,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error deleting all customer notifications:", error);
      res.status(500).json({
        success: false,
        error: "Error deleting all notifications",
      });
    }
  }
);

// Create price drop notification
app.post("/api/customer-notifications/price-drop", async (req, res) => {
  try {
    const { storeId, productId, oldPrice, newPrice } = req.body;

    if (!storeId || !productId || !oldPrice || !newPrice) {
      return res.status(400).json({
        success: false,
        error: "Store ID, Product ID, old price, and new price are required",
      });
    }

    const result = await CustomerNotificationService.notifyFollowersOfPriceDrop(
      storeId,
      productId,
      oldPrice,
      newPrice
    );

    res.json({
      success: true,
      message: "Price drop notifications sent successfully",
      notificationsCreated: result.length,
    });
  } catch (error) {
    console.error("Error creating price drop notifications:", error);
    res.status(500).json({
      success: false,
      error: "Error creating price drop notifications",
    });
  }
});

// Create availability alert notification
app.post("/api/customer-notifications/availability-alert", async (req, res) => {
  try {
    const { storeId, productId, availability } = req.body;

    if (!storeId || !productId || availability === undefined) {
      return res.status(400).json({
        success: false,
        error: "Store ID, Product ID, and availability status are required",
      });
    }

    const result =
      await CustomerNotificationService.notifyFollowersOfAvailabilityAlert(
        storeId,
        productId,
        availability
      );

    res.json({
      success: true,
      message: "Availability alert notifications sent successfully",
      notificationsCreated: result.length,
    });
  } catch (error) {
    console.error("Error creating availability alert notifications:", error);
    res.status(500).json({
      success: false,
      error: "Error creating availability alert notifications",
    });
  }
});

// Create store promotion notification
app.post("/api/customer-notifications/promotion", async (req, res) => {
  try {
    const { storeId, title, message, actionUrl } = req.body;

    if (!storeId || !title || !message) {
      return res.status(400).json({
        success: false,
        error: "Store ID, title, and message are required",
      });
    }

    const result = await CustomerNotificationService.notifyFollowersOfPromotion(
      storeId,
      title,
      message,
      actionUrl
    );

    res.json({
      success: true,
      message: "Promotion notifications sent successfully",
      notificationsCreated: result.length,
    });
  } catch (error) {
    console.error("Error creating promotion notifications:", error);
    res.status(500).json({
      success: false,
      error: "Error creating promotion notifications",
    });
  }
});

// Create custom notification
app.post("/api/customer-notifications/custom", async (req, res) => {
  try {
    const { customerIds, storeId, notificationData } = req.body;

    if (
      !customerIds ||
      !Array.isArray(customerIds) ||
      customerIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Customer IDs array is required",
      });
    }

    if (!storeId || !notificationData) {
      return res.status(400).json({
        success: false,
        error: "Store ID and notification data are required",
      });
    }

    const result = await CustomerNotificationService.createCustomNotification(
      customerIds,
      storeId,
      notificationData
    );

    res.json({
      success: true,
      message: "Custom notifications sent successfully",
      notificationsCreated: result.length,
    });
  } catch (error) {
    console.error("Error creating custom notifications:", error);
    res.status(500).json({
      success: false,
      error: "Error creating custom notifications",
    });
  }
});

// --- Upload Routes ---
app.post("/api/upload", upload.single("media"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    res.json({
      success: true,
      filename: req.file.path, // Cloudinary URL
      url: req.file.path, // Cloudinary URL
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      publicId: req.file.public_id, // Cloudinary public ID for future operations
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({
      success: false,
      error: "Error uploading file",
    });
  }
});

// Cloudinary image operations endpoints
app.post("/api/cloudinary/optimize-image", (req, res) => {
  try {
    const { publicId, transformations = [] } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: "Public ID is required",
      });
    }

    const optimizedUrl = getOptimizedUrl(publicId, transformations);
    const responsiveImages = generateResponsiveImages(publicId);

    res.json({
      success: true,
      optimizedUrl,
      responsiveImages,
    });
  } catch (error) {
    console.error("Error optimizing image:", error);
    res.status(500).json({
      success: false,
      error: "Error optimizing image",
    });
  }
});

app.delete("/api/cloudinary/delete/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType = "image" } = req.query;

    const result = await deleteFromCloudinary(publicId, resourceType);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting from Cloudinary",
    });
  }
});

// --- Blog Post Routes ---
// Get all blog posts
app.get("/api/blog-posts", async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    const posts = await BlogPost.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      posts: posts,
    });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching blog posts",
    });
  }
});

// Get published blog posts for frontend
app.get("/api/blog-posts/published", async (req, res) => {
  try {
    const posts = await BlogPost.find({ status: "published" }).sort({
      featured: -1,
      createdAt: -1,
    });

    res.json({
      success: true,
      posts: posts,
    });
  } catch (error) {
    console.error("Error fetching published blog posts:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching published blog posts",
    });
  }
});

// Create new blog post
app.post("/api/blog-posts", async (req, res) => {
  try {
    const blogPost = new BlogPost(req.body);
    await blogPost.save();

    res.json({
      success: true,
      post: blogPost,
      message: "Blog post created successfully",
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).json({
      success: false,
      error: "Error creating blog post",
    });
  }
});

// Update blog post
app.put("/api/blog-posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPost = await BlogPost.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    res.json({
      success: true,
      post: updatedPost,
      message: "Blog post updated successfully",
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    res.status(500).json({
      success: false,
      error: "Error updating blog post",
    });
  }
});

// Delete blog post
app.delete("/api/blog-posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPost = await BlogPost.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    res.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting blog post",
    });
  }
});

// Increment blog post views
app.post("/api/blog-posts/:id/increment-views", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    // Increment views using the model method
    await post.incrementViews();

    res.json({
      success: true,
      message: "Views incremented successfully",
      post: {
        _id: post._id,
        views: post.views,
        title: post.title,
      },
    });
  } catch (error) {
    console.error("Error incrementing blog post views:", error);
    res.status(500).json({
      success: false,
      error: "Error incrementing views",
    });
  }
});

// --- MSME Blog Posts Routes ---

// Get all published blog posts for a specific MSME
app.get("/api/msme/:msmeId/blog-posts", async (req, res) => {
  try {
    const { msmeId } = req.params;
    const blogPosts = await MsmeBlogPost.findPublishedByMsme(msmeId);

    res.json({
      success: true,
      blogPosts,
    });
  } catch (error) {
    console.error("Error fetching MSME blog posts:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching blog posts",
    });
  }
});

// Get all blog posts for a specific MSME (including drafts)
app.get("/api/msme/:msmeId/blog-posts/all", async (req, res) => {
  try {
    const { msmeId } = req.params;
    const posts = await MsmeBlogPost.find({ msmeId })
      .sort({ featured: -1, createdAt: -1 })
      .populate("msmeId", "businessName username");

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Error fetching MSME blog posts:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching blog posts",
    });
  }
});

// Create new MSME blog post
app.post("/api/msme/blog-posts", upload.single("media"), async (req, res) => {
  try {
    const {
      msmeId,
      title,
      subtitle,
      description,
      mediaType,
      mediaUrl,
      category,
      featured,
      status,
    } = req.body;

    let finalMediaUrl = mediaUrl;

    // Handle file upload with Cloudinary
    if (req.file && (mediaType === "image" || mediaType === "video")) {
      finalMediaUrl = req.file.path; // Cloudinary URL
    }

    const newPost = new MsmeBlogPost({
      msmeId,
      title,
      subtitle,
      description,
      mediaType,
      mediaUrl: finalMediaUrl,
      category,
      featured: featured === "true",
      status: status || "published",
    });

    const savedPost = await newPost.save();

    // Send email notifications to followers if the post is published
    if (savedPost.status === "published") {
      try {
        await StoreActivityNotificationService.notifyFollowersOfNewBlogPost(
          msmeId,
          savedPost._id,
          {
            title: savedPost.title,
            subtitle: savedPost.subtitle,
            description: savedPost.description,
            category: savedPost.category,
            mediaUrl: savedPost.mediaUrl,
            mediaType: savedPost.mediaType,
          }
        );
      } catch (notificationError) {
        console.error(
          "Error sending blog post notifications:",
          notificationError
        );
        // Continue with blog post creation response even if notifications fail
      }
    }

    res.json({
      success: true,
      message: "Blog post created successfully",
      post: savedPost,
    });
  } catch (error) {
    console.error("Error creating MSME blog post:", error);
    res.status(500).json({
      success: false,
      error: "Error creating blog post",
    });
  }
});

// Update MSME blog post
app.put(
  "/api/msme/blog-posts/:id",
  upload.single("media"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        subtitle,
        description,
        mediaType,
        mediaUrl,
        category,
        featured,
        status,
      } = req.body;

      // Get the original post to check status change
      const originalPost = await MsmeBlogPost.findById(id);
      if (!originalPost) {
        return res.status(404).json({
          success: false,
          error: "Blog post not found",
        });
      }

      const updateData = {
        title,
        subtitle,
        description,
        mediaType,
        category,
        featured: featured === "true",
        status,
        updatedAt: Date.now(),
      };

      // Handle media update with Cloudinary
      if (req.file && (mediaType === "image" || mediaType === "video")) {
        updateData.mediaUrl = req.file.path; // Cloudinary URL
      } else if (mediaUrl) {
        updateData.mediaUrl = mediaUrl;
      }

      const updatedPost = await MsmeBlogPost.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      // Send email notifications if the post was just published (status changed from draft to published)
      if (
        originalPost.status === "draft" &&
        updatedPost.status === "published"
      ) {
        try {
          await StoreActivityNotificationService.notifyFollowersOfNewBlogPost(
            updatedPost.msmeId,
            updatedPost._id,
            {
              title: updatedPost.title,
              subtitle: updatedPost.subtitle,
              description: updatedPost.description,
              category: updatedPost.category,
              mediaUrl: updatedPost.mediaUrl,
              mediaType: updatedPost.mediaType,
            }
          );
        } catch (notificationError) {
          console.error(
            "Error sending blog post publication notifications:",
            notificationError
          );
          // Continue with blog post update response even if notifications fail
        }
      }

      res.json({
        success: true,
        message: "Blog post updated successfully",
        post: updatedPost,
      });
    } catch (error) {
      console.error("Error updating MSME blog post:", error);
      res.status(500).json({
        success: false,
        error: "Error updating blog post",
      });
    }
  }
);

// Delete MSME blog post
app.delete("/api/msme/blog-posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPost = await MsmeBlogPost.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    res.json({
      success: true,
      message: "Blog post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting MSME blog post:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting blog post",
    });
  }
});

// Get single MSME blog post and increment views
app.get("/api/msme/blog-posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await MsmeBlogPost.findById(id).populate(
      "msmeId",
      "businessName username"
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        error: "Blog post not found",
      });
    }

    // Increment views
    await post.incrementViews();

    res.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error("Error fetching MSME blog post:", error);
    res.status(500).json({
      success: false,
      error: "Error fetching blog post",
    });
  }
});

// --- Legacy User Routes (keep for backward compatibility) ---
app.post("/api/users", async (req, res) => {
  // ... existing user routes ...
});

// Socket.IO connection handling
const connectedUsers = new Map(); // Store connected users

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  // User joins their personal room for notifications
  socket.on("join_user_room", (userData) => {
    const { userId, userType } = userData;
    socket.join(`user_${userId}`);
    connectedUsers.set(socket.id, { userId, userType });
    console.log(`👤 ${userType} ${userId} joined their room`);

    // Notify user they're online
    socket.broadcast.emit("user_online", { userId, userType });
  });

  // Join specific conversation
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`💬 User joined conversation ${conversationId}`);
  });

  // Handle sending messages
  socket.on("send_message", async (messageData) => {
    try {
      const {
        conversationId,
        senderId,
        senderModel,
        receiverId,
        receiverModel,
        message,
        tempId,
      } = messageData;

      // Save message to database
      const newMessage = new Message({
        conversationId,
        senderId,
        senderModel,
        receiverId,
        receiverModel,
        message,
        messageType: "text",
      });

      const savedMessage = await newMessage.save();

      // Update conversation
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: savedMessage._id,
        lastActivity: new Date(),
      });

      // Populate message with sender info
      const populatedMessage = await Message.findById(savedMessage._id)
        .populate("senderId", "firstname lastname businessName username email")
        .populate(
          "receiverId",
          "firstname lastname businessName username email"
        );

      // Send to conversation participants
      socket
        .to(`conversation_${conversationId}`)
        .emit("receive_message", populatedMessage);

      // Send to receiver's personal room (for notifications)
      socket.to(`user_${receiverId}`).emit("new_message_notification", {
        conversationId,
        sender: populatedMessage.senderId,
        message: populatedMessage.message,
        timestamp: populatedMessage.createdAt,
      });

      // Create persistent notification in database
      try {
        if (receiverModel === "Customer") {
          // Create notification for customer
          await CustomerNotification.createNewMessageNotification(
            receiverId,
            senderId,
            savedMessage._id,
            conversationId,
            populatedMessage.senderId.businessName ||
              populatedMessage.senderId.username,
            populatedMessage.message
          );
        } else if (receiverModel === "MSME") {
          // Create notification for MSME
          await Notification.createNewMessageNotification(
            receiverId,
            senderId,
            savedMessage._id,
            conversationId,
            `${populatedMessage.senderId.firstname} ${populatedMessage.senderId.lastname}`,
            populatedMessage.message
          );
        }
      } catch (notificationError) {
        console.error(
          "❌ Error creating message notification:",
          notificationError
        );
      }

      // Confirm message sent to sender
      socket.emit("message_sent", {
        tempId,
        messageId: savedMessage._id,
        message: populatedMessage,
      });
    } catch (error) {
      console.error("❌ Error handling message:", error);
      socket.emit("message_error", {
        error: "Failed to send message",
        tempId: messageData.tempId,
      });
    }
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    socket.to(`conversation_${data.conversationId}`).emit("user_typing", data);
  });

  socket.on("stop_typing", (data) => {
    socket
      .to(`conversation_${data.conversationId}`)
      .emit("user_stop_typing", data);
  });

  // Mark messages as read
  socket.on("mark_messages_read", async (data) => {
    try {
      const { conversationId, userId } = data;

      await Message.updateMany(
        {
          conversationId: conversationId,
          receiverId: userId,
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      socket.to(`conversation_${conversationId}`).emit("messages_read", {
        conversationId,
        readBy: userId,
      });
    } catch (error) {
      console.error("❌ Error marking messages as read:", error);
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      socket.broadcast.emit("user_offline", userData);
      connectedUsers.delete(socket.id);
      console.log(`👋 User ${userData.userId} disconnected`);
    } else {
      console.log("🔌 User disconnected:", socket.id);
    }
  });
});

// --- Messaging API Routes ---

// Create or get conversation between two users
app.post("/api/conversations", async (req, res) => {
  try {
    const { userId, userModel, targetId, targetModel } = req.body;

    console.log("💬 Creating/Getting conversation:", {
      userId,
      userModel,
      targetId: targetId,
      targetModel,
      customerToStore: userModel === "Customer" && targetModel === "MSME",
    });

    if (!userId || !userModel || !targetId || !targetModel) {
      console.log("❌ Validation failed - missing required fields");
      return res.status(400).json({
        success: false,
        error: "All user details are required",
      });
    }

    const conversation = await Conversation.findOrCreateConversation(
      userId,
      userModel,
      targetId,
      targetModel
    );

    console.log("✅ Conversation created/found:", {
      conversationId: conversation._id,
      participants: conversation.participants.length,
      storeId: targetModel === "MSME" ? targetId : userId,
      customerId: userModel === "Customer" ? userId : targetId,
    });

    // Find the other participant for the client
    const otherParticipant = conversation.participants.find(
      (p) => p.userId._id.toString() !== userId.toString()
    );

    // Transform conversation data to include otherParticipant field
    const transformedConversation = {
      ...conversation.toObject(),
      otherParticipant: otherParticipant
        ? {
            id: otherParticipant.userId._id,
            name:
              otherParticipant.userModel === "Customer"
                ? `${otherParticipant.userId.firstname} ${otherParticipant.userId.lastname}`
                : otherParticipant.userId.businessName,
            // Add these fields for proper client-side display
            firstname: otherParticipant.userId.firstname,
            lastname: otherParticipant.userId.lastname,
            businessName: otherParticipant.userId.businessName,
            username: otherParticipant.userId.username,
            email: otherParticipant.userId.email,
            userType: otherParticipant.userModel.toLowerCase(),
          }
        : null,
    };

    res.json({
      success: true,
      conversation: transformedConversation,
    });
  } catch (error) {
    console.error("❌ Error creating/getting conversation:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get user's conversations
app.get("/api/users/:userId/conversations", async (req, res) => {
  try {
    const { userId } = req.params;
    const { userModel } = req.query;

    console.log(
      `[CONVERSATIONS] Fetching conversations for user: ${userId}, model: ${userModel}`
    );

    if (!userModel) {
      return res.status(400).json({
        success: false,
        error: "userModel query parameter is required",
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`[CONVERSATIONS] Invalid userId format: ${userId}`);
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format",
      });
    }

    // Find conversations without populate first to debug
    const rawConversations = await Conversation.find({
      "participants.userId": userId,
      isActive: true,
    }).sort({ lastActivity: -1 });

    console.log(
      `[CONVERSATIONS] Found ${rawConversations.length} raw conversations`
    );

    if (rawConversations.length === 0) {
      return res.json({
        success: true,
        conversations: [],
      });
    }

    // Now populate carefully with error handling
    const conversations = await Conversation.find({
      "participants.userId": userId,
      isActive: true,
    })
      .populate([
        {
          path: "participants.userId",
          select: "firstname lastname businessName username email",
        },
        { path: "lastMessage" },
      ])
      .sort({ lastActivity: -1 })
      .lean(); // Use lean for better performance

    console.log(
      `[CONVERSATIONS] Populated ${conversations.length} conversations`
    );

    // Get unread message counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        try {
          const unreadCount = await Message.countDocuments({
            conversationId: conversation._id,
            receiverId: userId,
            isRead: false,
            isDeleted: false,
          });

          // Find the other participant with null checking
          const otherParticipant = conversation.participants?.find(
            (p) => p.userId?._id?.toString() !== userId.toString()
          );

          console.log(
            `[CONVERSATIONS] Processing conversation ${conversation._id}, other participant:`,
            otherParticipant?.userId
          );

          return {
            ...conversation,
            unreadCount,
            otherParticipant:
              otherParticipant && otherParticipant.userId
                ? {
                    id: otherParticipant.userId._id,
                    name:
                      otherParticipant.userModel === "Customer"
                        ? `${otherParticipant.userId.firstname || "Unknown"} ${
                            otherParticipant.userId.lastname || "User"
                          }`
                        : otherParticipant.userId.businessName ||
                          "Unknown Business",
                    // Add these fields for proper client-side display
                    firstname: otherParticipant.userId.firstname,
                    lastname: otherParticipant.userId.lastname,
                    businessName: otherParticipant.userId.businessName,
                    username: otherParticipant.userId.username,
                    email: otherParticipant.userId.email,
                    userType: otherParticipant.userModel?.toLowerCase(),
                  }
                : null,
          };
        } catch (convError) {
          console.error(
            `[CONVERSATIONS] Error processing conversation ${conversation._id}:`,
            convError
          );
          return {
            ...conversation,
            unreadCount: 0,
            otherParticipant: null,
          };
        }
      })
    );

    console.log(
      `[CONVERSATIONS] Successfully processed ${conversationsWithUnread.length} conversations`
    );

    res.json({
      success: true,
      conversations: conversationsWithUnread,
    });
  } catch (error) {
    console.error("[CONVERSATIONS] Error fetching conversations:", error);
    console.error("[CONVERSATIONS] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get messages for a conversation
app.get("/api/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      conversationId: conversationId,
      isDeleted: false,
    })
      .populate("senderId", "firstname lastname businessName username email")
      .populate("receiverId", "firstname lastname businessName username email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalMessages = await Message.countDocuments({
      conversationId: conversationId,
      isDeleted: false,
    });

    res.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalMessages,
        hasMore: page * limit < totalMessages,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark messages as read
app.patch("/api/conversations/:conversationId/read", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "userId is required",
      });
    }

    const result = await Message.updateMany(
      {
        conversationId: conversationId,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Send a message (HTTP endpoint - also handled by Socket.IO)
app.post("/api/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const {
      senderId,
      senderModel,
      receiverId,
      receiverModel,
      message,
      messageType = "text",
    } = req.body;

    if (
      !senderId ||
      !senderModel ||
      !receiverId ||
      !receiverModel ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        error: "All message fields are required",
      });
    }

    const newMessage = new Message({
      conversationId,
      senderId,
      senderModel,
      receiverId,
      receiverModel,
      message,
      messageType,
    });

    const savedMessage = await newMessage.save();

    // Update conversation last activity
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: savedMessage._id,
      lastActivity: new Date(),
    });

    // Populate sender info
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate("senderId", "firstname lastname businessName username email")
      .populate("receiverId", "firstname lastname businessName username email");

    // Emit via Socket.IO to real-time users
    io.to(`conversation_${conversationId}`).emit(
      "receive_message",
      populatedMessage
    );
    io.to(`user_${receiverId}`).emit("new_message_notification", {
      conversationId,
      sender: populatedMessage.senderId,
      message: populatedMessage.message,
      timestamp: populatedMessage.createdAt,
    });

    res.json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get unread message count for a user
app.get("/api/users/:userId/unread-count", async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
      isDeleted: false,
    });

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete a conversation
app.delete("/api/conversations/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Delete all messages in the conversation
    await Message.deleteMany({ conversationId: conversationId });

    // Delete the conversation
    const deletedConversation = await Conversation.findByIdAndDelete(
      conversationId
    );

    if (!deletedConversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get customer notifications
app.get("/api/customers/:customerId/notifications", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await CustomerNotification.getCustomerNotifications(
      customerId,
      parseInt(limit),
      parseInt(skip)
    );

    const unreadCount = await CustomerNotification.getUnreadCount(customerId);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: notifications.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customer notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get MSME notifications
app.get("/api/msme/:msmeId/notifications", async (req, res) => {
  try {
    const { msmeId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ storeId: msmeId })
      .populate("customerId", "firstname lastname email")
      .populate("messageId", "message createdAt")
      .populate("conversationId")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const unreadCount = await Notification.countDocuments({
      storeId: msmeId,
      isRead: false,
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: notifications.length === parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching MSME notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Mark customer notification as read
app.patch(
  "/api/customers/:customerId/notifications/:notificationId/read",
  async (req, res) => {
    try {
      const { customerId, notificationId } = req.params;

      const notification = await CustomerNotification.markAsRead(
        notificationId,
        customerId
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        notification,
      });
    } catch (error) {
      console.error("Error marking customer notification as read:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Mark MSME notification as read
app.patch(
  "/api/msme/:msmeId/notifications/:notificationId/read",
  async (req, res) => {
    try {
      const { msmeId, notificationId } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, storeId: msmeId },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }

      res.json({
        success: true,
        notification,
      });
    } catch (error) {
      console.error("Error marking MSME notification as read:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Mark all customer notifications as read
app.patch(
  "/api/customers/:customerId/notifications/mark-all-read",
  async (req, res) => {
    try {
      const { customerId } = req.params;

      await CustomerNotification.markAllAsRead(customerId);

      res.json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all customer notifications as read:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Mark all MSME notifications as read
app.patch("/api/msme/:msmeId/notifications/mark-all-read", async (req, res) => {
  try {
    const { msmeId } = req.params;

    await Notification.updateMany(
      { storeId: msmeId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all MSME notifications as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --- Password Reset with OTP Routes ---
// In-memory storage for OTPs (in production, use Redis or database)
const otpStorage = new Map();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStorage.entries()) {
    if (now > value.expiresAt) {
      otpStorage.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Send OTP for password reset
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        error: "Email and user type are required",
      });
    }

    let user = null;
    let username = "";

    // Find user based on userType
    if (userType === "customer") {
      user = await Customer.findOne({ email });
      if (user) {
        username = user.username;
      }
    } else if (userType === "msme") {
      user = await MSME.findOne({ email });
      if (user) {
        username = user.username;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "No account found with this email address",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Store OTP with user info
    const otpKey = `${email}-${userType}`;
    otpStorage.set(otpKey, {
      otp,
      email,
      userType,
      userId: user._id,
      expiresAt,
      attempts: 0,
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, username);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: "Failed to send OTP email. Please try again.",
      });
    }

    res.json({
      success: true,
      message: "OTP sent successfully to your email address",
      expiresIn: 10, // minutes
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({
      success: false,
      error: "Server error. Please try again later.",
    });
  }
});

// Verify OTP and reset password
app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, userType, otp, newPassword } = req.body;

    if (!email || !userType || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({
        success: false,
        error:
          "Password is too weak. Please create a stronger password with at least 8 characters including at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters.",
      });
    }

    const otpKey = `${email}-${userType}`;
    const storedOTP = otpStorage.get(otpKey);

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        error: "OTP not found or expired. Please request a new one.",
      });
    }

    // Check if OTP is expired
    if (Date.now() > storedOTP.expiresAt) {
      otpStorage.delete(otpKey);
      return res.status(400).json({
        success: false,
        error: "OTP has expired. Please request a new one.",
      });
    }

    // Check attempts (max 3 attempts)
    if (storedOTP.attempts >= 3) {
      otpStorage.delete(otpKey);
      return res.status(400).json({
        success: false,
        error: "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (storedOTP.otp !== otp) {
      storedOTP.attempts += 1;
      return res.status(400).json({
        success: false,
        error: `Invalid OTP. ${3 - storedOTP.attempts} attempts remaining.`,
      });
    }

    // OTP is valid, update password
    let updateResult = null;

    if (userType === "customer") {
      updateResult = await Customer.findByIdAndUpdate(
        storedOTP.userId,
        {
          password: newPassword, // In production, hash this password
          updatedAt: new Date(),
        },
        { new: true }
      );
    } else if (userType === "msme") {
      updateResult = await MSME.findByIdAndUpdate(
        storedOTP.userId,
        {
          password: newPassword, // In production, hash this password
          updatedAt: new Date(),
        },
        { new: true }
      );
    }

    if (!updateResult) {
      return res.status(500).json({
        success: false,
        error: "Failed to update password. Please try again.",
      });
    }

    // Remove OTP from storage after successful reset
    otpStorage.delete(otpKey);

    res.json({
      success: true,
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({
      success: false,
      error: "Server error. Please try again later.",
    });
  }
});

// Resend OTP
app.post("/api/resend-otp", async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        error: "Email and user type are required",
      });
    }

    const otpKey = `${email}-${userType}`;
    const existingOTP = otpStorage.get(otpKey);

    // Check if there's a recent OTP (prevent spam)
    if (
      existingOTP &&
      Date.now() - (existingOTP.expiresAt - 10 * 60 * 1000) < 60 * 1000
    ) {
      return res.status(400).json({
        success: false,
        error: "Please wait at least 1 minute before requesting a new OTP",
      });
    }

    // Find user
    let user = null;
    let username = "";

    if (userType === "customer") {
      user = await Customer.findOne({ email });
      if (user) {
        username = user.username;
      }
    } else if (userType === "msme") {
      user = await MSME.findOne({ email });
      if (user) {
        username = user.username;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "No account found with this email address",
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    // Update OTP storage
    otpStorage.set(otpKey, {
      otp,
      email,
      userType,
      userId: user._id,
      expiresAt,
      attempts: 0,
    });

    // Send new OTP email
    const emailResult = await sendOTPEmail(email, otp, username);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        error: "Failed to send OTP email. Please try again.",
      });
    }

    res.json({
      success: true,
      message: "New OTP sent successfully to your email address",
      expiresIn: 10,
    });
  } catch (error) {
    console.error("Error in resend OTP:", error);
    res.status(500).json({
      success: false,
      error: "Server error. Please try again later.",
    });
  }
});

// Helper function to add follow status to stores
const addFollowStatusToStores = async (stores, customerId) => {
  let followedStoreIds = [];
  if (customerId) {
    try {
      const customer = await Customer.findById(customerId);
      if (customer && customer.following) {
        followedStoreIds = customer.following.map((id) => id.toString());
      }
    } catch (error) {
      console.error("Error fetching customer follow status:", error);
    }
  }

  return stores.map((store) => ({
    ...store,
    isFollowing: followedStoreIds.includes(store._id.toString()),
  }));
};

// Helper function to add favorite status to products
const addFavoriteStatusToProducts = async (products, customerId) => {
  let favoriteProductIds = [];
  if (customerId) {
    try {
      const customer = await Customer.findById(customerId);
      if (customer && customer.favorites) {
        favoriteProductIds = customer.favorites.map((id) => id.toString());
      }
    } catch (error) {
      console.error("Error fetching customer favorite status:", error);
    }
  }

  return products.map((product) => ({
    ...(product.toObject ? product.toObject() : product),
    isFavorite: favoriteProductIds.includes(product._id.toString()),
  }));
};

// --- Top Stores Routes ---
// Get top 6 stores with 4.5-5.0 average rating
app.get("/api/top-stores", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const customerId = req.query.customerId; // Optional customer ID for follow status

    // Fetch MSMEs with 4.0-5.0 average rating, approved status, and visible
    const topStores = await MSME.find({
      status: "approved",
      isVisible: true,
      averageRating: { $gte: 4.0, $lte: 5.0 },
    })
      .sort({ averageRating: -1, totalRatings: -1, createdAt: -1 }) // Sort by rating desc, then by number of ratings, then by newest
      .limit(limit);

    // Fetch dashboard information for each top store
    const storesWithDashboards = await Promise.all(
      topStores.map(async (msme) => {
        try {
          let dashboard = await Dashboard.findByMsmeId(msme._id);

          // If no dashboard exists, create a minimal dashboard
          if (!dashboard) {
            dashboard = new Dashboard({
              msmeId: msme._id,
              businessName: msme.businessName,
              description: "",
              coverPhoto: null,
              storeLogo: null,
              contactNumber: msme.contactNumber || "",
              location: msme.address || "",
              googleMapsUrl: "",
              coordinates: { lat: null, lng: null },
              socialLinks: {
                facebook: "",
                instagram: "",
              },
              ecommercePlatforms: {
                shopee: { enabled: false, url: "" },
                lazada: { enabled: false, url: "" },
                tiktok: { enabled: false, url: "" },
              },
              governmentApprovals: {
                dole: false,
                dost: false,
                dti: false,
                others: false,
              },
              rating: 0,
              isPublic: true,
            });

            try {
              await dashboard.save();
            } catch (saveError) {
              console.error(
                `Error saving dashboard for ${msme.businessName}:`,
                saveError
              );
            }
          }

          // Get product count for this store
          const productCount = await Product.countDocuments({
            msmeId: msme._id,
          });

          // Get follower count for this store
          const followerCount = await Customer.countDocuments({
            following: msme._id,
          });

          return {
            _id: msme._id,
            msmeId: msme._id,
            businessName: dashboard.businessName || msme.businessName,
            category: msme.category,
            username: msme.username,
            status: msme.status,
            createdAt: msme.createdAt,
            address: msme.address,
            // Include MSME rating data
            averageRating: msme.averageRating || 0,
            totalRatings: msme.totalRatings || 0,
            ratings: msme.ratings || [],
            // Include store statistics
            productCount: productCount,
            followerCount: followerCount,
            dashboard: {
              businessName: dashboard.businessName || msme.businessName,
              description: dashboard.description || "",
              coverPhoto: dashboard.coverPhoto,
              storeLogo: dashboard.storeLogo,
              contactNumber:
                dashboard.contactNumber || msme.contactNumber || "",
              location: dashboard.location || msme.address || "",
              socialLinks: dashboard.socialLinks || {
                facebook: "",
                instagram: "",
              },
              rating: msme.averageRating || 0,
              totalRatings: msme.totalRatings || 0,
              isPublic: dashboard.isPublic !== false,
              createdAt: dashboard.createdAt,
              updatedAt: dashboard.updatedAt,
            },
          };
        } catch (error) {
          console.error(
            `Error fetching dashboard for ${msme.businessName}:`,
            error
          );

          // Get product count and follower count even in error case
          const productCount = await Product.countDocuments({
            msmeId: msme._id,
          }).catch(() => 0);
          const followerCount = await Customer.countDocuments({
            following: msme._id,
          }).catch(() => 0);

          return {
            _id: msme._id,
            msmeId: msme._id,
            businessName: msme.businessName,
            category: msme.category,
            username: msme.username,
            status: msme.status,
            createdAt: msme.createdAt,
            address: msme.address,
            averageRating: msme.averageRating || 0,
            totalRatings: msme.totalRatings || 0,
            ratings: msme.ratings || [],
            productCount: productCount,
            followerCount: followerCount,
            dashboard: {
              businessName: msme.businessName,
              description: "",
              coverPhoto: null,
              storeLogo: null,
              contactNumber: msme.contactNumber || "",
              location: msme.address || "",
              socialLinks: {
                facebook: "",
                instagram: "",
              },
              rating: msme.averageRating || 0,
              totalRatings: msme.totalRatings || 0,
              isPublic: true,
            },
          };
        }
      })
    );

    // Add follow status to stores
    const storesWithFollowStatus = await addFollowStatusToStores(
      storesWithDashboards,
      customerId
    );

    res.json({
      success: true,
      stores: storesWithFollowStatus,
      total: storesWithFollowStatus.length,
      message:
        limit === 6
          ? "Top 6 stores with 4.5-5.0 rating"
          : `Top ${limit} stores with 4.5-5.0 rating`,
    });
  } catch (error) {
    console.error("Error fetching top stores:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch top stores",
    });
  }
});

// Get all stores with 4.5-5.0 average rating (for "View All" functionality)
app.get("/api/top-stores/all", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // Default to 12 per page for better pagination
    const customerId = req.query.customerId; // Optional customer ID for follow status
    const skip = (page - 1) * limit;

    // Get total count of top-rated stores
    const totalCount = await MSME.countDocuments({
      status: "approved",
      isVisible: true,
      averageRating: { $gte: 4.0, $lte: 5.0 },
    });

    // Fetch all MSMEs with 4.0-5.0 average rating with pagination
    const topStores = await MSME.find({
      status: "approved",
      isVisible: true,
      averageRating: { $gte: 4.0, $lte: 5.0 },
    })
      .sort({ averageRating: -1, totalRatings: -1, createdAt: -1 }) // Sort by rating desc, then by number of ratings, then by newest
      .skip(skip)
      .limit(limit);

    // Fetch dashboard information for each top store
    const storesWithDashboards = await Promise.all(
      topStores.map(async (msme) => {
        try {
          let dashboard = await Dashboard.findByMsmeId(msme._id);

          // If no dashboard exists, create a minimal dashboard
          if (!dashboard) {
            dashboard = new Dashboard({
              msmeId: msme._id,
              businessName: msme.businessName,
              description: "",
              coverPhoto: null,
              storeLogo: null,
              contactNumber: msme.contactNumber || "",
              location: msme.address || "",
              googleMapsUrl: "",
              coordinates: { lat: null, lng: null },
              socialLinks: {
                facebook: "",
                instagram: "",
              },
              ecommercePlatforms: {
                shopee: { enabled: false, url: "" },
                lazada: { enabled: false, url: "" },
                tiktok: { enabled: false, url: "" },
              },
              governmentApprovals: {
                dole: false,
                dost: false,
                dti: false,
                others: false,
              },
              rating: 0,
              isPublic: true,
            });

            try {
              await dashboard.save();
            } catch (saveError) {
              console.error(
                `Error saving dashboard for ${msme.businessName}:`,
                saveError
              );
            }
          }

          // Get product count for this store
          const productCount = await Product.countDocuments({
            msmeId: msme._id,
          });

          // Get follower count for this store
          const followerCount = await Customer.countDocuments({
            following: msme._id,
          });

          return {
            _id: msme._id,
            msmeId: msme._id,
            businessName: dashboard.businessName || msme.businessName,
            category: msme.category,
            username: msme.username,
            status: msme.status,
            createdAt: msme.createdAt,
            address: msme.address,
            // Include MSME rating data
            averageRating: msme.averageRating || 0,
            totalRatings: msme.totalRatings || 0,
            ratings: msme.ratings || [],
            // Include store statistics
            productCount: productCount,
            followerCount: followerCount,
            dashboard: {
              businessName: dashboard.businessName || msme.businessName,
              description: dashboard.description || "",
              coverPhoto: dashboard.coverPhoto,
              storeLogo: dashboard.storeLogo,
              contactNumber:
                dashboard.contactNumber || msme.contactNumber || "",
              location: dashboard.location || msme.address || "",
              socialLinks: dashboard.socialLinks || {
                facebook: "",
                instagram: "",
              },
              rating: msme.averageRating || 0,
              totalRatings: msme.totalRatings || 0,
              isPublic: dashboard.isPublic !== false,
              createdAt: dashboard.createdAt,
              updatedAt: dashboard.updatedAt,
            },
          };
        } catch (error) {
          console.error(
            `Error fetching dashboard for ${msme.businessName}:`,
            error
          );

          // Get product count and follower count even in error case
          const productCount = await Product.countDocuments({
            msmeId: msme._id,
          }).catch(() => 0);
          const followerCount = await Customer.countDocuments({
            following: msme._id,
          }).catch(() => 0);

          return {
            _id: msme._id,
            msmeId: msme._id,
            businessName: msme.businessName,
            category: msme.category,
            username: msme.username,
            status: msme.status,
            createdAt: msme.createdAt,
            address: msme.address,
            averageRating: msme.averageRating || 0,
            totalRatings: msme.totalRatings || 0,
            ratings: msme.ratings || [],
            productCount: productCount,
            followerCount: followerCount,
            dashboard: {
              businessName: msme.businessName,
              description: "",
              coverPhoto: null,
              storeLogo: null,
              contactNumber: msme.contactNumber || "",
              location: msme.address || "",
              socialLinks: {
                facebook: "",
                instagram: "",
              },
              rating: msme.averageRating || 0,
              totalRatings: msme.totalRatings || 0,
              isPublic: true,
            },
          };
        }
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    // Add follow status to stores
    const storesWithFollowStatus = await addFollowStatusToStores(
      storesWithDashboards,
      customerId
    );

    res.json({
      success: true,
      stores: storesWithFollowStatus,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      message: "All stores with 4.5-5.0 rating",
    });
  } catch (error) {
    console.error("Error fetching all top stores:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch all top stores",
    });
  }
});

// --- Hot Picks Routes (Top Rated Products) ---
// Get top 4 products with 4.5-5.0 average rating
app.get("/api/hot-picks", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const customerId = req.query.customerId; // Optional customer ID for favorite status

    // Fetch ALL products with 4.5-5.0 average rating, available, and visible
    const allHotProducts = await Product.find({
      availability: true,
      visible: true,
      rating: { $gte: 4.5, $lte: 5.0 },
    })
      .populate("msmeId", "businessName username status")
      .sort({ rating: -1, createdAt: -1 }); // Sort by rating desc, then by newest

    // Filter out products from non-approved MSMEs FIRST
    const filteredProducts = allHotProducts.filter(
      (product) => product.msmeId && product.msmeId.status === "approved"
    );

    // THEN apply the limit to get the final products
    const hotProducts = filteredProducts.slice(0, limit);

    console.log(`Found ${allHotProducts.length} products with 4.5-5.0 rating`);
    console.log(
      `After MSME approval filtering: ${filteredProducts.length} products`
    );
    console.log(
      `Final hot picks (limited to ${limit}): ${hotProducts.length} products`
    );

    // Format the response with product details
    const formattedProducts = hotProducts.map((product) => {
      const averageRating = product.rating || 0;
      const totalReviews = product.feedback ? product.feedback.length : 0;
      const mainImage =
        product.pictures && product.pictures.length > 0
          ? product.pictures[0]
          : product.picture;

      return {
        _id: product._id,
        productId: product._id,
        productName: product.productName,
        description: product.description,
        price: product.price,
        category: product.category || "General",
        availability: product.availability,
        visible: product.visible,
        // Image handling
        mainImage: mainImage,
        images: product.pictures || (product.picture ? [product.picture] : []),
        imageUrl: mainImage
          ? `http://localhost:1337/uploads/${mainImage}`
          : null,
        // Rating information
        rating: averageRating,
        averageRating: averageRating,
        totalReviews: totalReviews,
        feedback: product.feedback || [],
        // MSME information
        msme: {
          _id: product.msmeId._id,
          businessName: product.msmeId.businessName,
          username: product.msmeId.username,
          status: product.msmeId.status,
        },
        // Additional product details
        hashtags: product.hashtags || [],
        variants: product.variants || [],
        sizeOptions: product.sizeOptions || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    // Add favorite status to products
    const productsWithFavoriteStatus = await addFavoriteStatusToProducts(
      formattedProducts,
      customerId
    );

    res.json({
      success: true,
      products: productsWithFavoriteStatus,
      total: productsWithFavoriteStatus.length,
      message:
        limit === 4
          ? "Top 4 hot picks with 4.5-5.0 rating"
          : `Top ${limit} hot picks with 4.5-5.0 rating`,
    });
  } catch (error) {
    console.error("Error fetching hot picks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch hot picks",
    });
  }
});

// Get all products with 4.5-5.0 average rating (for "View All" functionality)
app.get("/api/hot-picks/all", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // Default to 12 per page for better pagination
    const customerId = req.query.customerId; // Optional customer ID for favorite status
    const skip = (page - 1) * limit;

    // Get total count of top-rated products
    const totalCountResult = await Product.aggregate([
      {
        $match: {
          availability: true,
          visible: true,
          rating: { $gte: 4.5, $lte: 5.0 },
        },
      },
      {
        $lookup: {
          from: "msmes",
          localField: "msmeId",
          foreignField: "_id",
          as: "msme",
        },
      },
      {
        $unwind: "$msme",
      },
      {
        $match: {
          "msme.status": "approved",
        },
      },
      {
        $count: "total",
      },
    ]);

    const totalCount =
      totalCountResult.length > 0 ? totalCountResult[0].total : 0;

    // Fetch all products with 4.5-5.0 average rating with pagination
    const hotProducts = await Product.aggregate([
      {
        $match: {
          availability: true,
          visible: true,
          rating: { $gte: 4.5, $lte: 5.0 },
        },
      },
      {
        $lookup: {
          from: "msmes",
          localField: "msmeId",
          foreignField: "_id",
          as: "msme",
        },
      },
      {
        $unwind: "$msme",
      },
      {
        $match: {
          "msme.status": "approved",
        },
      },
      {
        $sort: { rating: -1, createdAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    // Format the response with product details
    const formattedProducts = hotProducts.map((product) => {
      const averageRating = product.rating || 0;
      const totalReviews = product.feedback ? product.feedback.length : 0;
      const mainImage =
        product.pictures && product.pictures.length > 0
          ? product.pictures[0]
          : product.picture;

      return {
        _id: product._id,
        productId: product._id,
        productName: product.productName,
        description: product.description,
        price: product.price,
        category: product.category || "General",
        availability: product.availability,
        visible: product.visible,
        // Image handling
        mainImage: mainImage,
        images: product.pictures || (product.picture ? [product.picture] : []),
        imageUrl: mainImage
          ? `http://localhost:1337/uploads/${mainImage}`
          : null,
        // Rating information
        rating: averageRating,
        averageRating: averageRating,
        totalReviews: totalReviews,
        feedback: product.feedback || [],
        // MSME information
        msme: {
          _id: product.msme._id,
          businessName: product.msme.businessName,
          username: product.msme.username,
          status: product.msme.status,
        },
        // Additional product details
        hashtags: product.hashtags || [],
        variants: product.variants || [],
        sizeOptions: product.sizeOptions || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Add favorite status to products
    const productsWithFavoriteStatus = await addFavoriteStatusToProducts(
      formattedProducts,
      customerId
    );

    res.json({
      success: true,
      products: productsWithFavoriteStatus,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCount: totalCount,
        limit: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      message: "All hot picks with 4.5-5.0 rating",
    });
  } catch (error) {
    console.error("Error fetching all hot picks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch all hot picks",
    });
  }
});

// ===== BADGE SYSTEM API ENDPOINTS =====

// Get active store badge
app.get("/api/badges/store/:storeId", async (req, res) => {
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
app.post("/api/badges/store/:storeId/calculate", async (req, res) => {
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
app.post("/api/badges/celebration-shown", async (req, res) => {
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

// Get badge statistics
app.get("/api/badges/stats", async (req, res) => {
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

// Manual badge processing (for admin)
app.post("/api/badges/admin/process-all", async (req, res) => {
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

// Debug endpoint: Force calculate badges with detailed info
app.post("/api/badges/debug/calculate/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType } = req.body; // 'customer' or 'store'

    console.log(`Debug: Calculating badge for ${userType} ${userId}`);

    let badge;
    if (userType === "customer") {
      badge = await BadgeService.calculateCustomerBadge(userId);
    } else if (userType === "store") {
      badge = await BadgeService.calculateStoreBadge(userId);
    } else {
      return res.status(400).json({
        success: false,
        message: "userType must be 'customer' or 'store'",
      });
    }

    res.json({
      success: true,
      badge: badge,
      debug: {
        isActive: badge.isActive,
        criteria: badge.criteria,
        calculatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error in debug badge calculation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate badge",
      error: error.message,
    });
  }
});

// Clean expired badges (for admin)
app.post("/api/badges/admin/cleanup-expired", async (req, res) => {
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

// Get all store badges (for admin)
app.get("/api/badges/admin/stores", async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;

    const query = {};
    if (isActive !== undefined) {
      const isActiveBool = isActive === "true";
      if (isActiveBool) {
        // For active badges, check both isActive=true AND not expired
        query.isActive = true;
        query.expiresAt = { $gt: new Date() };
      } else {
        // For inactive badges, show either isActive=false OR expired badges
        query.$or = [{ isActive: false }, { expiresAt: { $lte: new Date() } }];
      }
    }

    const badges = await StoreBadge.find(query)
      .populate("storeId", "businessName email businessType averageRating")
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

// Manually award a Top Store badge to a specific store (Admin only)
app.post("/api/badges/admin/award-store/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log(`🏆 Admin manually awarding badge to store: ${storeId}`);

    const result = await BadgeService.manuallyAwardStoreBadge(storeId);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        badge: result.badge,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error manually awarding store badge:", error);
    res.status(500).json({
      success: false,
      message: "Failed to award badge: " + error.message,
    });
  }
});

// --- Badge System API Endpoints ---

// Get store badge status
app.get("/api/badges/store/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    console.log(`🏪 Badge requested for store: ${storeId}`);

    // Get real badge from database using BadgeService
    const badge = await BadgeService.getActiveStoreBadge(storeId);

    if (badge && badge.isActive) {
      console.log(`✅ Active badge found for store: ${storeId}`);
      res.json({
        success: true,
        badge: badge,
      });
    } else {
      console.log(`❌ No active badge found for store: ${storeId}`);
      res.json({
        success: false,
        message: "No active badge found",
        badge: null,
      });
    }
  } catch (error) {
    console.error("Error fetching store badge:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch store badge",
      badge: null,
    });
  }
});

// Mark celebration as shown
app.post("/api/badges/celebration-shown", (req, res) => {
  const { badgeType, badgeId } = req.body;

  // Mock response for celebration shown
  res.json({
    success: true,
    message: "Celebration marked as shown",
  });
});

// Change MSME password
app.put("/api/msme/:id/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    // Validate new password strength
    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({
        success: false,
        error:
          "Password is too weak. Please create a stronger password with at least 8 characters including at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters.",
      });
    }

    // Find the MSME
    const msme = await MSME.findOne({ id: req.params.id });
    if (!msme) {
      return res.status(404).json({
        success: false,
        error: "MSME not found",
      });
    }

    // Check if password is hashed (starts with $2a$ or $2b$) or plain text
    const isPasswordHashed =
      msme.password.startsWith("$2a$") || msme.password.startsWith("$2b$");

    let isValidPassword = false;

    if (isPasswordHashed) {
      // Use bcrypt for hashed passwords
      isValidPassword = await bcrypt.compare(currentPassword, msme.password);
    } else {
      // Direct comparison for plain text passwords
      isValidPassword = currentPassword === msme.password;
    }

    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    // Check if new password is different from current
    let isSamePassword = false;

    if (isPasswordHashed) {
      isSamePassword = await bcrypt.compare(newPassword, msme.password);
    } else {
      isSamePassword = newPassword === msme.password;
    }

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: "New password must be different from current password",
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password
    await MSME.findOneAndUpdate(
      { id: req.params.id },
      {
        password: hashedNewPassword,
        updatedAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing MSME password:", error);
    res.status(500).json({
      success: false,
      error: "Error changing password",
    });
  }
});

// Delete MSME account
app.delete("/api/msme/:id/delete-account", async (req, res) => {
  try {
    const msmeId = req.params.id;

    // Find the MSME first
    const msme = await MSME.findOne({ id: msmeId });
    if (!msme) {
      return res.status(404).json({
        success: false,
        error: "MSME not found",
      });
    }

    const msmeObjectId = msme._id;

    // Delete related data
    await Promise.all([
      // Delete dashboard data
      Dashboard.deleteMany({ msmeId: msmeObjectId }),

      // Delete products
      Product.deleteMany({ msmeId: msmeObjectId }),

      // Delete blog posts
      BlogPost.deleteMany({ msmeId: msmeObjectId }),

      // Delete messages
      Message.deleteMany({
        $or: [{ senderId: msmeObjectId }, { receiverId: msmeObjectId }],
      }),

      // Delete conversations
      Conversation.deleteMany({
        participants: msmeObjectId,
      }),

      // Delete notifications
      Notification.deleteMany({ msmeId: msmeObjectId }),

      // Delete customer notifications
      CustomerNotification.deleteMany({ msmeId: msmeObjectId }),

      // Delete page views
      PageView.deleteMany({ storeId: msmeObjectId }),

      // Delete customer badges related to this MSME
      CustomerBadge.deleteMany({ msmeId: msmeObjectId }),

      // Delete store badges
      StoreBadge.deleteMany({ storeId: msmeObjectId }),

      // Remove MSME from customer following lists
      Customer.updateMany(
        { following: msmeObjectId },
        { $pull: { following: msmeObjectId } }
      ),

      // Delete audit logs
      AuditLog.deleteMany({
        $or: [{ userId: msmeObjectId }, { targetId: msmeObjectId }],
      }),
    ]);

    // Finally, delete the MSME account
    await MSME.findOneAndDelete({ id: msmeId });

    res.json({
      success: true,
      message: "Account and all related data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting MSME account:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting account",
    });
  }
});

// --- Product Routes ---
// Create new product
app.post(
  "/api/products",
  productUpload.array("pictures", 10),
  async (req, res) => {
    try {
      const {
        productName,
        price,
        description,
        availability,
        category,
        hashtags,
        msmeId,
        variants,
        sizeOptions,
        artistName, // Add artistName field
      } = req.body;

      // Debug logging
      console.log("POST /api/products - Product creation request received");
      console.log("Request body keys:", Object.keys(req.body));
      console.log("Artist name received:", artistName);
      console.log("Category received:", category);

      // Validate required fields
      if (!productName || !price || !description || !msmeId) {
        return res.status(400).json({
          success: false,
          error: "Product name, price, description, and MSME ID are required",
        });
      }

      // Parse hashtags if it's a string
      let parsedHashtags = [];
      if (hashtags) {
        try {
          parsedHashtags =
            typeof hashtags === "string" ? JSON.parse(hashtags) : hashtags;
        } catch (e) {
          parsedHashtags = [];
        }
      }

      // Parse variants if it's a string
      let parsedVariants = [];
      if (variants) {
        try {
          parsedVariants =
            typeof variants === "string" ? JSON.parse(variants) : variants;

          // Validate variant prices
          for (const variant of parsedVariants) {
            if (variant.price !== undefined && variant.price !== null) {
              const price = parseFloat(variant.price);
              if (isNaN(price) || price <= 0) {
                return res.status(400).json({
                  success: false,
                  error: `Variant "${variant.name}" price must be a positive number greater than 0`,
                });
              }
              variant.price = price; // Ensure it's stored as a number
            }
          }
        } catch (e) {
          parsedVariants = [];
        }
      }

      // Parse size options if it's a string
      let parsedSizeOptions = [];
      if (sizeOptions) {
        try {
          parsedSizeOptions =
            typeof sizeOptions === "string"
              ? JSON.parse(sizeOptions)
              : sizeOptions;

          // Validate size option prices
          for (const sizeOption of parsedSizeOptions) {
            if (sizeOption.price !== undefined && sizeOption.price !== null) {
              const price = parseFloat(sizeOption.price);
              if (isNaN(price) || price <= 0) {
                return res.status(400).json({
                  success: false,
                  error: `Size option "${sizeOption.size} ${sizeOption.unit}" price must be a positive number greater than 0`,
                });
              }
              sizeOption.price = price; // Ensure it's stored as a number
            }
          }
        } catch (e) {
          parsedSizeOptions = [];
        }
      }

      // Handle multiple file uploads with Cloudinary
      let pictures = [];
      let singlePicture = null; // For backward compatibility

      if (req.files && req.files.length > 0) {
        pictures = req.files.map((file) => file.path); // Cloudinary URL
        singlePicture = pictures[0]; // Use first image as main picture
      }

      // Create new product with artistName field
      const newProduct = new Product({
        productName,
        price: parseFloat(price),
        description,
        availability: availability === "true" || availability === true,
        visible: true, // New products are visible by default
        picture: singlePicture, // Backward compatibility
        pictures: pictures, // New multiple images support
        variants: parsedVariants,
        sizeOptions: parsedSizeOptions,
        hashtags: parsedHashtags,
        category: category || "",
        artistName: artistName || "", // Add artistName field
        msmeId,
      });

      await newProduct.save();

      // Notify followers of the store about the new product
      try {
        await CustomerNotificationService.notifyFollowersOfNewProduct(
          msmeId,
          newProduct._id
        );
        // Also send email notifications
        await StoreActivityNotificationService.notifyFollowersOfNewProduct(
          msmeId,
          newProduct._id
        );
      } catch (notificationError) {
        console.error(
          "Error sending customer notifications:",
          notificationError
        );
        // Continue with product creation even if notifications fail
      }

      res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: newProduct,
      });
    } catch (err) {
      console.error("Error creating product:", err);
      res.status(500).json({
        success: false,
        error: "Error creating product",
      });
    }
  }
);

// Update product
app.put("/api/products/:id", upload.array("pictures", 10), async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(
      "PUT /api/products/" +
        productId +
        " - NEW ENDPOINT WITH ARTISTNAME - Update request received"
    );
    console.log("Request body keys:", Object.keys(req.body));
    console.log("Files received:", req.files ? req.files.length : 0);
    console.log("Artist name received:", req.body.artistName);

    const {
      productName,
      price,
      description,
      availability,
      visible,
      category,
      hashtags,
      variants,
      sizeOptions,
      keepExistingImages,
      existingImages,
      artistName, // Add artistName field
    } = req.body;

    // Find existing product
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    // Parse hashtags if it's a string
    let parsedHashtags = existingProduct.hashtags;
    if (hashtags) {
      try {
        parsedHashtags =
          typeof hashtags === "string" ? JSON.parse(hashtags) : hashtags;
      } catch (e) {
        // Keep existing hashtags if parsing fails
      }
    }

    // Parse variants if it's a string
    let parsedVariants = existingProduct.variants || [];
    if (variants) {
      try {
        parsedVariants =
          typeof variants === "string" ? JSON.parse(variants) : variants;

        // Validate variant prices
        for (const variant of parsedVariants) {
          if (variant.price !== undefined && variant.price !== null) {
            const price = parseFloat(variant.price);
            if (isNaN(price) || price <= 0) {
              return res.status(400).json({
                success: false,
                error: `Variant "${variant.name}" price must be a positive number greater than 0`,
              });
            }
            variant.price = price; // Ensure it's stored as a number
          }
        }
      } catch (e) {
        parsedVariants = existingProduct.variants || [];
      }
    }

    // Parse size options if it's a string
    let parsedSizeOptions = existingProduct.sizeOptions || [];
    if (sizeOptions) {
      try {
        parsedSizeOptions =
          typeof sizeOptions === "string"
            ? JSON.parse(sizeOptions)
            : sizeOptions;
      } catch (e) {
        parsedSizeOptions = existingProduct.sizeOptions || [];
      }
    }

    // Handle multiple file uploads with existing image removal support
    let pictures = [];
    let singlePicture = null;

    // Parse existing images to keep (sent from frontend)
    let imagesToKeep = [];
    if (existingImages) {
      try {
        imagesToKeep =
          typeof existingImages === "string"
            ? JSON.parse(existingImages)
            : existingImages;
      } catch (e) {
        imagesToKeep = existingProduct.pictures || [];
      }
    } else {
      // If no existingImages provided, keep all existing images
      imagesToKeep = existingProduct.pictures || [];
    }

    // Start with existing images that should be kept
    pictures = [...imagesToKeep];

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.filename);
      pictures = [...pictures, ...newImages];
    }

    // Set single picture for backward compatibility
    singlePicture = pictures.length > 0 ? pictures[0] : existingProduct.picture;

    // Store original values for comparison
    const oldPrice = existingProduct.price;
    const oldAvailability = existingProduct.availability;

    // Update product with artistName field
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        productName: productName || existingProduct.productName,
        price: price ? parseFloat(price) : existingProduct.price,
        description: description || existingProduct.description,
        availability:
          availability !== undefined
            ? availability === "true" || availability === true
            : existingProduct.availability,
        visible:
          visible !== undefined
            ? visible === "true" || visible === true
            : existingProduct.visible,
        picture: singlePicture,
        pictures: pictures,
        variants: parsedVariants,
        sizeOptions: parsedSizeOptions,
        hashtags: parsedHashtags,
        category: category || existingProduct.category,
        artistName:
          artistName !== undefined ? artistName : existingProduct.artistName, // Update artistName field
        updatedAt: new Date(),
      },
      { new: true }
    );

    // Check if significant changes occurred for notifications
    const newPrice = updatedProduct.price;
    const newAvailability = updatedProduct.availability;

    if (oldPrice !== newPrice) {
      console.log(
        `Price changed for product ${updatedProduct.productName}: ${oldPrice} -> ${newPrice}`
      );
      // Send price change notifications to followers
      await StoreActivityNotificationService.notifyFollowersOfPriceChange(
        updatedProduct.msmeId,
        updatedProduct._id,
        oldPrice,
        newPrice
      );
    }

    if (oldAvailability !== newAvailability) {
      console.log(
        `Availability changed for product ${updatedProduct.productName}: ${oldAvailability} -> ${newAvailability}`
      );
      // Send availability change notifications
      await StoreActivityNotificationService.notifyFollowersOfAvailabilityChange(
        updatedProduct.msmeId,
        updatedProduct._id,
        newAvailability
      );
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({
      success: false,
      error: "Error updating product",
    });
  }
});

// --- Badge Cleanup Scheduler ---
// Clean up expired badges every hour
setInterval(async () => {
  try {
    console.log("🧹 Running scheduled badge cleanup...");
    await BadgeService.cleanupExpiredBadges();
    console.log("✅ Badge cleanup completed");
  } catch (error) {
    console.error("❌ Error in scheduled badge cleanup:", error);
  }
}, 60 * 60 * 1000); // Run every hour

// --- Automatic Top Store Badge Renewal System ---
// Recalculate badges every Sunday at 11:59 PM (weekly renewal)
cron.schedule("59 23 * * 0", async () => {
  console.log("🏆 Starting weekly Top Store badge recalculation...");

  try {
    // Get all stores and recalculate their ratings
    const stores = await MSME.find({}).lean();
    console.log(
      `📊 Analyzing ${stores.length} stores for badge eligibility...`
    );

    const storeAnalysis = [];

    for (const store of stores) {
      // Calculate ratings from products
      const products = await Product.find({ msmeId: store._id });
      let totalRating = 0;
      let ratingCount = 0;

      for (const product of products) {
        if (product.feedback && product.feedback.length > 0) {
          const productRating =
            product.feedback.reduce((sum, f) => sum + f.rating, 0) /
            product.feedback.length;
          totalRating += productRating;
          ratingCount++;
        }
      }

      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      // Get weekly views
      let weeklyViews = 0;
      try {
        const stats = await PageView.getStoreStats(store._id);
        weeklyViews = stats.weekly;
      } catch (error) {
        console.log(`Warning: Could not get stats for ${store.businessName}`);
      }

      storeAnalysis.push({
        storeId: store._id,
        businessName: store.businessName,
        averageRating: averageRating,
        weeklyViews: weeklyViews,
        meetsRatingCriteria: averageRating >= 4.0,
        meetsViewsCriteria: weeklyViews >= 25,
      });
    }

    // Sort by rating (highest first)
    storeAnalysis.sort((a, b) => b.averageRating - a.averageRating);

    // Deactivate all existing badges first
    await StoreBadge.updateMany({}, { isActive: false });
    console.log("🧹 Deactivated all existing Top Store badges");

    // Award badges to qualifying stores
    const qualifyingStores = storeAnalysis.filter(
      (store) => store.meetsRatingCriteria && store.meetsViewsCriteria
    );

    // If no stores meet both criteria, award to top 3 by rating (minimum 3.5 rating)
    if (qualifyingStores.length === 0) {
      const topStores = storeAnalysis
        .filter((store) => store.averageRating >= 3.5)
        .slice(0, 3);
      qualifyingStores.push(...topStores);
      console.log(
        "📝 No stores met both criteria, awarding to top 3 by rating"
      );
    }

    console.log(`🏆 Awarding badges to ${qualifyingStores.length} stores:`);

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    for (const store of qualifyingStores) {
      const newBadge = new StoreBadge({
        storeId: store.storeId,
        weekStart: weekStart,
        weekEnd: weekEnd,
        isActive: true,
        awardedAt: now,
        criteria: {
          storeRating: {
            required: 4.0,
            current: store.averageRating,
            met: store.meetsRatingCriteria,
          },
          productRatings: {
            required: 4.0,
            current: store.averageRating,
            met: store.meetsRatingCriteria,
          },
          profileViews: {
            required: 25,
            current: store.weeklyViews,
            met: store.meetsViewsCriteria,
          },
          blogViews: {
            required: 10,
            current: 0,
            met: false,
          },
        },
        celebrationShown: false,
      });

      await newBadge.save();
      console.log(
        `✅ Badge awarded to: ${
          store.businessName
        } (${store.averageRating.toFixed(1)}★, ${store.weeklyViews} views)`
      );
    }

    console.log("🎉 Weekly Top Store badge renewal completed!");
  } catch (error) {
    console.error("❌ Error in weekly badge recalculation:", error);
  }
});

// Also run badge recalculation daily at midnight to catch any rating changes
cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running daily badge status check...");

  try {
    await BadgeService.processAllBadges();
    console.log("✅ Daily badge status check completed");
  } catch (error) {
    console.error("❌ Error in daily badge check:", error);
  }
});

// Run initial cleanup on server start
(async () => {
  try {
    console.log("🧹 Running initial badge cleanup...");
    await BadgeService.cleanupExpiredBadges();
    console.log("✅ Initial badge cleanup completed");
  } catch (error) {
    console.error("❌ Error in initial badge cleanup:", error);
  }
})();

// Global error handling middleware for multer errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error:
          "File size too large. Maximum file size allowed is 5MB per photo.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Too many files. Maximum 5 photos are allowed per review.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        error: "Unexpected file field. Only 'photos' field is allowed.",
      });
    }
    return res.status(400).json({
      success: false,
      error: "File upload error: " + error.message,
    });
  }

  // Handle custom validation errors for image files
  if (
    error.message &&
    (error.message.includes("Only image") ||
      error.message.includes("Invalid file type") ||
      error.message.includes("Invalid file extension") ||
      error.message.includes("JPEG, PNG, GIF"))
  ) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  // Pass other errors to default error handler
  next(error);
});

// --- Start Server ---
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`🔌 Socket.IO enabled for real-time messaging`);
  console.log(`⏰ Badge cleanup scheduled every hour`);
  console.log(`🏆 Top Store badge renewal: Every Sunday at 11:59 PM`);
  console.log(`🔄 Daily badge status check: Every day at midnight`);
});
