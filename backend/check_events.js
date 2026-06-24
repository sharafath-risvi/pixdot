const mongoose = require("mongoose");
const CalendarEvent = require("./models/CalendarEvent");

async function checkEvents() {
  await mongoose.connect("mongodb://127.0.0.1:27017/pixdot");
  const events = await CalendarEvent.find({});
  console.log("Events count:", events.length);
  events.forEach(e => console.log(e.dateKey, e.calendarType, e.kind, e.subtype));
  process.exit(0);
}
checkEvents();
