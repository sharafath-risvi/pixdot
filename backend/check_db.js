const mongoose = require("mongoose");
const User = require("./models/User");
const Staff = require("./models/Staff");
const Client = require("./models/Client");

async function checkDB() {
  await mongoose.connect("mongodb://127.0.0.1:27017/pixdot");
  
  const users = await User.find({});
  console.log("Users:", users);

  const admin = await User.findOne({ role: "admin" }).select("+password");
  console.log("Admin User:", admin);

  process.exit(0);
}

checkDB();
