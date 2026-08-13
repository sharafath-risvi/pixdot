export const MAX_SHEET_ROWS = 1000;

/** Legacy seed lists — Daily Report options now live in Report Templates (DB). */
export const PROJECT_OPTIONS = [];
export const TASK_OPTIONS = [];
export const REPORT_STATUS_OPTIONS = [];

export const ROLE_OPTIONS = [
  { value: "designer", label: "Designer" },
  { value: "video_editor", label: "Video Editor" },
  { value: "others", label: "Others" },
];

/**
 * Map Staff job role → sheet template mode: "template" | "plain".
 * Default is template (Date / Client / Project headings) so the sheet stays usable
 * even when role is still loading or unset. Only explicit "Others" uses a blank header row.
 */
export function sheetTemplateMode(jobRole) {
  const r = String(jobRole || "")
    .trim()
    .toLowerCase();
  if (r === "others" || r === "other" || r === "plain") return "plain";
  return "template";
}

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

/** Border color palette (Sheets-like). */
export const BORDER_COLORS = [
  "#000000",
  "#434343",
  "#666666",
  "#999999",
  "#b7b7b7",
  "#cccccc",
  "#d9d9d9",
  "#efefef",
  "#f3f3f3",
  "#ffffff",
  "#980000",
  "#ff0000",
  "#ff9900",
  "#ffff00",
  "#00ff00",
  "#00ffff",
  "#4a86e8",
  "#0000ff",
  "#9900ff",
  "#ff00ff",
  "#e6b8af",
  "#f4cccc",
  "#fce5cd",
  "#fff2cc",
  "#d9ead3",
  "#d0e0e3",
  "#c9daf8",
  "#d9d2e9",
  "#ead1dc",
];

export const BORDER_STYLE_PRESETS = [
  { key: "thin", label: "Thin", width: 1, style: "solid" },
  { key: "medium", label: "Medium", width: 2, style: "solid" },
  { key: "thick", label: "Thick", width: 3, style: "solid" },
  { key: "dashed", label: "Dashed", width: 1, style: "dashed" },
  { key: "dotted", label: "Dotted", width: 1, style: "dotted" },
  { key: "double", label: "Double", width: 3, style: "double" },
];

export function emptyBorders() {
  return { top: null, right: null, bottom: null, left: null };
}

export function hasBorderStyles(borders) {
  if (!borders || typeof borders !== "object") return false;
  return ["top", "right", "bottom", "left"].some((side) => {
    const v = borders[side];
    return v && typeof v === "object" && v.color && v.style !== "none";
  });
}

/** CSS borders for a cell; keeps light grid when a side is unset. */
export function bordersToCss(borders) {
  const b = { ...emptyBorders(), ...(borders || {}) };
  const sideCss = (side, fallback) => {
    const v = b[side];
    if (!v || !v.color || v.style === "none") return fallback;
    return `${Number(v.width) || 1}px ${v.style || "solid"} ${v.color}`;
  };
  return {
    borderTop: sideCss("top", "1px solid transparent"),
    borderRight: sideCss("right", "1px solid #e8eaed"),
    borderBottom: sideCss("bottom", "1px solid #e8eaed"),
    borderLeft: sideCss("left", "1px solid transparent"),
  };
}

export const EXTRA_COLUMNS = "KLMNOPQRSTUVWXYZ".split("");

export const FIXED_STORAGE_KEYS = new Set([
  "date",
  "clientName",
  "project",
  "task",
  "startTime",
  "endTime",
  "status",
  "revision",
  "filesShared",
  "remarks",
]);

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

