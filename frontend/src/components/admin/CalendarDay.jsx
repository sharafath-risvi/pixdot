import styles from "./Admin.module.css";

function getStatusClass(status) {
  if (status === "completed") return styles.dayCompleted;
  if (status === "issue") return styles.dayIssue;
  return styles.dayPending;
}

export default function CalendarDay({
  day,
  items,
  onAdd,
  onToggleComplete,
  onEditItem,
  onDeleteItem,
  onViewNote,
  readOnly = false,
}) {
  return (
    <div className={styles.calendarDay}>
      <div className={styles.calendarDayTop}>
        <span className={styles.dayNumber}>{day}</span>
        {readOnly ? null : (
          <button type="button" className={styles.miniBtn} onClick={onAdd}>
            +
          </button>
        )}
      </div>
      <div className={styles.dayItems}>
        {items.map((item) => (
          <div key={item.id} className={`${styles.dayItem} ${getStatusClass(item.status)}`}>
            <div className={styles.row}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <input
                  type="checkbox"
                  checked={item.completed}
                  disabled={readOnly}
                  onChange={() => !readOnly && onToggleComplete(item.id)}
                />
                <span>{item.kind}</span>
              </label>
              <strong>{item.subtype}</strong>
            </div>
            <div className={styles.itemActions}>
              {(item.reasonNote && item.status === "pending" || item.contentPlan) && (
                <button type="button" className={styles.tinyAction} onClick={() => onViewNote(item)}>
                  {item.contentPlan ? "View details" : "View note"}
                </button>
              )}
              {readOnly ? null : (
                <>
                  <button type="button" className={styles.tinyAction} onClick={() => onEditItem(item.id)}>
                    Edit
                  </button>
                  <button type="button" className={styles.tinyAction} onClick={() => onDeleteItem(item.id)}>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
