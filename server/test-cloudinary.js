const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Testing Cloudinary configuration...");
console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log(
  "API Key:",
  process.env.CLOUDINARY_API_KEY
    ? process.env.CLOUDINARY_API_KEY.slice(0, 6) + "..."
    : "Not set"
);
console.log(
  "API Secret:",
  process.env.CLOUDINARY_API_SECRET
    ? "Set (length: " + process.env.CLOUDINARY_API_SECRET.length + ")"
    : "Not set"
);

// Test basic API access
async function testCloudinary() {
  try {
    console.log("\n🧪 Testing Cloudinary API access...");

    // Test 1: Get account usage
    const usage = await cloudinary.api.usage();
    console.log("✅ API access successful!");
    console.log("📊 Account usage:", {
      credits: usage.credits,
      used_percent: usage.used_percent,
      limit: usage.limit,
    });

    // Test 2: List recent resources (limit to 1)
    console.log("\n🔍 Testing resource listing...");
    const resources = await cloudinary.api.resources({
      resource_type: "image",
      max_results: 1,
    });
    console.log("✅ Resource listing successful!");
    console.log("📁 Total resources:", resources.total_count);

    // Test 3: Test upload URL generation
    console.log("\n🔗 Testing URL generation...");
    const testUrl = cloudinary.url("sample", {
      width: 100,
      height: 100,
      crop: "fill",
    });
    console.log("✅ URL generation successful!");
    console.log("🌐 Test URL:", testUrl);

    console.log(
      "\n🎉 All Cloudinary tests passed! Integration is working properly."
    );
  } catch (error) {
    console.log("\n❌ Cloudinary test failed:");
    console.log("Full error:", error);
    console.log("Error message:", error.message);
    console.log("Error name:", error.name);
    if (error.http_code) {
      console.log("HTTP Code:", error.http_code);
    }
    if (error.error) {
      console.log("Error details:", error.error);
    }
  }
}

testCloudinary();
