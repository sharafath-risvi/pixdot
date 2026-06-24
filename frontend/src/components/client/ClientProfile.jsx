import { useEffect, useState } from "react";
import { useClientPersonal } from "../../context/ClientPersonalContext.jsx";
import { formatInr } from "../../lib/format.js";
import api from "../../lib/api.js";
import styles from "./Client.module.css";

export default function ClientProfile() {
  const { currentClient } = useClientPersonal();
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    if (!currentClient) return;
    const fetchServices = async () => {
      try {
        const res = await api.get("/api/services");
        if (res.data.success) {
          setServices(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load services", err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [currentClient]);

  if (!currentClient) {
    return (
      <section className={styles.clientPanel}>
        <h2 className={styles.clientPanelTitle}>Company profile</h2>
        <p className={styles.clientPanelSub}>We could not load your company. Please sign in again.</p>
      </section>
    );
  }

  return (
    <section className={styles.clientPanel}>
      <h2 className={styles.clientPanelTitle}>Company profile</h2>
      <p className={styles.clientPanelSub}>Read-only overview of your account with us.</p>

      <div className={styles.clientProfileHero}>
        {currentClient.logo ? <img src={currentClient.logo} alt="" className={styles.clientProfileLogo} /> : null}
        <div>
          <h3 className={styles.clientProfileName}>{currentClient.name}</h3>
          <p className={styles.clientProfileType}>{currentClient.businessType}</p>
        </div>
      </div>

      <dl className={styles.clientDetailGrid}>
        <div className={styles.clientDetailRow}>
          <dt>Core values</dt>
          <dd>{currentClient.coreValues || "—"}</dd>
        </div>
        <div className={styles.clientDetailRow}>
          <dt>Email</dt>
          <dd>{currentClient.email || "—"}</dd>
        </div>
        <div className={styles.clientDetailRow}>
          <dt>Phone</dt>
          <dd>{currentClient.phone || "—"}</dd>
        </div>
        <div className={styles.clientDetailRow}>
          <dt>Address</dt>
          <dd>{currentClient.address || "—"}</dd>
        </div>
        <div className={styles.clientDetailRow}>
          <dt>GST</dt>
          <dd>{currentClient.gstNumber || "—"}</dd>
        </div>
      </dl>

      <div style={{ marginTop: "32px", borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "16px" }}>Your Services</h3>
        {loadingServices ? (
          <p style={{ color: "#64748b", fontSize: "14px" }}>Loading services...</p>
        ) : services.length === 0 ? (
          <p style={{ color: "#64748b", fontSize: "14px" }}>No services assigned yet.</p>
        ) : (
          <div style={{ overflowX: "auto", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead style={{ background: "#f8fafc", textAlign: "left", color: "#64748b" }}>
                <tr>
                  <th style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0" }}>Service</th>
                  <th style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0" }}>Description</th>
                  <th style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0" }}>Status</th>
                  <th style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0" }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px 16px", fontWeight: "500", color: "#0f172a" }}>
                      {svc.serviceName}
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{svc.category}</div>
                    </td>
                    <td style={{ padding: "10px 16px", color: "#475569" }}>
                      {svc.description || "—"}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ padding: "4px 8px", borderRadius: "999px", fontSize: "12px", fontWeight: "600", background: svc.status === "Active" ? "#dcfce7" : "#f1f5f9", color: svc.status === "Active" ? "#166534" : "#475569" }}>
                        {svc.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", color: "#334155", fontWeight: "600" }}>
                      {formatInr(svc.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
