import { useState } from "react";
import styles from "../Admin.module.css";
import { safeNumber } from "../../../lib/format.js";

export default function AddOptionModal({ open, onClose, onSubmit }) {
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [note, setNote] = useState("");

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.cardTitle}>Add Option</h3>
        <div className={styles.formGrid}>
          <input className={styles.input} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Option label" />
          <input className={styles.input} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
          <input className={styles.input} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit (optional)" />
          <input className={styles.input} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" />
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.buttonGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={() => {
              const clean = label.trim();
              if (!clean) return;
              onSubmit({ label: clean, price: safeNumber(price), unit: unit.trim(), note: note.trim() });
              setLabel("");
              setPrice("");
              setUnit("");
              setNote("");
              onClose();
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

