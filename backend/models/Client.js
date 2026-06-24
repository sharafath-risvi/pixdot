const mongoose = require("mongoose");


const clientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Client name is required."],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters."],
    },
    logo: { type: String, trim: true, default: "" },
    businessType: { type: String, trim: true, default: "" },
    gstNumber: { type: String, trim: true, default: "" }, // Empty = without GST
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, trim: true, default: "" },
    coreValues: { type: String, trim: true, default: "" },

    totalAmount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
