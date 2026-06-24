import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { FaArrowRightFromBracket, FaBars, FaXmark } from "react-icons/fa6";
import adminStyles from "../admin/Admin.module.css";
import clientStyles from "./Client.module.css";
import ClientSidebar from "./ClientSidebar.jsx";
import ClientBreadcrumb from "./ClientBreadcrumb.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useClientPersonal } from "../../context/ClientPersonalContext.jsx";
export default function ClientLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentClient } = useClientPersonal();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const name = currentClient?.name ?? "Client";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`${adminStyles.page} ${clientStyles.clientPage}`}>
      <div className={adminStyles.mobileTopbar}>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className={adminStyles.iconBtn}
          aria-label="Open menu"
        >
          <FaBars />
        </button>
        <h2 className={adminStyles.mobileTopbarTitle}>{name}</h2>
        <div className={adminStyles.mobileTopbarActions}>
          <button type="button" onClick={handleLogout} className={clientStyles.clientLogoutBtn} aria-label="Log out">
            <FaArrowRightFromBracket aria-hidden />
            <span>Logout</span>
          </button>
        </div>      </div>

      {sidebarOpen ? (
        <div className={adminStyles.overlay} onClick={() => setSidebarOpen(false)} aria-hidden />
      ) : null}

      <div className={adminStyles.adminShell}>
        <aside
          className={`${adminStyles.sidebarWrap} ${sidebarOpen ? adminStyles.sidebarOpen : ""}`}
        >
          <div className={adminStyles.sidebarHeader}>
            <h2>{name}</h2>
            <button
              type="button"
              className={adminStyles.iconBtn}
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <FaXmark />
            </button>
          </div>
          <ClientSidebar onNavigate={() => setSidebarOpen(false)} inDrawer />
        </aside>

        <main className={adminStyles.adminMain}>
          <header className={`${adminStyles.topbar} ${adminStyles.desktopNavbar} ${clientStyles.clientDesktopBar}`}>
            <div className={adminStyles.topbarLeft}>
              <div>
                <h1 className={adminStyles.topbarTitle}>{name} dashboard</h1>
                <p className={adminStyles.muted}>Read-only schedules · your private notes</p>
              </div>
            </div>
            <div className={`${adminStyles.topbarActions} ${clientStyles.clientTopbarActions}`}>
              <span className={clientStyles.clientTopbarUserName}>{name}</span>
              <button type="button" className={clientStyles.clientLogoutBtn} onClick={handleLogout}>
                <FaArrowRightFromBracket aria-hidden />
                <span>Logout</span>
              </button>
            </div>
          </header>

          <div className={adminStyles.adminOutlet}>
            <ClientBreadcrumb />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
