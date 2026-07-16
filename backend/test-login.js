const mongoose = require("mongoose");
const User = require("./models/User");
async function test() {
  await mongoose.connect("mongodb://127.0.0.1:27017/pixdot");
  const admin = await User.findOne({ username: "admin" }).select("+password");
  console.log("Admin exists?", !!admin);
  if (admin) {
    console.log("Password hash:", admin.password);
    console.log("Match 'password'?", await admin.matchPassword("password"));
    console.log("Match '123456'?", await admin.matchPassword("123456"));
  }
  process.exit(0);
}
test();
