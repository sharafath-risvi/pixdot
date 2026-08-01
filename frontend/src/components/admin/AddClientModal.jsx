import { useEffect, useState } from "react";
import {
  buildClientServicesPayload,
  buildServiceConfigFromClient,
} from "../../lib/clientServices.js";
import styles from "./Admin.module.css";

const emptyClient = {
  name: "",
  logo: "",
  businessType: "",
  servicesSelected: [],
  gstNumber: "",
  phone: "",
  email: "",
  address: "",
  username: "",
  password: "",
  coreValues: "",
};

export default function AddClientModal({ open, onClose, onSubmit, servicePriceSettings }) {
  const [form, setForm] = useState(emptyClient);
  const [serviceConfig, setServiceConfig] = useState({});
  const safeServicePriceSettings = Array.isArray(servicePriceSettings) ? servicePriceSettings : [];
  const [logoStatus, setLogoStatus] = useState("idle");

  useEffect(() => {
    if (!open) return;
    setForm(emptyClient);
    setLogoStatus("idle");
    setServiceConfig(
      Object.fromEntries(
        safeServicePriceSettings.map((item) => [
          item.serviceName,
          { currentPrice: item.price, nextMonthPrice: "" },
        ]),
      ),
    );
  }, [open, safeServicePriceSettings]);

  useEffect(() => {
    const url = form.logo.trim();
    if (!url) {
      setLogoStatus("idle");
      return;
    }

    const validateImage = async (testUrl) => {
      try {
        const parsed = new URL(testUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          setLogoStatus("error");
          return;
        }
      } catch {
        setLogoStatus("error");
        return;
      }

      setLogoStatus("loading");

      // 1. Check using Image object
      const isLoadable = await new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = testUrl;
      });

      if (isLoadable) {
        setLogoStatus("success");
        return;
      }

      // 2. Try fetching HEAD to verify Content-Type
      try {
        const res = await fetch(testUrl, { method: "HEAD" });
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.startsWith("image/")) {
          setLogoStatus("success");
          return;
        }
      } catch (err) {
        // Fetch failed (likely CORS)
      }

      // 3. Fallback to known extensions
      if (/\.(jpeg|jpg|png|webp|gif|svg|avif)(\?.*)?$/i.test(testUrl)) {
        setLogoStatus("success");
        return;
      }

      // 4. Otherwise, it is invalid or not an image
      setLogoStatus("error");
    };

    validateImage(url);
  }, [form.logo]);

  if (!open) return null;

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (form.logo.trim() && logoStatus === "error") return;

    const services = buildClientServicesPayload(form.servicesSelected, serviceConfig);

    onSubmit({
      name: form.name.trim(),
      logo: form.logo.trim() || "https://via.placeholder.com/80x80.png?text=Logo",
      businessType: form.businessType.trim(),
      gstNumber: form.gstNumber.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      coreValues: form.coreValues.trim(),
      portalUsername: form.username.trim(),
      portalPassword: form.password.trim() || "123456",
      services,
      totalAmount: services.reduce((sum, item) => sum + item.currentPrice, 0),
    });
    onClose();
  };

  const toggleService = (serviceName) => {
    setForm((prev) => ({
      ...prev,
      servicesSelected: prev.servicesSelected.includes(serviceName)
        ? prev.servicesSelected.filter((item) => item !== serviceName)
        : [...prev.servicesSelected, serviceName],
    }));
  };

  const selectedTotal = form.servicesSelected.reduce(
    (sum, serviceName) => sum + Number(serviceConfig[serviceName]?.currentPrice || 0),
    0,
  );

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.cardTitle}>Add Client</h3>
        <p className={styles.cardSub}>Fill all required client onboarding details.</p>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <input className={styles.input} placeholder="Client Name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
            <div>
              <input className={styles.input} placeholder="Logo URL (or dummy)" value={form.logo} onChange={(e) => handleChange("logo", e.target.value)} />
              {form.logo.trim() && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {logoStatus === "success" && (
                    <img 
                      src={form.logo.trim()} 
                      alt="Logo preview" 
                      style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                  )}
                  {logoStatus === "error" && (
                    <p style={{ margin: 0, color: '#b91c1c', fontSize: '12px', fontWeight: '600' }}>
                      Please enter a valid direct image URL (must point directly to the image).
                    </p>
                  )}
                </div>
              )}
            </div>
            <input className={styles.input} placeholder="Business Type" value={form.businessType} onChange={(e) => handleChange("businessType", e.target.value)} />
            <input className={styles.input} placeholder="GST Number" value={form.gstNumber} onChange={(e) => handleChange("gstNumber", e.target.value)} />
            <input className={styles.input} placeholder="Phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            <input className={styles.input} placeholder="Email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            <input className={styles.input} placeholder="Username" value={form.username} onChange={(e) => handleChange("username", e.target.value)} />
            <input className={styles.input} placeholder="Password" value={form.password} onChange={(e) => handleChange("password", e.target.value)} />
          </div>
          <div className={styles.noteGroup}>
            <p className={styles.cardSub}>Select Services (auto-filled with global base price)</p>
            <div className={styles.detailsListStack}>
              {safeServicePriceSettings.map((item) => {
                const selected = form.servicesSelected.includes(item.serviceName);
                return (
                  <div key={item.serviceName} className={styles.detailsItemStack}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleService(item.serviceName)}
                      />
                      <strong>{item.serviceName}</strong>
                    </label>
                    {selected && (
                      <div className={styles.formGrid}>
                        <input
                          className={styles.input}
                          type="number"
                          min="0"
                          value={serviceConfig[item.serviceName]?.currentPrice ?? item.price}
                          onChange={(e) =>
                            setServiceConfig((prev) => ({
                              ...prev,
                              [item.serviceName]: {
                                ...prev[item.serviceName],
                                currentPrice: Number(e.target.value || 0),
                              },
                            }))
                          }
                          placeholder="Current price"
                        />
                        <input
                          className={styles.input}
                          type="number"
                          min="0"
                          value={serviceConfig[item.serviceName]?.nextMonthPrice ?? ""}
                          onChange={(e) =>
                            setServiceConfig((prev) => ({
                              ...prev,
                              [item.serviceName]: {
                                ...prev[item.serviceName],
                                nextMonthPrice: e.target.value,
                              },
                            }))
                          }
                          placeholder="Next month price (optional)"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className={styles.cardSub}>Total Amount: Rs. {selectedTotal.toLocaleString("en-IN")}</p>
          </div>
          <textarea className={styles.textarea} placeholder="Address" value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
          <textarea className={styles.textarea} placeholder="Core values" value={form.coreValues} onChange={(e) => handleChange("coreValues", e.target.value)} />
          <div className={styles.modalActions}>
            <button type="button" className={styles.buttonGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.buttonPrimary} disabled={logoStatus === "error"}>Add Client</button>
          </div>
        </form>
      </div>
    </div>
  );
}
