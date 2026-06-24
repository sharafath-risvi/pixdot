import { useEffect, useState } from "react";
import PasswordInput from "../PasswordInput.jsx";
import api from "../../../lib/api.js";
import styles from "../Admin.module.css";

export default function ChangeAdminPasswordModal({ open, mode = "edit", onClose, onSaved }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }, [open, mode]);

  if (!open) return null;

  const isReset = mode === "reset";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isReset) {
      if (!oldPassword) {
        setError("Current admin password is required to reset.");
        return;
      }
      try {
        setLoading(true);
        await api.put("/api/auth/change-my-password", {
          currentPassword: oldPassword,
          newPassword: "123456",
        });
        onSaved?.("Admin password reset to default.");
        onClose();
      } catch (err) {
        setError(err.response?.data?.message || "Failed to reset password.");
      } finally {
        setLoading(false);
      }
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
    if (next === oldPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    try {
      setLoading(true);
      await api.put("/api/auth/change-my-password", {
        currentPassword: oldPassword,
        newPassword: next,
      });
      onSaved?.("Admin password updated.");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className={styles.cardTitle}>{isReset ? "Reset admin password" : "Change admin password"}</h3>
        <p className={styles.cardSub}>
          {isReset
            ? "Enter your current admin password to reset back to the default (123456)."
            : "Confirm your current password, then set a new one."}
        </p>

        <form onSubmit={handleSubmit} className={styles.settingsModalForm}>
          <PasswordInput
            label="Current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Current admin password"
            autoComplete="current-password"
          />
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
            <button type="button" className={styles.buttonSecondary} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={isReset ? styles.buttonDanger : styles.buttonPrimary} disabled={loading}>
              {loading ? "Saving..." : isReset ? "Reset password" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
