import { useEffect } from "react";
import { FaCircleExclamation } from "react-icons/fa6";
import styles from "./Admin.module.css";

export default function ConfirmModal({
  open,
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Confirm",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <FaCircleExclamation style={{ color: "var(--color-danger)", fontSize: "24px" }} />
          <h3 className={styles.cardTitle} style={{ margin: 0 }}>{title}</h3>
        </div>
        <p className={styles.cardSub} style={{ marginBottom: "24px" }}>
          {message}
        </p>
        <div className={styles.modalActions}>
          <button type="button" className={styles.buttonGhost} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.buttonDanger} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
