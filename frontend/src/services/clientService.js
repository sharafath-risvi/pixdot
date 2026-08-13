import api from "../lib/api.js";
import { unwrapData, withId, withIds } from "./http.js";

/**
 * Clients API — CRUD
 *
 * Shape (UI-facing):
 * {
 *   id, name, logo, businessType, gstNumber, phone, email, address,
 *   coreValues, totalAmount, username?, userId?, createdAt?, updatedAt?
 * }
 */
export const clientService = {
  async getClients() {
    const res = await api.get("/api/clients");
    return withIds(unwrapData(res) || []);
  },

  async getClientById(id) {
    const res = await api.get(`/api/clients/${id}`);
    return withId(unwrapData(res));
  },

  async createClient(payload) {
    const res = await api.post("/api/clients", payload);
    return withId(unwrapData(res));
  },

  async updateClient(id, payload) {
    const res = await api.put(`/api/clients/${id}`, payload);
    return withId(unwrapData(res));
  },

  async deleteClient(id) {
    const res = await api.delete(`/api/clients/${id}`);
    return res.data;
  },
};
