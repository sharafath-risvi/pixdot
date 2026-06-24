const express = require("express");
const router = express.Router();
const { getAllPricing, getPricingById, updatePricing } = require("../controllers/pricing.controller");
const { protect, authorise } = require("../middleware/auth");

// Public reads
router.get("/", getAllPricing);
router.get("/:serviceId", getPricingById);

// Admin only write
router.put("/:serviceId", protect, authorise("admin"), updatePricing);

module.exports = router;
