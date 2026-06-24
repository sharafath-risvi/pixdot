import axios from "axios";
import { readJson } from "./storage.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  headers: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const authData = readJson("lp_auth_v1");
    if (authData && authData.token) {
      config.headers.Authorization = `Bearer ${authData.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional response interceptor for handling 401s (token expiry, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // You can trigger a logout here if needed, or let components handle it
      // For now, we'll just reject the promise
    }
    return Promise.reject(error);
  }
);

export default api;
