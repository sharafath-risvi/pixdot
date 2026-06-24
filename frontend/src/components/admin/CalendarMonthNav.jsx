import { useMemo } from "react";
import styles from "./Admin.module.css";

const MONTHS = Array.from({ length: 12 }, (_, i) => i);
const YEARS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

export default function CalendarMonthNav({ monthDate, onMonthDateChange }) {
  const monthLabel = useMemo(
    () => monthDate.toLocaleString("en-US", { month: "long", year: "numeric" }),
    [monthDate],
  );

  const shiftMonth = (delta) => {
    onMonthDateChange(new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1));
  };

  return (
    <div className={styles.calendarMonthNav}>
      <div className={styles.calendarMonthNavRow}>
        <button
          type="button"
          className={styles.calendarNavBtn}
          onClick={() => shiftMonth(-1)}
          aria-label="Previous month"
        >
          ◀
        </button>

        <strong className={styles.calendarMonthLabel}>{monthLabel}</strong>

        <div className={styles.calendarMonthPickers}>
          <select
            className={styles.calendarNavSelect}
            value={monthDate.getMonth()}
            onChange={(e) => onMonthDateChange(new Date(monthDate.getFullYear(), Number(e.target.value), 1))}
            aria-label="Select month"
          >
            {MONTHS.map((monthIndex) => (
              <option key={monthIndex} value={monthIndex}>
                {new Date(2000, monthIndex, 1).toLocaleString("en-US", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            className={styles.calendarNavSelect}
            value={monthDate.getFullYear()}
            onChange={(e) => onMonthDateChange(new Date(Number(e.target.value), monthDate.getMonth(), 1))}
            aria-label="Select year"
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={styles.calendarNavBtn}
          onClick={() => shiftMonth(1)}
          aria-label="Next month"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
