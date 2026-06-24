const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/pixdot');
  const users = await User.find({}).select('+password');
  for (const u of users) {
    const match = await u.matchPassword("123456");
    console.log(`User: ${u.username}, match 123456: ${match}`);
  }
  process.exit(0);
}
run();
