import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell } from "react-icons/fi";
import { notificationService } from "../../services/index.js";
import styles from "./NotificationBell.module.css";

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hour${Math.floor(sec / 3600) === 1 ? "" : "s"} ago`;
  return `${Math.floor(sec / 86400)} day${Math.floor(sec / 86400) === 1 ? "" : "s"} ago`;
}

export default function NotificationBell({ pollMs = 60000 }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const rootRef = useRef(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationService.list({ limit: 30 });
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* silent — bell is non-blocking; backend may not expose notifications yet */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const markAll = async () => {
    try {
      const ok = await notificationService.markAllRead();
      if (!ok) return;
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  const openItem = async (n) => {
    if (!n.isRead) {
      try {
        const ok = await notificationService.markRead(n.id || n._id);
        if (ok) {
          setItems((prev) =>
            prev.map((x) => ((x.id || x._id) === (n.id || n._id) ? { ...x, isRead: true } : x)),
          );
          setUnreadCount((c) => Math.max(0, c - 1));
        }
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.bellBtn}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
      >
        <FiBell strokeWidth={2} />
        {unreadCount > 0 ? <span className={styles.badge}>{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className={styles.dropdown} role="dialog" aria-label="Notifications">
          <div className={styles.header}>
            <strong>Notifications</strong>
            <button type="button" className={styles.markAll} onClick={markAll} disabled={!unreadCount}>
              Mark all as read
            </button>
          </div>
          <div className={styles.list}>
            {loading && items.length === 0 ? (
              <p className={styles.empty}>Loading…</p>
            ) : items.length === 0 ? (
              <p className={styles.empty}>No notifications yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id || n._id}
                  type="button"
                  className={`${styles.item} ${n.isRead ? "" : styles.unread}`}
                  onClick={() => openItem(n)}
                >
                  <span className={styles.dot} aria-hidden />
                  <span className={styles.body}>
                    <span className={styles.title}>{n.title}</span>
                    {n.message ? <span className={styles.msg}>{n.message}</span> : null}
                    <span className={styles.time}>{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
