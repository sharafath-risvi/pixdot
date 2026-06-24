const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

const testCreate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.create({
      role: "staff",
      username: "test_staff_abc_2",
      password: "123456",
    });
    console.log("User created!");

    const fetchedUser = await User.findById(user._id).select("+password");
    console.log("Saved password:", fetchedUser.password);
    console.log("Starts with $2b$ or $2a$?", fetchedUser.password.startsWith("$2b$") || fetchedUser.password.startsWith("$2a$"));
    
    console.log("Does '123456' match?", await bcrypt.compare("123456", fetchedUser.password));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

testCreate();
