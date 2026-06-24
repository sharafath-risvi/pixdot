import { useEffect, useState } from "react";
import { FiSave, FiX } from "react-icons/fi";
import styles from "./Admin.module.css";

function staffFormFromRecord(staff) {
  return {
    name: staff.name || "",
    role: staff.role || "",
    salary: staff.salary || "",
    phone: staff.phone || "",
    email: staff.email || "",
    username: staff.username || "",
    password: staff.password || "123456",
    profileImage: staff.profileImage || "",
  };
}

export default function StaffEditForm({ staff, onSave, onCancel }) {
  const [form, setForm] = useState(() => staffFormFromRecord(staff));

  useEffect(() => {
    setForm(staffFormFromRecord(staff));
  }, [staff]);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    onSave({
      name: form.name.trim(),
      role: form.role.trim(),
      salary: form.salary.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      username: form.username.trim(),
      password: form.password || "123456",
      profileImage: form.profileImage.trim(),
    });
  };

  return (
    <form className={styles.profileEditForm} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Full name</span>
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </label>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Role / position</span>
          <input
            className={styles.input}
            value={form.role}
            onChange={(e) => handleChange("role", e.target.value)}
          />
        </label>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Salary</span>
          <input
            className={styles.input}
            value={form.salary}
            onChange={(e) => handleChange("salary", e.target.value)}
            placeholder="₹35,000"
          />
        </label>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Phone</span>
          <input
            className={styles.input}
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </label>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Email</span>
          <input
            className={styles.input}
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </label>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Login username</span>
          <input
            className={styles.input}
            value={form.username}
            onChange={(e) => handleChange("username", e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Login password</span>
          <input
            className={styles.input}
            type="text"
            value={form.password}
            onChange={(e) => handleChange("password", e.target.value)}
            autoComplete="new-password"
          />
        </label>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Profile image URL</span>
          <input
            className={styles.input}
            value={form.profileImage}
            onChange={(e) => handleChange("profileImage", e.target.value)}
            placeholder="https://…"
          />
        </label>
      </div>

      <div className={styles.profileEditActions}>
        <button type="button" className={styles.buttonGhost} onClick={onCancel}>
          <FiX aria-hidden />
          Cancel
        </button>
        <button type="submit" className={styles.buttonPrimary}>
          <FiSave aria-hidden />
          Save changes
        </button>
      </div>
    </form>
  );
}
