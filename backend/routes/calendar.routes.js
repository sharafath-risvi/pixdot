const express = require("express");
const router = express.Router({ mergeParams: true }); // mergeParams to get :clientId
const { getCalendar, addEvent, updateEvent, deleteEvent } = require("../controllers/calendar.controller");
const { protect, authorise } = require("../middleware/auth");

// GET  /api/clients/:clientId/calendar/:type     — admin, staff, client (own)
router.get("/:type", protect, authorise("admin", "staff", "client"), getCalendar);

// POST /api/clients/:clientId/calendar/:type     — admin + staff only
router.post("/:type", protect, authorise("admin", "staff"), addEvent);

// PUT  /api/clients/:clientId/calendar/:type/:eventId — admin + staff only
router.put("/:type/:eventId", protect, authorise("admin", "staff"), updateEvent);

// DELETE /api/clients/:clientId/calendar/:type/:eventId — admin + staff only
router.delete("/:type/:eventId", protect, authorise("admin", "staff"), deleteEvent);

module.exports = router;
