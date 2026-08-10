import { useMemo, useState } from "react";
import AddContentModal from "./AddContentModal.jsx";
import CalendarDay from "./CalendarDay.jsx";
import CalendarMonthNav from "./CalendarMonthNav.jsx";
import StatusLegend from "../shared/StatusLegend.jsx";
import styles from "./Admin.module.css";
import { formatMonthLabel, getDateKey, getMonthDays, getWeekdayShort } from "../../lib/calendar.js";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Calendar({ title, store, onAdd, onUpdate, onDelete, readOnly = false }) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [viewNoteItem, setViewNoteItem] = useState(null);

  const days = getMonthDays(monthDate);
  const monthLabel = formatMonthLabel(monthDate);

  // JS getDay(): 0 = Sunday … 6 = Saturday — pad empty cells so dates align under weekday headers
  const startWeekday = useMemo(
    () => new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay(),
    [monthDate],
  );

  const openAdd = (day) => {
    setActiveDay(day);
    setEditItem(null);
    setModalOpen(true);
  };

  const handleSubmit = (payload) => {
    if (!activeDay) return;
    const key = getDateKey(monthDate, activeDay);

    if (editItem) {
      if (onUpdate) onUpdate(editItem.id, { ...payload, dateKey: key });
      return;
    }

    if (onAdd) onAdd({ ...payload, dateKey: key });
  };

  const withDayItems = (day) => store[getDateKey(monthDate, day)] || [];

  const dayLabelFor = (day) => {
    const weekday = getWeekdayShort(monthDate.getFullYear(), monthDate.getMonth(), day);
    return `${day} ${weekday} ${monthLabel}`;
  };

  return (
    <section className={styles.card}>
      <div className={styles.calendarHeader}>
        <div>
          <h2 className={styles.cardTitle}>{title}</h2>
          <p className={styles.cardSub}>
            {readOnly ? "View only — updates from your team appear here." : "Interactive monthly planner with status colors"}
          </p>
        </div>
        <CalendarMonthNav monthDate={monthDate} onMonthDateChange={setMonthDate} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <StatusLegend compact />
      </div>

      <div className={styles.calendarGrid} role="grid" aria-label={`${monthLabel} calendar`}>
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className={styles.calendarWeekdayHead} role="columnheader">
            {label}
          </div>
        ))}

        {Array.from({ length: startWeekday }, (_, i) => (
          <div key={`pad-${i}`} className={styles.calendarDayEmpty} aria-hidden />
        ))}

        {Array.from({ length: days }, (_, i) => i + 1).map((day) => (
          <CalendarDay
            key={day}
            day={day}
            weekday={getWeekdayShort(monthDate.getFullYear(), monthDate.getMonth(), day)}
            items={withDayItems(day)}
            readOnly={readOnly}
            onAdd={() => openAdd(day)}
            onToggleComplete={(itemId) => {
              const target = withDayItems(day).find((item) => item.id === itemId);
              if (!target || !onUpdate) return;
              onUpdate(itemId, {
                completed: !target.completed,
                status: !target.completed ? "completed" : "pending",
              });
            }}
            onEditItem={(itemId) => {
              const target = withDayItems(day).find((item) => item.id === itemId);
              if (!target) return;
              setActiveDay(day);
              setEditItem(target);
              setModalOpen(true);
            }}
            onDeleteItem={(itemId) => {
              if (onDelete) onDelete(itemId);
            }}
            onViewNote={(item) => setViewNoteItem(item)}
          />
        ))}
      </div>

      {!readOnly ? (
        <AddContentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          initialValue={editItem}
          dayLabel={activeDay ? dayLabelFor(activeDay) : ""}
        />
      ) : null}
      {viewNoteItem && (
        <div className={styles.modalBackdrop} onClick={() => setViewNoteItem(null)}>
          <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.cardTitle}>Item Details</h3>
            <p className={styles.cardSub}>
              {viewNoteItem.kind} - {viewNoteItem.subtype}
            </p>
            {viewNoteItem.status === "pending" && viewNoteItem.reasonNote && (
              <>
                <h4 style={{ fontSize: "14px", marginTop: "12px", marginBottom: "4px" }}>Pending Reason</h4>
                <div className={styles.notePreview}>{viewNoteItem.reasonNote}</div>
              </>
            )}
            {viewNoteItem.contentPlan && (
              <>
                <h4 style={{ fontSize: "14px", marginTop: "12px", marginBottom: "4px" }}>Content Plan</h4>
                <div className={styles.notePreview} style={{ whiteSpace: "pre-wrap" }}>{viewNoteItem.contentPlan}</div>
              </>
            )}
            <div className={styles.modalActions}>
              <button type="button" className={styles.buttonPrimary} onClick={() => setViewNoteItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
