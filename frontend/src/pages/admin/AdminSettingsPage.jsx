import { useEffect, useRef, useState } from "react";
import api from "../../lib/api.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import PasswordInput from "../../components/admin/PasswordInput.jsx";
import ChangeAdminPasswordModal from "../../components/admin/settings/ChangeAdminPasswordModal.jsx";
import ChangePortalPasswordModal from "../../components/admin/settings/ChangePortalPasswordModal.jsx";
import styles from "../../components/admin/Admin.module.css";
import { useToast } from "../../context/ToastContext.jsx";

function SavedToast({ show, message }) {
  if (!show) return null;
  return <p className={styles.settingsSavedToast}>{message}</p>;
}

function PasswordRowActions({ onEdit, onReset }) {
  return (
    <div className={styles.settingsPasswordRowActions}>
      <button type="button" className={styles.buttonSecondary} onClick={onEdit}>
        Edit
      </button>
      <button type="button" className={styles.buttonDanger} onClick={onReset}>
        Reset
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const {
    staffSalaryVisibleToSelf,
    setStaffSalaryVisibleToSelf,
    staffMembers,
    updateStaffMember,
    clients,
    updateClient,
  } = useWorkspace();
  const globalToast = useToast();

  const [toast, setToast] = useState("");

  const [adminModal, setAdminModal] = useState(null);
  const [portalModal, setPortalModal] = useState(null);

  const toastTimer = useRef(null);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  };

  return (
    <section className={styles.adminPageSection}>
      <div className={styles.pageHeading}>
        <h2 className={styles.pageHeadingTitle}>Settings</h2>
        <p className={styles.pageHeadingSub}>Workspace preferences and login passwords</p>
      </div>

      <SavedToast show={Boolean(toast)} message={toast} />

      <section className={styles.modernCard}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Staff salary visibility</h2>
            <p>When enabled, each staff member can see their salary on their profile page.</p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={staffSalaryVisibleToSelf}
              onChange={(e) => setStaffSalaryVisibleToSelf(e.target.checked)}
            />
            <span className={styles.slider} />
          </label>
        </div>
      </section>

      <section className={styles.modernCard}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Admin password</h2>
            <p>Login for the admin account (<strong>admin</strong>). Use Edit to change or Reset to default.</p>
          </div>
        </div>
        <div className={styles.settingsPasswordDisplayRow}>
          <label className={styles.settingsPasswordField}>
            <span className={styles.settingsPasswordLabel}>Username</span>
            <input type="text" className={styles.input} value="admin" readOnly />
          </label>
          <PasswordInput label="Password" value="********" onChange={() => {}} readOnly />
          <PasswordRowActions
            onEdit={() => setAdminModal({ mode: "edit" })}
            onReset={() => setAdminModal({ mode: "reset" })}
          />
        </div>
        <div className={styles.settingsPasswordActions}>
          <button type="button" className={styles.buttonPrimary} onClick={() => setAdminModal({ mode: "edit" })}>
            Update admin password
          </button>
        </div>
      </section>

      <section className={styles.modernCard}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Staff passwords</h2>
            <p>Each staff member signs in with their username. Admin password required to edit or reset.</p>
          </div>
        </div>
        <div className={styles.settingsPasswordList}>
          {staffMembers.map((member) => (
            <div key={member.id} className={styles.settingsPasswordRow}>
              <div className={styles.settingsPasswordMeta}>
                <strong>{member.name}</strong>
                <span>{member.username || "—"}</span>
              </div>
              <PasswordInput
                value="********"
                onChange={() => {}}
                readOnly
                placeholder="Password"
              />
              <PasswordRowActions
                onEdit={() =>
                  setPortalModal({
                    mode: "edit",
                    type: "staff",
                    userId: member.userId,
                    name: member.name,
                  })
                }
                onReset={() =>
                  setPortalModal({
                    mode: "reset",
                    type: "staff",
                    userId: member.userId,
                    name: member.name,
                  })
                }
              />
            </div>
          ))}
          {staffMembers.length === 0 ? (
            <p className={styles.emptyText}>No staff members yet. Add staff from the profile menu.</p>
          ) : null}
        </div>
      </section>

      <section className={styles.modernCard}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Client portal passwords</h2>
            <p>Clients sign in with their portal username. Admin password required to edit or reset.</p>
          </div>
        </div>
        <div className={styles.settingsPasswordList}>
          {clients.map((client) => (
            <div key={client.id} className={styles.settingsPasswordRow}>
              <div className={styles.settingsPasswordMeta}>
                <strong>{client.name}</strong>
                <span>{client.portalUsername || "—"}</span>
              </div>
              <PasswordInput
                value="********"
                onChange={() => {}}
                readOnly
                placeholder="Portal password"
              />
              <PasswordRowActions
                onEdit={() =>
                  setPortalModal({
                    mode: "edit",
                    type: "client",
                    userId: client.userId,
                    name: client.name,
                  })
                }
                onReset={() =>
                  setPortalModal({
                    mode: "reset",
                    type: "client",
                    userId: client.userId,
                    name: client.name,
                  })
                }
              />
            </div>
          ))}
          {clients.length === 0 ? (
            <p className={styles.emptyText}>No clients yet. Add a client from the profile menu.</p>
          ) : null}
        </div>
      </section>

      <ChangeAdminPasswordModal
        open={Boolean(adminModal)}
        mode={adminModal?.mode}
        onClose={() => setAdminModal(null)}
        onSaved={(message) => {

          showToast(message);
        }}
      />

      <ChangePortalPasswordModal
        open={Boolean(portalModal)}
        mode={portalModal?.mode}
        entityLabel={portalModal?.type === "client" ? "client" : "staff"}
        entityName={portalModal?.name ?? ""}
        onClose={() => setPortalModal(null)}
        onConfirm={async (password) => {
          if (!portalModal) return;
          try {
            await api.put(`/auth/change-password/${portalModal.userId}`, { newPassword: password });
            showToast(
              portalModal.mode === "reset"
                ? `${portalModal.name}'s password reset.`
                : `${portalModal.name}'s password updated.`
            );
          } catch (err) {
            globalToast.error(err.response?.data?.message || "Failed to update password");
          }
        }}
      />
    </section>
  );
}
