import { NavLink, useLocation } from "react-router-dom";
import { FiEdit3, FiUser, FiUsers } from "react-icons/fi";
import styles from "./Staff.module.css";

const nav = [
  { to: "/staff/clients", label: "Clients", matchClientDetails: true, Icon: FiUsers },
  { to: "/staff/notes", label: "Notes", Icon: FiEdit3 },
];

export default function StaffSidebar({ onNavigate, inDrawer = false }) {
  const { pathname } = useLocation();

  return (
    <aside className={`${styles.staffSidebar} ${inDrawer ? styles.staffSidebarDrawer : ""}`}>
      <nav className={styles.staffNav} aria-label="Staff menu">
        {nav.map((item) => {
          const Icon = item.Icon;
          const clientsBranch = item.matchClientDetails && pathname.startsWith("/staff/client/");
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) => {
                const active = isActive || clientsBranch;
                return `${styles.staffNavLink} ${active ? styles.staffNavLinkActive : ""}`;
              }}
            >
              <span className={styles.staffNavIcon} aria-hidden>
                <Icon strokeWidth={2} />
              </span>
              <span className={styles.staffNavLabel}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.staffSidebarFooter}>
        <NavLink
          to="/staff/profile"
          onClick={onNavigate}
          className={({ isActive }) =>
            `${styles.staffNavLink} ${isActive ? styles.staffNavLinkActive : ""}`
          }
        >
          <span className={styles.staffNavIcon} aria-hidden>
            <FiUser strokeWidth={2} />
          </span>
          <span className={styles.staffNavLabel}>Profile</span>
        </NavLink>
      </div>
    </aside>
  );
}
