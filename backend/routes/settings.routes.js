const express = require("express");
const router = express.Router();
const { getSettings, updateSetting } = require("../controllers/settings.controller");
const { protect, authorise } = require("../middleware/auth");

// Admin only
router.get("/", protect, authorise("admin"), getSettings);
router.put("/:key", protect, authorise("admin"), updateSetting);

module.exports = router;
