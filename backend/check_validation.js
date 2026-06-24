const mongoose = require("mongoose");
const CalendarEvent = require("./models/CalendarEvent");

async function checkValidation() {
  await mongoose.connect("mongodb://127.0.0.1:27017/pixdot");
  
  try {
    const event = new CalendarEvent({
      clientId: new mongoose.Types.ObjectId(),
      calendarType: "meta",
      dateKey: "2026-6-18",
      metaStatus: "active",
      contentPlan: "This is a test content plan."
    });
    await event.validate();
    console.log("Validation passed successfully!");
  } catch (err) {
    console.error("Validation failed:", err.message);
  }
  process.exit(0);
}
checkValidation();
