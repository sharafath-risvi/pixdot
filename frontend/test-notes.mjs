const axios = require('axios');

async function run() {
  // Login as staff
  let loginRes;
  try {
    loginRes = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'arun_k',
      password: '123456' // I reset passwords to 123456 in the previous step
    });
  } catch (err) {
    console.error("Login failed", err.response?.data);
    return;
  }
  const token = loginRes.data.data.token;
  
  // Create a note
  let createRes;
  try {
    createRes = await axios.post('http://localhost:3001/api/notes', {
      title: "Test Note",
      description: "Testing API",
      type: "Daily",
      date: "2026-06-17"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Create Note:", createRes.data);
  } catch(err) {
    console.error("Create failed", err.response?.data);
    return;
  }
  
  // Get notes
  try {
    const getRes = await axios.get('http://localhost:3001/api/notes', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Get Notes count:", getRes.data.data.length);
  } catch (err) {
    console.error("Get failed", err.response?.data);
  }
}
run();
