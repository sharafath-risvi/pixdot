import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMagnifyingGlass, FaUsers } from "react-icons/fa6";
import ClientCard from "../../components/admin/ClientCard.jsx";
import { clientPath } from "../../lib/adminSlugs.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import styles from "../../components/admin/Admin.module.css";

export default function AdminClientsPage() {
  const navigate = useNavigate();
  const { clients, clientsLoading } = useWorkspace();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => {
      const haystack = [client.name, client.email, client.phone, client.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [clients, query]);

  if (clientsLoading) {
    return (
      <section className={styles.adminPageSection}>
        <div className={styles.pageHeading}>
          <h2 className={styles.pageHeadingTitle}>Clients</h2>
          <div className="dash-skeleton" style={{ width: "140px", height: "14px", marginTop: "8px" }} />
        </div>
        <div className={styles.premiumClientGrid} style={{ marginTop: "24px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="dash-skeleton" style={{ height: "180px", width: "100%", borderRadius: "16px" }} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.adminPageSection}>
      <header className={styles.clientsPageHead}>
        <div className={styles.pageHeading}>
          <h2 className={styles.pageHeadingTitle}>Clients</h2>
          <p className={styles.pageHeadingSub}>
            {filtered.length} of {clients.length} clients
          </p>
        </div>
        <label className={styles.pricingSearchWrap}>
          <FaMagnifyingGlass className={styles.pricingSearchIcon} aria-hidden />
          <input
            className={styles.pricingSearchInput}
            type="search"
            placeholder="Search clients by name, email, phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search clients"
          />
        </label>
      </header>

      <div className={styles.premiumClientGrid}>
        {filtered.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onClick={() => navigate(clientPath(client))}
            onViewDetails={() => navigate(clientPath(client))}
            onEdit={() => navigate(`${clientPath(client)}?edit=1`)}
            onOpenCalendar={() => navigate(`${clientPath(client)}/content`)}
          />
        ))}
      </div>

      {clients.length === 0 ? (
        <div className="dash-empty-container">
          <FaUsers className="dash-empty-icon" />
          <p className="dash-empty-title">No clients yet</p>
          <p className="dash-empty-desc">Use the quick actions menu to add your first client.</p>
        </div>
      ) : null}

      {clients.length > 0 && filtered.length === 0 ? (
        <div className="dash-empty-container">
          <FaMagnifyingGlass className="dash-empty-icon" />
          <p className="dash-empty-title">No matches found</p>
          <p className="dash-empty-desc">We couldn't find any clients matching &ldquo;{query}&rdquo;.</p>
        </div>
      ) : null}
    </section>
  );
}
