import { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FaPen } from "react-icons/fa6";
import Calendar from "../../components/admin/Calendar.jsx";
import ClientEditForm from "../../components/admin/ClientEditForm.jsx";
import MetaAdsCalendar from "../../components/admin/MetaAdsCalendar.jsx";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";
import styles from "../../components/admin/Admin.module.css";

import { findClientBySlug, clientPath } from "../../lib/adminSlugs.js";
import { toSlug } from "../../lib/utils.js";
import api from "../../lib/api.js";
import ClientServicesList from "../../components/admin/ClientServicesList.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";



export default function AdminClientDetailPage() {

  const { clientSlug } = useParams();

  const { clients } = useWorkspace();

  const client = findClientBySlug(clients, clientSlug);

  const basePath = client ? clientPath(client) : `/admin-dashboard/client/${clientSlug}`;



  if (!client) {

    return (

      <section className={styles.adminPageSection}>

        <p className={styles.emptyText}>Client not found.</p>

        <NavLink to="/admin-dashboard/clients" className={styles.backLink}>

          ← Back to clients

        </NavLink>

      </section>

    );

  }



  return (

    <section className={styles.adminPageSection}>

      <nav className={styles.adminBreadcrumb} aria-label="Breadcrumb">

        <NavLink to="/admin-dashboard">Admin</NavLink>

        <span>/</span>

        <NavLink to="/admin-dashboard/clients">Clients</NavLink>

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

        <NavLink to={basePath} end className={({ isActive }) => `${styles.detailTab} ${isActive ? styles.detailTabActive : ""}`}>

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



export function AdminClientProfileView() {

  const { clientSlug } = useParams();

  const navigate = useNavigate();

  const { clients, fetchClients } = useWorkspace();

  const client = findClientBySlug(clients, clientSlug);

  const [searchParams, setSearchParams] = useSearchParams();

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (searchParams.get("edit") !== "1") return;
    setEditing(true);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  if (!client) return <Navigate to="/admin-dashboard/clients" replace />;



  const handleSave = async (patch) => {
    try {
      await api.put(`/api/clients/${client.id}`, patch);
      await fetchClients();
      
      setEditing(false);
      setSaved(true);
      toast.success("Client updated successfully.");
      window.setTimeout(() => setSaved(false), 2500);

      const nextSlug = toSlug(patch.name || client.name);
      if (nextSlug && nextSlug !== clientSlug) {
        navigate(clientPath({ ...client, ...patch }), { replace: true });
      }
    } catch (error) {
      console.error("Failed to update client", error);
      toast.error(error.response?.data?.message || "Failed to update client.");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/clients/${client.id}`);
      await fetchClients();
      toast.success("Client deleted successfully.");
      navigate("/admin-dashboard/clients", { replace: true });
    } catch (error) {
      console.error("Failed to delete client", error);
      toast.error(error.response?.data?.message || "Failed to delete client.");
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
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className={styles.buttonGhost} onClick={() => setEditing(true)}>
              <FaPen aria-hidden />
              Edit profile
            </button>
            <button type="button" className={styles.buttonDanger} onClick={() => setDeleteModalOpen(true)}>
              Delete client
            </button>
          </div>
        ) : null}
        {saved ? <span className={styles.savedPill}>Saved</span> : null}
      </div>



      {editing ? (

        <ClientEditForm
          client={client}
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
      
      {!editing && <ClientServicesList client={client} />}

      <ConfirmModal
        open={isDeleteModalOpen}
        title="Delete Client"
        message={`Are you sure you want to delete '${client.name}'? This action cannot be undone.`}
        confirmText="Delete Client"
        onConfirm={() => {
          setDeleteModalOpen(false);
          handleDelete();
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </section>

  );

}



export function AdminClientContentView() {
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

export function AdminClientMetaView() {
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


