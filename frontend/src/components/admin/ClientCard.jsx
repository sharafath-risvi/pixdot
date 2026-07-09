import { FaCalendarDays, FaEye, FaPen } from "react-icons/fa6";
import { normalizeServiceName, serviceLabel } from "../../lib/agencyServices.js";
import styles from "./Admin.module.css";

function progressFromServices(services = []) {
  if (!services || !services.length) return 0;
  const totalProgress = services.reduce((sum, s) => sum + (Number(s?.progress) || 0), 0);
  return Math.round(totalProgress / services.length);
}

export default function ClientCard({ client, onClick, onViewDetails, onEdit, onOpenCalendar }) {
  const serviceNames = (client.services || [])
    .map((s) => normalizeServiceName(serviceLabel(s)))
    .filter(Boolean);
  const progress = progressFromServices(client.services);

  return (
    <article
      role="button"
      tabIndex={0}
      className={styles.premiumClientCard}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.premiumClientHead}>
        {client.logo ? <img src={client.logo} alt="" className={styles.premiumLogo} /> : null}
        <div className={styles.premiumClientMeta}>
          <h3 className={styles.premiumClientName}>{client.name}</h3>
          <p className={styles.premiumClientType}>{client.businessType}</p>
        </div>
        <span className={styles.statusBadge}>In progress</span>
      </div>

      <div className={styles.progressRow}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.progressPct}>{progress}%</span>
      </div>

      <div className={styles.serviceTags}>
        {serviceNames.slice(0, 4).map((name, i) => (
          <span key={`${name}-${i}`} className={styles.serviceTag}>
            {name}
          </span>
        ))}
        {serviceNames.length > 4 ? (
          <span className={styles.serviceTagMuted}>+{serviceNames.length - 4}</span>
        ) : null}
      </div>

      <p className={styles.premiumClientValues}>Core: {client.coreValues}</p>

      <div className={styles.premiumClientActions}>
        <button
          type="button"
          className={styles.cardActionBtn}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.();
          }}
        >
          <FaEye aria-hidden />
          View
        </button>
        {onEdit && (
          <button
            type="button"
            className={styles.cardActionBtn}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <FaPen aria-hidden />
            Edit
          </button>
        )}
        <button
          type="button"
          className={styles.cardActionBtnPrimary}
          onClick={(e) => {
            e.stopPropagation();
            onOpenCalendar?.();
          }}
        >
          <FaCalendarDays aria-hidden />
          Calendar
        </button>
      </div>
    </article>
  );
}
