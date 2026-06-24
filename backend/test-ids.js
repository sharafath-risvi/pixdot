const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/pixdot');
  const users = await User.find({});
  users.forEach(u => console.log(u.username, u._id));
  process.exit(0);
}
run();
