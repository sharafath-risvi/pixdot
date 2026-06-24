import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPen, FaMagnifyingGlass, FaUserTie } from "react-icons/fa6";
import { staffPath } from "../../lib/adminSlugs.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import styles from "../../components/admin/Admin.module.css";

export default function AdminTeamPage() {
  const navigate = useNavigate();
  const { staffMembers, staffLoading } = useWorkspace();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staffMembers;
    return staffMembers.filter((staff) => {
      const haystack = [staff.name, staff.email, staff.phone, staff.username]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [staffMembers, query]);

  if (staffLoading) {
    return (
      <section className={styles.adminPageSection}>
        <div className={styles.pageHeading}>
          <h2 className={styles.pageHeadingTitle}>Team</h2>
          <div className="dash-skeleton" style={{ width: "160px", height: "14px", marginTop: "8px" }} />
        </div>
        <div className={styles.teamGrid} style={{ marginTop: "24px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="dash-skeleton" style={{ height: "220px", width: "100%", borderRadius: "16px" }} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.adminPageSection}>
      <header className={styles.clientsPageHead}>
        <div className={styles.pageHeading}>
          <h2 className={styles.pageHeadingTitle}>Team</h2>
          <p className={styles.pageHeadingSub}>{filtered.length} of {staffMembers.length} team members</p>
        </div>
        <label className={styles.pricingSearchWrap}>
          <FaMagnifyingGlass className={styles.pricingSearchIcon} aria-hidden />
          <input
            className={styles.pricingSearchInput}
            type="search"
            placeholder="Search staff by name, email, phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search staff"
          />
        </label>
      </header>

      <div className={styles.teamGrid}>
        {filtered.map((staff) => (
          <div
            key={staff.id}
            className={styles.teamCard}
            onClick={() => navigate(staffPath(staff))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(staffPath(staff));
              }
            }}
          >
            <div className={styles.teamCardAvatar}>{staff.name.charAt(0)}</div>
            <h3>{staff.name}</h3>
            <p className={styles.teamCardRole}>{staff.role}</p>
            {staff.email ? <p className={styles.teamCardMeta}>{staff.email}</p> : null}
            <div className={styles.teamCardActions}>
              <span className={styles.teamCardLink}>View profile →</span>
              <button
                type="button"
                className={styles.teamCardEditBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(staffPath(staff), { state: { edit: true } });
                }}
              >
                <FaPen aria-hidden />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {staffMembers.length === 0 ? (
        <div className="dash-empty-container">
          <FaUserTie className="dash-empty-icon" />
          <p className="dash-empty-title">No team members</p>
          <p className="dash-empty-desc">Use the profile menu to add new staff accounts.</p>
        </div>
      ) : null}

      {staffMembers.length > 0 && filtered.length === 0 ? (
        <div className="dash-empty-container">
          <FaMagnifyingGlass className="dash-empty-icon" />
          <p className="dash-empty-title">No matches found</p>
          <p className="dash-empty-desc">We couldn't find any staff matching &ldquo;{query}&rdquo;.</p>
        </div>
      ) : null}
    </section>
  );
}
