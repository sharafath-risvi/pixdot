const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Staff name is required."],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters."],
    },
    role: { type: String, trim: true, default: "" }, // Job title / designation
    salary: { type: String, trim: true, default: "" }, // Display string e.g. "₹35,000"
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    profileImage: { type: String, trim: true, default: "" }, // URL string
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
