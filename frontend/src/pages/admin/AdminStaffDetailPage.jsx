import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { FaPen } from "react-icons/fa6";
import StaffEditForm from "../../components/admin/StaffEditForm.jsx";
import ConfirmModal from "../../components/admin/ConfirmModal.jsx";
import styles from "../../components/admin/Admin.module.css";
import { findStaffBySlug, staffPath, toSlug } from "../../lib/adminSlugs.js";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";



function avatarLetter(name) {

  return String(name || "?").trim().charAt(0).toUpperCase() || "?";

}



export default function AdminStaffDetailPage() {

  const { staffSlug } = useParams();

  const navigate = useNavigate();

  const location = useLocation();

  const { staffMembers, fetchStaff } = useWorkspace();

  const staff = findStaffBySlug(staffMembers, staffSlug);

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (location.state?.edit) setEditing(true);
  }, [location.state?.edit]);

  if (!staff) {
    return (
      <section className={styles.adminPageSection}>
        <p className={styles.emptyText}>Staff member not found.</p>
        <NavLink to="/admin-dashboard/team" className={styles.backLink}>
          ← Back to team
        </NavLink>
      </section>
    );
  }

  const handleSave = async (patch) => {
    try {
      const api = (await import("../../lib/api.js")).default;
      await api.put(`/api/staff/${staff.id}`, patch);
      await fetchStaff();

      setEditing(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);

      const nextSlug = toSlug(patch.name || staff.name);
      if (nextSlug && nextSlug !== staffSlug) {
        navigate(staffPath({ ...staff, ...patch }), { replace: true });
      }
    } catch (error) {
      console.error("Failed to update staff", error);
      toast.error(error.response?.data?.message || "Failed to update staff.");
    }
  };

  const handleDelete = async () => {
    try {
      const api = (await import("../../lib/api.js")).default;
      await api.delete(`/api/staff/${staff.id}`);
      await fetchStaff();
      navigate("/admin-dashboard/team", { replace: true });
    } catch (error) {
      console.error("Failed to delete staff", error);
      toast.error(error.response?.data?.message || "Failed to delete staff.");
    }
  };

  const avatar = staff.profileImage?.trim();

  return (
    <section className={styles.adminPageSection}>
      <nav className={styles.adminBreadcrumb} aria-label="Breadcrumb">
        <NavLink to="/admin-dashboard">Admin</NavLink>
        <span>/</span>
        <NavLink to="/admin-dashboard/team">Team</NavLink>
        <span>/</span>
        <span className={styles.adminBreadcrumbCurrent}>{staff.name}</span>
      </nav>

      <div className={styles.detailHeader}>
        {avatar ? (
          <img src={avatar} alt="" className={styles.detailHeaderLogo} />
        ) : (
          <div className={styles.teamCardAvatar} style={{ width: 72, height: 72, fontSize: 28 }}>
            {avatarLetter(staff.name)}
          </div>
        )}
        <div>
          <h1 className={styles.detailHeaderTitle}>{staff.name}</h1>
          <p className={styles.detailHeaderSub}>{staff.role}</p>
        </div>
      </div>

      <section className={styles.modernCard}>
        <div className={styles.profileCardToolbar}>
          <div>
            <h2 className={styles.cardTitle}>Staff profile</h2>
            <p className={styles.cardSub}>Role, contact, and login credentials.</p>
          </div>
          {!editing ? (
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" className={styles.buttonGhost} onClick={() => setEditing(true)}>
                <FaPen aria-hidden />
                Edit profile
              </button>
              <button type="button" className={styles.buttonDanger} onClick={() => setDeleteModalOpen(true)}>
                Delete staff
              </button>
            </div>
          ) : null}
          {saved ? <span className={styles.savedPill}>Saved</span> : null}
        </div>

        {editing ? (
          <StaffEditForm staff={staff} onCancel={() => setEditing(false)} onSave={handleSave} />
        ) : (
          <ul className={styles.detailsListStack}>
            <li className={styles.detailsItemStack}>
              <strong>Salary:</strong> {staff.salary || "—"}
            </li>
            <li className={styles.detailsItemStack}>
              <strong>Phone:</strong> {staff.phone || "—"}
            </li>
            <li className={styles.detailsItemStack}>
              <strong>Email:</strong> {staff.email || "—"}
            </li>
            <li className={styles.detailsItemStack}>
              <strong>Username:</strong> {staff.username || "—"}
            </li>
          </ul>
        )}
      </section>

      <ConfirmModal
        open={isDeleteModalOpen}
        title="Delete Staff"
        message={`Are you sure you want to delete '${staff.name}'? This action cannot be undone.`}
        confirmText="Delete Staff"
        onConfirm={() => {
          setDeleteModalOpen(false);
          handleDelete();
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </section>

  );

}


