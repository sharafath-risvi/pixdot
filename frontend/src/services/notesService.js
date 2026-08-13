import api from "../lib/api.js";
import { unwrapData, withId, withIds } from "./http.js";

/**
 * Personal notes (staff / client)
 * GET|POST /api/notes
 * PUT|DELETE /api/notes/:id
 */
export const notesService = {
  async getNotes() {
    const res = await api.get("/api/notes");
    return withIds(unwrapData(res) || []);
  },

  async createNote(payload) {
    const res = await api.post("/api/notes", payload);
    return withId(unwrapData(res));
  },

  async updateNote(id, payload) {
    const res = await api.put(`/api/notes/${id}`, payload);
    return withId(unwrapData(res));
  },

  async deleteNote(id) {
    const res = await api.delete(`/api/notes/${id}`);
    return res.data;
  },
};
