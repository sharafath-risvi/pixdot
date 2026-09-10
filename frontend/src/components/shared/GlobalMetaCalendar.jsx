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

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function GlobalMetaCalendar({ basePath = "staff" }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [monthDate, setMonthDate] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState([]);
  const [dates, setDates] = useState([]);
  const [contents, setContents] = useState([]);
  const [allClientsForFilter, setAllClientsForFilter] = useState([]);

  // Filters
  const [clientFilter, setClientFilter] = useState("all");
  const [adTypeFilter, setAdTypeFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Two-level view
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const monthParam = monthQueryParam(monthDate);

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
        },
      });
      const data = res.data?.data || {};
      setClients(data.clients || []);
      setDates(data.dates || []);
      setContents(data.contents || []);
      if (clientFilter === "all") {
        setAllClientsForFilter(data.clients || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load Meta Ads schedule.");
      setClients([]);
      setDates([]);
      setContents([]);
    } finally {
      setLoading(false);
    }
  }, [monthParam, adTypeFilter, platformFilter, statusFilter, clientFilter]);

  useEffect(() => {
    fetchGlobal();
  }, [fetchGlobal]);

  // Map: dateKey → all items on that date
  const dailyContents = useMemo(() => {
    const map = {};
    for (const item of contents) {
      if (!map[item.dateKey]) map[item.dateKey] = [];
      map[item.dateKey].push(item);
    }
    return map;
  }, [contents]);

  // Map: "clientId__dateKey" → items for that client+date
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
    setSelectedDateKey(null);
  };

  const openCell = (client, dateKey, editItem = null) => {
    const row = dates.find((d) => d.dateKey === dateKey);
    setActiveCell({
      clientId: client.id || client._id,
      clientName: client.name,
      dateKey,
      dayLabel: `${row?.label ?? dateKey} · ${client.name}`,
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
          { ...payload, dateKey: activeCell.dateKey }
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
        `/api/clients/${deleteTarget.clientId}/calendar/meta/${deleteTarget.item.id || deleteTarget.item._id}`
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

  // Calendar grid padding: Mon-start
  const startDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
  const paddingDays = startDay === 0 ? 6 : startDay - 1;
  const paddingArray = Array.from({ length: paddingDays });

  const selectedRow = dates.find((d) => d.dateKey === selectedDateKey);

  return (
    <section className={adminStyles.adminPageSection}>
      <div className={adminStyles.pageHeading}>
        <h2 className={adminStyles.pageHeadingTitle}>Meta Ads Schedule</h2>
        <p className={adminStyles.pageHeadingSub}>
          Overview of all client Meta Ad campaigns for the selected month
        </p>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <CalendarMonthNav
            monthDate={monthDate}
            onMonthDateChange={(d) => {
              setMonthDate(d);
              setSelectedDateKey(null);
            }}
          />
          <button type="button" className={styles.todayBtn} onClick={goToday}>
            Today
          </button>
        </div>
        <div className={styles.filters}>
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
            <option value="all">All Formats</option>
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
            <option value="all">All Statuses</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status legend */}
      <div className={styles.legendWrap}>
        <div className={styles.metaLegend} aria-label="Meta status legend">
          {statusOptions.map((o) => (
            <span key={o.value} className={styles.metaLegendItem}>
              <span
                className={styles.metaLegendSwatch}
                style={{ background: metaStatusColor(o.value) }}
              />
              {o.label}
            </span>
          ))}
        </div>
      </div>

      {error ? <p className={adminStyles.errorText}>{error}</p> : null}

      {loading ? (
        <div className={styles.skeleton}>Loading Meta Ads schedule…</div>
      ) : selectedDateKey === null ? (
        /* ─── LEVEL 1: MONTHLY GRID VIEW ─────────────────────────────── */
        <div className={styles.calendarGrid}>
          {WEEKDAYS.map((day) => (
            <div key={day} className={styles.weekdayHeader}>
              {day}
            </div>
          ))}

          {paddingArray.map((_, i) => (
            <div key={`pad-${i}`} className={styles.dayCellEmpty} />
          ))}

          {dates.map((row) => {
            const dayItems = dailyContents[row.dateKey] || [];
            const isToday = row.dateKey === todayKey;
            // Gather distinct statuses present on this day for colored dots
            const statuses = [...new Set(dayItems.map((i) => i.metaStatus).filter(Boolean))];

            return (
              <div
                key={row.dateKey}
                className={`${styles.dayCell} ${isToday ? styles.todayCell : ""}`}
                onClick={() => setSelectedDateKey(row.dateKey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedDateKey(row.dateKey);
                }}
                aria-label={`${row.label} — ${dayItems.length} campaign${dayItems.length !== 1 ? "s" : ""}`}
              >
                <div className={styles.dayLabel}>{row.day}</div>
                {dayItems.length > 0 && (
                  <>
                    <div className={styles.eventIndicator}>
                      {dayItems.length} Campaign{dayItems.length !== 1 ? "s" : ""}
                    </div>
                    <div className={metaDotsClass}>
                      {statuses.map((s) => (
                        <span
                          key={s}
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: metaStatusColor(s),
                            border: "1px solid rgba(0,0,0,0.12)",
                            marginRight: 3,
                          }}
                          title={s}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── LEVEL 2: DATE DETAIL VIEW ──────────────────────────────── */
        <div className={styles.detailView}>
          <div className={styles.detailHeader}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setSelectedDateKey(null)}
            >
              ← Back to Monthly Calendar
            </button>
            <h3>
              {selectedRow?.label}, {selectedRow?.weekday}
            </h3>
          </div>

          <div className={styles.detailList}>
            {clients.length === 0 ? (
              <p className={styles.emptyState}>No clients found.</p>
            ) : (
              (() => {
                const clientsWithItems = clients.filter((c) => {
                  const cid = String(c.id || c._id);
                  return (contentMap[`${cid}__${selectedDateKey}`] || []).length > 0;
                });

                return (
                  <>
                    {clientsWithItems.length === 0 ? (
                      <p className={styles.emptyState}>
                        No Meta Ad campaigns scheduled for this date.
                      </p>
                    ) : (
                      clientsWithItems.map((client) => {
                        const cid = String(client.id || client._id);
                        const items = contentMap[`${cid}__${selectedDateKey}`] || [];
                        return (
                          <div key={cid} className={styles.detailClientCard}>
                            <div className={styles.detailClientHeader}>
                              <button
                                type="button"
                                className={styles.detailClientName}
                                onClick={() => openClientMeta(client)}
                              >
                                {client.name}
                              </button>
                              <button
                                type="button"
                                className={styles.addCellBtn}
                                title={`Add campaign for ${client.name}`}
                                onClick={() => openCell(client, selectedDateKey)}
                                aria-label={`Add campaign for ${client.name}`}
                              >
                                +
                              </button>
                            </div>
                            <div className={styles.detailItems}>
                              {items.map((item) => (
                                <div
                                  key={item.id || item._id}
                                  className={styles.chipWrap}
                                >
                                  <button
                                    type="button"
                                    className={styles.chip}
                                    style={{
                                      background: metaStatusColor(item.metaStatus),
                                      borderColor: "rgba(0,0,0,0.08)",
                                    }}
                                    onClick={() => openCell(client, selectedDateKey, item)}
                                    title={`${item.adType} — ${item.campaignName}. Click to edit.`}
                                  >
                                    <strong>{item.adType || "Campaign"}</strong>
                                    {item.campaignName && (
                                      <span>{item.campaignName}</span>
                                    )}
                                    {item.platform && (
                                      <span style={{ opacity: 0.7 }}>{item.platform}</span>
                                    )}
                                    {item.budgetAmount && (
                                      <span style={{ opacity: 0.7 }}>
                                        {item.budgetType}: {item.budgetAmount}
                                      </span>
                                    )}
                                    <span
                                      style={{
                                        marginTop: 4,
                                        fontWeight: 600,
                                        fontSize: 11,
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {item.metaStatus || "—"}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.chipDelete}
                                    aria-label="Delete campaign"
                                    onClick={() =>
                                      setDeleteTarget({ clientId: cid, item })
                                    }
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Allow adding to clients that have no entry yet */}
                    {clients.filter((c) => {
                      const cid = String(c.id || c._id);
                      return (contentMap[`${cid}__${selectedDateKey}`] || []).length === 0;
                    }).length > 0 && (
                      <div className={styles.detailClientCard}>
                        <div className={styles.detailClientHeader}>
                          <span className={styles.detailClientName} style={{ cursor: "default", color: "var(--dash-muted,#656575)" }}>
                            Add campaign for another client
                          </span>
                        </div>
                        <div style={{ paddingTop: 4 }}>
                          <select
                            className={styles.select}
                            defaultValue=""
                            onChange={(e) => {
                              const id = e.target.value;
                              if (!id) return;
                              const client = clients.find(
                                (c) => String(c.id || c._id) === id
                              );
                              if (client) openCell(client, selectedDateKey);
                              e.target.value = "";
                            }}
                            aria-label="Select client to add campaign"
                          >
                            <option value="">Select client…</option>
                            {clients
                              .filter((c) => {
                                const cid = String(c.id || c._id);
                                return (
                                  (contentMap[`${cid}__${selectedDateKey}`] || []).length === 0
                                );
                              })
                              .map((c) => (
                                <option key={c.id || c._id} value={c.id || c._id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        </div>
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
        message="This will permanently remove the Meta Ads campaign."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}

// Inline style helper — dots row below the campaign count badge
const metaDotsClass = { display: "flex", flexWrap: "wrap", gap: 2, marginTop: 4 };
