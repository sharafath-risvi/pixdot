const mongoose = require("mongoose");
require("dotenv").config();
const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require("../models/User");
    const users = await User.find().select("+password");
    const bcrypt = require("bcryptjs");
    for (const u of users) {
      if (u.username === "maari") {
        console.log(`User: ${u.username}`);
        u.password = "123456";
        await u.save();
        console.log("maari password reset to 123456");
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};
checkDB();
