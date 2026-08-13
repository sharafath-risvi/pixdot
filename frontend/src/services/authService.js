import api from "../lib/api.js";
import { unwrapData } from "./http.js";

/**
 * Auth API
 *
 * POST /api/auth/login
 *   body: { username, password }
 *   data: { token, user, dashboard, profile? }
 *
 * GET /api/auth/me
 *   data: { user, profile? }
 */
export const authService = {
  async login(username, password) {
    const res = await api.post("/api/auth/login", {
      username: String(username || "").trim(),
      password: String(password || ""),
    });
    return unwrapData(res);
  },

  async me() {
    const res = await api.get("/api/auth/me");
    return unwrapData(res);
  },

  async changeMyPassword({ currentPassword, newPassword }) {
    const res = await api.put("/api/auth/change-my-password", {
      currentPassword,
      newPassword,
    });
    return res.data;
  },

  async changeUserPassword(userId, { newPassword }) {
    const res = await api.put(`/api/auth/change-password/${userId}`, { newPassword });
    return res.data;
  },
};
