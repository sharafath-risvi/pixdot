const mongoose = require('mongoose');
const User = require('./models/User');
const Staff = require('./models/Staff');
const Client = require('./models/Client');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/pixdot');
  
  const users = await User.find({}).select('+password');
  console.log("Total users:", users.length);
  users.forEach(u => console.log(u.role, u.username, u.password ? "Has password" : "NO PASSWORD"));
  
  const staffs = await Staff.find({});
  console.log("\nTotal staff:", staffs.length);
  staffs.forEach(s => console.log(s.name, s.userId));

  const clients = await Client.find({});
  console.log("\nTotal clients:", clients.length);
  clients.forEach(c => console.log(c.name, c.userId));
  
  process.exit(0);
}
run();
