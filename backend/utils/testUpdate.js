const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();
const bcrypt = require("bcryptjs");

const testUpdate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // 1. Create user with 123456
    await User.deleteOne({ username: "test_update" });
    let userAccount = await User.create({
      role: "staff",
      username: "test_update",
      password: "123456",
    });
    console.log("Created. Hash:", userAccount.password);
    
    // 2. Fetch without password
    userAccount = await User.findById(userAccount._id);
    console.log("Fetched. Has password field?", userAccount.password !== undefined);

    // 3. Set password to "123456" (like what updateStaff does)
    userAccount.password = "123456";
    await userAccount.save();

    // 4. Fetch again and check
    const finalUser = await User.findById(userAccount._id).select("+password");
    console.log("Final Hash:", finalUser.password);
    const isMatch = await bcrypt.compare("123456", finalUser.password);
    console.log("Does 123456 match final hash?", isMatch);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

testUpdate();
