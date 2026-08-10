import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api.js";
import { toIsoDateString, formatMonthLabel, parseDateKey } from "../../lib/calendar.js";
import { getStatusColor, getStatusLabel, normalizeStatus } from "../../lib/contentStatus.js";
import styles from "./PendingTasksPanel.module.css";

const DISMISS_KEY = "staff_pending_panel_dismissed_date";

export default function PendingTasksPanel() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const today = toIsoDateString();
    if (sessionStorage.getItem(DISMISS_KEY) === today) {
      setDismissed(true);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/calendar/summary");
      setData(res.data?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (dismissed || loading || !data) return null;

  const pendingCount = data.today?.pendingCount || 0;
  const missedCount = data.missed?.count || 0;
  const byKind = data.today?.byKind || {};
  const byStatus = data.today?.byStatus || {};

  const hasSomething = pendingCount > 0 || missedCount > 0 || (data.today?.items?.length || 0) > 0;
  if (!hasSomething && missedCount === 0) {
    // Still show a light "caught up" once — but only if there was something to check
    // Skip empty panel entirely when no calendar data at all for today/missed
    if ((data.today?.items?.length || 0) === 0 && missedCount === 0) return null;
  }

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, toIsoDateString());
    setDismissed(true);
  };

  const formatKey = (dateKey) => {
    const d = parseDateKey(dateKey);
    if (!d) return dateKey;
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };

  return (
    <aside className={styles.panel} role="region" aria-label="Today's work summary">
      <div className={styles.head}>
        <div>
          <h3 className={styles.title}>Welcome back</h3>
          <p className={styles.sub}>
            {missedCount > 0
              ? `You have ${missedCount} missed task${missedCount === 1 ? "" : "s"}`
              : pendingCount > 0
                ? `You have ${pendingCount} pending task${pendingCount === 1 ? "" : "s"} today`
                : "You're all caught up"}
          </p>
        </div>
        <button type="button" className={styles.close} onClick={dismiss} aria-label="Dismiss">
          ×
        </button>
      </div>

      {missedCount > 0 ? (
        <div className={styles.alert}>
          <strong>You have missed tasks</strong>
          <ul className={styles.missedList}>
            {(data.missed?.items || []).slice(0, 5).map((item) => (
              <li key={item.id}>
                {formatKey(item.dateKey)} — {item.clientName} — {item.kind || "Content"} —{" "}
                {getStatusLabel(item.status)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.section}>
        <h4>Today&apos;s Work · {formatMonthLabel(new Date())}</h4>
        <div className={styles.kindGrid}>
          {Object.keys(byKind).length === 0 ? (
            <span className={styles.muted}>No content scheduled today</span>
          ) : (
            Object.entries(byKind).map(([kind, count]) => (
              <span key={kind} className={styles.kindChip} style={{ background: getStatusColor("pending") }}>
                {kind}: {count}
              </span>
            ))
          )}
        </div>
        <div className={styles.statusRow}>
          {Object.entries(byStatus)
            .filter(([, n]) => n > 0)
            .map(([status, count]) => (
              <span key={status} className={styles.statusChip} style={{ background: getStatusColor(status) }}>
                {getStatusLabel(normalizeStatus(status))}: {count}
              </span>
            ))}
        </div>
      </div>

      {(data.upcoming || []).length > 0 ? (
        <div className={styles.section}>
          <h4>Upcoming</h4>
          <ul className={styles.upcoming}>
            {(data.upcoming || []).slice(0, 4).map((u) => (
              <li key={u.dateKey}>
                {formatKey(u.dateKey)} — {u.count} task{u.count === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => navigate("/staff/schedule")}>
          View Calendar
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => {
            dismiss();
            navigate("/staff/schedule");
          }}
        >
          View Today&apos;s Tasks
        </button>
      </div>
    </aside>
  );
}
