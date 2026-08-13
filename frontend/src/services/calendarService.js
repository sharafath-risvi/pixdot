import api from "../lib/api.js";
import { unwrapData, isNotFound } from "./http.js";

/**
 * Calendar API
 *
 * Per-client: /api/clients/:clientId/calendar/:type  (content | meta)
 * Global:     GET /api/calendar/global?month=&type=
 *
 * Event shape varies by calendarType — see docs/API-INTEGRATION.md
 */
export const calendarService = {
  async getClientCalendar(clientId, type) {
    const res = await api.get(`/api/clients/${clientId}/calendar/${type}`);
    return unwrapData(res);
  },

  async createClientEvent(clientId, type, payload) {
    const res = await api.post(`/api/clients/${clientId}/calendar/${type}`, payload);
    return unwrapData(res);
  },

  async updateClientEvent(clientId, type, eventId, payload) {
    const res = await api.put(`/api/clients/${clientId}/calendar/${type}/${eventId}`, payload);
    return unwrapData(res);
  },

  async deleteClientEvent(clientId, type, eventId) {
    const res = await api.delete(`/api/clients/${clientId}/calendar/${type}/${eventId}`);
    return res.data;
  },

  async getGlobal({ month, type, ...rest } = {}) {
    const res = await api.get("/api/calendar/global", {
      params: { month, type, ...rest },
    });
    return unwrapData(res);
  },

  /**
   * Optional endpoint — backend may not implement yet.
   * Returns null on 404 instead of throwing.
   */
  async getSummary() {
    try {
      const res = await api.get("/api/calendar/summary");
      return unwrapData(res);
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
  },
};
