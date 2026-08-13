import api from "../lib/api.js";
import { unwrapData, withId, withIds } from "./http.js";

/**
 * Staff API — CRUD
 *
 * Shape (UI-facing):
 * {
 *   id, name, role (job title), salary, phone, email, profileImage,
 *   username?, password?, userId?, createdAt?, updatedAt?
 * }
 */
export const staffService = {
  async getStaff() {
    const res = await api.get("/api/staff");
    return withIds(unwrapData(res) || []);
  },

  async getStaffById(id) {
    const res = await api.get(`/api/staff/${id}`);
    return withId(unwrapData(res));
  },

  async createStaff(payload) {
    const res = await api.post("/api/staff", payload);
    return withId(unwrapData(res));
  },

  async updateStaff(id, payload) {
    const res = await api.put(`/api/staff/${id}`, payload);
    return withId(unwrapData(res));
  },

  async deleteStaff(id) {
    const res = await api.delete(`/api/staff/${id}`);
    return res.data;
  },
};
