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
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// ─── Global Middleware ─────────────────────────────────────────────────────
app.set("trust proxy", 1);
app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Incoming Origin:", origin);
      const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://app.pixdotsolutions.com",
        "https://pixdotsolutions.com",
        process.env.FRONTEND_ORIGIN
      ].filter(Boolean);
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
app.use("/api/quotes", quoteRoutes);

// ─── Automated Webhook Deploy Endpoint ─────────────────────────────────────
app.post("/api/deploy-webhook", (req, res) => {
  const secret = process.env.DEPLOY_SECRET || "pixdot_deploy_secret_2026";
  const providedToken = req.query.token || req.headers["x-deploy-token"];
  if (providedToken !== secret) {
    return res.status(401).json({ success: false, message: "Unauthorized deploy token" });
  }

  console.log("🚀 Webhook deploy triggered! Starting git pull & build...");
  const { exec } = require("child_process");
  exec("cd /opt/pixdot/app && git reset --hard origin/main && git pull origin main && cd frontend && npm run build", (error, stdout, stderr) => {
    if (error) {
      console.error(`Deploy execution error: ${error.message}`);
      return;
    }
    console.log(`Deploy finished cleanly:\n${stdout}`);
  });

  // Return immediately so GitHub gets 200 OK without waiting for npm run build
  res.json({ success: true, message: "Deployment triggered in background 🚀" });
});

// ─── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Central Error Handler (must be last) ─────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, "::", () => {
    console.log(`\n✅ Pixdot backend running at http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`   MongoDB URI : ${process.env.MONGO_URI}`);
  });
}

module.exports = app;