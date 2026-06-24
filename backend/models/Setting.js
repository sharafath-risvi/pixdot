const mongoose = require("mongoose");

/**
 * Key-value store for admin workspace preferences.
 * e.g. key: "staffSalaryVisibleToSelf", value: true
 */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Setting", settingSchema);
