import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FiSave } from "react-icons/fi";
import { useStaffPersonal } from "../context/StaffPersonalContext.jsx";
import adminStyles from "../components/admin/Admin.module.css";
import staffStyles from "../components/staff/Staff.module.css";

function avatarFallback(name) {
  const parts = String(name || "?")
    .trim()
    .split(/\s+/);
  const a = parts[0]?.[0] || "?";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

export default function StaffProfilePage() {
  const { currentStaff, showSalary, updateMyProfile } = useStaffPersonal();
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentStaff) return;
    setPhone(currentStaff.phone ?? "");
    setProfileImage(currentStaff.profileImage ?? "");
    setSaved(false);
  }, [currentStaff]);

  if (!currentStaff) {
    return (
      <section className={adminStyles.adminPageSection}>
        <p className={adminStyles.emptyText}>We could not load your staff account. Please log out and sign in again.</p>
        <NavLink to="/staff/clients" className={adminStyles.backLink}>
          ← Back to clients
        </NavLink>
      </section>
    );
  }

  const handleSave = (e) => {
    e.preventDefault();
    if (currentStaff.isVirtual) return;
    const ok = updateMyProfile({ phone, profileImage });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const img = profileImage?.trim();
  const readOnly = currentStaff.isVirtual;

  return (
    <section className={adminStyles.adminPageSection}>
      <nav className={adminStyles.adminBreadcrumb} aria-label="Breadcrumb">
        <NavLink to="/staff/clients">Staff</NavLink>
        <span>/</span>
        <span className={adminStyles.adminBreadcrumbCurrent}>Profile</span>
      </nav>

      <div className={adminStyles.detailHeader}>
        {img ? (
          <img src={img} alt="" className={adminStyles.detailHeaderLogo} />
        ) : (
          <div className={adminStyles.teamCardAvatar} style={{ width: 72, height: 72, fontSize: 28 }}>
            {avatarFallback(currentStaff.name)}
          </div>
        )}
        <div>
          <h1 className={adminStyles.detailHeaderTitle}>{currentStaff.name}</h1>
          <p className={adminStyles.detailHeaderSub}>{currentStaff.role || "Staff member"}</p>
        </div>
      </div>

      <section className={adminStyles.modernCard}>
        <ul className={adminStyles.detailsListStack}>
          <li className={adminStyles.detailsItemStack}>
            <strong>Email:</strong> {currentStaff.email || "—"}
          </li>
          <li className={adminStyles.detailsItemStack}>
            <strong>Phone:</strong>{" "}
            {readOnly ? (
              currentStaff.phone || "—"
            ) : (
              <input
                className={staffStyles.staffInput}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            )}
          </li>
          <li className={adminStyles.detailsItemStack}>
            <strong>Role:</strong> {currentStaff.role || "—"}
          </li>
          {showSalary ? (
            <li className={adminStyles.detailsItemStack}>
              <strong>Salary:</strong> {currentStaff.salary || "—"}
            </li>
          ) : null}
          <li className={adminStyles.detailsItemStack}>
            <strong>Profile image URL:</strong>{" "}
            {readOnly ? (
              currentStaff.profileImage || "—"
            ) : (
              <input
                className={staffStyles.staffInput}
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                placeholder="https://…"
              />
            )}
          </li>
        </ul>

        {readOnly ? (
          <p className={staffStyles.staffProfileVirtual}>
            This login is not linked to a full staff record yet. Ask an admin to add you in Team with the same username.
          </p>
        ) : (
          <form onSubmit={handleSave} className={staffStyles.staffProfileFormActions}>
            <button type="submit" className={staffStyles.staffBtnPrimary}>
              <FiSave aria-hidden />
              Save phone and image
            </button>
            {saved ? <span className={staffStyles.staffSavedPill}>Saved</span> : null}
          </form>
        )}
      </section>

      <Link to="/staff/clients" className={adminStyles.backLink}>
        ← Back to clients
      </Link>
    </section>
  );
}
