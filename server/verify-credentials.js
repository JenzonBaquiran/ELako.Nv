// Simple credential verification test
require("dotenv").config();

console.log("🔍 Cloudinary Credential Verification");
console.log("=====================================");

console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY);
console.log(
  "CLOUDINARY_API_SECRET length:",
  process.env.CLOUDINARY_API_SECRET
    ? process.env.CLOUDINARY_API_SECRET.length
    : "Not set"
);

// Check for any hidden characters or formatting issues
console.log("\n🔧 Credential Analysis:");
console.log("Cloud Name length:", process.env.CLOUDINARY_CLOUD_NAME?.length);
console.log("API Key length:", process.env.CLOUDINARY_API_KEY?.length);
console.log(
  "API Key first/last chars:",
  process.env.CLOUDINARY_API_KEY
    ? `'${
        process.env.CLOUDINARY_API_KEY[0]
      }' / '${process.env.CLOUDINARY_API_KEY.slice(-1)}'`
    : "N/A"
);

// Test the exact URL that would be called
const testUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/usage`;
console.log("\n📞 Test URL:", testUrl);

console.log("\n💡 Next Steps:");
console.log(
  "1. Verify these credentials match your Cloudinary dashboard exactly"
);
console.log("2. Check for any trailing spaces or special characters");
console.log("3. Ensure you're using the correct account");
console.log("4. Visit: https://cloudinary.com/console/settings/security");
