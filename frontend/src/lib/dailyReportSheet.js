export const MAX_SHEET_ROWS = 1000;

export const PROJECT_OPTIONS = ["poster", "packaging", "thumbnail", "ai reel", "brochure"];
export const TASK_OPTIONS = [
  "social media poster",
  "packaging design",
  "thumbnail",
  "brochure",
];
export const REPORT_STATUS_OPTIONS = [
  "complete",
  "waiting for approval",
  "pending",
  "approved",
];

export const ROLE_OPTIONS = [
  { value: "designer", label: "Designer" },
  { value: "video_editor", label: "Video Editor" },
  { value: "others", label: "Others" },
];

export const FONT_FAMILIES = [
  "Arial",
  "Calibri",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Trebuchet MS",
  "Courier New",
];

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24];

export const FILL_COLORS = [
  "transparent",
  "#ffffff",
  "#fce8e6",
  "#fef7e0",
  "#e6f4ea",
  "#e8f0fe",
  "#f3e8fd",
  "#e0e0e0",
  "#fff2cc",
  "#d9ead3",
  "#cfe2f3",
  "#f4cccc",
];

export const EXTRA_COLUMNS = "KLMNOPQRSTUVWXYZ".split("");

export const DEFAULT_TEMPLATE_HEADERS = {
  A: "Date",
  B: "Client Name",
  C: "Project",
  D: "Task",
  E: "Start Time",
  F: "End Time",
  G: "Status",
  H: "Revision",
  I: "Files Shared",
  J: "Remarks",
};

export const SHEET_COLUMNS = [
  { key: "date", letter: "A", label: "Date", type: "date", width: 110 },
  { key: "clientName", letter: "B", label: "Client Name", type: "client", width: 160 },
  { key: "project", letter: "C", label: "Project", type: "project", width: 140 },
  { key: "task", letter: "D", label: "Task", type: "task", width: 170 },
  { key: "startTime", letter: "E", label: "Start Time", type: "time", width: 100 },
  { key: "endTime", letter: "F", label: "End Time", type: "time", width: 100 },
  { key: "status", letter: "G", label: "Status", type: "status", width: 150 },
  { key: "revision", letter: "H", label: "Revision", type: "text", width: 220 },
  { key: "filesShared", letter: "I", label: "Files Shared", type: "text", width: 140 },
  { key: "remarks", letter: "J", label: "Remarks", type: "text", width: 160 },
  ...EXTRA_COLUMNS.map((letter) => ({
    key: `extra_${letter}`,
    letter,
    label: "",
    type: "extra",
    width: 90,
  })),
];

export function defaultColumnWidths() {
  return Object.fromEntries(SHEET_COLUMNS.map((c) => [c.letter, c.width]));
}

export function defaultHeadersForRole(role) {
  if (role === "others") {
    return Object.fromEntries(SHEET_COLUMNS.map((c) => [c.letter, ""]));
  }
  return {
    ...Object.fromEntries(SHEET_COLUMNS.map((c) => [c.letter, ""])),
    ...DEFAULT_TEMPLATE_HEADERS,
  };
}

export function emptyCellStyle() {
  return {
    fontFamily: "Arial",
    fontSize: 12,
    background: "transparent",
  };
}

export function emptyRow() {
  return {
    id: null,
    date: "",
    dateIso: "",
    clientId: null,
    clientName: "",
    project: "",
    task: "",
    startTime: "",
    endTime: "",
    status: "",
    revision: "",
    filesShared: "",
    remarks: "",
    extras: {},
    cellStyles: {},
  };
}

export function createEmptyGrid(count = MAX_SHEET_ROWS) {
  return Array.from({ length: count }, () => emptyRow());
}

export function todayDisplayDate() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${d.getFullYear()}`;
}

export function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthKeyFromDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatMonthTab(monthKey) {
  const [y, m] = String(monthKey).split("-").map(Number);
  if (!y || !m) return monthKey;
  return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short", year: "numeric" });
}

export function shiftMonthKey(monthKey, delta) {
  const [y, m] = String(monthKey).split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKeyFromDate(d);
}

export function displayToIso(display) {
  const match = String(display || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function isoToDisplay(iso) {
  const match = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function isRowBlank(row) {
  if (!row) return true;
  const main = [
    row.date,
    row.clientName,
    row.project,
    row.task,
    row.startTime,
    row.endTime,
    row.status,
    row.revision,
    row.filesShared,
    row.remarks,
  ];
  if (main.some((v) => String(v || "").trim())) return false;
  return !Object.values(row.extras || {}).some((v) => String(v || "").trim());
}

export function getCellValue(row, col) {
  if (!row) return "";
  if (col.type === "extra") {
    return row.extras?.[col.letter] || "";
  }
  return row[col.key] ?? "";
}

export function setCellValue(row, col, value) {
  const next = { ...row, extras: { ...(row.extras || {}) }, cellStyles: { ...(row.cellStyles || {}) } };
  if (col.type === "extra") {
    next.extras[col.letter] = value;
    return next;
  }
  next[col.key] = value;
  if (col.key === "date") {
    next.dateIso = displayToIso(value);
  }
  return next;
}

export function getCellStyle(row, col) {
  const key = col.type === "extra" ? col.letter : col.key;
  return { ...emptyCellStyle(), ...(row?.cellStyles?.[key] || {}) };
}

export function setCellStyle(row, col, patch) {
  const key = col.type === "extra" ? col.letter : col.key;
  const next = { ...row, cellStyles: { ...(row.cellStyles || {}) } };
  next.cellStyles[key] = { ...emptyCellStyle(), ...(next.cellStyles[key] || {}), ...patch };
  return next;
}

export function rowToPayload(row, { monthKey, rowIndex, staffId }) {
  return {
    monthKey,
    rowIndex,
    staffId,
    date: row.date || "",
    dateIso: row.dateIso || displayToIso(row.date) || "",
    clientId: row.clientId || null,
    clientName: row.clientName || "",
    project: row.project || "",
    task: row.task || "",
    startTime: row.startTime || "",
    endTime: row.endTime || "",
    status: row.status || "",
    revision: row.revision || "",
    filesShared: row.filesShared || "",
    remarks: row.remarks || "",
    extras: row.extras || {},
    cellStyles: row.cellStyles || {},
  };
}

/** Column input behavior: template roles keep smart types; Others = plain text. */
export function resolveColType(col, role) {
  if (role === "others") return col.type === "extra" ? "extra" : "text";
  return col.type;
}
