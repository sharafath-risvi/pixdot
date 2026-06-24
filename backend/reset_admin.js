const mongoose = require("mongoose");
const User = require("./models/User");

async function resetAdmin() {
  await mongoose.connect("mongodb://127.0.0.1:27017/pixdot");
  
  const admin = await User.findOne({ role: "admin" });
  if (admin) {
    admin.password = "123456";
    await admin.save();
    console.log("Admin password reset to 123456");
  } else {
    console.log("Admin user not found");
  }

  process.exit(0);
}

resetAdmin();
