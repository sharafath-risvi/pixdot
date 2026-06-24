import { useState } from "react";
import styles from "../Admin.module.css";

export default function AddLineItemModal({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [blurb, setBlurb] = useState("");

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.cardTitle}>Add Line Item</h3>
        <div className={styles.formGrid}>
          <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Line item name" />
          <input className={styles.input} value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="Blurb (optional)" />
        </div>
        <div className={styles.modalActions}>
          <button type="button" className={styles.buttonGhost} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.buttonPrimary}
            onClick={() => {
              const clean = name.trim();
              if (!clean) return;
              onSubmit({ name: clean, blurb: blurb.trim(), options: [] });
              setName("");
              setBlurb("");
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

