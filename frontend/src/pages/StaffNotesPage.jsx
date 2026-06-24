import { useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { useStaffPersonal } from "../context/StaffPersonalContext.jsx";
import { NOTE_TYPES } from "../lib/noteTypes.js";
import StaffNoteModal from "../components/staff/StaffNoteModal.jsx";
import ConfirmModal from "../components/admin/ConfirmModal.jsx";
import adminStyles from "../components/admin/Admin.module.css";
import styles from "../components/staff/Staff.module.css";

const FILTER_ALL = "All";

export default function StaffNotesPage() {
  const { notes, addNote, updateNote, deleteNote, staffNotesKey, loading, error, clearError } = useStaffPersonal();
  const [filter, setFilter] = useState(FILTER_ALL);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes
      .filter((n) => (filter === FILTER_ALL ? true : n.type === filter))
      .filter((n) => {
        if (!q) return true;
        return `${n.title} ${n.description}`.toLowerCase().includes(q);
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [notes, filter, search]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (n) => {
    setEditing(n);
    setModalOpen(true);
  };

  const handleSave = (payload) => {
    if (editing) updateNote(editing.id, payload);
    else addNote(payload);
  };

  const confirmDelete = (n) => {
    setNoteToDelete(n);
    setDeleteModalOpen(true);
  };

  const executeDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id);
      setDeleteModalOpen(false);
      setNoteToDelete(null);
    }
  };

  return (
    <section className={adminStyles.adminPageSection}>
      <div className={`${adminStyles.pageHeading} ${styles.staffPageHeadingRow}`}>
        <div>
          <h2 className={adminStyles.pageHeadingTitle}>Notes</h2>
          <p className={adminStyles.pageHeadingSub}>
            Private to your login — organise by Daily, Weekly, Monthly, or Yearly.
          </p>
        </div>
        <button type="button" className={styles.staffBtnPrimary} onClick={openAdd} disabled={!staffNotesKey}>
          <FiPlus aria-hidden />
          Add note
        </button>
      </div>

      <section className={styles.staffPanel}>
        <div className={styles.staffNotesToolbar}>
          <div className={styles.staffFilterTabs} role="tablist" aria-label="Note type">
            {[FILTER_ALL, ...NOTE_TYPES].map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={filter === t}
                className={`${styles.staffFilterTab} ${filter === t ? styles.staffFilterTabActive : ""}`}
                onClick={() => setFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className={styles.staffSearchWrap}>
            <FiSearch className={styles.staffSearchIcon} aria-hidden />
            <input
              type="search"
              className={styles.staffSearchInput}
              placeholder="Search title or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {!staffNotesKey ? (
          <p className={styles.staffNotesEmpty}>Sign in as staff to use notes.</p>
        ) : error ? (
          <div className={styles.staffNotesEmpty} style={{ color: "red" }}>
            <p>{error}</p>
            <button type="button" className={styles.staffBtnOutline} onClick={clearError} style={{ marginTop: "1rem" }}>Dismiss</button>
          </div>
        ) : loading && notes.length === 0 ? (
          <div className="dash-empty-container">
            <div className="dash-skeleton" style={{ width: "100%", height: "48px", marginBottom: "8px" }} />
            <div className="dash-skeleton" style={{ width: "100%", height: "48px", marginBottom: "8px" }} />
            <div className="dash-skeleton" style={{ width: "100%", height: "48px" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty-container">
            <FiSearch className="dash-empty-icon" />
            <p className="dash-empty-title">No notes found</p>
            <p className="dash-empty-desc">Create a new note or adjust your search filter.</p>
          </div>
        ) : (
          <div className={styles.staffTableScroll}>
            <table className={`${styles.staffNotesTable} dash-table`}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th className={styles.staffNotesThActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div className={styles.staffNoteTitleCell}>{n.title}</div>
                      {n.description ? (
                        <div className={styles.staffNoteDescPreview}>{n.description}</div>
                      ) : null}
                    </td>
                    <td>
                      <span className={styles.staffTypePill}>{n.type}</span>
                    </td>
                    <td className={styles.staffNotesDate}>{n.date}</td>
                    <td>
                      <div className={styles.staffNotesRowActions}>
                        <button
                          type="button"
                          className={styles.staffIconBtn}
                          onClick={() => openEdit(n)}
                          aria-label="Edit note"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          type="button"
                          className={`${styles.staffIconBtn} ${styles.staffIconBtnDanger}`}
                          onClick={() => confirmDelete(n)}
                          aria-label="Delete note"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <StaffNoteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialNote={editing}
        onSave={handleSave}
      />

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        confirmText="Delete"
        onConfirm={executeDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </section>
  );
}
