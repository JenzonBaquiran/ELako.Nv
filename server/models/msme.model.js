const mongoose = require("mongoose");

const MSMESchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    clientProfilingNumber: { type: String, unique: true, sparse: true },
    category: { type: String, required: true, enum: ["food", "artisan"] },
    businessName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: String, default: "" },
    municipality: { type: String, default: "" }, // Municipality for location-based search
    contactNumber: { type: String, default: "" },
    businessDescription: { type: String, default: "" },
    operatingHours: { type: String, default: "" },
    website: { type: String, default: "" },
    specialties: [{ type: String }],
    established: { type: String, default: "" },
    userType: { type: String, default: "msme" },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "approved", "rejected"],
    },
    isVisible: { type: Boolean, default: true }, // Controls visibility on homepage and login access
    visibilityReason: { type: String, default: "" }, // Reason for hiding the MSME
    hiddenAt: { type: Date }, // Timestamp when MSME was hidden
    hiddenBy: { type: String }, // Admin who hid the MSME

    // Certificate documents
    certificates: {
      mayorsPermit: { type: String, default: "" }, // File path for Mayor's Permit
      bir: { type: String, default: "" }, // File path for BIR certificate
      tinNumber: { type: String, default: "" }, // TIN number as text
      dti: { type: String, default: "" }, // File path for DTI certificate
    },

    // Rating system for stores
    ratings: [
      {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },

    termsAcceptedAt: { type: Date, default: Date.now }, // When terms were accepted during signup
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "msmes" }
);

// Method to calculate average rating
MSMESchema.methods.calculateAverageRating = function () {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10; // Round to 1 decimal
    this.totalRatings = this.ratings.length;
  }
};

module.exports = mongoose.model("MSME", MSMESchema);
