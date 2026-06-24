export function formatInr(value) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatSavedLabel(timestamp) {
  return timestamp ? `Last saved ${new Date(timestamp).toLocaleString()}` : "Not saved yet this session";
}
