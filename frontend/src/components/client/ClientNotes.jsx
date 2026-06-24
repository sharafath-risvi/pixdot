import { useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2 } from "react-icons/fi";
import { useClientPersonal } from "../../context/ClientPersonalContext.jsx";
import { NOTE_TYPES } from "../../lib/noteTypes.js";
import StaffNoteModal from "../staff/StaffNoteModal.jsx";
import ConfirmModal from "../admin/ConfirmModal.jsx";
import styles from "./Client.module.css";

const FILTER_ALL = "All";

export default function ClientNotes() {
  const { notes, addNote, updateNote, deleteNote, clientId, loading, error, clearError } = useClientPersonal();
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
      .filter((n) => !q || `${n.title} ${n.description}`.toLowerCase().includes(q))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [notes, filter, search]);

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
    <section className={styles.clientPanel}>
      <div className={styles.clientNotesHeader}>
        <div>
          <h2 className={styles.clientPanelTitle}>Notes</h2>
          <p className={styles.clientPanelSub}>Your private planner — not visible to other companies.</p>
        </div>
        <button type="button" className={styles.clientBtnPrimary} onClick={() => { setEditing(null); setModalOpen(true); }} disabled={!clientId}>
          <FiPlus aria-hidden />
          Add note
        </button>
      </div>

      <div className={styles.clientFilterTabs} role="tablist">
        {[FILTER_ALL, ...NOTE_TYPES].map((t) => (
          <button
            key={t}
            type="button"
            className={`${styles.clientFilterTab} ${filter === t ? styles.clientFilterTabActive : ""}`}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className={styles.clientSearchWrap}>
        <FiSearch size={16} />
        <input
          type="search"
          className={styles.clientSearchInput}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!clientId ? (
        <p className={styles.clientNotesEmpty}>Sign in to use notes.</p>
      ) : error ? (
        <div className={styles.clientNotesEmpty} style={{ color: "red" }}>
          <p>{error}</p>
          <button type="button" className={styles.clientBtnPrimary} onClick={clearError} style={{ marginTop: "1rem" }}>Dismiss</button>
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
        <div className={styles.clientTableScroll}>
          <table className={`${styles.clientNotesTable} dash-table`}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Date</th>
                <th style={{ width: 88 }}> </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id}>
                  <td>
                    <strong>{n.title}</strong>
                    {n.description ? <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>{n.description}</div> : null}
                  </td>
                  <td>
                    <span className={styles.clientTypePill}>{n.type}</span>
                  </td>
                  <td style={{ whiteSpace: "nowrap", color: "#64748b", fontWeight: 600 }}>{n.date}</td>
                  <td>
                    <div className={styles.clientNotesActions}>
                      <button type="button" className={styles.clientIconBtn} aria-label="Edit" onClick={() => { setEditing(n); setModalOpen(true); }}>
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.clientIconBtn} ${styles.clientIconBtnDanger}`}
                        aria-label="Delete"
                        onClick={() => confirmDelete(n)}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
