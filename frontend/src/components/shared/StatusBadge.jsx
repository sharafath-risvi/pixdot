import { getStatusColor, getStatusBorderColor, getStatusLabel, normalizeStatus } from "../../lib/contentStatus.js";
import styles from "./StatusBadge.module.css";

export default function StatusBadge({ status, className = "" }) {
  const s = normalizeStatus(status);
  return (
    <span
      className={`${styles.badge} ${className}`}
      style={{
        background: getStatusColor(s),
        borderColor: getStatusBorderColor(s),
      }}
    >
      {getStatusLabel(s)}
    </span>
  );
}
