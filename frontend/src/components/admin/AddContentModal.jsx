import { useEffect, useState } from "react";
import styles from "./Admin.module.css";
import { STATUS_OPTIONS, getStatusColor, normalizeStatus } from "../../lib/contentStatus.js";

const posterTypes = ["Creative Poster", "Normal Poster", "AI Poster"];
const reelTypes = ["AI Reel", "Edited Reel", "Animation Reel", "Voice-Over Reel"];
const shootTypes = ["Shoot", "Shoot Reel"];
const creativeTypes = ["Creative", "Creative Ad"];

function subtypesForKind(kind) {
  if (kind === "Poster") return posterTypes;
  if (kind === "Reel") return reelTypes;
  if (kind === "Shoot") return shootTypes;
  if (kind === "Creative") return creativeTypes;
  return posterTypes;
}

export default function AddContentModal({ open, onClose, onSubmit, initialValue, dayLabel }) {
  const [kind, setKind] = useState("Poster");
  const [subtype, setSubtype] = useState(posterTypes[0]);
  const [status, setStatus] = useState("pending");
  const [reasonNote, setReasonNote] = useState("");
  const [contentPlan, setContentPlan] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initialValue) {
      setKind(initialValue.kind || "Poster");
      setSubtype(initialValue.subtype || posterTypes[0]);
      setStatus(normalizeStatus(initialValue.status));
      setReasonNote(initialValue.reasonNote || "");
      setContentPlan(initialValue.contentPlan || "");
    } else {
      setKind("Poster");
      setSubtype(posterTypes[0]);
      setStatus("pending");
      setReasonNote("");
      setContentPlan("");
    }
    setError("");
  }, [open, initialValue]);

  useEffect(() => {
    if (initialValue) return;
    const opts = subtypesForKind(kind);
    setSubtype(opts[0]);
  }, [kind, initialValue]);

  if (!open) return null;

  const options = subtypesForKind(kind);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (status === "pending" && !reasonNote.trim()) {
      setError("Please enter a Reason Note for Pending status.");
      return;
    }
    onSubmit({
      kind,
      subtype,
      status: normalizeStatus(status),
      completed: status === "completed",
      reasonNote: status === "pending" ? reasonNote.trim() : "",
      contentPlan: contentPlan.trim(),
    });
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.cardTitle}>Content for {dayLabel}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <select className={styles.select} value={kind} onChange={(e) => setKind(e.target.value)}>
              <option>Poster</option>
              <option>Reel</option>
              <option>Shoot</option>
              <option>Creative</option>
            </select>
            <select className={styles.select} value={subtype} onChange={(e) => setSubtype(e.target.value)}>
              {options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              className={styles.select}
              value={normalizeStatus(status)}
              onChange={(e) => {
                setStatus(e.target.value);
                setError("");
              }}
              style={{ backgroundColor: getStatusColor(status) }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {status === "pending" && (
            <div className={styles.noteGroup}>
              <label className={styles.cardSub} htmlFor="reason-note">
                Reason note (required for Pending)
              </label>
              <textarea
                id="reason-note"
                className={styles.textarea}
                value={reasonNote}
                onChange={(e) => {
                  setReasonNote(e.target.value);
                  setError("");
                }}
                placeholder="Example: Client approval pending, so poster not published yet."
              />
            </div>
          )}

          <div className={styles.noteGroup}>
            <label className={styles.cardSub} htmlFor="content-plan">
              Post / Video / Content Plan
            </label>
            <textarea
              id="content-plan"
              className={styles.textarea}
              value={contentPlan}
              onChange={(e) => setContentPlan(e.target.value)}
              placeholder="Instagram Post, YouTube Video, Product Photography, etc..."
              rows={4}
            />
          </div>

          {error && <p className={styles.errorText}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.buttonGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.buttonPrimary}>
              {initialValue ? "Save changes" : "Add content"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
