import axios from "axios";
import { readJson, writeJson } from "./storage.js";

const AUTH_STORAGE_KEY = "lp_auth_v1";

/**
 * Resolve Axios baseURL.
 *
 * Production (app.pixdotsolutions.com) uses same-origin "" so requests hit
 * `/api/...` and nginx proxies to the live backend (see vps-nginx.conf).
 *
 * Never bake localhost into a production build — that causes browser
 * "Network Error" on login when VITE_API_URL=http://localhost:3001 was set at build time.
 */
function resolveApiBaseUrl() {
  const raw = String(
    import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "",
  )
    .trim()
    .replace(/\/$/, "");

  const isLoopback =
    !raw ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw);

  if (import.meta.env.PROD) {
    if (isLoopback) return "";
    return raw;
  }

  if (isLoopback) return "http://localhost:3001";
  return raw;
}

const baseURL = resolveApiBaseUrl();

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
