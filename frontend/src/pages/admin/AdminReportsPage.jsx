import { useCallback, useEffect, useMemo, useState } from "react";
import { FaClipboardList, FaMagnifyingGlass, FaUser } from "react-icons/fa6";
import { useToast } from "../../context/ToastContext.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { reportService, getErrorMessage } from "../../services/index.js";
import DailyReportSheet from "../../components/shared/DailyReportSheet.jsx";
import styles from "../../components/admin/Admin.module.css";

function staffIdOf(s) {
  return String(s?.id || s?._id || "");
}

function displayNameOf(s) {
  const name = String(s?.name || "").trim();
  const username = String(s?.username || "").trim();
  if (name) return name;
  if (username) return username;
  return "Staff";
}

export default function AdminReportsPage() {
  const toast = useToast();
  const { staffMembers, staffLoading, fetchStaff } = useWorkspace();
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overview, setOverview] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  /** { id, name, username, role } | null */
  const [selectedStaff, setSelectedStaff] = useState(null);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await reportService.getAdminOverview();
      setOverview(data || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load report status."));
    } finally {
      setLoadingOverview(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStaff?.();
    loadOverview();
  }, [fetchStaff, loadOverview]);

  const submittedMap = useMemo(() => {
    const map = new Map();
    for (const s of overview?.staff || []) {
      map.set(staffIdOf(s), Boolean(s.submittedToday));
    }
    return map;
  }, [overview]);

  /** Team staff (names/usernames) + today submission status from overview API */
  const staffRows = useMemo(() => {
    const fromTeam = Array.isArray(staffMembers) ? staffMembers : [];
    const fromOverview = Array.isArray(overview?.staff) ? overview.staff : [];

    // Prefer Team list (same as Team page). Overlay overview fields when present.
    const byId = new Map();
    for (const s of fromOverview) {
      const id = staffIdOf(s);
      if (!id) continue;
      byId.set(id, {
        id,
        name: displayNameOf(s),
        username: String(s.username || "").trim(),
        role: String(s.role || "").trim(),
        email: String(s.email || "").trim(),
        submittedToday: Boolean(s.submittedToday),
      });
    }
    for (const s of fromTeam) {
      const id = staffIdOf(s);
      if (!id) continue;
      const prev = byId.get(id) || {};
      byId.set(id, {
        id,
        name: displayNameOf(s) || prev.name || "Staff",
        username: String(s.username || prev.username || "").trim(),
        role: String(s.role || prev.role || "").trim(),
        email: String(s.email || prev.email || "").trim(),
        submittedToday:
          submittedMap.has(id) ? submittedMap.get(id) : Boolean(prev.submittedToday),
      });
    }

    return Array.from(byId.values()).sort((a, b) =>
      displayNameOf(a).localeCompare(displayNameOf(b), undefined, { sensitivity: "base" }),
    );
  }, [staffMembers, overview, submittedMap]);

  const roles = useMemo(() => {
    const set = new Set();
    for (const s of staffRows) {
      if (s.role) set.add(s.role);
    }
    for (const r of overview?.roles || []) {
      if (r) set.add(r);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [staffRows, overview]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staffRows.filter((s) => {
      if (roleFilter && String(s.role || "") !== roleFilter) return false;
      if (!q) return true;
      const hay = [s.name, s.username, s.role, s.email].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [staffRows, search, roleFilter]);

  const submittedCount = filtered.filter((s) => s.submittedToday).length;
  const pendingCount = Math.max(0, filtered.length - submittedCount);
  const loading = staffLoading || loadingOverview;

  const openStaffReport = (s) => {
    const id = staffIdOf(s);
    if (!id) {
      toast.error("Staff id missing — open Team and re-save this staff member.");
      return;
    }
    setSelectedStaff({
      id,
      name: displayNameOf(s),
      username: String(s.username || "").trim(),
      role: String(s.role || "").trim(),
    });
  };

  if (selectedStaff?.id) {
    return (
      <section className={styles.adminPageSection}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className={styles.buttonGhost}
            onClick={() => setSelectedStaff(null)}
          >
            ← All staff
          </button>
          <div>
            <h2 className={styles.pageHeadingTitle} style={{ margin: 0 }}>
              {selectedStaff.name} – Daily Report
            </h2>
            <p className={styles.pageHeadingSub} style={{ margin: 0 }}>
              {selectedStaff.username ? `@${selectedStaff.username} · ` : ""}
              {selectedStaff.role || "Staff"} · View their sheet (use Edit to change)
            </p>
          </div>
        </div>
        <DailyReportSheet mode="admin" initialStaffId={selectedStaff.id} />
      </section>
    );
  }

  return (
    <section className={styles.adminPageSection}>
      <header className={styles.clientsPageHead}>
        <div className={styles.pageHeading}>
          <h2 className={styles.pageHeadingTitle}>Daily Reports</h2>
          <p className={styles.pageHeadingSub}>
            Open any staff member’s Daily Report sheet. Names match Team (e.g. Ajees, Rashiya,
            Clement).
          </p>
        </div>
      </header>

      <div
        className={styles.card}
        style={{
          padding: 16,
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        <div>
          <div className={styles.cardSub}>Total staff</div>
          <strong style={{ fontSize: 22 }}>{loading ? "—" : filtered.length}</strong>
        </div>
        <div>
          <div className={styles.cardSub}>Submitted today</div>
          <strong style={{ fontSize: 22, color: "#137333" }}>
            {loading ? "—" : submittedCount}
          </strong>
        </div>
        <div>
          <div className={styles.cardSub}>Pending today</div>
          <strong style={{ fontSize: 22, color: "#b06000" }}>
            {loading ? "—" : pendingCount}
          </strong>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
        className={styles.clientsFiltersRow}
      >
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 0 }}>
          <FaMagnifyingGlass
            style={{ position: "absolute", left: 10, top: 11, color: "#80868b", fontSize: 13 }}
          />
          <input
            className={styles.input}
            style={{ paddingLeft: 32, width: "100%", boxSizing: "border-box", minHeight: 42 }}
            placeholder="Search by name or username…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.input}
          style={{ flex: "1 1 160px", maxWidth: "100%", minHeight: 42 }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className={styles.cardSub}>Loading staff…</p>
      ) : filtered.length === 0 ? (
        <div className="dash-empty-container">
          <FaClipboardList className="dash-empty-icon" />
          <p className="dash-empty-title">No staff found</p>
          <p className="dash-empty-desc">
            Add staff in Team with their real name (Ajees, Rashiya…) and username. Then they appear
            here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((s) => {
            const id = staffIdOf(s);
            const name = displayNameOf(s);
            const initial = name.charAt(0).toUpperCase() || "?";
            return (
              <div
                key={id}
                className={styles.card}
                role="button"
                tabIndex={0}
                onClick={() => openStaffReport(s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openStaffReport(s);
                  }
                }}
                style={{
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      background: "#e8f0fe",
                      display: "grid",
                      placeItems: "center",
                      color: "#1a73e8",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  >
                    {initial || <FaUser />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{name}</div>
                    <div className={styles.cardSub} style={{ margin: 0 }}>
                      {s.username ? (
                        <>
                          <span style={{ color: "#3c4043" }}>@{s.username}</span>
                          {" · "}
                        </>
                      ) : null}
                      {s.role || "Staff"}
                      {" · "}
                      {s.submittedToday ? (
                        <span style={{ color: "#137333" }}>Submitted today</span>
                      ) : (
                        <span style={{ color: "#b06000" }}>Pending</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.buttonPrimary}
                  onClick={(e) => {
                    e.stopPropagation();
                    openStaffReport(s);
                  }}
                >
                  View Report
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
