import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CalendarMonthNav from "../admin/CalendarMonthNav.jsx";
import ConfirmModal from "../admin/ConfirmModal.jsx";
import {
  MetaAdsFormModal,
  adTypeOptions,
  metaFormatOptions,
  metaStatusColor,
  statusOptions,
} from "../admin/MetaAdsCalendar.jsx";
import adminStyles from "../admin/Admin.module.css";
import styles from "./GlobalCalendar.module.css";
import api from "../../lib/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { formatMonthLabel, getDateKey, monthQueryParam } from "../../lib/calendar.js";
import { clientPath, staffClientPath } from "../../lib/adminSlugs.js";
import { useAuth } from "../../context/AuthContext.jsx";

const legacyFormatMap = {
  Facebook: "Poster",
  Instagram: "Reels",
};

function normalizeFormat(value) {
  if (!value) return value;
  return legacyFormatMap[value] || value;
}

export default function GlobalMetaCalendar({ basePath = "staff" }) {
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
  const [adTypeFilter, setAdTypeFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
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
          type: "meta",
          adType: adTypeFilter !== "all" ? adTypeFilter : undefined,
          platform: platformFilter !== "all" ? platformFilter : undefined,
          metaStatus: statusFilter !== "all" ? statusFilter : undefined,
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
      setError(err.response?.data?.message || "Failed to load Meta ads schedule.");
      setClients([]);
      setDates([]);
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [monthParam, adTypeFilter, platformFilter, statusFilter, clientFilter, searchDebounced]);

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
      dayLabel: `${dateRow.label} ${dateRow.weekday.slice(0, 3)} · ${client.name}`,
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
          `/api/clients/${clientId}/calendar/meta/${activeCell.editItem.id || activeCell.editItem._id}`,
          { ...payload, dateKey: activeCell.dateKey },
        );
        toast.success("Campaign updated.");
      } else {
        await api.post(`/api/clients/${clientId}/calendar/meta`, {
          ...payload,
          dateKey: activeCell.dateKey,
        });
        toast.success("Campaign added.");
      }
      setModalOpen(false);
      setActiveCell(null);
      fetchGlobal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save campaign.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(
        `/api/clients/${deleteTarget.clientId}/calendar/meta/${deleteTarget.item.id || deleteTarget.item._id}`,
      );
      toast.success("Deleted.");
      setDeleteTarget(null);
      fetchGlobal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete.");
    }
  };

  const openClientMeta = (client) => {
    const path =
      role === "admin" || basePath === "admin"
        ? `${clientPath({ ...client, id: client.id || client._id })}/meta`
        : `${staffClientPath({ ...client, id: client.id || client._id })}/meta`;
    navigate(path);
  };

  const todayKey = getDateKey(new Date(), new Date().getDate());

  return (
    <section className={adminStyles.adminPageSection}>
      <div className={adminStyles.pageHeading}>
        <h2 className={adminStyles.pageHeadingTitle}>Meta Ads Schedule</h2>
        <p className={adminStyles.pageHeadingSub}>
          All-client Meta ads planner — compare campaigns by date across clients
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
            value={adTypeFilter}
            onChange={(e) => setAdTypeFilter(e.target.value)}
            aria-label="Filter ad type"
          >
            <option value="all">All Ad Types</option>
            {adTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            aria-label="Filter format"
          >
            <option value="all">All formats</option>
            {metaFormatOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status"
          >
            <option value="all">All Status</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.legendWrap}>
        <div className={styles.metaLegend} aria-label="Meta status legend">
          {statusOptions.map((o) => (
            <span key={o.value} className={styles.metaLegendItem}>
              <span className={styles.metaLegendSwatch} style={{ background: metaStatusColor(o.value) }} />
              {o.label}
            </span>
          ))}
        </div>
      </div>

      {error ? <p className={adminStyles.errorText}>{error}</p> : null}

      {loading ? (
        <div className={styles.skeleton}>Loading Meta ads schedule…</div>
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
                      <button type="button" className={styles.clientHeadBtn} onClick={() => openClientMeta(c)}>
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
                                  style={{ background: metaStatusColor(item.metaStatus) }}
                                  title={`${item.adType} — ${item.campaignName || "Campaign"}. Click to edit.`}
                                  onClick={() => openCell(c, row, item)}
                                >
                                  <strong>{item.adType || "Campaign"}</strong>
                                  <span>{item.campaignName || normalizeFormat(item.platform) || item.metaStatus}</span>
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
                              aria-label={`Add Meta ad for ${c.name} on ${row.label}`}
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
                    <p className={styles.mobileEmpty}>No scheduled Meta ads</p>
                  ) : (
                    dayBlocks.map(({ client, items }) => (
                      <div key={client.id || client._id} className={styles.mobileClientBlock}>
                        <button
                          type="button"
                          className={styles.mobileClientName}
                          onClick={() => openClientMeta(client)}
                        >
                          {client.name}
                        </button>
                        {items.map((item) => (
                          <div key={item.id || item._id} className={styles.mobileItemRow}>
                            <button
                              type="button"
                              className={styles.mobileItem}
                              style={{ background: metaStatusColor(item.metaStatus) }}
                              onClick={() => openCell(client, row, item)}
                            >
                              <span>
                                <strong>{item.adType}</strong>
                                {item.campaignName ? ` · ${item.campaignName}` : ""}
                              </span>
                              <span>{item.metaStatus || "—"}</span>
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
                      aria-label="Add Meta ad for client"
                    >
                      <option value="">+ Add Meta ad…</option>
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

      <MetaAdsFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setActiveCell(null);
        }}
        onSubmit={handleSubmit}
        initialValue={activeCell?.editItem || null}
        initialAdType={activeCell?.editItem?.adType || adTypeOptions[0]}
        dayLabel={activeCell?.dayLabel || ""}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete campaign?"
        message="This will permanently remove the Meta ads campaign."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
