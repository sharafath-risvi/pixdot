import api from "../lib/api.js";
import { unwrapData, isNotFound } from "./http.js";

/**
 * Notifications — OPTIONAL backend.
 * If endpoints are missing (404), returns empty payload so UI stays quiet.
 *
 * Assumed (not yet implemented on backend):
 *   GET  /api/notifications?limit=
 *   PUT  /api/notifications/read-all
 *   PUT  /api/notifications/:id/read
 */
const EMPTY = { items: [], unreadCount: 0 };

export const notificationService = {
  async list({ limit = 30 } = {}) {
    try {
      const res = await api.get("/api/notifications", { params: { limit } });
      const data = unwrapData(res) || {};
      return {
        items: data.items || [],
        unreadCount: data.unreadCount || 0,
      };
    } catch (err) {
      if (isNotFound(err)) return EMPTY;
      throw err;
    }
  },

  async markAllRead() {
    try {
      await api.put("/api/notifications/read-all");
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw err;
    }
  },

  async markRead(id) {
    try {
      await api.put(`/api/notifications/${id}/read`);
      return true;
    } catch (err) {
      if (isNotFound(err)) return false;
      throw err;
    }
  },
};
