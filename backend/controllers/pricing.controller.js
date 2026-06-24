const ServicePricing = require("../models/ServicePricing");

/**
 * @route   GET /api/pricing
 * @access  Public (used by frontend public pages + admin)
 * @desc    Get all service pricing
 */
const getAllPricing = async (req, res, next) => {
  try {
    const pricing = await ServicePricing.find().sort({ createdAt: 1 });
    return res.status(200).json({ success: true, data: pricing });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/pricing/:serviceId
 * @access  Public
 * @desc    Get a single service pricing by serviceId (e.g. "brand-creative")
 */
const getPricingById = async (req, res, next) => {
  try {
    const pricing = await ServicePricing.findOne({ serviceId: req.params.serviceId });
    if (!pricing) {
      return res.status(404).json({ success: false, message: "Service not found." });
    }
    return res.status(200).json({ success: true, data: pricing });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/pricing/:serviceId
 * @access  Private (admin only)
 * @desc    Update a service's pricing data
 */
const updatePricing = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { name, tagline, icon, image, pageBackground, options, detail } = req.body;

    let pricing = await ServicePricing.findOne({ serviceId });
    if (!pricing) {
      pricing = new ServicePricing({ serviceId });
    }

    if (name !== undefined) pricing.name = name;
    if (tagline !== undefined) pricing.tagline = tagline;
    if (icon !== undefined) pricing.icon = icon;
    if (image !== undefined) pricing.image = image;
    if (pageBackground !== undefined) pricing.pageBackground = pageBackground;
    if (options !== undefined) pricing.options = options;
    if (detail !== undefined) pricing.detail = detail;

    // Mongoose Mixed fields require markModified to trigger save
    pricing.markModified("detail");
    pricing.markModified("options");
    await pricing.save();

    return res.status(200).json({ success: true, data: pricing });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllPricing, getPricingById, updatePricing };
