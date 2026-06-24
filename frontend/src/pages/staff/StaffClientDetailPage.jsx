import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaPen } from "react-icons/fa6";
import Calendar from "../../components/admin/Calendar.jsx";
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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { clients, updateClient } = useWorkspace();
  const { services } = useServicePricing();
  const servicePriceSettings = useMemo(() => buildServicePriceSettings(services), [services]);
  const client = findClientBySlug(clients, clientSlug);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (searchParams.get("edit") !== "1") return;
    setEditing(true);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  if (!client) return <Navigate to="/staff/clients" replace />;

  const serviceNames = clientServiceNames(client);

  const handleSave = (patch) => {
    updateClient(client.id, patch);
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);

    const nextSlug = toSlug(patch.name || client.name);
    if (nextSlug && nextSlug !== clientSlug) {
      navigate(staffClientPath({ ...client, ...patch }), { replace: true });
    }
  };

  return (
    <section className={styles.modernCard}>
      <div className={styles.profileCardToolbar}>
        <div>
          <h2 className={styles.cardTitle}>Client profile</h2>
          <p className={styles.cardSub}>Company details and portal login.</p>
        </div>
        {!editing ? (
          <button type="button" className={styles.buttonGhost} onClick={() => setEditing(true)}>
            <FaPen aria-hidden />
            Edit profile
          </button>
        ) : null}
        {saved ? <span className={styles.savedPill}>Saved</span> : null}
      </div>

      {editing ? (
        <ClientEditForm
          client={client}
          servicePriceSettings={servicePriceSettings}
          onCancel={() => setEditing(false)}
          onSave={handleSave}
        />
      ) : (
        <ul className={styles.detailsListStack}>
          <li className={styles.detailsItemStack}>
            <strong>Phone:</strong> {client.phone || "—"}
          </li>
          <li className={styles.detailsItemStack}>
            <strong>Email:</strong> {client.email || "—"}
          </li>
          <li className={styles.detailsItemStack}>
            <strong>GST:</strong> {client.gstNumber || "—"}
          </li>
          <li className={styles.detailsItemStack}>
            <strong>Address:</strong> {client.address || "—"}
          </li>
          <li className={styles.detailsItemStack}>
            <strong>Portal username:</strong> {client.portalUsername || "—"}
          </li>
          <li className={styles.detailsItemStack}>
            <strong>Core values:</strong> {client.coreValues || "—"}
          </li>
        </ul>
      )}
      {!editing && <ClientServicesList client={client} readOnly />}
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
      const api = (await import("../../lib/api.js")).default;
      const res = await api.get(`/clients/${client.id}/calendar/content`);
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
      const api = (await import("../../lib/api.js")).default;
      await api.post(`/clients/${client.id}/calendar/content`, payload);
      await fetchCalendar();
    } catch (err) {
      toast.error("Failed to add task.");
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      const api = (await import("../../lib/api.js")).default;
      await api.put(`/clients/${client.id}/calendar/content/${id}`, payload);
      await fetchCalendar();
    } catch (err) {
      toast.error("Failed to update task.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const api = (await import("../../lib/api.js")).default;
      await api.delete(`/clients/${client.id}/calendar/content/${id}`);
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
      const api = (await import("../../lib/api.js")).default;
      const res = await api.get(`/clients/${client.id}/calendar/meta`);
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
      const api = (await import("../../lib/api.js")).default;
      await api.post(`/clients/${client.id}/calendar/meta`, payload);
      await fetchCalendar();
    } catch (err) {
      toast.error("Failed to add campaign.");
    }
  };

  const handleUpdate = async (id, payload) => {
    try {
      const api = (await import("../../lib/api.js")).default;
      await api.put(`/clients/${client.id}/calendar/meta/${id}`, payload);
      await fetchCalendar();
    } catch (err) {
      toast.error("Failed to update campaign.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const api = (await import("../../lib/api.js")).default;
      await api.delete(`/clients/${client.id}/calendar/meta/${id}`);
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
