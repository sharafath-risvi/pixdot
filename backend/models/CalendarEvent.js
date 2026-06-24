const mongoose = require("mongoose");

/**
 * Stores both Content Calendar and Meta Ads Calendar events.
 * calendarType distinguishes between them.
 *
 * Content Calendar fields: kind, subtype, status, completed, reasonNote
 * Meta Ads Calendar fields: adType, campaignName, platform, budgetType,
 *   budgetAmount, startDate, endDate, targetAudience, objective, status
 */
const calendarEventSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    calendarType: {
      type: String,
      enum: ["content", "meta"],
      required: true,
    },
    // Date key matching frontend format: "YYYY-M-D" (e.g. "2026-6-17")
    dateKey: {
      type: String,
      required: true,
    },
    
    // Shared content plan field
    contentPlan: { type: String, trim: true, default: "" },

    // ── Content Calendar ─────────────────────────────────
    kind: { type: String, trim: true, default: "" },
    subtype: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["pending", "completed", "issue"],
      default: "pending",
    },
    completed: { type: Boolean, default: false },
    reasonNote: { type: String, trim: true, default: "" },

    // ── Meta Ads Calendar ─────────────────────────────────
    adType: { type: String, trim: true, default: "" },
    campaignName: { type: String, trim: true, default: "" },
    platform: { type: String, trim: true, default: "" }, // "Poster" | "Reels" | "Both"
    budgetType: { type: String, trim: true, default: "Daily" },
    budgetAmount: { type: String, trim: true, default: "" },
    startDate: { type: String, trim: true, default: "" },
    endDate: { type: String, trim: true, default: "" },
    targetAudience: { type: String, trim: true, default: "" },
    objective: { type: String, trim: true, default: "" },
    metaStatus: {
      type: String,
      enum: ["active", "completed", "paused", ""],
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index: fast lookup of all events for a client+type+month
calendarEventSchema.index({ clientId: 1, calendarType: 1, dateKey: 1 });

module.exports = mongoose.model("CalendarEvent", calendarEventSchema);
