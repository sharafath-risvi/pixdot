import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddContentModal from "../admin/AddContentModal.jsx";
import CalendarMonthNav from "../admin/CalendarMonthNav.jsx";
import StatusLegend from "./StatusLegend.jsx";
import StatusBadge from "./StatusBadge.jsx";
import ConfirmModal from "../admin/ConfirmModal.jsx";
import adminStyles from "../admin/Admin.module.css";
import styles from "./GlobalCalendar.module.css";
import api from "../../lib/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatMonthLabel, getDateKey, monthQueryParam } from "../../lib/calendar.js";
import { STATUS_OPTIONS, getStatusColor, getStatusLabel } from "../../lib/contentStatus.js";
import { clientPath, staffClientPath } from "../../lib/adminSlugs.js";
import { useAuth } from "../../context/AuthContext.jsx";

const CONTENT_TYPE_FILTERS = ["all", "Poster", "Reel", "Shoot", "Creative"];

export default function GlobalCalendar({ basePath = "staff" }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [monthDate, setMonthDate] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState([]);
  const [dates, setDates] = useState([]);
  const [contents, setContents] = useState([]);
  const [allClientsForFilter, setAllClientsForFilter] = useState([]);

  const [clientFilter, setClientFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const monthParam = monthQueryParam(monthDate);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetchGlobal = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/calendar/global", {
        params: {
          month: monthParam,
          status: statusFilter !== "all" ? statusFilter : undefined,
          contentType: typeFilter !== "all" ? typeFilter : undefined,
          clientId: clientFilter !== "all" ? clientFilter : undefined,
          q: searchDebounced || undefined,
        },
      });
      const data = res.data?.data || {};
      setClients(data.clients || []);
      setDates(data.dates || []);
      setContents(data.contents || []);
      if (!searchDebounced && clientFilter === "all") {
        setAllClientsForFilter(data.clients || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load global calendar.");
      setClients([]);
      setDates([]);
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [monthParam, statusFilter, typeFilter, clientFilter, searchDebounced]);

  useEffect(() => {
    fetchGlobal();
  }, [fetchGlobal]);

  const contentMap = useMemo(() => {
    const map = {};
    for (const item of contents) {
      const cid = item.clientId?.toString?.() || String(item.clientId);
      const key = `${cid}__${item.dateKey}`;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }
    return map;
  }, [contents]);

  const filterClientOptions = allClientsForFilter.length ? allClientsForFilter : clients;

  const goToday = () => {
    const now = new Date();
    setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const openCell = (client, dateRow, editItem = null) => {
    setActiveCell({
      clientId: client.id || client._id,
      clientName: client.name,
      dateKey: dateRow.dateKey,
      dayLabel: `${dateRow.label} · ${client.name}`,
      editItem,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (!activeCell) return;
    const clientId = activeCell.clientId;
    try {
      if (activeCell.editItem) {
        await api.put(
          `/api/clients/${clientId}/calendar/content/${activeCell.editItem.id || activeCell.editItem._id}`,
          { ...payload, dateKey: activeCell.dateKey }
        );
        toast.success("Content updated.");
      } else {
        await api.post(`/api/clients/${clientId}/calendar/content`, {
          ...payload,
          dateKey: activeCell.dateKey,
        });
        toast.success("Content added.");
      }
      setModalOpen(false);
      setActiveCell(null);
      fetchGlobal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save content.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(
        `/api/clients/${deleteTarget.clientId}/calendar/content/${deleteTarget.item.id || deleteTarget.item._id}`
      );
      toast.success("Deleted.");
      setDeleteTarget(null);
      fetchGlobal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete.");
    }
  };

  const openClientCalendar = (client) => {
    const path =
      role === "admin" || basePath === "admin"
        ? `${clientPath({ ...client, id: client.id || client._id })}/content`
        : `${staffClientPath({ ...client, id: client.id || client._id })}/content`;
    navigate(path);
  };

  const todayKey = getDateKey(new Date(), new Date().getDate());

  return (
    <section className={adminStyles.adminPageSection}>
      <div className={adminStyles.pageHeading}>
        <h2 className={adminStyles.pageHeadingTitle}>Monthly Schedule</h2>
        <p className={adminStyles.pageHeadingSub}>
          All-client content calendar — scroll horizontally to compare clients by date
        </p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <CalendarMonthNav monthDate={monthDate} onMonthDateChange={setMonthDate} />
          <button type="button" className={styles.todayBtn} onClick={goToday}>
            Today
          </button>
        </div>
        <div className={styles.filters}>
          <input
            className={styles.search}
            type="search"
            placeholder="Search client"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search client"
          />
          <select
            className={styles.select}
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            aria-label="Filter client"
          >
            <option value="all">All Clients</option>
            {filterClientOptions.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter content type"
          >
            {CONTENT_TYPE_FILTERS.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All Content Types" : t}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.legendWrap}>
        <StatusLegend />
      </div>

      {error ? <p className={adminStyles.errorText}>{error}</p> : null}

      {loading ? (
        <div className={styles.skeleton}>Loading calendar…</div>
      ) : clients.length === 0 ? (
        <p className={adminStyles.emptyText}>No clients found. Ask admin to add clients.</p>
      ) : (
        <>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={`${styles.stickyCol} ${styles.dateCol}`}>DATE</th>
                  <th className={`${styles.stickyCol2} ${styles.dayCol}`}>DAY</th>
                  {clients.map((c) => (
                    <th key={c.id || c._id} className={styles.clientCol}>
                      <button type="button" className={styles.clientHeadBtn} onClick={() => openClientCalendar(c)}>
                        {c.name}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dates.map((row) => (
                  <tr key={row.dateKey} className={row.dateKey === todayKey ? styles.todayRow : undefined}>
                    <td className={`${styles.stickyCol} ${styles.dateCol}`}>{row.label}</td>
                    <td className={`${styles.stickyCol2} ${styles.dayCol}`}>{row.weekday}</td>
                    {clients.map((c) => {
                      const cid = String(c.id || c._id);
                      const items = contentMap[`${cid}__${row.dateKey}`] || [];
                      return (
                        <td key={cid} className={styles.cell}>
                          <div className={styles.cellInner}>
                            {items.map((item) => (
                              <div key={item.id || item._id} className={styles.chipWrap}>
                                <button
                                  type="button"
                                  className={styles.chip}
                                  style={{ background: getStatusColor(item.status) }}
                                  title={`${item.kind} — ${getStatusLabel(item.status)}. Click to edit.`}
                                  onClick={() => openCell(c, row, item)}
                                >
                                  <strong>{item.kind || item.subtype || "Content"}</strong>
                                  <span>{getStatusLabel(item.status)}</span>
                                </button>
                                <button
                                  type="button"
                                  className={styles.chipDelete}
                                  aria-label="Delete"
                                  onClick={() => setDeleteTarget({ clientId: cid, item })}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className={styles.addCellBtn}
                              onClick={() => openCell(c, row)}
                              aria-label={`Add content for ${c.name} on ${row.label}`}
                            >
                              +
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.mobileList}>
            {dates.map((row) => {
              const dayBlocks = clients
                .map((c) => {
                  const cid = String(c.id || c._id);
                  return { client: c, items: contentMap[`${cid}__${row.dateKey}`] || [] };
                })
                .filter((x) => x.items.length > 0);

              return (
                <article
                  key={row.dateKey}
                  className={`${styles.mobileDay} ${row.dateKey === todayKey ? styles.todayRow : ""}`}
                >
                  <header className={styles.mobileDayHead}>
                    <strong>
                      {String(row.day).padStart(2, "0")} {row.weekday.slice(0, 3)}
                    </strong>
                    <span>{formatMonthLabel(monthDate)}</span>
                  </header>

                  {dayBlocks.length === 0 ? (
                    <p className={styles.mobileEmpty}>No scheduled content</p>
                  ) : (
                    dayBlocks.map(({ client, items }) => (
                      <div key={client.id || client._id} className={styles.mobileClientBlock}>
                        <button
                          type="button"
                          className={styles.mobileClientName}
                          onClick={() => openClientCalendar(client)}
                        >
                          {client.name}
                        </button>
                        {items.map((item) => (
                          <div key={item.id || item._id} className={styles.mobileItemRow}>
                            <button
                              type="button"
                              className={styles.mobileItem}
                              style={{ background: getStatusColor(item.status) }}
                              onClick={() => openCell(client, row, item)}
                            >
                              <span>
                                <strong>{item.kind}</strong>
                                {item.subtype ? ` · ${item.subtype}` : ""}
                              </span>
                              <StatusBadge status={item.status} />
                            </button>
                            <button
                              type="button"
                              className={styles.chipDelete}
                              onClick={() =>
                                setDeleteTarget({ clientId: String(client.id || client._id), item })
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ))
                  )}

                  <div className={styles.mobileAddRow}>
                    <select
                      className={styles.select}
                      defaultValue=""
                      onChange={(e) => {
                        const id = e.target.value;
                        if (!id) return;
                        const client = clients.find((c) => String(c.id || c._id) === id);
                        if (client) openCell(client, row);
                        e.target.value = "";
                      }}
                      aria-label="Add content for client"
                    >
                      <option value="">+ Add content…</option>
                      {clients.map((c) => (
                        <option key={c.id || c._id} value={c.id || c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <AddContentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveCell(null);
        }}
        onSubmit={handleSubmit}
        initialValue={activeCell?.editItem || null}
        dayLabel={activeCell?.dayLabel || ""}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete content?"
        message="This will permanently remove the scheduled item."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
