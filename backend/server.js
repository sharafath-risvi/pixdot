require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Route imports
const authRoutes = require("./routes/auth.routes");
const clientRoutes = require("./routes/client.routes");
const staffRoutes = require("./routes/staff.routes");
const calendarRoutes = require("./routes/calendar.routes");
const notesRoutes = require("./routes/notes.routes");
const pricingRoutes = require("./routes/pricing.routes");
const settingsRoutes = require("./routes/settings.routes");
const clientServiceRoutes = require("./routes/clientService.routes");
const quoteRoutes = require("./routes/quote.routes");

const app = express();

// ─── Database Connection ───────────────────────────────────────────────────
connectDB();

// ─── Global Middleware ─────────────────────────────────────────────────────
app.set("trust proxy", 1);
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        process.env.FRONTEND_ORIGIN
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Health Check ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ success: true, message: "Pixdot Backend is running 🚀" });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
// Calendar is nested under clients: /api/clients/:clientId/calendar
app.use("/api/clients/:clientId/calendar", calendarRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/services", clientServiceRoutes);
app.use("/api/quotes", quoteRoutes);

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Central Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n✅ Pixdot backend running at http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`   MongoDB URI : ${process.env.MONGO_URI}`);
});