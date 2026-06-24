import { useEffect, useState } from "react";
import PasswordInput from "../PasswordInput.jsx";
import styles from "../Admin.module.css";

const DEFAULT_PASSWORD = "123456";

export default function ChangePortalPasswordModal({
  open,
  mode = "edit",
  entityLabel,
  entityName,
  onClose,
  onConfirm,
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }, [open, mode, entityName]);

  if (!open) return null;

  const isReset = mode === "reset";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (isReset) {
      onConfirm(DEFAULT_PASSWORD);
      onClose();
      return;
    }

    const next = newPassword.trim();
    const confirm = confirmPassword.trim();
    if (!next) {
      setError("New password cannot be empty.");
      return;
    }
    if (next.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    onConfirm(next);
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className={styles.cardTitle}>
          {isReset ? `Reset ${entityLabel} password` : `Change ${entityLabel} password`}
        </h3>
        <p className={styles.cardSub}>
          {isReset
            ? `Are you sure you want to reset ${entityName}'s password to default (${DEFAULT_PASSWORD})?`
            : `Set a new password for ${entityName}.`}
        </p>

        <form onSubmit={handleSubmit} className={styles.settingsModalForm}>
          {!isReset ? (
            <>
              <PasswordInput
                label="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
              />
              <PasswordInput
                label="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </>
          ) : null}
          {error ? <p className={styles.errorText}>{error}</p> : null}
          <div className={styles.modalActions}>
            <button type="button" className={styles.buttonSecondary} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={isReset ? styles.buttonDanger : styles.buttonPrimary}>
              {isReset ? "Reset password" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
