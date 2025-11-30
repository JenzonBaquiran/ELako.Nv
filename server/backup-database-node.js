const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Database connection
const DB_NAME = "ElakoNv";
const DB_URL = `mongodb://localhost:27017/${DB_NAME}`;

async function backupDatabase() {
  try {
    console.log("========================================");
    console.log("   ELAKO.NV NODE.JS DATABASE BACKUP");
    console.log("========================================\n");

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(DB_URL);
    console.log("✓ Connected to database\n");

    // Get all collections
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    // Create backup directory
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const backupDir = path.join(
      __dirname,
      "node-backup",
      `${DB_NAME}_${timestamp}`
    );

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`Backup directory: ${backupDir}\n`);
    console.log("Backing up collections:");

    // Backup each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`  - ${collectionName}`);

      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();

      const filePath = path.join(backupDir, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

      console.log(`    ✓ ${documents.length} documents exported`);
    }

    // Create backup summary
    const summary = {
      database: DB_NAME,
      timestamp: new Date().toISOString(),
      collections: collections.map((c) => c.name),
      totalCollections: collections.length,
      backupPath: backupDir,
    };

    fs.writeFileSync(
      path.join(backupDir, "_backup-info.json"),
      JSON.stringify(summary, null, 2)
    );

    console.log("\n========================================");
    console.log("✓ BACKUP COMPLETED SUCCESSFULLY!");
    console.log("========================================");
    console.log(`Location: ${backupDir}`);
    console.log(`Collections backed up: ${collections.length}`);
    console.log(
      `Files: ${collections.map((c) => c.name + ".json").join(", ")}`
    );

    await mongoose.disconnect();

    // Open backup folder (Windows)
    if (process.platform === "win32") {
      const { exec } = require("child_process");
      exec(`explorer "${backupDir}"`);
    }
  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    process.exit(1);
  }
}

// Run backup
backupDatabase();
