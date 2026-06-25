const jwt = require('jsonwebtoken');
require("dotenv").config();

const run = async () => {
  const token = jwt.sign({ userId: "60d0fe4f5311236168a109ca", role: "admin" }, process.env.JWT_SECRET);
  
  try {
    const res = await fetch('http://127.0.0.1:3001/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error:", e.message);
  }
};
run();
