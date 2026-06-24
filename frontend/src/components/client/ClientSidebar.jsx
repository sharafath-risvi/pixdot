import { NavLink } from "react-router-dom";
import { FiCalendar, FiEdit3, FiHome, FiZap } from "react-icons/fi";
import styles from "./Client.module.css";

const main = [
  { to: "/client/dashboard", label: "Company profile", end: true, Icon: FiHome },
  { to: "/client/dashboard/content", label: "Content calendar", Icon: FiCalendar },
  { to: "/client/dashboard/meta", label: "Meta ads calendar", Icon: FiZap },
];

export default function ClientSidebar({ onNavigate, inDrawer = false }) {
  return (
    <aside className={`${styles.clientSidebar} ${inDrawer ? styles.clientSidebarDrawer : ""}`}>
      <p className={styles.clientNavHeading}>Overview</p>
      <nav className={styles.clientNav} aria-label="Main">
        {main.map((item) => {
          const Icon = item.Icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `${styles.clientNavLink} ${isActive ? styles.clientNavLinkActive : ""}`
              }
            >
              <span className={styles.clientNavIcon} aria-hidden>
                <Icon strokeWidth={2} />
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <p className={styles.clientNavHeading} style={{ marginTop: 16 }}>
        Personal
      </p>
      <nav className={styles.clientNav} aria-label="Personal">
        <NavLink
          to="/client/notes"
          onClick={onNavigate}
          className={({ isActive }) =>
            `${styles.clientNavLink} ${isActive ? styles.clientNavLinkActive : ""}`
          }
        >
          <span className={styles.clientNavIcon} aria-hidden>
            <FiEdit3 strokeWidth={2} />
          </span>
          Notes
        </NavLink>
      </nav>
    </aside>
  );
}
