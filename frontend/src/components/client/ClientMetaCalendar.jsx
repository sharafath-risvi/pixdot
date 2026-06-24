import { useEffect, useState } from "react";
import MetaAdsCalendar from "../admin/MetaAdsCalendar.jsx";
import styles from "./Client.module.css";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ClientMetaCalendar() {
  const { clientId } = useAuth();
  const [store, setStore] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendar = async () => {
      if (!clientId) return;
      try {
        const api = (await import("../../lib/api.js")).default;
        const res = await api.get(`/clients/${clientId}/calendar/meta`);
        setStore(res.data.data);
      } catch (err) {
        console.error("Failed to fetch calendar", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [clientId]);

  if (loading) return (
    <div className="dash-empty-container">
       <div className="dash-skeleton" style={{ width: "48px", height: "48px", borderRadius: "8px", marginBottom: "16px" }} />
       <div className="dash-skeleton" style={{ width: "160px", height: "16px", marginBottom: "8px" }} />
       <div className="dash-skeleton" style={{ width: "220px", height: "12px" }} />
    </div>
  );

  return (
    <>
      <div className={styles.clientReadonlyBanner}>View only — ad campaigns are managed by your team.</div>
      <MetaAdsCalendar
        title="Meta ads calendar"
        store={store}
        readOnly
      />
    </>
  );
}
