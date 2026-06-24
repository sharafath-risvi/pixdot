require("dotenv").config();
const jwt = require("jsonwebtoken");
const testApi = async () => {
  const token = jwt.sign({ role: "admin", userId: "60c72b2f9b1d8b0015b6d9c6" }, process.env.JWT_SECRET);
  console.log("Token generated");

  // 1. Create staff
  let res = await fetch("http://localhost:3001/api/staff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      name: "apistaff3",
      role: "worker",
      salary: "100",
      phone: "123",
      email: "api3@test.com",
      username: "apistaff3",
      password: "123456"
    })
  });
  let data = await res.json();
  console.log("Create staff response:", data);

  // 2. Login as staff
  res = await fetch("http://localhost:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "apistaff3", password: "123456" })
  });
  data = await res.json();
  console.log("Login staff response:", data);
};

testApi();
