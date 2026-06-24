import { useEffect, useMemo, useState } from "react";
import { formatInr } from "../../lib/format.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import api from "../../lib/api.js";
import styles from "../../components/admin/Admin.module.css";
import ServiceEditModal from "./ServiceEditModal.jsx";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";
import { FaClipboardList } from "react-icons/fa6";
import { useToast } from "../../context/ToastContext.jsx";

export default function AdminServicesPage() {
  const { clients } = useWorkspace();
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get("/services");
      if (res.data.success) setServices(res.data.data);
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

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
      console.error("Failed to delete service:", err);
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
      console.error("Failed to save service:", err);
      toast.error(err.response?.data?.message || "Failed to save service.");
    }
  };

  return (
    <section className={styles.adminPageSection}>
      <header className={styles.clientsPageHead}>
        <div className={styles.pageHeading}>
          <h2 className={styles.pageHeadingTitle}>Services</h2>
          <p className={styles.pageHeadingSub}>
            {services.length} assigned services across all clients
          </p>
        </div>
        <button
          className={styles.buttonPrimary}
          onClick={() => {
            setEditingService(null);
            setModalOpen(true);
          }}
        >
          Assign new service
        </button>
      </header>

      {loading ? (
        <div className="dash-empty-container">
           <div className="dash-skeleton" style={{ width: "48px", height: "48px", borderRadius: "50%", marginBottom: "16px" }} />
           <div className="dash-skeleton" style={{ width: "160px", height: "16px", marginBottom: "8px" }} />
           <div className="dash-skeleton" style={{ width: "220px", height: "12px" }} />
        </div>
      ) : services.length === 0 ? (
        <div className="dash-empty-container">
          <FaClipboardList className="dash-empty-icon" />
          <p className="dash-empty-title">No services assigned</p>
          <p className="dash-empty-desc">Click "Assign new service" to link a service to a client.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <table className="dash-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>
              <tr>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Client</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Service</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Category</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Price</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "600", color: "#0f172a" }}>
                    {svc.client?.name || "Unknown"}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#334155" }}>
                    {svc.serviceName}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748b" }}>
                    {svc.category}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "600" }}>
                    {formatInr(svc.price)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "999px", 
                      fontSize: "12px",
                      fontWeight: "600",
                      background: svc.status === "Active" ? "#dcfce7" : "#f1f5f9",
                      color: svc.status === "Active" ? "#166534" : "#475569"
                    }}>
                      {svc.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button 
                      onClick={() => { setEditingService(svc); setModalOpen(true); }}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer" }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => confirmDelete(svc)}
                      style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #fee2e2", background: "#fef2f2", color: "#b91c1c", cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ServiceEditModal
          service={editingService}
          clients={clients}
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
    </section>
  );
}
