const mongoose = require("mongoose");
const ServicePricing = require("../models/ServicePricing");
const pricingData = require("../data/serviceDetailsPricelist.json");
require("dotenv").config();

/**
 * Seeds service pricing from the frontend JSON file into MongoDB.
 * Run once: node utils/seedPricing.js
 * Safe to re-run — uses upsert (update or insert).
 */
const seedPricing = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding.");

    for (const service of pricingData) {
      await ServicePricing.findOneAndUpdate(
        { serviceId: service.id },
        {
          serviceId: service.id,
          name: service.name,
          tagline: service.tagline || "",
          icon: service.icon || "",
          image: service.image || "",
          pageBackground: service.pageBackground || [],
          options: service.options || [],
          detail: service.detail || {},
        },
        { upsert: true, returnDocument: "after" }
      );
      console.log(`✅ Seeded: ${service.name}`);
    }

    console.log(`\nAll ${pricingData.length} services seeded successfully.`);
  } catch (err) {
    console.error("Seed pricing error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seedPricing();
