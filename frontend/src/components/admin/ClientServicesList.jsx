import { useEffect, useState } from "react";
import api from "../../lib/api.js";
import { formatInr } from "../../lib/format.js";
import styles from "./Admin.module.css";
import ServiceEditModal from "../../pages/admin/ServiceEditModal.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import { FaClipboardList } from "react-icons/fa6";
import { useToast } from "../../context/ToastContext.jsx";

export default function ClientServicesList({ client, readOnly = false }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const toast = useToast();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const fetchServices = async () => {
    try {
      const res = await api.get("/api/services");
      if (res.data.success) {
        // Filter manually if the API returns all, though API can be updated to accept ?clientId=...
        const clientServices = res.data.data.filter(s => s.client?._id === client.id || s.client === client.id);
        setServices(clientServices);
      }
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [client.id]);

  const confirmDelete = (svc) => {
    setServiceToDelete(svc);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await api.delete(`/services/${serviceToDelete._id}`);
      toast.success("Service deleted successfully.");
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete service.");
    } finally {
      setDeleteModalOpen(false);
      setServiceToDelete(null);
    }
  };

  const handleSave = async (payload) => {
    try {
      if (editingService) {
        await api.put(`/services/${editingService._id}`, payload);
        toast.success("Service updated successfully.");
      } else {
        await api.post("/services", payload);
        toast.success("Service added successfully.");
      }
      setModalOpen(false);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save service.");
    }
  };

  return (
    <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>Assigned Services</h3>
        {!readOnly && (
          <button
            onClick={() => { setEditingService(null); setModalOpen(true); }}
            style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "#6366f1", color: "white", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}
          >
            Assign Service
          </button>
        )}
      </div>

      {loading ? (
        <div className="dash-empty-container" style={{ padding: "32px 16px" }}>
          <div className="dash-skeleton" style={{ width: "160px", height: "16px", marginBottom: "8px" }} />
          <div className="dash-skeleton" style={{ width: "220px", height: "12px" }} />
        </div>
      ) : services.length === 0 ? (
        <div className="dash-empty-container" style={{ padding: "32px 16px" }}>
          <FaClipboardList className="dash-empty-icon" style={{ fontSize: "32px", marginBottom: "8px" }} />
          <p className="dash-empty-title" style={{ fontSize: "0.95rem" }}>No services assigned</p>
          {!readOnly && <p className="dash-empty-desc" style={{ fontSize: "0.8rem" }}>Assign a service to this client.</p>}
        </div>
      ) : (
        <div style={{ overflowX: "auto", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table className="dash-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>
              <tr>
                <th style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0" }}>Service</th>
                <th style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                <th style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0" }}>Price</th>
                {!readOnly && <th style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px 16px", fontWeight: "500", color: "#0f172a" }}>
                    {svc.serviceName}
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{svc.category}</div>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ padding: "4px 8px", borderRadius: "999px", fontSize: "12px", fontWeight: "600", background: svc.status === "Active" ? "#dcfce7" : "#f1f5f9", color: svc.status === "Active" ? "#166534" : "#475569" }}>
                      {svc.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#334155", fontWeight: "600" }}>
                    {formatInr(svc.price)}
                  </td>
                  {!readOnly && (
                    <td style={{ padding: "10px 16px", textAlign: "right", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button onClick={() => { setEditingService(svc); setModalOpen(true); }} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "12px" }}>Edit</button>
                      <button onClick={() => confirmDelete(svc)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#b91c1c", cursor: "pointer", fontSize: "12px" }}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && !readOnly && (
        <ServiceEditModal
          service={editingService}
          clients={[{ id: client.id, name: client.name }]} // Only this client
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Service"
        message={`Are you sure you want to delete ${serviceToDelete?.serviceName}?`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
