const mongoose = require("mongoose");

const quoteRequestSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, required: true, trim: true },
    selectedServices: [
      {
        serviceId: { type: String, required: true },
        serviceName: { type: String, required: true },
        lines: [
          {
            label: { type: String, required: true },
            sub: { type: String, default: "" },
            price: { type: Number, required: true },
          }
        ],
        total: { type: Number, required: true },
      }
    ],
    totalPrice: { type: Number, required: true },
    status: { type: String, default: "Pending", enum: ["Pending", "Contacted", "Closed"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuoteRequest", quoteRequestSchema);