/** Fallback columns when no DB template is loaded yet */
export const SHEET_COLUMNS = [
  { key: "date", letter: "A", label: "Date", type: "date", width: 110, storageKey: "date" },
  {
    key: "clientName",
    letter: "B",
    label: "Client Name",
    type: "client",
    width: 160,
    storageKey: "clientName",
  },
  {
    key: "project",
    letter: "C",
    label: "Project",
    type: "combobox",
    width: 140,
    storageKey: "project",
    options: [],
  },
  {
    key: "task",
    letter: "D",
    label: "Task",
    type: "combobox",
    width: 170,
    storageKey: "task",
    options: [],
  },
  {
    key: "startTime",
    letter: "E",
    label: "Start Time",
    type: "time",
    width: 100,
    storageKey: "startTime",
  },
  { key: "endTime", letter: "F", label: "End Time", type: "time", width: 100, storageKey: "endTime" },
  {
    key: "status",
    letter: "G",
    label: "Status",
    type: "status",
    width: 150,
    storageKey: "status",
    options: [],
  },
  {
    key: "revision",
    letter: "H",
    label: "Revision",
    type: "text",
    width: 220,
    storageKey: "revision",
  },
  {
    key: "filesShared",
    letter: "I",
    label: "Files Shared",
    type: "text",
    width: 140,
    storageKey: "filesShared",
  },
  {
    key: "remarks",
    letter: "J",
    label: "Remarks",
    type: "text",
    width: 160,
    storageKey: "remarks",
  },
  ...EXTRA_COLUMNS.map((letter) => ({
    key: `extra_${letter}`,
    letter,
    label: "",
    type: "extra",
    width: 90,
    storageKey: letter,
    options: [],
  })),
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function mapFieldTypeToColType(fieldType) {
  const t = String(fieldType || "text").toLowerCase();
  if (t === "client") return "client";
  if (t === "date") return "date";
  if (t === "time") return "time";
  if (t === "status") return "status";
  if (t === "dropdown" || t === "combobox") return "combobox";
  if (t === "textarea" || t === "number" || t === "text") return "text";
  return "text";
}

/**
 * Build sheet columns from per-staff field config (StaffReportField API).
 */
export function columnsFromStaffFields(fields) {
  const list = Array.isArray(fields) ? [...fields] : [];
  list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const cols = list.map((f, index) => {
    const storageKey = f.storageKey || f.key;
    const isFixed = FIXED_STORAGE_KEYS.has(storageKey);
    const letter = LETTERS[index] || `C${index}`;
    const optionItems = (f.options || [])
      .map((o) =>
        typeof o === "string"
          ? { id: null, label: o, value: o }
          : {
              id: o.id || o._id || null,
              label: o.label || o.value || "",
              value: o.value || o.label || "",
            },
      )
      .filter((o) => o.label);
    const options = optionItems.map((o) => o.label);

    let type = mapFieldTypeToColType(f.fieldType);
    if (storageKey === "clientName" || f.fieldType === "client") type = "client";
    if (storageKey === "status" || f.fieldType === "status") type = "status";
    if (f.fieldType === "dropdown") type = "combobox";

    return {
      id: f.id || f._id,
      fieldKey: f.key,
      key: isFixed ? storageKey : `extra_${storageKey}`,
      letter,
      label: f.label || f.key,
      type,
      fieldType: f.fieldType,
      width: f.width || 140,
      storageKey,
      options,
      optionItems,
      isExtra: !isFixed,
      isDefault: Boolean(f.isDefault),
    };
  });

  let nextIndex = cols.length;
  while (nextIndex < 26) {
    const letter = LETTERS[nextIndex];
    cols.push({
      key: `extra_${letter}`,
      letter,
      label: "",
      type: "extra",
      width: 90,
      storageKey: letter,
      options: [],
      isExtra: true,
      isDefault: false,
      isPad: true,
    });
    nextIndex += 1;
  }

  return cols;
}

export function headersFromColumns(columns) {
  return Object.fromEntries((columns || []).map((c) => [c.letter, c.label || ""]));
}
export function defaultColumnWidths() {
  return Object.fromEntries(SHEET_COLUMNS.map((c) => [c.letter, c.width]));
}

export function defaultHeadersForRole(roleOrMode) {
  const mode =
    roleOrMode === "template" || roleOrMode === "plain"
      ? roleOrMode
      : roleOrMode === "others"
        ? "plain"
        : roleOrMode === "designer" || roleOrMode === "video_editor"
          ? "template"
          : sheetTemplateMode(roleOrMode);
  if (mode === "plain") {
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
    borders: emptyBorders(),
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

function pad2(n) {
  return String(n).padStart(2, "0");
}

function isValidYmd(year, month, day) {
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(year, month - 1, day);
  return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
}

function yearMonthFromKey(monthKey) {
  const match = String(monthKey || "").match(/^(\d{4})-(\d{2})$/);
  if (match) return { year: Number(match[1]), month: Number(match[2]) };
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function displayToIso(display) {
  const match = String(display || "").match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!isValidYmd(year, month, day)) return "";
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function isoToDisplay(iso) {
  const match = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/**
 * Normalize time like "1.45am", "1:45 AM", "1 45pm", "13.45".
 * Keeps display style: h.mmam / h.mmpm (or 24h as h.mm).
 */
export function normalizeDisplayTime(raw) {
  const original = String(raw || "").trim();
  if (!original) return "";

  // Unify separators: "1 45am" → "1.45am", "1:45" → "1.45"
  let s = original
    .replace(/(\d)\s+(\d{2})\s*/g, "$1.$2")
    .replace(/:/g, ".")
    .replace(/\s+/g, "")
    .toLowerCase();

  let m = s.match(/^(\d{1,2})\.(\d{2})(am|pm)?$/i);
  if (m) {
    let h = Number(m[1]);
    const min = Number(m[2]);
    let ap = (m[3] || "").toLowerCase();
    if (Number.isNaN(h) || Number.isNaN(min) || min > 59) return original;
    if (ap) {
      if (h < 1 || h > 12) return original;
      return `${h}.${String(min).padStart(2, "0")}${ap}`;
    }
    if (h >= 0 && h <= 23) {
      return `${h}.${String(min).padStart(2, "0")}`;
    }
    return original;
  }

  // "145am" / "245pm" / "1345"
  m = s.match(/^(\d{3,4})(am|pm)?$/i);
  if (m) {
    const digits = m[1];
    const ap = (m[2] || "").toLowerCase();
    const hh = digits.length === 3 ? Number(digits.slice(0, 1)) : Number(digits.slice(0, 2));
    const mm = Number(digits.slice(-2));
    if (Number.isNaN(hh) || Number.isNaN(mm) || mm > 59) return original;
    if (ap) {
      if (hh < 1 || hh > 12) return original;
      return `${hh}.${String(mm).padStart(2, "0")}${ap}`;
    }
    if (hh >= 0 && hh <= 23) return `${hh}.${String(mm).padStart(2, "0")}`;
  }

  // Hour only: "2am", "14"
  m = s.match(/^(\d{1,2})(am|pm)?$/i);
  if (m) {
    const h = Number(m[1]);
    const ap = (m[2] || "").toLowerCase();
    if (Number.isNaN(h)) return original;
    if (ap) {
      if (h < 1 || h > 12) return original;
      return `${h}.00${ap}`;
    }
    if (h >= 0 && h <= 23) return `${h}.00`;
  }

  return original;
}

/**
 * Expand partial date input like Sheets/Excel (on Tab / Enter / blur).
 * "13" → "13-08-2026" using the active sheet month.
 * "13-08" → "13-08-2026"
 * "2026-08-13" → "13-08-2026"
 */
export function normalizeDisplayDate(raw, monthKey) {
  const s = String(raw || "").trim();
  if (!s) return "";

  const { year: sheetYear, month: sheetMonth } = yearMonthFromKey(monthKey);

  // ISO YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    if (isValidYmd(year, month, day)) return `${pad2(day)}-${pad2(month)}-${year}`;
    return s;
  }

  // DD-MM-YYYY or D-M-YYYY ( - / . )
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    if (isValidYmd(year, month, day)) return `${pad2(day)}-${pad2(month)}-${year}`;
    return s;
  }

  // DD-MM (no year) → use sheet year
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (isValidYmd(sheetYear, month, day)) {
      return `${pad2(day)}-${pad2(month)}-${sheetYear}`;
    }
    return s;
  }

  // Day only: "13" / "5" → day + sheet month/year
  m = s.match(/^(\d{1,2})$/);
  if (m) {
    const day = Number(m[1]);
    if (isValidYmd(sheetYear, sheetMonth, day)) {
      return `${pad2(day)}-${pad2(sheetMonth)}-${sheetYear}`;
    }
    return s;
  }

  return s;
}

/** True when any cell has typed/saved text (including date). */
export function rowHasCellValues(row) {
  if (!row) return false;
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
  if (main.some((v) => String(v || "").trim())) return true;
  return Object.values(row.extras || {}).some((v) => String(v || "").trim());
}

/**
 * Text/content that should trigger auto-date (Google Sheets–like).
 * Fill color / font alone must NOT count — only real work fields.
 */
export function rowHasWorkValues(row) {
  if (!row) return false;
  const main = [
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
  if (main.some((v) => String(v || "").trim())) return true;
  return Object.values(row.extras || {}).some((v) => String(v || "").trim());
}

export function rowHasStyles(row) {
  const styles = row?.cellStyles || {};
  return Object.values(styles).some((st) => {
    if (!st || typeof st !== "object") return false;
    if (st.background && st.background !== "transparent") return true;
    if (st.fontFamily && st.fontFamily !== "Arial") return true;
    if (st.fontSize && Number(st.fontSize) !== 12) return true;
    if (hasBorderStyles(st.borders)) return true;
    return false;
  });
}

/** Blank = no values and no formatting (safe to drop from DB). */
export function isRowBlank(row) {
  if (!row) return true;
  return !rowHasCellValues(row) && !rowHasStyles(row);
}

export function getCellValue(row, col) {
  if (!row) return "";
  const storageKey = col.storageKey || col.key;
  if (col.isExtra || col.type === "extra" || !FIXED_STORAGE_KEYS.has(storageKey)) {
    // Prefer storageKey; fall back to letter for legacy padded columns
    return row.extras?.[storageKey] ?? row.extras?.[col.letter] ?? "";
  }
  return row[storageKey] ?? "";
}

export function setCellValue(row, col, value) {
  const next = { ...row, extras: { ...(row.extras || {}) }, cellStyles: { ...(row.cellStyles || {}) } };
  const storageKey = col.storageKey || col.key;
  if (col.isExtra || col.type === "extra" || !FIXED_STORAGE_KEYS.has(storageKey)) {
    next.extras[storageKey] = value;
    return next;
  }
  next[storageKey] = value;
  if (storageKey === "date") {
    next.dateIso = displayToIso(value);
  }
  return next;
}

export function getCellStyle(row, col) {
  const key = col.isExtra || col.type === "extra" ? col.storageKey || col.letter : col.storageKey || col.key;
  const raw = row?.cellStyles?.[key] || {};
  return {
    ...emptyCellStyle(),
    ...raw,
    borders: { ...emptyBorders(), ...(raw.borders || {}) },
  };
}

export function setCellStyle(row, col, patch) {
  const key = col.isExtra || col.type === "extra" ? col.storageKey || col.letter : col.storageKey || col.key;
  const next = { ...row, cellStyles: { ...(row.cellStyles || {}) } };
  const prev = getCellStyle(row, col);
  const merged = { ...prev, ...patch };
  if (patch.borders) {
    const borders = { ...prev.borders };
    for (const side of ["top", "right", "bottom", "left"]) {
      if (Object.prototype.hasOwnProperty.call(patch.borders, side)) {
        borders[side] = patch.borders[side];
      }
    }
    merged.borders = borders;
  }
  next.cellStyles[key] = merged;
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

/** Column input behavior from field type (template-driven). */
export function resolveColType(col, roleOrMode) {
  const mode =
    roleOrMode === "template" || roleOrMode === "plain"
      ? roleOrMode
      : roleOrMode === "others"
        ? "plain"
        : roleOrMode === "designer" || roleOrMode === "video_editor"
          ? "template"
          : sheetTemplateMode(roleOrMode);
  if (mode === "plain") return col.type === "extra" ? "extra" : "text";
  // Map legacy project/task types to combobox
  if (col.type === "project" || col.type === "task") return "combobox";
  return col.type;
}

export function isComboColType(type) {
  return type === "client" || type === "combobox" || type === "status" || type === "project" || type === "task";
}
