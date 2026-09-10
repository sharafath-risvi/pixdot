const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    date: {
      type: String, // Stored as YYYY-MM-DD
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
    contentType: {
      type: String,
      required: true,
    },
    additionalNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// A staff member can submit only one report per client per day?
// Or just multiple reports per day? The frontend just posts to `/api/reports`.
// We will not enforce compound unique indexes just to be safe.

module.exports = mongoose.model("Report", reportSchema);
