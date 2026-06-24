const Setting = require("../models/Setting");

const DEFAULT_SETTINGS = [
  { key: "staffSalaryVisibleToSelf", value: true },
];

/**
 * @route   GET /api/settings
 * @access  Private (admin only)
 * @desc    Get all workspace settings
 */
const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.find();

    // Seed defaults if no settings exist yet
    if (!settings.length) {
      settings = await Setting.insertMany(DEFAULT_SETTINGS);
    }

    // Return as a key-value object for easy frontend consumption
    const settingsObj = {};
    settings.forEach((s) => { settingsObj[s.key] = s.value; });

    return res.status(200).json({ success: true, data: settingsObj });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/settings/:key
 * @access  Private (admin only)
 * @desc    Update a setting by key
 */
const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ success: false, message: "Value is required." });
    }

    const setting = await Setting.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSetting };
