const mongoose = require("mongoose");
const MSME = require("./models/msme.model");

const MONGO_URI = "mongodb://localhost:27017/elako";

async function checkVisibilityReason() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all hidden MSMEs
    const hiddenMsmes = await MSME.find({ isVisible: false });

    console.log(`\nFound ${hiddenMsmes.length} hidden MSMEs:\n`);

    hiddenMsmes.forEach((msme) => {
      console.log(`Business Name: ${msme.businessName}`);
      console.log(`Username: ${msme.username}`);
      console.log(`Is Visible: ${msme.isVisible}`);
      console.log(`Visibility Reason: ${msme.visibilityReason || "NOT SET"}`);
      console.log(`Hidden At: ${msme.hiddenAt || "NOT SET"}`);
      console.log(`Hidden By: ${msme.hiddenBy || "NOT SET"}`);
      console.log("---");
    });

    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkVisibilityReason();
