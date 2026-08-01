import { useState } from "react";
import styles from "../Admin.module.css";
import { safeNumber } from "../../../lib/format.js";
import ConfirmDeleteModal from "./ConfirmDeleteModal.jsx";

export default function OptionEditor({ option, onChange, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <div className={styles.pricingOption}>
      <div className={styles.pricingGrid3}>
        <input
          className={styles.input}
          value={option.label}
          onChange={(e) => onChange({ ...option, label: e.target.value })}
          placeholder="Label"
        />
        <input
          className={styles.input}
          inputMode="numeric"
          value={option.price}
          onChange={(e) => onChange({ ...option, price: safeNumber(e.target.value) })}
          placeholder="Price"
        />
        <button
          type="button"
          className={styles.buttonDanger}
          onClick={() => setShowConfirm(true)}
        >
          Delete
        </button>
      </div>
      <div className={styles.pricingGrid2} style={{ marginTop: 8 }}>
        <input
          className={styles.input}
          value={option.unit ?? ""}
          onChange={(e) => onChange({ ...option, unit: e.target.value })}
          placeholder="Unit (optional)"
        />
        <input
          className={styles.input}
          value={option.note ?? ""}
          onChange={(e) => onChange({ ...option, note: e.target.value })}
          placeholder="Note (optional)"
        />
      </div>

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        <p className={styles.muted} style={{ fontSize: 12, margin: 0 }}>What's Included</p>
        {(option.bulletPoints ?? []).map((bp, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <input
              className={styles.input}
              value={bp}
              onChange={(e) => {
                const next = [...(option.bulletPoints ?? [])];
                next[i] = e.target.value;
                onChange({ ...option, bulletPoints: next });
              }}
              placeholder="Bullet point"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className={styles.buttonDanger}
              onClick={() => {
                const next = (option.bulletPoints ?? []).filter((_, idx) => idx !== i);
                onChange({ ...option, bulletPoints: next });
              }}
            >
              Delete
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={() => onChange({ ...option, bulletPoints: [...(option.bulletPoints ?? []), ""] })}
          style={{ width: "fit-content", fontSize: 13, padding: "6px 12px" }}
        >
          + Add Bullet Point
        </button>
      </div>

      <ConfirmDeleteModal
        open={showConfirm}
        title="Delete Option"
        message={`Are you sure you want to delete this option? This action cannot be undone.`}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          onDelete();
        }}
      />
    </div>
  );
}

