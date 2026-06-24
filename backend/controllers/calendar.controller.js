const CalendarEvent = require("../models/CalendarEvent");
const Client = require("../models/Client");

/**
 * Validates that calendarType is "content" or "meta".
 */
function validateType(type) {
  return type === "content" || type === "meta";
}

/**
 * Checks if the requesting user can access this clientId.
 * - admin: any
 * - staff: any (all clients visible)
 * - client: own only
 */
function canAccessClient(req, clientId) {
  if (req.user.role === "admin" || req.user.role === "staff") return true;
  if (req.user.role === "client") {
    return req.user.clientId?.toString() === clientId;
  }
  return false;
}

/**
 * @route   GET /api/clients/:clientId/calendar/:type
 * @access  Private (admin, staff, client — own only)
 * @desc    Get all calendar events for a client.
 *          Returns a dateKey-indexed map matching frontend format:
 *          { "2026-6-17": [event, ...], ... }
 */
const getCalendar = async (req, res, next) => {
  try {
    const { clientId, type } = req.params;

    if (!validateType(type)) {
      return res.status(400).json({ success: false, message: 'Calendar type must be "content" or "meta".' });
    }
    if (!canAccessClient(req, clientId)) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const events = await CalendarEvent.find({ clientId, calendarType: type }).sort({ dateKey: 1 });

    // Build the dateKey map the frontend expects
    const calendarMap = {};
    for (const event of events) {
      if (!calendarMap[event.dateKey]) calendarMap[event.dateKey] = [];
      const eventObj = event.toObject();
      eventObj.id = eventObj._id; // Map _id to id for frontend compatibility
      calendarMap[event.dateKey].push(eventObj);
    }

    return res.status(200).json({ success: true, data: calendarMap });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/clients/:clientId/calendar/:type
 * @access  Private (admin, staff only)
 * @desc    Add a new event to a day
 */
const addEvent = async (req, res, next) => {
  try {
    const { clientId, type } = req.params;

    if (!validateType(type)) {
      return res.status(400).json({ success: false, message: 'Calendar type must be "content" or "meta".' });
    }

    const { dateKey, ...rest } = req.body;
    if (!dateKey) {
      return res.status(400).json({ success: false, message: "dateKey is required." });
    }

    const event = await CalendarEvent.create({
      clientId,
      calendarType: type,
      dateKey,
      ...rest,
    });

    return res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/clients/:clientId/calendar/:type/:eventId
 * @access  Private (admin, staff only)
 * @desc    Update a calendar event
 */
const updateEvent = async (req, res, next) => {
  try {
    const { clientId, type, eventId } = req.params;

    if (!validateType(type)) {
      return res.status(400).json({ success: false, message: 'Calendar type must be "content" or "meta".' });
    }

    const event = await CalendarEvent.findOne({ _id: eventId, clientId, calendarType: type });
    if (!event) {
      return res.status(404).json({ success: false, message: "Calendar event not found." });
    }

    // Update allowed fields
    const allowedFields = [
      "dateKey", "kind", "subtype", "status", "completed", "reasonNote",
      "adType", "campaignName", "platform", "budgetType", "budgetAmount",
      "startDate", "endDate", "targetAudience", "objective", "metaStatus",
      "contentPlan"
    ];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    }

    await event.save();
    return res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/clients/:clientId/calendar/:type/:eventId
 * @access  Private (admin, staff only)
 * @desc    Delete a calendar event
 */
const deleteEvent = async (req, res, next) => {
  try {
    const { clientId, type, eventId } = req.params;

    if (!validateType(type)) {
      return res.status(400).json({ success: false, message: 'Calendar type must be "content" or "meta".' });
    }

    const event = await CalendarEvent.findOneAndDelete({ _id: eventId, clientId, calendarType: type });
    if (!event) {
      return res.status(404).json({ success: false, message: "Calendar event not found." });
    }

    return res.status(200).json({ success: true, message: "Event deleted." });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCalendar, addEvent, updateEvent, deleteEvent };
