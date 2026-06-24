export function getMonthDays(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function getDateKey(date, day) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${day}`;
}

export function formatMonthLabel(date) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}
