// cspell:ignore Xmark Topbar
import { useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { FaArrowRightFromBracket, FaBars, FaXmark } from "react-icons/fa6";
import AdminNavbar from "./Navbar.jsx";
import Sidebar from "./Sidebar.jsx";
import AddClientModal from "./AddClientModal.jsx";
import AddStaffModal from "./AddStaffModal.jsx";
import styles from "./Admin.module.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { buildServicePriceSettings } from "../../lib/agencyServices.js";
import { clientPath } from "../../lib/adminSlugs.js";
import api from "../../lib/api.js";
import { useServicePricing } from "../../context/PricingContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { fetchClients, fetchStaff } = useWorkspace();
  const { services } = useServicePricing();
  const servicePriceSettings = useMemo(() => buildServicePriceSettings(services), [services]);
  const toast = useToast();

  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const openAddClient = () => setShowAddClient(true);
  const openAddStaff = () => setShowAddStaff(true);
  const openServicePricing = () => navigate("/admin-dashboard/pricing");
  const openSettings = () => navigate("/admin-dashboard/settings");

  return (
    <div className={styles.page}>
      <div className={styles.mobileTopbar}>
        <button type="button" onClick={() => setSidebarOpen(true)} className={styles.iconBtn} aria-label="Open menu">
          <FaBars />
        </button>
        <h2 className={styles.mobileTopbarTitle}>Admin</h2>
        <div className={styles.mobileTopbarActions}>
          <button type="button" onClick={handleLogout} className={styles.adminLogoutBtn} aria-label="Log out">
            <FaArrowRightFromBracket aria-hidden />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {sidebarOpen ? <div className={styles.overlay} onClick={() => setSidebarOpen(false)} aria-hidden /> : null}

      <div className={styles.adminShell}>
        <aside
          className={`${styles.sidebarWrap} ${sidebarCollapsed ? styles.sidebarWrapCollapsed : ""} ${
            sidebarOpen ? styles.sidebarOpen : ""
          }`}
        >
          <div className={styles.sidebarHeader}>
            <h2>Admin</h2>
            <button type="button" className={styles.iconBtn} onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              <FaXmark />
            </button>
          </div>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((p) => !p)}
            onNavigate={() => setSidebarOpen(false)}
            onAddClient={openAddClient}
            onAddStaff={openAddStaff}
            onServicePrices={openServicePricing}
            onSettings={openSettings}
          />
        </aside>

        <main className={styles.adminMain}>
          <div className={styles.desktopNavbar}>
            <AdminNavbar onLogout={handleLogout} />
          </div>
          <div className={styles.adminOutlet}>
            <Outlet />
          </div>
        </main>
      </div>

      <AddClientModal
        open={showAddClient}
        servicePriceSettings={servicePriceSettings}
        onClose={() => setShowAddClient(false)}
        onSubmit={async (newClient) => {
          try {
            const res = await api.post("/api/clients", newClient);
            const createdClient = res.data.data;
            await fetchClients(); // refresh context
            setShowAddClient(false);
            toast.success("Client created successfully.");
            navigate(clientPath({ ...createdClient, id: createdClient._id }));
          } catch (error) {
            console.error("Failed to add client", error);
            toast.error(error.response?.data?.message || "Failed to add client. Please try again.");
          }
        }}
      />

      <AddStaffModal
        open={showAddStaff}
        onClose={() => setShowAddStaff(false)}
        onSubmit={async (staff) => {
          try {
            await api.post("/api/staff", staff);
            await fetchStaff(); // refresh context
            setShowAddStaff(false);
            toast.success("Staff member created successfully.");
          } catch (error) {
            console.error("Failed to add staff", error);
            toast.error(error.response?.data?.message || "Failed to add staff. Please try again.");
          }
        }}
      />
    </div>
  );
}
