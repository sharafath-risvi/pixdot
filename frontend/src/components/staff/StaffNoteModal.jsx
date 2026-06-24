import { useEffect, useState } from "react";
import { NOTE_TYPES } from "../../lib/noteTypes.js";
import styles from "./Staff.module.css";

const empty = { title: "", description: "", type: "Daily", date: "" };

export default function StaffNoteModal({ open, onClose, onSave, initialNote }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (!open) return;
    if (initialNote) {
      setForm({
        title: initialNote.title ?? "",
        description: initialNote.description ?? "",
        type: initialNote.type ?? "Daily",
        date: initialNote.date ?? "",
      });
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setForm({ ...empty, type: "Daily", date: today });
    }
  }, [open, initialNote]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ ...form, title: form.title.trim(), description: form.description.trim() });
    onClose();
  };

  return (
    <div className={styles.staffModalBackdrop} onClick={onClose} role="presentation">
      <div className={styles.staffModal} onClick={(ev) => ev.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="staff-note-modal-title">
        <h2 id="staff-note-modal-title" className={styles.staffModalTitle}>
          {initialNote ? "Edit note" : "Add note"}
        </h2>
        <form onSubmit={submit} className={styles.staffModalForm}>
          <label className={styles.staffField}>
            <span className={styles.staffFieldLabel}>Title</span>
            <input
              className={styles.staffInput}
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Client call"
              required
            />
          </label>
          <label className={styles.staffField}>
            <span className={styles.staffFieldLabel}>Description</span>
            <textarea
              className={styles.staffTextarea}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Details, links, checklist…"
              rows={4}
            />
          </label>
          <div className={styles.staffModalGrid2}>
            <label className={styles.staffField}>
              <span className={styles.staffFieldLabel}>Type</span>
              <select className={styles.staffInput} value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                {NOTE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.staffField}>
              <span className={styles.staffFieldLabel}>Date</span>
              <input
                type="date"
                className={styles.staffInput}
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                required
              />
            </label>
          </div>
          <div className={styles.staffModalActions}>
            <button type="button" className={styles.staffBtnOutline} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.staffBtnPrimary}>
              {initialNote ? "Save changes" : "Add note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
