const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for product images
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "elako/products",
    format: async (req, file) => {
      const supportedFormats = ["jpg", "jpeg", "png", "webp", "gif"];
      const fileFormat = file.mimetype.split("/")[1];
      return supportedFormats.includes(fileFormat) ? fileFormat : "jpg";
    },
    transformation: [
      { width: 1200, height: 1200, crop: "limit", quality: "auto:good" },
      { format: "auto" },
    ],
    public_id: (req, file) =>
      `product-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  },
});

// Cloudinary storage for certificates
const certificateStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "elako/certificates",
    format: async (req, file) => {
      if (file.mimetype === "application/pdf") return "pdf";
      const supportedFormats = ["jpg", "jpeg", "png"];
      const fileFormat = file.mimetype.split("/")[1];
      return supportedFormats.includes(fileFormat) ? fileFormat : "jpg";
    },
    transformation: [
      { width: 2000, height: 2000, crop: "limit", quality: "auto:best" },
    ],
    public_id: (req, file) =>
      `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  },
});

// Cloudinary storage for blog media
const blogMediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "elako/blog",
    resource_type: "auto", // Handles both images and videos
    format: async (req, file) => {
      if (file.mimetype.startsWith("video/")) return "mp4";
      const supportedFormats = ["jpg", "jpeg", "png", "webp", "gif"];
      const fileFormat = file.mimetype.split("/")[1];
      return supportedFormats.includes(fileFormat) ? fileFormat : "jpg";
    },
    transformation: [
      { width: 1920, height: 1080, crop: "limit", quality: "auto:good" },
    ],
    public_id: (req, file) =>
      `blog-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  },
});

// Cloudinary storage for feedback photos
const feedbackPhotosStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "elako/feedback",
    format: async (req, file) => {
      const supportedFormats = ["jpg", "jpeg", "png", "webp"];
      const fileFormat = file.mimetype.split("/")[1];
      return supportedFormats.includes(fileFormat) ? fileFormat : "jpg";
    },
    transformation: [
      { width: 800, height: 800, crop: "limit", quality: "auto:good" },
    ],
    public_id: (req, file) =>
      `feedback-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  },
});

// Configure multer with Cloudinary storage
const productUpload = multer({
  storage: productStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for products!"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const certificateUpload = multer({
  storage: certificateStorage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Only image and PDF files are allowed for certificates!"),
        false
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const blogMediaUpload = multer({
  storage: blogMediaStorage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Only image and video files are allowed for blog posts!"),
        false
      );
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

const feedbackPhotosUpload = multer({
  storage: feedbackPhotosStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for feedback!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Helper function to delete files from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};

// Helper function to get optimized URL
const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    ...options,
    fetch_format: "auto",
    quality: "auto",
  });
};

// Helper function to generate multiple image sizes for responsive images
const generateResponsiveImages = (publicId) => {
  const sizes = [
    { width: 400, suffix: "_sm" },
    { width: 800, suffix: "_md" },
    { width: 1200, suffix: "_lg" },
    { width: 1600, suffix: "_xl" },
  ];

  return sizes.map((size) => ({
    width: size.width,
    url: cloudinary.url(publicId, {
      width: size.width,
      height: size.width,
      crop: "limit",
      fetch_format: "auto",
      quality: "auto",
    }),
  }));
};

module.exports = {
  cloudinary,
  productUpload,
  certificateUpload,
  blogMediaUpload,
  feedbackPhotosUpload,
  deleteFromCloudinary,
  getOptimizedUrl,
  generateResponsiveImages,
};
