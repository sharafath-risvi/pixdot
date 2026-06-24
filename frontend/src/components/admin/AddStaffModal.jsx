import { useEffect, useState } from "react";
import styles from "./Admin.module.css";

const emptyStaff = {
  name: "",
  role: "",
  salary: "",
  phone: "",
  email: "",
  username: "",
  password: "123456",
  profileImage: "",
};

export default function AddStaffModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyStaff);

  useEffect(() => {
    if (open) setForm(emptyStaff);
  }, [open]);

  if (!open) return null;

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.cardTitle}>Add Staff</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <input className={styles.input} placeholder="Name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
            <input className={styles.input} placeholder="Role/Position" value={form.role} onChange={(e) => handleChange("role", e.target.value)} />
            <input className={styles.input} placeholder="Salary" value={form.salary} onChange={(e) => handleChange("salary", e.target.value)} />
            <input className={styles.input} placeholder="Phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            <input className={styles.input} placeholder="Email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            <input className={styles.input} placeholder="Username (for staff login)" value={form.username} onChange={(e) => handleChange("username", e.target.value)} />
            <input className={styles.input} placeholder="Password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.buttonGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.buttonPrimary}>Add Staff</button>
          </div>
        </form>
      </div>
    </div>
  );
}
