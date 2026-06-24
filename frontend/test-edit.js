import axios from 'axios';

async function run() {
  const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
    username: 'admin',
    password: '123456'
  });
  const token = loginRes.data.data.token;
  
  const staffRes = await axios.get('http://localhost:3001/api/staff', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const kumar = staffRes.data.data.find(s => s.username === 'kumar');
  console.log("Found kumar:", kumar._id);
  
  const patch = {
    name: "kumar",
    role: "staff",
    salary: "1000",
    phone: "123",
    email: "kumar@example.com",
    username: "kumar",
    password: "123456",
    profileImage: ""
  };
  
  await axios.put(`http://localhost:3001/api/staff/${kumar._id}`, patch, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Updated kumar!");
  
  try {
    const kLogin = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'kumar',
      password: '123456'
    });
    console.log("Kumar login SUCCESS:", kLogin.data.success);
  } catch (err) {
    console.log("Kumar login FAILED:", err.response?.data);
  }
}
run();
