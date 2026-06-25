const mongoose = require("mongoose");
const Client = require("./models/Client");
const Staff = require("./models/Staff");

const run = async () => {
  const uri = "mongodb+srv://sharafathrisvi02_db_user:NTMpAiTEO3Rxzxhs@pixdot.i26a1lt.mongodb.net/test?appName=pixdot";
  await mongoose.connect(uri);
  const clients = await Client.find({});
  const staff = await Staff.find({});
  console.log("TEST DB Client count DB:", clients.length);
  console.log("TEST DB Staff count DB:", staff.length);
  process.exit(0);
};
run();
