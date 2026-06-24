import { useEffect } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import styles from "../Admin.module.css";

export default function ConfirmDeleteModal({
  open,
  title = "Delete Line Item",
  message = "Are you sure you want to delete this line item? This action cannot be undone.",
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
    <div className={styles.modalBackdrop} onClick={onCancel} style={{ backdropFilter: "blur(4px)" }}>
      <div 
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          animation: "modalFadeIn 0.2s ease-out", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          textAlign: "center" 
        }}
      >
        <div style={{ marginBottom: "16px", color: "var(--color-danger)", fontSize: "32px" }}>
          <FaExclamationTriangle />
        </div>
        <h3 className={styles.cardTitle} style={{ marginBottom: "12px" }}>{title}</h3>
        <p className={styles.cardSub} style={{ marginBottom: "24px" }}>
          {message}
        </p>
        <div className={styles.modalActions} style={{ width: "100%", justifyContent: "center" }}>
          <button type="button" className={styles.buttonGhost} onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={styles.buttonDanger} onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
