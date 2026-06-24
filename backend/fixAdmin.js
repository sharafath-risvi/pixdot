const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ username: "admin" });
  if (user) {
    user.password = "123456";
    await user.save();
    console.log("Admin password reset to 123456");
  }
  process.exit();
}
run();
