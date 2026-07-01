import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaPen } from "react-icons/fa6";
import Calendar from "../../components/admin/Calendar.jsx";
import api from "../../lib/api.js";
import ClientEditForm from "../../components/admin/ClientEditForm.jsx";
import MetaAdsCalendar from "../../components/admin/MetaAdsCalendar.jsx";
import { buildServicePriceSettings } from "../../lib/agencyServices.js";
import { findClientBySlug, staffClientPath, toSlug } from "../../lib/adminSlugs.js";
import { clientServiceNames } from "../../lib/clientServices.js";
import ClientServicesList from "../../components/admin/ClientServicesList.jsx";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import styles from "../../components/admin/Admin.module.css";

export default function StaffClientDetailPage() {
  const { clientSlug } = useParams();
  const { clients } = useWorkspace();
  const client = findClientBySlug(clients, clientSlug);
  const basePath = client ? staffClientPath(client) : `/staff/client/${clientSlug}`;

  if (!client) {
    return (
      <section className={styles.adminPageSection}>
        <p className={styles.emptyText}>Client not found.</p>
        <NavLink to="/staff/clients" className={styles.backLink}>
          ← Back to clients
        </NavLink>
      </section>
    );
  }

  return (
    <section className={styles.adminPageSection}>
      <nav className={styles.adminBreadcrumb} aria-label="Breadcrumb">
        <NavLink to="/staff/clients">Staff</NavLink>
        <span>/</span>
        <NavLink to="/staff/clients">Clients</NavLink>
        <span>/</span>
        <span className={styles.adminBreadcrumbCurrent}>{client.name}</span>
      </nav>

      <div className={styles.detailHeader}>
        {client.logo ? <img src={client.logo} alt="" className={styles.detailHeaderLogo} /> : null}
        <div>
          <h1 className={styles.detailHeaderTitle}>{client.name}</h1>
          <p className={styles.detailHeaderSub}>{client.businessType}</p>
        </div>
      </div>

      <div className={styles.detailTabs} role="tablist">
        <NavLink
          to={basePath}
          end
          className={({ isActive }) => `${styles.detailTab} ${isActive ? styles.detailTabActive : ""}`}
        >
          Profile
        </NavLink>
        <NavLink
          to={`${basePath}/content`}
          className={({ isActive }) => `${styles.detailTab} ${isActive ? styles.detailTabActive : ""}`}
        >
          Calendar
        </NavLink>
        <NavLink
          to={`${basePath}/meta`}
          className={({ isActive }) => `${styles.detailTab} ${isActive ? styles.detailTabActive : ""}`}
        >
          Meta ads
        </NavLink>
      </div>

      <Outlet />
    </section>
  );
}

export function StaffClientProfileView() {
  const { clientSlug } = useParams();
  const { clients } = useWorkspace();
  const client = findClientBySlug(clients, clientSlug);

  if (!client) return <Navigate to="/staff/clients" replace />;

  return (
    <section className={styles.modernCard}>
      <div className={styles.profileCardToolbar}>
        <div>
          <h2 className={styles.cardTitle}>Client profile</h2>
          <p className={styles.cardSub}>Company details and portal login.</p>
        </div>
      </div>

      <ul className={styles.detailsListStack}>
        <li className={styles.detailsItemStack}>
          <strong>Client Name:</strong> {client.name || "—"}
        </li>
        <li className={styles.detailsItemStack}>
          <strong>Phone:</strong> —
        </li>
        <li className={styles.detailsItemStack}>
          <strong>Email:</strong> —
        </li>
        <li className={styles.detailsItemStack}>
          <strong>GST:</strong> —
        </li>
        <li className={styles.detailsItemStack}>
          <strong>Address:</strong> —
        </li>
        <li className={styles.detailsItemStack}>
          <strong>Portal Username:</strong> —
        </li>
        <li className={styles.detailsItemStack}>
          <strong>Core Values:</strong> —
        </li>
        <li className={styles.detailsItemStack}>
          <strong>Image URL:</strong> —
        </li>
      </ul>
      <ClientServicesList client={client} readOnly={true} allowProgressUpdate={true} />
    </section>
  );
}

export function StaffClientContentView() {
  const { clientSlug } = useParams();
  const { clients } = useWorkspace();
  const client = findClientBySlug(clients, clientSlug);
  
  const [store, setStore] = useState({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchCalendar = async () => {
    if (!client) return;
    try {
      const res = await api.get(`/api/clients/${client.id}/calendar/content`);
      setStore(res.data.data);
    } catch (err) {
      console.error("Failed to fetch calendar", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [client]);

  const handleAdd = async (payload) => {
    try {
      await api.post(`/api/clients/${client.id}/calendar/content`, payload);
      toast.success("Content added successfully.");
      await fetchCalendar();
    } catch (err) {
      toast.error("Failed to add task.");
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      await api.put(`/api/clients/${client.id}/calendar/content/${id}`, payload);
      toast.success("Content updated successfully.");
      await fetchCalendar();
    } catch (err) {
      toast.error("Failed to update task.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/clients/${client.id}/calendar/content/${id}`);
      toast.success("Content deleted successfully.");
      await fetchCalendar();
    } catch (err) {
      toast.error("Failed to delete task.");
    }
  };

  if (!client || loading) return (
    <div className="dash-empty-container">
       <div className="dash-skeleton" style={{ width: "48px", height: "48px", borderRadius: "8px", marginBottom: "16px" }} />
       <div className="dash-skeleton" style={{ width: "160px", height: "16px", marginBottom: "8px" }} />
       <div className="dash-skeleton" style={{ width: "220px", height: "12px" }} />
    </div>
  );

  return (
    <Calendar
      title="Content Calendar (Poster & Reel)"
      store={store}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}

export function StaffClientMetaView() {
  const { clientSlug } = useParams();
  const { clients } = useWorkspace();
  const client = findClientBySlug(clients, clientSlug);
  
  const [store, setStore] = useState({});
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchCalendar = async () => {
    if (!client) return;
    try {
      const res = await api.get(`/api/clients/${client.id}/calendar/meta`);
      setStore(res.data.data);
    } catch (err) {
      console.error("Failed to fetch calendar", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [client]);

  const handleAdd = async (payload) => {
    try {
      await api.post(`/api/clients/${client.id}/calendar/meta`, payload);
      toast.success("Meta entry added successfully.");
      await fetchCalendar();
    } catch (err) {
      toast.error("Failed to add campaign.");
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      await api.put(`/api/clients/${client.id}/calendar/meta/${id}`, payload);
      toast.success("Meta entry updated successfully.");
      await fetchCalendar();
    } catch (err) {
      toast.error("Failed to update campaign.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/clients/${client.id}/calendar/meta/${id}`);
      toast.success("Meta entry deleted successfully.");
      await fetchCalendar();
    } catch (err) {
      toast.error("Failed to delete campaign.");
    }
  };

  if (!client || loading) return (
    <div className="dash-empty-container">
       <div className="dash-skeleton" style={{ width: "48px", height: "48px", borderRadius: "8px", marginBottom: "16px" }} />
       <div className="dash-skeleton" style={{ width: "160px", height: "16px", marginBottom: "8px" }} />
       <div className="dash-skeleton" style={{ width: "220px", height: "12px" }} />
    </div>
  );

  return (
    <MetaAdsCalendar 
      title="Meta Ads Calendar"
      store={store} 
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
    />
  );
}
