import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { FaArrowRightFromBracket, FaBars, FaXmark } from "react-icons/fa6";
import adminStyles from "../admin/Admin.module.css";
import staffStyles from "./Staff.module.css";
import StaffSidebar from "./StaffSidebar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function StaffLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`${adminStyles.page} ${staffStyles.staffPage}`}>
      <div className={adminStyles.mobileTopbar}>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className={adminStyles.iconBtn}
          aria-label="Open menu"
        >
          <FaBars />
        </button>
        <h2 className={adminStyles.mobileTopbarTitle}>Staff</h2>
        <div className={adminStyles.mobileTopbarActions}>
          <button type="button" onClick={handleLogout} className={adminStyles.iconBtn} aria-label="Log out">
            <FaArrowRightFromBracket />
          </button>
        </div>
      </div>

      {sidebarOpen ? (
        <div className={adminStyles.overlay} onClick={() => setSidebarOpen(false)} aria-hidden />
      ) : null}

      <div className={adminStyles.adminShell}>
        <aside className={`${adminStyles.sidebarWrap} ${sidebarOpen ? adminStyles.sidebarOpen : ""}`}>
          <div className={adminStyles.sidebarHeader}>
            <h2>Staff</h2>
            <button
              type="button"
              className={adminStyles.iconBtn}
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <FaXmark />
            </button>
          </div>
          <StaffSidebar onNavigate={() => setSidebarOpen(false)} inDrawer />
        </aside>

        <main className={adminStyles.adminMain}>
          <header className={`${adminStyles.topbar} ${adminStyles.desktopNavbar} ${staffStyles.staffDesktopBar}`}>
            <div className={adminStyles.topbarLeft}>
              <div className={staffStyles.staffTopbarMark} aria-hidden>
                S
              </div>
              <div>
                <h1 className={adminStyles.topbarTitle}>Staff workspace</h1>
                <p className={adminStyles.muted}>Manage client calendars in sync with your team.</p>
              </div>
            </div>
            <div className={adminStyles.topbarActions}>
              <button type="button" className={staffStyles.staffLogoutBtn} onClick={handleLogout}>
                <FaArrowRightFromBracket aria-hidden />
                <span>Log out</span>
              </button>
            </div>
          </header>

          <div className={adminStyles.adminOutlet}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
