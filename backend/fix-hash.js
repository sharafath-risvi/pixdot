const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function fix() {
  await mongoose.connect("mongodb://127.0.0.1:27017/pixdot");
  const hash = await bcrypt.hash("password", 12);
  await User.updateOne({ username: "admin" }, { $set: { password: hash } });
  
  const admin = await User.findOne({ username: "admin" }).select("+password");
  console.log("Match 'password' now?", await admin.matchPassword("password"));
  process.exit(0);
}
fix();
