const express = require("express");
const router = express.Router();
const { login, getMe, changeUserPassword, changeMyPassword } = require("../controllers/auth.controller");
const { protect, authorise } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

// Rate limit login: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public (Rate limiter temporarily disabled for development)
router.post("/login", login);

// Private — all authenticated users
router.get("/me", protect, getMe);

// Private — admin only
router.put("/change-my-password", protect, authorise("admin"), changeMyPassword);
router.put("/change-password/:userId", protect, authorise("admin"), changeUserPassword);

module.exports = router;
