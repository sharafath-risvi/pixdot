const mongoose = require("mongoose");
const Client = require("./models/Client");
const Staff = require("./models/Staff");
require("dotenv").config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const clients = await Client.find({});
  const staff = await Staff.find({});
  console.log("Client count DB:", clients.length);
  console.log("Staff count DB:", staff.length);
  process.exit(0);
};
run();
