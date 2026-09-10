const CalendarEvent = require("../models/CalendarEvent");
const Client = require("../models/Client");

const getGlobalCalendar = async (req, res, next) => {
  try {
    const { month, status, contentType, clientId, q } = req.query;
    // month format expected: YYYY-MM
    let year, monthNum;
    if (month) {
      const parts = month.split("-");
      year = parseInt(parts[0], 10);
      monthNum = parseInt(parts[1], 10) - 1; // 0-indexed for Date
    } else {
      const now = new Date();
      year = now.getFullYear();
      monthNum = now.getMonth();
    }

    // Generate dates for the month
    const dates = [];
    const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
    const monthName = new Date(year, monthNum, 1).toLocaleString('default', { month: 'short' });
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, monthNum, i);
      const weekday = d.toLocaleString('default', { weekday: 'long' });
      dates.push({
        dateKey: `${year}-${monthNum + 1}-${i}`,
        day: i,
        label: `${String(i).padStart(2, "0")} ${monthName}`,
        weekday
      });
    }

    // Build client query
    const clientQuery = {};
    if (clientId && clientId !== "all") {
      clientQuery._id = clientId;
    }
    if (q) {
      clientQuery.name = { $regex: q, $options: "i" };
    }
    
    const clients = await Client.find(clientQuery).sort({ name: 1 }).lean();
    const clientIds = clients.map(c => c._id);

    // Build event query
    const eventQuery = {
      clientId: { $in: clientIds },
      calendarType: "content",
      // Match date keys starting with year-month-
      dateKey: new RegExp(`^${year}-${monthNum + 1}-`)
    };

    if (status && status !== "all") {
      eventQuery.status = status;
    }
    if (contentType && contentType !== "all") {
      eventQuery.kind = contentType; // Assuming contentType filter matches 'kind'
    }

    const events = await CalendarEvent.find(eventQuery).lean();
    
    // Map _id to id for frontend compatibility
    const contents = events.map(e => ({
      ...e,
      id: e._id,
      clientId: e.clientId.toString()
    }));
    
    const formattedClients = clients.map(c => ({
      ...c,
      id: c._id
    }));

    return res.status(200).json({
      success: true,
      data: {
        clients: formattedClients,
        dates,
        contents
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGlobalCalendar };
