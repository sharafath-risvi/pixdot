import { FaArrowRightFromBracket } from "react-icons/fa6";
import styles from "./Admin.module.css";

export default function Navbar({ onLogout }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <h1 className={styles.topbarTitle}>Admin Dashboard</h1>
        <p className={styles.muted}>Manage your agency workspace</p>
      </div>

      <div className={styles.topbarActions}>
        <button type="button" className={styles.adminLogoutBtn} onClick={onLogout}>
          <FaArrowRightFromBracket aria-hidden />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
