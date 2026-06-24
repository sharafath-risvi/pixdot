const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    ownerType: {
      type: String,
      enum: ["staff", "client"],
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      // Dynamically refs either Staff or Client
      refPath: "ownerModel",
    },
    ownerModel: {
      type: String,
      enum: ["Staff", "Client"],
      required: true,
    },
    title: {
      type: String,
      required: [true, "Note title is required."],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters."],
    },
    description: { type: String, trim: true, default: "" },
    date: { type: String, trim: true, default: "" }, // "YYYY-MM-DD"
    type: {
      type: String,
      enum: ["Daily", "Weekly", "Monthly", "Yearly"],
      required: [true, "Note type is required."],
    },
  },
  { timestamps: true }
);

// Ensure notes are only accessible to their owner
noteSchema.index({ ownerId: 1, ownerType: 1 });

module.exports = mongoose.model("Note", noteSchema);
