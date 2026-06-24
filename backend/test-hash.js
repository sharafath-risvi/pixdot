const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/pixdot');
  
  const oldHash = await bcrypt.hash("123456", 12);
  console.log("Old hash:", oldHash);
  
  const user = await User.findOne({ username: 'kumar' }).select('+password');
  console.log("Current DB password for kumar:", user.password);
  
  console.log("Does 123456 match kumar?", await bcrypt.compare("123456", user.password));
  
  process.exit(0);
}
run();
