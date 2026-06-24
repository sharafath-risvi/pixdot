import { Link, useLocation } from "react-router-dom";
import { useClientPersonal } from "../../context/ClientPersonalContext.jsx";
import styles from "./Client.module.css";

export default function ClientBreadcrumb() {
  const { pathname } = useLocation();
  const { currentClient } = useClientPersonal();
  const company = currentClient?.name ?? "Company";

  const parts = [{ label: "Dashboard", to: "/client/dashboard" }];

  if (pathname.includes("/client/profile")) {
    parts.push({ label: company, to: "/client/dashboard" });
    parts.push({ label: "Profile" });
  } else if (pathname.includes("/client/notes")) {
    parts.push({ label: company, to: "/client/dashboard" });
    parts.push({ label: "Notes" });
  } else if (pathname.includes("/dashboard/content")) {
    parts.push({ label: company, to: "/client/dashboard" });
    parts.push({ label: "Content calendar" });
  } else if (pathname.includes("/dashboard/meta")) {
    parts.push({ label: company, to: "/client/dashboard" });
    parts.push({ label: "Meta ads calendar" });
  } else {
    parts.push({ label: company });
  }

  return (
    <div className={styles.clientBreadcrumbBar}>
      <nav className={styles.clientBreadcrumb} aria-label="Breadcrumb">
        {parts.map((p, i) => (
          <span key={`${p.label}-${i}`}>
            {i > 0 ? <span style={{ margin: "0 6px", color: "#cbd5e1" }}>/</span> : null}
            {"to" in p && p.to ? (
              <Link to={p.to}>{p.label}</Link>
            ) : (
              <span className={styles.clientBreadcrumbCurrent}>{p.label}</span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
}
