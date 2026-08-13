import axios from "axios";
import { readJson, writeJson } from "./storage.js";

const AUTH_STORAGE_KEY = "lp_auth_v1";

const envUrl = String(import.meta.env.VITE_API_URL || "").trim();
const baseURL = envUrl || (import.meta.env.PROD ? "" : "http://localhost:3001");

const api = axios.create({
  baseURL,
  headers: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
});

/** Optional app-level handler (AuthProvider registers logout). */
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
}

export function getApiBaseUrl() {
  return baseURL;
}

api.interceptors.request.use(
  (config) => {
    const authData = readJson(AUTH_STORAGE_KEY);
    if (authData?.token) {
      config.headers.Authorization = `Bearer ${authData.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url || "");
    const isLoginAttempt = url.includes("/api/auth/login");

    if (status === 401 && !isLoginAttempt) {
      writeJson(AUTH_STORAGE_KEY, {
        isAuthenticated: false,
        role: null,
        staffUsername: null,
        clientId: null,
        staffId: null,
        userId: null,
        token: null,
        staffRole: null,
        staffName: null,
      });
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  },
);

export default api;
