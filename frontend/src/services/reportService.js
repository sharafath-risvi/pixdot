import api from "../lib/api.js";
import { unwrapData } from "./http.js";

/**
 * Daily report sheet + per-staff column config.
 *
 * Sheet rows: /api/reports/*
 * Staff fields: /api/daily-report/*
 * Admin overview: GET /api/daily-report/admin/overview
 */
export const reportService = {
  async getSheet({ month, staffId, jobRole, date } = {}) {
    const res = await api.get("/api/reports/sheet", {
      params: {
        month,
        staffId: staffId || undefined,
        jobRole: jobRole || undefined,
        date: date || undefined,
      },
    });
    return unwrapData(res);
  },

  async saveSheetRow(payload) {
    const res = await api.put("/api/reports/sheet/row", payload);
    return unwrapData(res);
  },

  async deleteSheetRow(payload) {
    const res = await api.delete("/api/reports/sheet/row", { data: payload });
    return unwrapData(res) ?? res.data;
  },

  async deleteSheetMonth(payload) {
    const res = await api.delete("/api/reports/sheet/month", { data: payload });
    return unwrapData(res) ?? res.data;
  },

  async getMonths(params) {
    const res = await api.get("/api/reports/months", { params });
    return unwrapData(res);
  },

  async getOptions(params) {
    const res = await api.get("/api/reports/options", { params });
    return unwrapData(res);
  },

  async getAdminOverview(params) {
    const res = await api.get("/api/daily-report/admin/overview", { params });
    return unwrapData(res);
  },

  async getFields(params) {
    const res = await api.get("/api/daily-report/fields", { params });
    return unwrapData(res);
  },

  async createField(payload) {
    const res = await api.post("/api/daily-report/fields", payload);
    return unwrapData(res);
  },

  async updateField(id, payload) {
    const res = await api.put(`/api/daily-report/fields/${id}`, payload);
    return unwrapData(res);
  },

  async deleteField(id, params) {
    const res = await api.delete(`/api/daily-report/fields/${id}`, { params });
    return res.data;
  },

  async getFieldOptions(fieldId, params) {
    const res = await api.get(`/api/daily-report/fields/${fieldId}/options`, { params });
    return unwrapData(res);
  },

  async createFieldOption(fieldId, payload) {
    const res = await api.post(`/api/daily-report/fields/${fieldId}/options`, payload);
    return unwrapData(res);
  },

  async updateOption(id, payload) {
    const res = await api.put(`/api/daily-report/options/${id}`, payload);
    return unwrapData(res);
  },

  async deleteOption(id, params) {
    const res = await api.delete(`/api/daily-report/options/${id}`, { params });
    return res.data;
  },
};
