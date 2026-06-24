const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Create a brand new document using new User() instead of User.create()
  const u1 = new User({
    role: "staff",
    username: "test_new_user",
    password: "123456"
  });
  await u1.save();

  // Test comparison
  const hash1 = u1.password;
  console.log("u1.password matches 123456:", await bcrypt.compare("123456", hash1));

  // Now simulate updateStaff behavior EXACTLY
  const u2 = await User.findOne({ username: "test_new_user" }); // without password field
  u2.password = "123456";
  await u2.save();

  const finalU2 = await User.findOne({ username: "test_new_user" }).select("+password");
  console.log("finalU2.password matches 123456:", await bcrypt.compare("123456", finalU2.password));

  await mongoose.disconnect();
}
run();
