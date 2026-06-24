import { useEffect, useState } from "react";
import { FaUserTie, FaUsers } from "react-icons/fa6";
import styles from "../../components/admin/Admin.module.css";
import api from "../../lib/api.js";

export default function AdminOverviewPage() {
  const [clientCount, setClientCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [clientsRes, staffRes] = await Promise.all([
          api.get("/clients"),
          api.get("/staff")
        ]);
        
        setClientCount(clientsRes.data.data.length);
        setStaffCount(staffRes.data.data.length);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <section className={styles.adminPageSection}>
        <div className={styles.welcomeCard}>
          <h1 className={styles.welcomeTitle}>Welcome, Admin</h1>
          <div className="dash-skeleton" style={{ width: "240px", height: "16px", marginTop: "8px" }} />
        </div>

        <div className={styles.miniStatsGrid}>
          {[1, 2].map((i) => (
            <article key={i} className={styles.miniStatCard}>
              <div className={styles.dashboardStatIcon}>
                <div className="dash-skeleton" style={{ width: "100%", height: "100%", borderRadius: "10px" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div className="dash-skeleton" style={{ width: "80px", height: "12px", marginBottom: "8px" }} />
                <div className="dash-skeleton" style={{ width: "32px", height: "24px" }} />
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.adminPageSection}>
        <div className={styles.welcomeCard}>
          <h1 className={styles.welcomeTitle}>Error</h1>
          <p className={styles.welcomeSub} style={{ color: "var(--color-danger)" }}>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.adminPageSection}>
      <div className={styles.welcomeCard}>
        <h1 className={styles.welcomeTitle}>Welcome, Admin</h1>
        <p className={styles.welcomeSub}>
          Your agency workspace is ready. Use the menu to manage services, clients, and team members.
        </p>
      </div>

      <div className={styles.miniStatsGrid}>
        <article className={styles.miniStatCard}>
          <div className={styles.dashboardStatIcon}>
            <FaUsers />
          </div>
          <div>
            <p>Total clients</p>
            <h2>{clientCount}</h2>
          </div>
        </article>
        <article className={styles.miniStatCard}>
          <div className={styles.dashboardStatIcon}>
            <FaUserTie />
          </div>
          <div>
            <p>Team members</p>
            <h2>{staffCount}</h2>
          </div>
        </article>
      </div>
    </section>
  );
}
