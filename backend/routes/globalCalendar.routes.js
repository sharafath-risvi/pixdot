const express = require("express");
const router = express.Router();
const { getGlobalCalendar } = require("../controllers/globalCalendar.controller");
const { protect, authorise } = require("../middleware/auth");

// GET /api/calendar/global
// Only admin and staff can access global calendar
router.get("/global", protect, authorise("admin", "staff"), getGlobalCalendar);

module.exports = router;
