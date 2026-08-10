import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { toIsoDateString } from "../../lib/calendar.js";
import {
  STATUS_OPTIONS,
  getStatusColor,
  normalizeStatus,
} from "../../lib/contentStatus.js";
import { formatDisplayDate, formatStaffRole } from "../../lib/staffRole.js";
import StatusBadge from "./StatusBadge.jsx";
import adminStyles from "../admin/Admin.module.css";
import styles from "./DailyReport.module.css";

export default function DailyReportPage({ mode = "staff" }) {
  const toast = useToast();
  const { role: authRole } = useAuth();
  const { clients, clientsLoading, fetchClients } = useWorkspace();
  const isAdmin = mode === "admin";
  const canAddClient = isAdmin || authRole === "admin";

  const todayIso = useMemo(() => toIsoDateString(), []);
  const [viewDate, setViewDate] = useState(todayIso);

  const [profile, setProfile] = useState({ name: "", role: "" });
  const [profileLoading, setProfileLoading] = useState(!isAdmin);

  const [form, setForm] = useState({
    clientId: "",
    status: "pending",
    contentType: "",
    additionalNotes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [contentTypes, setContentTypes] = useState([]);
  const [contentTypesLoading, setContentTypesLoading] = useState(true);

  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const [clientOpen, setClientOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState("");

  const [addClientOpen, setAddClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientCategory, setNewClientCategory] = useState("");
  const [addingClient, setAddingClient] = useState(false);

  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [addingType, setAddingType] = useState(false);

  const clientRef = useRef(null);
  const typeRef = useRef(null);

  const reportDate = isAdmin ? viewDate : todayIso;

  const loadDay = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/reports/date/${reportDate}`);
      setDayData(res.data?.data || null);
    } catch {
      setDayData(null);
    } finally {
      setLoading(false);
    }
  }, [reportDate]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  useEffect(() => {
    if (isAdmin) return undefined;
    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      try {
        const me = await api.get("/api/auth/me");
        const p = me.data?.data?.profile;
        if (!cancelled && p) {
          setProfile({ name: p.name || "", role: p.role || "" });
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const loadContentTypes = useCallback(async () => {
    setContentTypesLoading(true);
    try {
      const res = await api.get("/api/content-types");
      setContentTypes(res.data?.data || []);
    } catch {
      setContentTypes([]);
    } finally {
      setContentTypesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContentTypes();
  }, [loadContentTypes]);

  useEffect(() => {
    const onDoc = (e) => {
      if (clientRef.current && !clientRef.current.contains(e.target)) setClientOpen(false);
      if (typeRef.current && !typeRef.current.contains(e.target)) setTypeOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectedClient = clients.find((c) => String(c.id) === String(form.clientId));
  const filteredClients = clients.filter((c) =>
    !clientSearch.trim() ? true : c.name.toLowerCase().includes(clientSearch.trim().toLowerCase())
  );
  const filteredTypes = contentTypes.filter((t) =>
    !typeSearch.trim() ? true : t.name.toLowerCase().includes(typeSearch.trim().toLowerCase())
  );

  const validate = () => {
    const next = {};
    if (!form.clientId) next.clientId = "Please select a client.";
    if (!form.status) next.status = "Please select a status.";
    if (!form.contentType) next.contentType = "Please select a content type.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/api/reports", {
        clientId: form.clientId,
        status: form.status,
        contentType: form.contentType,
        additionalNotes: form.additionalNotes.trim(),
      });
      toast.success("Daily report submitted successfully.");
      setForm({
        clientId: "",
        status: "pending",
        contentType: "",
        additionalNotes: "",
      });
      setErrors({});
      loadDay();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!newClientName.trim() || addingClient) return;
    setAddingClient(true);
    try {
      const username =
        newClientName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "")
          .slice(0, 20) || `client${Date.now().toString().slice(-6)}`;
      const res = await api.post("/api/clients", {
        name: newClientName.trim(),
        businessType: newClientCategory.trim() || "",
        portalUsername: username,
        portalPassword: "123456",
      });
      const created = res.data?.data;
      await fetchClients(true);
      const id = created?._id || created?.id;
      if (id) setForm((f) => ({ ...f, clientId: id }));
      setAddClientOpen(false);
      setNewClientName("");
      setNewClientCategory("");
      setClientOpen(false);
      toast.success("Client added.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add client.");
    } finally {
      setAddingClient(false);
    }
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim() || addingType) return;
    setAddingType(true);
    try {
      const res = await api.post("/api/content-types", { name: newTypeName.trim() });
      const created = res.data?.data;
      await loadContentTypes();
      if (created?.name) setForm((f) => ({ ...f, contentType: created.name }));
      setAddTypeOpen(false);
      setNewTypeName("");
      setTypeOpen(false);
      toast.success("Content type added.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add content type.");
    } finally {
      setAddingType(false);
    }
  };

  const stats = dayData?.stats || { totalReports: 0, submitted: 0, pending: 0, issues: 0 };
  const reports = dayData?.reports || [];
  const staffStatus = dayData?.staffStatus || [];

  return (
    <section className={adminStyles.adminPageSection}>
      <div className={`${adminStyles.pageHeading} ${styles.headingRow}`}>
        <div>
          <h2 className={adminStyles.pageHeadingTitle}>Daily Report</h2>
          <p className={adminStyles.pageHeadingSub}>
            {isAdmin ? "Monitor staff submissions for the selected day" : "Submit and review your daily work report"}
          </p>
        </div>
        {isAdmin ? (
          <div className={styles.headingActions}>
            <input
              type="date"
              className={styles.dateInput}
              value={viewDate}
              onChange={(e) => setViewDate(e.target.value)}
              aria-label="Report date"
            />
          </div>
        ) : null}
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span>Today&apos;s Reports</span>
          <strong>{isAdmin ? stats.totalReports : reports.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Submitted</span>
          <strong>{stats.submitted}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Pending</span>
          <strong>{stats.pending}</strong>
        </div>
        <div className={styles.statCard}>
          <span>Issues</span>
          <strong>{stats.issues}</strong>
        </div>
      </div>

      {!isAdmin ? (
        <form className={styles.formCard} onSubmit={handleSubmit} noValidate>
          <h3>Submit Daily Report</h3>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Date</span>
              <div className={styles.readOnly}>
                <span>{formatDisplayDate(todayIso)}</span>
                <span className={styles.fieldIcon} aria-hidden>
                  📅
                </span>
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Staff Name</span>
              <div className={styles.readOnly}>
                {profileLoading ? "Loading…" : profile.name || "—"}
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Role</span>
              <div className={styles.readOnly}>
                {profileLoading ? "Loading…" : formatStaffRole(profile.role)}
              </div>
            </label>

            <div className={styles.field} ref={clientRef}>
              <span className={styles.fieldLabel}>Client Name</span>
              <button
                type="button"
                className={`${styles.selectTrigger} ${errors.clientId ? styles.inputError : ""}`}
                onClick={() => {
                  setClientOpen((o) => !o);
                  setTypeOpen(false);
                }}
                aria-expanded={clientOpen}
              >
                <span className={selectedClient ? "" : styles.placeholder}>
                  {clientsLoading
                    ? "Loading clients…"
                    : selectedClient?.name || "Select Client"}
                </span>
                <span aria-hidden>▼</span>
              </button>
              {errors.clientId ? <span className={styles.error}>{errors.clientId}</span> : null}

              {clientOpen ? (
                <div className={styles.dropdown}>
                  <input
                    className={styles.searchInput}
                    placeholder="Search client…"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.dropdownList}>
                    {clientsLoading ? (
                      <p className={styles.dropdownEmpty}>Loading clients…</p>
                    ) : filteredClients.length === 0 ? (
                      <p className={styles.dropdownEmpty}>No clients available</p>
                    ) : (
                      filteredClients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => {
                            setForm((f) => ({ ...f, clientId: c.id }));
                            setErrors((er) => ({ ...er, clientId: undefined }));
                            setClientOpen(false);
                            setClientSearch("");
                          }}
                        >
                          {c.name}
                        </button>
                      ))
                    )}
                  </div>
                  {canAddClient ? (
                    <button
                      type="button"
                      className={styles.addLink}
                      onClick={() => {
                        setAddClientOpen(true);
                        setClientOpen(false);
                      }}
                    >
                      + Add Client
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Status</span>
              <select
                className={`${styles.selectColored} ${errors.status ? styles.inputError : ""}`}
                value={form.status}
                onChange={(e) => {
                  setForm((f) => ({ ...f, status: e.target.value }));
                  setErrors((er) => ({ ...er, status: undefined }));
                }}
                style={{ backgroundColor: getStatusColor(form.status) }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.status ? <span className={styles.error}>{errors.status}</span> : null}
            </label>

            <div className={styles.field} ref={typeRef}>
              <span className={styles.fieldLabel}>Content Type</span>
              <button
                type="button"
                className={`${styles.selectTrigger} ${errors.contentType ? styles.inputError : ""}`}
                onClick={() => {
                  setTypeOpen((o) => !o);
                  setClientOpen(false);
                }}
                aria-expanded={typeOpen}
              >
                <span className={form.contentType ? "" : styles.placeholder}>
                  {contentTypesLoading
                    ? "Loading content types…"
                    : form.contentType || "Select Content Type"}
                </span>
                <span aria-hidden>▼</span>
              </button>
              {errors.contentType ? <span className={styles.error}>{errors.contentType}</span> : null}

              {typeOpen ? (
                <div className={styles.dropdown}>
                  <input
                    className={styles.searchInput}
                    placeholder="Search content type…"
                    value={typeSearch}
                    onChange={(e) => setTypeSearch(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.dropdownList}>
                    {contentTypesLoading ? (
                      <p className={styles.dropdownEmpty}>Loading content types…</p>
                    ) : filteredTypes.length === 0 ? (
                      <p className={styles.dropdownEmpty}>No content types available</p>
                    ) : (
                      filteredTypes.map((t) => (
                        <button
                          key={t.id || t._id}
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => {
                            setForm((f) => ({ ...f, contentType: t.name }));
                            setErrors((er) => ({ ...er, contentType: undefined }));
                            setTypeOpen(false);
                            setTypeSearch("");
                          }}
                        >
                          {t.name}
                        </button>
                      ))
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.addLink}
                    onClick={() => {
                      setAddTypeOpen(true);
                      setTypeOpen(false);
                    }}
                  >
                    + Add Content Type
                  </button>
                </div>
              ) : null}
            </div>

            <label className={`${styles.field} ${styles.fullWidth}`}>
              <span className={styles.fieldLabel}>Additional Notes</span>
              <textarea
                className={styles.textarea}
                rows={4}
                value={form.additionalNotes}
                onChange={(e) => setForm((f) => ({ ...f, additionalNotes: e.target.value }))}
                placeholder="Add any important notes about today's work…"
              />
            </label>
          </div>

          <button
            type="submit"
            className={`${adminStyles.buttonPrimary} ${styles.submitBtn}`}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit Daily Report"}
          </button>
        </form>
      ) : null}

      <div className={styles.listCard}>
        <h3>{isAdmin ? "Staff Reports" : "Today's Reports"}</h3>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : isAdmin ? (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Staff</th>
                    <th>Role</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Content Type</th>
                    <th>Notes</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staffStatus.map((s) => {
                    const r = s.report;
                    return (
                      <tr key={s.staffId}>
                        <td>{r ? formatDisplayDate(r.date) : formatDisplayDate(reportDate)}</td>
                        <td>{s.name}</td>
                        <td>{formatStaffRole(s.role)}</td>
                        <td>{r?.clientName || r?.clientId?.name || "—"}</td>
                        <td>
                          {r ? (
                            <StatusBadge status={r.status} />
                          ) : (
                            <span className={styles.badgePending}>Not Submitted</span>
                          )}
                        </td>
                        <td>{r?.contentType || "—"}</td>
                        <td className={styles.notesCell}>
                          {(r?.additionalNotes || r?.notes || "").slice(0, 40) || "—"}
                          {(r?.additionalNotes || r?.notes || "").length > 40 ? "…" : ""}
                        </td>
                        <td>
                          {r ? (
                            <button type="button" className={styles.linkBtn} onClick={() => setSelectedReport(r)}>
                              View
                            </button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className={styles.mobileCards}>
              {staffStatus.map((s) => {
                const r = s.report;
                return (
                  <article key={s.staffId} className={styles.mobileCard}>
                    <div className={styles.mobileCardTop}>
                      <strong>{s.name}</strong>
                      {r ? (
                        <StatusBadge status={r.status} />
                      ) : (
                        <span className={styles.badgePending}>Not Submitted</span>
                      )}
                    </div>
                    <p className={styles.muted}>{formatStaffRole(s.role)}</p>
                    {r ? (
                      <>
                        <p className={styles.metaLine}>
                          <span>{r.clientName || r.clientId?.name || "—"}</span>
                          <span>·</span>
                          <span>{r.contentType || "—"}</span>
                        </p>
                        <button type="button" className={styles.linkBtn} onClick={() => setSelectedReport(r)}>
                          View report
                        </button>
                      </>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </>
        ) : reports.length === 0 ? (
          <p className={styles.muted}>No reports for today yet.</p>
        ) : (
          <div className={styles.tableWrapAlways}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Content Type</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id || r._id} className={styles.clickRow} onClick={() => setSelectedReport(r)}>
                    <td>{r.clientName || r.clientId?.name || "—"}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>{r.contentType || "—"}</td>
                    <td className={styles.notesCell}>
                      {(r.additionalNotes || r.notes || "").slice(0, 48) || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.mobileCards}>
              {reports.map((r) => (
                <article
                  key={r.id || r._id}
                  className={styles.mobileCard}
                  onClick={() => setSelectedReport(r)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedReport(r)}
                  role="button"
                  tabIndex={0}
                >
                  <div className={styles.mobileCardTop}>
                    <strong>{r.clientName || r.clientId?.name || "—"}</strong>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className={styles.muted}>{r.contentType || "—"}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedReport ? (
        <div className={adminStyles.modalBackdrop} onClick={() => setSelectedReport(null)}>
          <div className={adminStyles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={adminStyles.cardTitle}>
              {selectedReport.staffName || "Staff"} — {formatDisplayDate(selectedReport.date)}
            </h3>
            <p className={adminStyles.cardSub}>{formatStaffRole(selectedReport.role)}</p>
            <div className={styles.detailGrid}>
              <div>
                <h4>Client</h4>
                <p>{selectedReport.clientName || selectedReport.clientId?.name || "—"}</p>
              </div>
              <div>
                <h4>Status</h4>
                <StatusBadge status={normalizeStatus(selectedReport.status)} />
              </div>
              <div>
                <h4>Content Type</h4>
                <p>{selectedReport.contentType || "—"}</p>
              </div>
              <div>
                <h4>Additional Notes</h4>
                <p>{selectedReport.additionalNotes || selectedReport.notes || "—"}</p>
              </div>
            </div>
            <div className={adminStyles.modalActions}>
              <button type="button" className={adminStyles.buttonPrimary} onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addClientOpen ? (
        <div className={adminStyles.modalBackdrop} onClick={() => setAddClientOpen(false)}>
          <div className={adminStyles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <h3 className={adminStyles.cardTitle}>Add Client</h3>
            <form onSubmit={handleAddClient}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Client Name</span>
                <input
                  className={styles.input}
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Category</span>
                <input
                  className={styles.input}
                  value={newClientCategory}
                  onChange={(e) => setNewClientCategory(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <div className={adminStyles.modalActions}>
                <button type="button" className={adminStyles.buttonGhost} onClick={() => setAddClientOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={adminStyles.buttonPrimary} disabled={addingClient}>
                  {addingClient ? "Adding…" : "Add Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {addTypeOpen ? (
        <div className={adminStyles.modalBackdrop} onClick={() => setAddTypeOpen(false)}>
          <div className={adminStyles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <h3 className={adminStyles.cardTitle}>Add Content Type</h3>
            <form onSubmit={handleAddType}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Content Type Name</span>
                <input
                  className={styles.input}
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  required
                  autoFocus
                />
              </label>
              <div className={adminStyles.modalActions}>
                <button type="button" className={adminStyles.buttonGhost} onClick={() => setAddTypeOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={adminStyles.buttonPrimary} disabled={addingType}>
                  {addingType ? "Adding…" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
