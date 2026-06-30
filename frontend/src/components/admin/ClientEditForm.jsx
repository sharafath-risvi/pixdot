import { useEffect, useState } from "react";
import { FiSave, FiX } from "react-icons/fi";
import styles from "./Admin.module.css";

export default function ClientEditForm({ client, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: client?.name || "",
    logo: client?.logo || "",
    businessType: client?.businessType || "",
    gstNumber: client?.gstNumber || "",
    phone: client?.phone || "",
    email: client?.email || "",
    address: client?.address || "",
    coreValues: client?.coreValues || "",
    portalUsername: client?.portalUsername || "",
    portalPassword: client?.portalPassword || "",
  });

  const [logoStatus, setLogoStatus] = useState("idle");

  useEffect(() => {
    setForm({
      name: client?.name || "",
      logo: client?.logo || "",
      businessType: client?.businessType || "",
      gstNumber: client?.gstNumber || "",
      phone: client?.phone || "",
      email: client?.email || "",
      address: client?.address || "",
      coreValues: client?.coreValues || "",
      portalUsername: client?.portalUsername || "",
      portalPassword: client?.portalPassword || "",
    });
  }, [client]);

  useEffect(() => {
    const url = form.logo.trim();
    if (!url) {
      setLogoStatus("idle");
      return;
    }
    setLogoStatus("loading");
    const img = new window.Image();
    img.onload = () => setLogoStatus("success");
    img.onerror = () => setLogoStatus("error");
    img.src = url;
  }, [form.logo]);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (form.logo.trim() && logoStatus === "error") return;

    onSave({
      name: form.name.trim(),
      logo: form.logo.trim() || "https://via.placeholder.com/80x80.png?text=Logo",
      businessType: form.businessType.trim(),
      gstNumber: form.gstNumber.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      coreValues: form.coreValues.trim(),
      portalUsername: form.portalUsername.trim(),
      ...(form.portalPassword.trim() ? { portalPassword: form.portalPassword.trim() } : {}),
    });
  };

  return (
    <form className={styles.profileEditForm} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Client name</span>
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />
        </label>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Logo URL</span>
          <input
            className={styles.input}
            value={form.logo}
            onChange={(e) => handleChange("logo", e.target.value)}
            placeholder="https://…"
          />
          {form.logo.trim() && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logoStatus === "success" && (
                <img 
                  src={form.logo.trim()} 
                  alt="Logo preview" 
                  style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                />
              )}
              {logoStatus === "error" && (
                <p style={{ margin: 0, color: '#b91c1c', fontSize: '13px', fontWeight: '600' }}>
                  Please enter a valid direct image URL (.jpg, .jpeg, .png, .webp, etc.).
                </p>
              )}
            </div>
          )}
        </label>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Business type</span>
          <input
            className={styles.input}
            value={form.businessType}
            onChange={(e) => handleChange("businessType", e.target.value)}
          />
        </label>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>GST number</span>
          <input
            className={styles.input}
            value={form.gstNumber}
            onChange={(e) => handleChange("gstNumber", e.target.value)}
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
          <span className={styles.fieldLabel}>Portal username</span>
          <input
            className={styles.input}
            value={form.portalUsername}
            onChange={(e) => handleChange("portalUsername", e.target.value)}
            autoComplete="off"
          />
        </label>
        <label className={styles.fieldBlock}>
          <span className={styles.fieldLabel}>Portal password</span>
          <input
            className={styles.input}
            type="text"
            value={form.portalPassword}
            onChange={(e) => handleChange("portalPassword", e.target.value)}
            autoComplete="new-password"
          />
        </label>
      </div>

      <label className={styles.fieldBlock}>
        <span className={styles.fieldLabel}>Address</span>
        <textarea
          className={styles.textarea}
          value={form.address}
          onChange={(e) => handleChange("address", e.target.value)}
        />
      </label>

      <label className={styles.fieldBlock}>
        <span className={styles.fieldLabel}>Core values</span>
        <textarea
          className={styles.textarea}
          value={form.coreValues}
          onChange={(e) => handleChange("coreValues", e.target.value)}
        />
      </label>

      <div className={styles.profileEditActions}>
        <button type="button" className={styles.buttonGhost} onClick={onCancel}>
          <FiX aria-hidden />
          Cancel
        </button>
        <button type="submit" className={styles.buttonPrimary} disabled={logoStatus === "error"}>
          <FiSave aria-hidden />
          Save changes
        </button>
      </div>
    </form>
  );
}
