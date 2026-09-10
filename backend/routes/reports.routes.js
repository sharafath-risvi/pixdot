const express = require("express");
const router = express.Router();
const reportsController = require("../controllers/reports.controller");
const { protect } = require("../middleware/auth");

router.get("/date/:date", protect, reportsController.getReportsByDate);
router.post("/", protect, reportsController.createReport);

module.exports = router;
