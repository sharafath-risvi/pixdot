export function getMonthDays(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getDateKey(date, day) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${day}`;
}

export function formatMonthLabel(date) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

/** Weekday name for a given year/month/day (month is 0-based Date month or pass Date) */
export function getWeekdayName(dateOrYear, monthMaybe, dayMaybe) {
  let d;
  if (dateOrYear instanceof Date) {
    d = dateOrYear;
  } else {
    d = new Date(dateOrYear, monthMaybe, dayMaybe);
  }
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

export function getWeekdayShort(dateOrYear, monthMaybe, dayMaybe) {
  let d;
  if (dateOrYear instanceof Date) {
    d = dateOrYear;
  } else {
    d = new Date(dateOrYear, monthMaybe, dayMaybe);
  }
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

/** Parse frontend dateKey "YYYY-M-D" into Date */
export function parseDateKey(dateKey) {
  const parts = String(dateKey || "").split("-").map(Number);
  if (parts.length !== 3) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function toIsoDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function monthQueryParam(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

