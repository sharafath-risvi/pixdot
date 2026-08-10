import { STATUS_OPTIONS, getStatusColor } from "../../lib/contentStatus.js";
import styles from "./StatusLegend.module.css";

export default function StatusLegend({ compact = false }) {
  return (
    <div className={`${styles.legend} ${compact ? styles.compact : ""}`} aria-label="Status legend">
      {STATUS_OPTIONS.map((opt) => (
        <span key={opt.value} className={styles.item}>
          <span className={styles.swatch} style={{ background: getStatusColor(opt.value) }} aria-hidden />
          {opt.label}
        </span>
      ))}
    </div>
  );
}
