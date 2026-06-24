const mongoose = require("mongoose");

/**
 * Stores the full service pricing structure editable by admin.
 * Mirrors the shape of serviceDetailsPricelist.json.
 * The `detail` field is kept as Mixed so we can store all nested
 * lineItems, fixedPlans, alaCarte, etc. without rigid sub-schemas.
 */
const servicePricingSchema = new mongoose.Schema(
  {
    serviceId: {
      type: String,
      required: true,
      unique: true, // e.g. "brand-creative"
    },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true, default: "" },
    icon: { type: String, trim: true, default: "" },
    image: { type: String, trim: true, default: "" },
    pageBackground: { type: [String], default: [] },
    options: { type: mongoose.Schema.Types.Mixed, default: [] },
    detail: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServicePricing", servicePricingSchema);
