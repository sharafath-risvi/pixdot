const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/pixdot');
  const User = require('./models/User');
  const admin = await User.findOne({ role: 'admin' });
  const token = admin.getSignedJwtToken();
  
  try {
    const res = await fetch('http://localhost:3001/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("Clients count:", data.data ? data.data.length : data);
  } catch (err) {
    console.error("Error fetching clients:", err);
  }
  
  try {
    const res2 = await fetch('http://localhost:3001/api/staff', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data2 = await res2.json();
    console.log("Staff count:", data2.data ? data2.data.length : data2);
  } catch (err) {
    console.error("Error fetching staff:", err);
  }
  process.exit();
}
run();
