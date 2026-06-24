const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/pixdot');
  
  const users = await User.find({});
  for (const u of users) {
    if (u.role !== 'admin') {
      u.password = "123456";
      await u.save();
      console.log(`Reset ${u.username}`);
    }
  }
  process.exit(0);
}
run();
