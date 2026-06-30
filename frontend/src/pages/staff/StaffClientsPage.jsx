import { useNavigate } from "react-router-dom";
import ClientCard from "../../components/admin/ClientCard.jsx";
import { staffClientPath } from "../../lib/adminSlugs.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import styles from "../../components/admin/Admin.module.css";

export default function StaffClientsPage() {
  const navigate = useNavigate();
  const { clients } = useWorkspace();

  return (
    <section className={styles.adminPageSection}>
      <div className={styles.pageHeading}>
        <h2 className={styles.pageHeadingTitle}>Clients</h2>
        <p className={styles.pageHeadingSub}>
          {clients.length} total · open a client for profile, content calendar, and Meta ads
        </p>
      </div>

      <div className={styles.premiumClientGrid}>
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onClick={() => navigate(staffClientPath(client))}
            onViewDetails={() => navigate(staffClientPath(client))}
            onOpenCalendar={() => navigate(`${staffClientPath(client)}/content`)}
          />
        ))}
      </div>

      {clients.length === 0 ? (
        <p className={styles.emptyText}>No clients assigned yet. Ask your admin to add clients.</p>
      ) : null}
    </section>
  );
}
