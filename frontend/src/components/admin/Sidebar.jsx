import { NavLink } from "react-router-dom";
import { FaAnglesLeft, FaAnglesRight, FaChartLine, FaGear, FaGrip, FaUserGroup, FaUsers } from "react-icons/fa6";
import AdminProfileMenu from "./AdminProfileMenu.jsx";
import { PIXDOT_LOGO_FULL_URL, PIXDOT_LOGO_ICON_URL } from "../../lib/brand.js";
import styles from "./Admin.module.css";

const sections = [
  { to: "/admin-dashboard", label: "Dashboard", icon: FaGrip, end: true },
  { to: "/admin-dashboard/services", label: "Services", icon: FaChartLine },
  { to: "/admin-dashboard/clients", label: "Clients", icon: FaUsers },
  { to: "/admin-dashboard/team", label: "Team", icon: FaUserGroup },
];

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  onNavigate,
  onAddClient,
  onAddStaff,
  onServicePrices,
  onSettings,
}) {
  return (
    <aside className={`${styles.sidebar} ${styles.sidebarNoScroll} ${collapsed ? styles.sidebarCollapsed : ""}`}>
      <div className={styles.sidebarBrand}>
        {!collapsed ? (
          <img src={PIXDOT_LOGO_FULL_URL} alt="Pixdot" className={styles.sidebarLogo} />
        ) : (
          <img src={PIXDOT_LOGO_ICON_URL} alt="Pixdot" className={styles.sidebarLogoCollapsed} />
        )}
        <button
          type="button"
          className={styles.sidebarCollapseBtn}
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FaAnglesRight /> : <FaAnglesLeft />}
        </button>
      </div>

      <nav className={styles.sectionTabs}>
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <NavLink
              key={section.to}
              to={section.to}
              end={section.end}
              title={section.label}
              onClick={onNavigate}
              className={({ isActive }) =>
                `${styles.tabButton} ${styles.tabButtonNav} ${isActive ? styles.tabButtonActive : ""}`
              }
            >
              <span className={styles.tabIcon}>
                <Icon />
              </span>
              {!collapsed ? section.label : null}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.sidebarBottom}>
        <AdminProfileMenu
          placement="sidebar"
          collapsed={collapsed}
          onNavigate={onNavigate}
          onAddClient={onAddClient}
          onAddStaff={onAddStaff}
          onServicePrices={onServicePrices}
          onSettings={onSettings}
        />
        <NavLink
          to="/admin-dashboard/settings"
          title="Settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            `${styles.tabButton} ${styles.tabButtonNav} ${isActive ? styles.tabButtonActive : ""}`
          }
        >
          <span className={styles.tabIcon}>
            <FaGear />
          </span>
          {!collapsed ? "Settings" : null}
        </NavLink>
      </div>
    </aside>
  );
}
