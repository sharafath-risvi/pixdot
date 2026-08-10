import { useEffect, useState } from "react";
import { FiEdit2, FiEye, FiTrash2, FiX } from "react-icons/fi";
import styles from "./Admin.module.css";
import {
  getStatusBorderColor,
  getStatusColor,
  getStatusLabel,
  normalizeStatus,
} from "../../lib/contentStatus.js";

<<<<<<< HEAD
const VISIBLE_LIMIT = 2;

function ContentCard({ item, readOnly, onToggleComplete, onEditItem, onDeleteItem, onViewNote }) {
  const status = normalizeStatus(item.status);
  const hasDetails = Boolean((item.reasonNote && status === "pending") || item.contentPlan);

  return (
    <article
      className={styles.contentCard}
      style={{ borderLeftColor: getStatusBorderColor(status) }}
    >
      <div className={styles.contentCardHead}>
        <span className={styles.contentCardKind}>{item.kind || "Content"}</span>
        {!readOnly ? (
          <label
            className={styles.contentCardCheck}
            title={item.completed ? "Mark incomplete" : "Mark complete"}
          >
            <input
              type="checkbox"
              checked={Boolean(item.completed)}
              onChange={() => onToggleComplete(item.id)}
              aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
            />
          </label>
        ) : item.completed ? (
          <span className={styles.contentCardDone} aria-label="Completed">
            ✓
          </span>
        ) : null}
      </div>

      <h4 className={styles.contentCardTitle}>{item.subtype || item.kind || "Untitled"}</h4>

      <span
        className={styles.contentStatusBadge}
        style={{
          background: getStatusColor(status),
          borderColor: getStatusBorderColor(status),
        }}
      >
        {getStatusLabel(status)}
      </span>

      <div className={styles.contentCardActions}>
        {hasDetails ? (
          <button
            type="button"
            className={styles.contentIconBtn}
            title="View details"
            aria-label="View details"
            onClick={() => onViewNote(item)}
          >
            <FiEye strokeWidth={2} />
          </button>
        ) : null}
        {readOnly ? null : (
          <>
            <button
              type="button"
              className={styles.contentIconBtn}
              title="Edit content"
              aria-label="Edit content"
              onClick={() => onEditItem(item.id)}
            >
              <FiEdit2 strokeWidth={2} />
            </button>
            <button
              type="button"
              className={`${styles.contentIconBtn} ${styles.contentIconBtnDanger}`}
              title="Delete content"
              aria-label="Delete content"
              onClick={() => onDeleteItem(item.id)}
            >
              <FiTrash2 strokeWidth={2} />
            </button>
          </>
        )}
      </div>
    </article>
  );
=======
function getStatusClass(status) {
  if (status === "completed") return styles.dayCompleted;
  if (status === "issue") return styles.dayIssue;
  if (status === "waiting_approval") return styles.dayWaitingApproval;
  if (status === "approval_received") return styles.dayApprovalReceived;
  return styles.dayPending;
>>>>>>> 97d7b749ef59fdbc17a9e0482abb68eee0399456
}

export default function CalendarDay({
  day,
  weekday,
  items,
  onAdd,
  onToggleComplete,
  onEditItem,
  onDeleteItem,
  onViewNote,
  readOnly = false,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const visible = items.slice(0, VISIBLE_LIMIT);
  const hiddenCount = Math.max(0, items.length - VISIBLE_LIMIT);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const handleEdit = (id) => {
    setMoreOpen(false);
    onEditItem(id);
  };

  const handleDelete = (id) => {
    setMoreOpen(false);
    onDeleteItem(id);
  };

  const handleView = (item) => {
    setMoreOpen(false);
    onViewNote(item);
  };

  return (
    <div className={styles.calendarDay}>
      <div className={styles.calendarDayTop}>
        <div className={styles.dayLabelBlock}>
          <span className={styles.dayNumber}>{day}</span>
          {weekday ? <span className={styles.dayWeekday}>{weekday}</span> : null}
        </div>
        {readOnly ? null : (
          <button
            type="button"
            className={styles.miniBtn}
            onClick={onAdd}
            aria-label="Add content"
            title="Add content"
          >
            +
          </button>
        )}
      </div>

      <div className={styles.dayItems}>
        {visible.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            readOnly={readOnly}
            onToggleComplete={onToggleComplete}
            onEditItem={onEditItem}
            onDeleteItem={onDeleteItem}
            onViewNote={onViewNote}
          />
        ))}

        {hiddenCount > 0 ? (
          <button type="button" className={styles.moreItemsBtn} onClick={() => setMoreOpen(true)}>
            + {hiddenCount} more
          </button>
        ) : null}
      </div>

      {moreOpen ? (
        <div className={styles.moreModalBackdrop} onClick={() => setMoreOpen(false)}>
          <div
            className={styles.moreModal}
            role="dialog"
            aria-modal="true"
            aria-label={`All content for day ${day}${weekday ? ` ${weekday}` : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.moreModalHead}>
              <div>
                <strong className={styles.moreModalTitle}>
                  {day}
                  {weekday ? ` ${weekday}` : ""}
                </strong>
                <p className={styles.moreModalSub}>{items.length} content items</p>
              </div>
              <button
                type="button"
                className={styles.contentIconBtn}
                onClick={() => setMoreOpen(false)}
                aria-label="Close"
                title="Close"
              >
                <FiX strokeWidth={2} />
              </button>
            </div>
            <div className={styles.moreModalList}>
              {items.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  readOnly={readOnly}
                  onToggleComplete={onToggleComplete}
                  onEditItem={handleEdit}
                  onDeleteItem={handleDelete}
                  onViewNote={handleView}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
