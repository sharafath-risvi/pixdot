import api from "./src/lib/api.js";

async function run() {
  try {
    const res = await api.get("/api/clients");
    console.log("Clients:", res.data.data.length);
  } catch (err) {
    console.error("Clients Error:", err.message);
  }

  try {
    const res = await api.get("/api/staff");
    console.log("Staff:", res.data.data.length);
  } catch (err) {
    console.error("Staff Error:", err.message);
  }
}
run();
