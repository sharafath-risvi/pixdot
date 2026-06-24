import { useEffect, useState } from "react";
import styles from "../../components/admin/Admin.module.css";
import { AGENCY_SERVICES } from "../../lib/agencyServices.js";

const empty = { clientId: "", serviceName: "", category: "General", description: "", status: "Active", price: 0, startDate: "", endDate: "" };

export default function ServiceEditModal({ service, clients, onSave, onClose }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (service) {
      setForm({
        clientId: service.client?._id || service.client || "",
        serviceName: service.serviceName || "",
        category: service.category || "General",
        description: service.description || "",
        status: service.status || "Active",
        price: service.price || 0,
        startDate: service.startDate ? new Date(service.startDate).toISOString().slice(0,10) : "",
        endDate: service.endDate ? new Date(service.endDate).toISOString().slice(0,10) : "",
      });
    } else {
      setForm({ ...empty, startDate: new Date().toISOString().slice(0, 10) });
    }
  }, [service]);

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(4px)" }}>
      <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "16px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)", maxHeight: "90vh", overflowY: "auto" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>
          {service ? "Edit service" : "Assign new service"}
        </h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>
            Client
            <select
              required
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
            >
              <option value="" disabled>Select client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>
              Service Name
              <input
                required
                list="service-names"
                value={form.serviceName}
                onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                placeholder="e.g. Website Development"
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
              />
              <datalist id="service-names">
                {AGENCY_SERVICES.map(s => <option key={s.id} value={s.name} />)}
              </datalist>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>
              Category
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Design"
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
              />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief details about the service scope..."
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", resize: "vertical" }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>
              Status
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>
              Price (Rs.)
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>
              Start Date
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>
              End Date (Optional)
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                style={{ padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "white", color: "#475569", fontWeight: "600", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: "#6366f1", color: "white", fontWeight: "600", cursor: "pointer" }}
            >
              {service ? "Save changes" : "Assign service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
