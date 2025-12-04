import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";
import { format, quality } from "@cloudinary/url-gen/actions/delivery";

// Initialize Cloudinary with your cloud name
const cld = new Cloudinary({
  cloud: {
    cloudName: "dk9umulxw", // Your cloud name from the environment
  },
});

// Configuration
export const CLOUDINARY_CONFIG = {
  cloudName: "dk9umulxw",
  uploadPreset: "elako_uploads", // You'll need to create this in Cloudinary dashboard
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 10,
  allowedFormats: ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "pdf"],
  folders: {
    products: "elako/products",
    certificates: "elako/certificates",
    blog: "elako/blog",
    feedback: "elako/feedback",
    profiles: "elako/profiles",
  },
};

// Helper function to generate optimized image URL
export const getOptimizedImageUrl = (publicIdOrUrl, options = {}) => {
  if (!publicIdOrUrl) return "";

  try {
    // If it's already a full URL, return it as-is for now
    if (publicIdOrUrl.startsWith("http")) {
      return publicIdOrUrl;
    }

    const image = cld.image(publicIdOrUrl);

    // Apply default optimizations
    image
      .delivery(format("auto"))
      .delivery(quality("auto"))
      .resize(auto().gravity(autoGravity()));

    // Apply custom transformations if provided
    if (options.width && options.height) {
      image.resize(auto().width(options.width).height(options.height));
    } else if (options.width) {
      image.resize(auto().width(options.width));
    }

    return image.toURL();
  } catch (error) {
    console.error("Error generating optimized URL:", error);
    return publicIdOrUrl; // Fallback to original
  }
};

// Helper function to generate responsive image URLs
export const getResponsiveImageUrls = (publicId) => {
  if (!publicId) return [];

  const breakpoints = [
    { size: "sm", width: 400 },
    { size: "md", width: 800 },
    { size: "lg", width: 1200 },
    { size: "xl", width: 1600 },
  ];

  return breakpoints.map((bp) => ({
    size: bp.size,
    width: bp.width,
    url: getOptimizedImageUrl(publicId, { width: bp.width }),
  }));
};

// Helper function to extract public ID from Cloudinary URL
export const extractPublicId = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return null;

  try {
    // Handle different Cloudinary URL formats
    const regex =
      /\/(?:image|video|raw)\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/;
    const match = cloudinaryUrl.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
};

// Helper function to check if URL is a Cloudinary URL
export const isCloudinaryUrl = (url) => {
  if (!url) return false;
  return url.includes("cloudinary.com") || url.includes("res.cloudinary.com");
};

// Helper function to get file type from Cloudinary URL
export const getFileTypeFromUrl = (url) => {
  if (!url) return "unknown";

  if (url.includes("/image/")) return "image";
  if (url.includes("/video/")) return "video";
  if (url.includes("/raw/")) return "document";

  return "unknown";
};

// Upload file to Cloudinary via your backend
export const uploadToCloudinary = async (file, folder = "elako/general") => {
  try {
    const formData = new FormData();
    formData.append("media", file);
    formData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        url: result.url,
        publicId: result.publicId,
        ...result,
      };
    } else {
      throw new Error(result.error || "Upload failed");
    }
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error.message || "Upload failed",
    };
  }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (
  publicId,
  resourceType = "image"
) => {
  try {
    const response = await fetch(
      `/api/cloudinary/delete/${encodeURIComponent(
        publicId
      )}?resourceType=${resourceType}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Delete error:", error);
    return {
      success: false,
      error: error.message || "Delete failed",
    };
  }
};

// Get optimized image transformations from backend
export const getOptimizedImage = async (publicId, transformations = {}) => {
  try {
    const response = await fetch("/api/cloudinary/optimize-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        publicId,
        transformations,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Optimization error:", error);
    return {
      success: false,
      error: error.message || "Optimization failed",
    };
  }
};

export default {
  cld,
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  extractPublicId,
  isCloudinaryUrl,
  getFileTypeFromUrl,
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedImage,
  CLOUDINARY_CONFIG,
};
