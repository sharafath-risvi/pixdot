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

