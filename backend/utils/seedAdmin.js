const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

/**
 * Seeds the admin account from environment variables.
 * Run once: node utils/seedAdmin.js
 * Safe to run again — skips if admin already exists.
 */
const seedAdmin = async () => {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding.");

    const existing = await User.findOne({ username: adminUsername.toLowerCase() });

    if (existing) {
      console.log(`Admin account "${adminUsername}" already exists. Skipping.`);
    } else {
      await User.create({
        role: "admin",
        username: adminUsername.toLowerCase(),
        password: adminPassword,
      });
      console.log(`✅ Admin account created: username="${adminUsername}"`);
    }
  } catch (err) {
    console.error("Seed admin error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seedAdmin();
