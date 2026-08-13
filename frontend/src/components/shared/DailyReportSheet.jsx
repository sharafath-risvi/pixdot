import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaEllipsisVertical, FaXmark } from "react-icons/fa6";
import api from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import {
  MAX_SHEET_ROWS,
  FONT_FAMILIES,
  FONT_SIZES,
  FILL_COLORS,
  BORDER_COLORS,
  BORDER_STYLE_PRESETS,
  SHEET_COLUMNS as DEFAULT_SHEET_COLUMNS,
  createEmptyGrid,
  emptyRow,
  emptyBorders,
  defaultColumnWidths,
  defaultHeadersForRole,
  formatMonthTab,
  getCellValue,
  setCellValue,
  getCellStyle,
  setCellStyle,
  bordersToCss,
  rowHasWorkValues,
  rowHasCellValues,
  rowHasStyles,
  monthKeyFromDate,
  normalizeDisplayDate,
  normalizeDisplayTime,
  rowToPayload,
  shiftMonthKey,
  todayDisplayDate,
  todayIsoDate,
  resolveColType,
  columnsFromStaffFields,
  headersFromColumns,
  isComboColType,
} from "../../lib/dailyReportSheet.js";
import ConfirmModal from "../admin/ConfirmModal.jsx";
import adminStyles from "../admin/Admin.module.css";
import styles from "./DailyReportSheet.module.css";

const ROW_H = 28;
const OVERSCAN = 12;
const COL_WIDTHS_KEY = "pixdot_daily_report_col_widths_v1";
const TAB_NAMES_KEY = "pixdot_daily_report_tab_names_v1";
const MIN_COL_W = 64;

const ADD_COLUMN_TYPES = [
  { value: "text", label: "Text" },
  { value: "dropdown", label: "Dropdown" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Text Area" },
];

function todaySubtitleDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isManageableOptionsType(col) {
  const t = String(col?.fieldType || col?.type || "").toLowerCase();
  return t === "dropdown" || t === "status" || t === "combobox";
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function loadTabNames() {
  return loadJson(TAB_NAMES_KEY, {}) || {};
}

function saveTabNames(map) {
  saveJson(TAB_NAMES_KEY, map);
}

function headersStorageKey(sheetModeOrRole) {
  return `pixdot_report_headers_${sheetModeOrRole}`;
}

function loadHeaders(sheetMode) {
  const defaults = defaultHeadersForRole(sheetMode);
  if (sheetMode === "plain") return defaults;
  const saved = loadJson(headersStorageKey(sheetMode), null);
  if (!saved || typeof saved !== "object") return defaults;
  const merged = { ...defaults };
  for (const [letter, value] of Object.entries(saved)) {
    if (String(value || "").trim()) merged[letter] = value;
  }
  // If A–J somehow all blank in storage, keep defaults so headings always show
  const hasCore = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].some(
    (l) => String(merged[l] || "").trim(),
  );
  return hasCore ? merged : defaults;
}

function saveHeaders(sheetMode, headers) {
  if (sheetMode === "plain") return;
  saveJson(headersStorageKey(sheetMode), headers);
}

function monthsStorageKey(staffKey) {
  return `pixdot_report_months_${staffKey}`;
}

function loadLocalMonths(staffKey) {
  const list = loadJson(monthsStorageKey(staffKey), []);
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

function saveLocalMonths(staffKey, months) {
  saveJson(monthsStorageKey(staffKey), months);
}

function statusColor(status) {
  if (status === "complete" || status === "approved") return "#e6f4ea";
  if (status === "waiting for approval") return "#e8f0fe";
  if (status === "pending") return "#fef7e0";
  return "transparent";
}

function loadSavedWidths() {
  try {
    const raw = localStorage.getItem(COL_WIDTHS_KEY);
    if (!raw) return defaultColumnWidths();
    const parsed = JSON.parse(raw);
    return { ...defaultColumnWidths(), ...parsed };
  } catch {
    return defaultColumnWidths();
  }
}

function isComboType(type) {
  return isComboColType(type);
}

function cellKey(row, col) {
  return `${row}:${col}`;
}

function parseCellKey(key) {
  const [r, c] = String(key).split(":").map(Number);
  return { row: r, col: c };
}

function buildRangeSet(a, b) {
  const r0 = Math.min(a.row, b.row);
  const r1 = Math.max(a.row, b.row);
  const c0 = Math.min(a.col, b.col);
  const c1 = Math.max(a.col, b.col);
  const set = new Set();
  for (let r = r0; r <= r1; r += 1) {
    for (let c = c0; c <= c1; c += 1) set.add(cellKey(r, c));
  }
  return set;
}

function sortedSelectedKeys(selected) {
  return Array.from(selected).sort((ka, kb) => {
    const a = parseCellKey(ka);
    const b = parseCellKey(kb);
    return a.row - b.row || a.col - b.col;
  });
}

function selectionBounds(selected, fallback = { row: 0, col: 0 }) {
  const keys = sortedSelectedKeys(selected);
  if (!keys.length) {
    return { r0: fallback.row, r1: fallback.row, c0: fallback.col, c1: fallback.col };
  }
  const positions = keys.map(parseCellKey);
  return {
    r0: Math.min(...positions.map((p) => p.row)),
    r1: Math.max(...positions.map((p) => p.row)),
    c0: Math.min(...positions.map((p) => p.col)),
    c1: Math.max(...positions.map((p) => p.col)),
  };
}

function BorderIcon({ kind }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    "aria-hidden": true,
  };
  if (kind === "all") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="12" height="12" />
        <path d="M9 3v12M3 9h12" />
      </svg>
    );
  }
  if (kind === "inner") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="12" height="12" strokeDasharray="2 2" />
        <path d="M9 3v12M3 9h12" />
      </svg>
    );
  }
  if (kind === "horizontal") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="12" height="12" strokeDasharray="2 2" />
        <path d="M3 9h12" />
      </svg>
    );
  }
  if (kind === "vertical") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="12" height="12" strokeDasharray="2 2" />
        <path d="M9 3v12" />
      </svg>
    );
  }
  if (kind === "outer") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="12" height="12" strokeWidth="2" />
        <path d="M9 3v12M3 9h12" strokeDasharray="2 2" />
      </svg>
    );
  }
  if (kind === "left") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="12" height="12" strokeDasharray="2 2" />
        <path d="M3 3v12" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "top") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="12" height="12" strokeDasharray="2 2" />
        <path d="M3 3h12" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "right") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="12" height="12" strokeDasharray="2 2" />
        <path d="M15 3v12" strokeWidth="2" />
      </svg>
    );
  }
  if (kind === "bottom") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="12" height="12" strokeDasharray="2 2" />
        <path d="M3 15h12" strokeWidth="2" />
      </svg>
    );
  }
  // clear
  return (
    <svg {...common}>
      <rect x="3" y="3" width="12" height="12" strokeDasharray="2 2" />
      <path d="M4 4l10 10" stroke="#d93025" />
    </svg>
  );
}

function ColResizeHandle({ onResizeStart }) {
  return (
    <span
      className={styles.colResize}
      onMouseDown={onResizeStart}
      title="Drag to resize column"
      role="separator"
      aria-orientation="vertical"
    />
  );
}

/** Type + pick from suggestions. Enter selects match. */
function OptionCombobox({
  value,
  options,
  open,
  draftText,
  onDraftChange,
  onOpen,
  onClose,
  onPick,
  onCommit,
  placeholder = "",
  onFocusCell,
  inputStyle,
  readOnly = false,
  cellKeyAttr = "",
}) {
  const [highlight, setHighlight] = useState(0);
  const display = open && !readOnly ? draftText : value;

  const filtered = useMemo(() => {
    const q = String(draftText || "").trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, draftText]);

  useEffect(() => {
    setHighlight(0);
  }, [draftText, open]);

  const pickHighlighted = () => {
    if (filtered.length > 0) {
      const opt = filtered[Math.min(highlight, filtered.length - 1)];
      onPick(opt);
      return true;
    }
    return false;
  };

  return (
    <div className={styles.comboWrap}>
      <input
        className={styles.cellInput}
        style={inputStyle}
        value={display}
        placeholder={placeholder}
        readOnly={readOnly}
        data-cell-key={cellKeyAttr || undefined}
        onFocus={() => {
          onFocusCell?.();
          if (readOnly) return;
          onOpen();
          onDraftChange(value || "");
        }}
        onChange={(e) => {
          if (readOnly) return;
          const next = e.target.value;
          onDraftChange(next);
          onOpen();
          onCommit(next, { save: false });
        }}
        onKeyDown={(e) => {
          if (readOnly) return;
          if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            onOpen();
            onDraftChange(value || "");
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (!pickHighlighted()) {
              onCommit(draftText || value, { save: true });
              onClose();
            }
          } else if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
        }}
        onBlur={() => {
          if (readOnly) return;
          setTimeout(() => onClose(), 150);
          onCommit(open ? draftText : value, { save: true });
        }}
      />
      {!readOnly ? (
        <button
          type="button"
          className={styles.comboCaret}
          tabIndex={-1}
          aria-label="Show options"
          onMouseDown={(e) => {
            e.preventDefault();
            onFocusCell?.();
            if (open) onClose();
            else {
              onOpen();
              onDraftChange(value || "");
            }
          }}
        >
          ▾
        </button>
      ) : null}
      {open && !readOnly ? (
        <div className={styles.clientMenu}>
          {filtered.length === 0 ? (
            <div className={styles.clientEmpty}>
              {String(draftText || "").trim()
                ? `Press Enter to use “${String(draftText).trim()}”`
                : "No options"}
            </div>
          ) : (
            filtered.map((opt, idx) => (
              <button
                key={opt}
                type="button"
                className={`${styles.clientOption} ${idx === highlight ? styles.clientOptionActive : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => onPick(opt)}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function DailyReportSheet({ mode = "staff", initialStaffId = "" }) {
  const toast = useToast();
  const { clients, clientsLoading } = useWorkspace();
  const { staffId: authStaffId, staffRole: authStaffRole, staffName: authStaffName } = useAuth();
  const isAdmin = mode === "admin";
  const showAdminStaffPicker = isAdmin && !initialStaffId;

  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate());
  const [months, setMonths] = useState(() => [monthKeyFromDate()]);
  const [staffList, setStaffList] = useState([]);
  const [staffId, setStaffId] = useState(() => initialStaffId || "");
  const [dateFilter, setDateFilter] = useState("");
  const [jobRole, setJobRole] = useState(() => (!isAdmin && authStaffRole) || "");
  const [staffName, setStaffName] = useState(() => (!isAdmin && authStaffName) || "");
  const [roleFilter, setRoleFilter] = useState("");
  const [distinctRoles, setDistinctRoles] = useState([]);
  const [headers, setHeaders] = useState(() => loadHeaders("template"));
  const [rows, setRows] = useState(() => createEmptyGrid());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState({ row: 0, col: 0 });
  const [draft, setDraft] = useState(null); // { row, col, text }
  const [menu, setMenu] = useState({ open: false, kind: "" });
  const [clientHighlight, setClientHighlight] = useState(0);
  const [colWidths, setColWidths] = useState(loadSavedWidths);
  const [tabNames, setTabNames] = useState(loadTabNames);
  const [tabMenu, setTabMenu] = useState(null);
  const [renamingTab, setRenamingTab] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(480);
  /** Anchor for Shift+range; selected keys "row:col" */
  const [selAnchor, setSelAnchor] = useState({ row: 0, col: 0 });
  const [selected, setSelected] = useState(() => new Set(["0:0"]));
  const [exportingPdf, setExportingPdf] = useState(false);
  const [borderMenuOpen, setBorderMenuOpen] = useState(false);
  const [borderColorOpen, setBorderColorOpen] = useState(false);
  const [borderStyleOpen, setBorderStyleOpen] = useState(false);
  const [borderColor, setBorderColor] = useState("#000000");
  const [borderStyleKey, setBorderStyleKey] = useState("thin");
  /** null | { mode: "delete" | "cut" } */
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [sheetColumns, setSheetColumns] = useState(DEFAULT_SHEET_COLUMNS);
  /** Admin only: view (read-only) | edit */
  const [viewMode, setViewMode] = useState("view");
  const [colMenuLetter, setColMenuLetter] = useState(null);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [addColumnForm, setAddColumnForm] = useState({
    label: "",
    fieldType: "text",
    afterKey: "",
  });
  const [editColumn, setEditColumn] = useState(null); // { id, label }
  const [optionsModal, setOptionsModal] = useState(null); // column
  const [optionDraft, setOptionDraft] = useState("");
  const [editingOption, setEditingOption] = useState(null); // { id, label }
  /** null | { kind: "column"|"option", id, fieldId? } */
  const [fieldConfirm, setFieldConfirm] = useState(null);
  /** Mobile/tablet: tools drawer under title menu */
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  const scrollRef = useRef(null);
  const sheetRef = useRef(null);
  const saveTimers = useRef({});
  const rowsRef = useRef(rows);
  const selectedRef = useRef(selected);
  const selAnchorRef = useRef(selAnchor);
  const activeRef = useRef(active);
  const draftRef = useRef(draft);
  const menuRef = useRef(menu);
  const deleteConfirmRef = useRef(deleteConfirm);
  const editOriginRef = useRef("");
  const fullscreenRef = useRef(fullscreen);
  const sheetColumnsRef = useRef(sheetColumns);
  const sheetEditableRef = useRef(true);
  rowsRef.current = rows;
  selectedRef.current = selected;
  selAnchorRef.current = selAnchor;
  activeRef.current = active;
  draftRef.current = draft;
  menuRef.current = menu;
  deleteConfirmRef.current = deleteConfirm;
  fullscreenRef.current = fullscreen;
  sheetColumnsRef.current = sheetColumns;

  const staffKey = isAdmin ? staffId || "admin" : "self";
  const sheetEditable = !isAdmin || viewMode === "edit";
  const canManageColumns = sheetEditable && (!isAdmin || Boolean(staffId));
  sheetEditableRef.current = sheetEditable;

  useEffect(() => {
    if (initialStaffId) setStaffId(initialStaffId);
  }, [initialStaffId]);

  const selectedStaffRole = useMemo(() => {
    if (!isAdmin || !staffId) return "";
    const s = staffList.find((x) => String(x.id || x._id) === String(staffId));
    return s?.role || "";
  }, [isAdmin, staffId, staffList]);

  const effectiveJobRole = isAdmin ? selectedStaffRole : jobRole;
  // Always template mode so heading row + typed columns stay available for all staff.
  const sheetMode = "template";
  const sheetModeRef = useRef(sheetMode);
  sheetModeRef.current = sheetMode;
  const monthKeyRef = useRef(monthKey);
  monthKeyRef.current = monthKey;

  const showHeadingRow = true;
  const dataRowOffset = showHeadingRow ? 2 : 1;

  const filteredStaffList = useMemo(() => {
    if (!roleFilter) return staffList;
    return staffList.filter((s) => String(s.role || "") === roleFilter);
  }, [staffList, roleFilter]);

  const labeledColumns = useMemo(
    () =>
      sheetColumns.filter(
        (c) => !c.isPad && String(c.label || headers[c.letter] || "").trim(),
      ),
    [sheetColumns, headers],
  );

  const applyFields = useCallback((fields) => {
    const cols = columnsFromStaffFields(fields);
    setSheetColumns(cols);
    setHeaders(headersFromColumns(cols));
  }, []);

  const loadFields = useCallback(async () => {
    if (isAdmin && !staffId) {
      setSheetColumns(DEFAULT_SHEET_COLUMNS);
      setHeaders(loadHeaders("template"));
      return [];
    }
    try {
      const res = await api.get("/api/daily-report/fields", {
        params: isAdmin && staffId ? { staffId } : undefined,
      });
      const payload = res.data?.data || {};
      if (payload.staffName) setStaffName(payload.staffName);
      if (payload.role && !isAdmin) setJobRole(payload.role);
      const fields = payload.fields || [];
      applyFields(fields);
      return fields;
    } catch {
      setSheetColumns(DEFAULT_SHEET_COLUMNS);
      setHeaders(loadHeaders("template"));
      return [];
    }
  }, [isAdmin, staffId, applyFields]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  useEffect(() => {
    setColWidths((prev) => {
      const merged = { ...prev };
      for (const c of sheetColumns) {
        if (merged[c.letter] == null) merged[c.letter] = c.width || 100;
      }
      return merged;
    });
  }, [sheetColumns]);

  useEffect(() => {
    if (!colMenuLetter) return undefined;
    const close = () => setColMenuLetter(null);
    const t = setTimeout(() => document.addEventListener("mousedown", close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", close);
    };
  }, [colMenuLetter]);

  const colTemplate = useMemo(
    () => sheetColumns.map((c) => `${colWidths[c.letter] || c.width}px`).join(" "),
    [colWidths, sheetColumns],
  );

  const widthOf = useCallback(
    (letter) => colWidths[letter] || sheetColumns.find((c) => c.letter === letter)?.width || 100,
    [colWidths, sheetColumns],
  );

  const startColResize = useCallback(
    (letter, e) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = widthOf(letter);

      const onMove = (ev) => {
        const next = Math.max(MIN_COL_W, Math.round(startW + (ev.clientX - startX)));
        setColWidths((prev) => ({ ...prev, [letter]: next }));
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.classList.remove("pixdot-col-resizing");
        setColWidths((prev) => {
          try {
            localStorage.setItem(COL_WIDTHS_KEY, JSON.stringify(prev));
          } catch {
            /* ignore */
          }
          return prev;
        });
      };

      document.body.classList.add("pixdot-col-resizing");
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [widthOf],
  );

  const draftTextFor = useCallback(
    (rowIndex, colIndex, fallback = "") => {
      if (draft && draft.row === rowIndex && draft.col === colIndex) return draft.text;
      return fallback;
    },
    [draft],
  );

  const setDraftText = useCallback((rowIndex, colIndex, text) => {
    setDraft({ row: rowIndex, col: colIndex, text });
  }, []);

  const clearDraft = useCallback(() => setDraft(null), []);

  const filteredClients = useMemo(() => {
    const q = String(draft?.text || "").trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, draft?.text]);

  useEffect(() => {
    setClientHighlight(0);
  }, [draft?.text, menu.open, menu.kind]);

  const persistMonths = useCallback(
    (list) => {
      const unique = Array.from(new Set(list.filter(Boolean))).sort();
      setMonths(unique);
      saveLocalMonths(staffKey, unique);
      return unique;
    },
    [staffKey],
  );

  const loadMonths = useCallback(async () => {
    const local = loadLocalMonths(staffKey);
    const current = monthKeyFromDate();
    try {
      const res = await api.get("/api/reports/months", {
        params: isAdmin && staffId ? { staffId } : undefined,
      });
      const apiList = res.data?.data || [];
      const merged = Array.from(new Set([current, ...local, ...apiList])).sort();
      persistMonths(merged);
    } catch {
      const merged = Array.from(new Set([current, ...local, monthKey])).sort();
      persistMonths(merged);
    }
  }, [isAdmin, staffId, monthKey, staffKey, persistMonths]);

  /** Staff: load job role from auth cache, /api/auth/me and /api/staff/:id. */
  useEffect(() => {
    if (isAdmin) return undefined;
    let cancelled = false;

    if (authStaffRole) setJobRole(authStaffRole);
    if (authStaffName) setStaffName(authStaffName);

    const applyProfile = (name, role) => {
      if (cancelled) return;
      if (name) setStaffName(name);
      if (role) setJobRole(role);
    };

    (async () => {
      try {
        const res = await api.get("/api/auth/me");
        const profile = res.data?.data?.profile;
        if (profile) {
          applyProfile(profile.name || "", profile.role || "");
        }
      } catch {
        /* try staff endpoint below */
      }

      const id = authStaffId;
      if (!id) return;
      try {
        const res = await api.get(`/api/staff/${id}`);
        const staff = res.data?.data;
        if (staff) {
          applyProfile(staff.name || "", staff.role || "");
        }
      } catch {
        /* sheet load may still refresh via me */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, authStaffId, authStaffRole, authStaffName]);

  const loadSheet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/reports/sheet", {
        params: {
          month: monthKey,
          staffId: isAdmin ? staffId || undefined : undefined,
          jobRole: isAdmin && roleFilter ? roleFilter : undefined,
          date: dateFilter || undefined,
        },
      });
      const data = res.data?.data || {};
      if (Array.isArray(data.staffList)) setStaffList(data.staffList);
      if (Array.isArray(data.distinctRoles)) setDistinctRoles(data.distinctRoles);

      if (data.me) {
        if (data.me.role) setJobRole(data.me.role);
        if (data.me.name) setStaffName(data.me.name);
      }

      if (isAdmin && !staffId) {
        setRows(createEmptyGrid());
        return;
      }

      const grid = createEmptyGrid();
      for (const saved of data.rows || []) {
        const idx = Number(saved.rowIndex);
        if (Number.isNaN(idx) || idx < 0 || idx >= MAX_SHEET_ROWS) continue;
        if (isAdmin && staffId && String(saved.staffId) !== String(staffId)) continue;
        grid[idx] = {
          ...emptyRow(),
          id: saved.id || saved._id,
          date: saved.date || "",
          dateIso: saved.dateIso || "",
          clientId: saved.clientId || null,
          clientName: saved.clientName || "",
          project: saved.project || "",
          task: saved.task || "",
          startTime: saved.startTime || "",
          endTime: saved.endTime || "",
          status: saved.status || "",
          revision: saved.revision || "",
          filesShared: saved.filesShared || "",
          remarks: saved.remarks || "",
          extras: saved.extras || {},
          cellStyles: saved.cellStyles || {},
        };
      }
      setRows(grid);
      clearDraft();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load report sheet.");
      setRows(createEmptyGrid());
    } finally {
      setLoading(false);
    }
  }, [monthKey, dateFilter, isAdmin, staffId, roleFilter, toast, clearDraft]);

  useEffect(() => {
    loadMonths();
  }, [loadMonths]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  useEffect(() => {
    if (!showAdminStaffPicker) return;
    if (filteredStaffList.length && !staffId) {
      setStaffId(String(filteredStaffList[0].id || filteredStaffList[0]._id));
    }
  }, [showAdminStaffPicker, filteredStaffList, staffId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const measure = () => setViewportH(el.clientHeight || 480);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fullscreen, loading]);

  useEffect(() => {
    if (!fullscreen) return undefined;
    document.body.classList.add("pixdot-sheet-fullscreen");
    return () => {
      document.body.classList.remove("pixdot-sheet-fullscreen");
    };
  }, [fullscreen]);

  useEffect(() => {
    if (!tabMenu) return undefined;
    const close = () => setTabMenu(null);
    const t = setTimeout(() => {
      document.addEventListener("mousedown", close);
      document.addEventListener("touchstart", close, { passive: true });
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [tabMenu]);

  useEffect(() => {
    if (!borderMenuOpen && !borderColorOpen && !borderStyleOpen) return undefined;
    const onDoc = (e) => {
      const t = e.target;
      if (t instanceof Element && t.closest(`.${styles.borderToolWrap}`)) return;
      setBorderMenuOpen(false);
      setBorderColorOpen(false);
      setBorderStyleOpen(false);
    };
    const timer = setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [borderMenuOpen, borderColorOpen, borderStyleOpen]);

  /** Open month tab menu ABOVE the point so Rename/Delete stay on-screen. */
  const openTabMenuAt = useCallback((monthKeyValue, clientX, clientY, anchorEl) => {
    const menuW = 160;
    const menuH = 96;
    const pad = 8;
    let x = clientX;
    let y = clientY;

    if (anchorEl?.getBoundingClientRect) {
      const r = anchorEl.getBoundingClientRect();
      x = r.left;
      y = r.top; // open upward from tab top
    }

    x = Math.min(Math.max(pad, x), window.innerWidth - menuW - pad);
    // Prefer above; if not enough room, still clamp into viewport
    y = y - menuH - 4;
    if (y < pad) y = pad;
    y = Math.min(y, window.innerHeight - menuH - pad);

    setTabMenu({ monthKey: monthKeyValue, x, y });
  }, []);

  const tabLongPressRef = useRef({ timer: null, monthKey: null });

  const clearTabLongPress = useCallback(() => {
    if (tabLongPressRef.current.timer) {
      clearTimeout(tabLongPressRef.current.timer);
      tabLongPressRef.current.timer = null;
    }
  }, []);

  const startTabLongPress = useCallback(
    (monthKeyValue, e) => {
      clearTabLongPress();
      const touch = e.touches?.[0];
      const el = e.currentTarget;
      const x = touch?.clientX ?? 0;
      const y = touch?.clientY ?? 0;
      tabLongPressRef.current.monthKey = monthKeyValue;
      tabLongPressRef.current.timer = setTimeout(() => {
        openTabMenuAt(monthKeyValue, x, y, el);
        tabLongPressRef.current.timer = null;
      }, 450);
    },
    [clearTabLongPress, openTabMenuAt],
  );

  const updateHeader = (letter, value) => {
    setHeaders((prev) => {
      const next = { ...prev, [letter]: value };
      saveHeaders(sheetMode, next);
      return next;
    });
  };

  const tabLabel = useCallback((m) => tabNames[m] || formatMonthTab(m), [tabNames]);

  const persistRow = useCallback(
    async (rowIndex) => {
      if (!sheetEditableRef.current) return;
      if (isAdmin && !staffId) return;
      const row = rowsRef.current[rowIndex];
      if (!row) return;
      setSaving(true);
      try {
        const res = await api.put(
          "/api/reports/sheet/row",
          rowToPayload(row, {
            monthKey,
            rowIndex,
            staffId: isAdmin ? staffId : undefined,
          }),
        );
        const saved = res.data?.data;
        if (saved?.deleted) {
          setRows((prev) => {
            const next = [...prev];
            next[rowIndex] = emptyRow();
            return next;
          });
        } else if (saved) {
          setRows((prev) => {
            const next = [...prev];
            next[rowIndex] = {
              ...next[rowIndex],
              id: saved.id || saved._id,
              // Trust server — do not keep a stale auto-date after style-only saves
              date: saved.date ?? "",
              dateIso: saved.dateIso ?? "",
              cellStyles: saved.cellStyles || next[rowIndex].cellStyles || {},
            };
            return next;
          });
        }
        loadMonths();
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not save row.");
      } finally {
        setSaving(false);
      }
    },
    [isAdmin, staffId, monthKey, toast, loadMonths],
  );

  const scheduleSave = useCallback(
    (rowIndex) => {
      if (!sheetEditableRef.current) return;
      if (saveTimers.current[rowIndex]) clearTimeout(saveTimers.current[rowIndex]);
      saveTimers.current[rowIndex] = setTimeout(() => {
        persistRow(rowIndex);
      }, 450);
    },
    [persistRow],
  );

  const updateRow = useCallback(
    (rowIndex, updater, { save = true, autoDate = true } = {}) => {
      if (!sheetEditableRef.current) return;
      setRows((prev) => {
        const next = [...prev];
        let row = {
          ...prev[rowIndex],
          extras: { ...(prev[rowIndex].extras || {}) },
          cellStyles: { ...(prev[rowIndex].cellStyles || {}) },
        };
        row = typeof updater === "function" ? updater(row) : { ...row, ...updater };

        // Color/font alone must not auto-fill date (Sheets/Excel)
        if (autoDate && rowHasWorkValues(row) && !String(row.date || "").trim()) {
          row.date = todayDisplayDate();
          row.dateIso = todayIsoDate();
        }

        next[rowIndex] = row;
        rowsRef.current = next; // sync immediately for Tab/Enter navigation
        return next;
      });
      if (save) scheduleSave(rowIndex);
    },
    [scheduleSave],
  );

  const activateCell = useCallback(
    (rowIndex, colIndex, { openCombo = false } = {}) => {
      setActive({ row: rowIndex, col: colIndex });
      const col = sheetColumnsRef.current[colIndex];
      const row = rowsRef.current[rowIndex];
      const value = getCellValue(row, col);
      editOriginRef.current = value || "";
      setDraft({ row: rowIndex, col: colIndex, text: value || "" });
      const colType = resolveColType(col, sheetModeRef.current);
      if (openCombo && isComboType(colType)) {
        setMenu({ open: true, kind: colType });
      } else {
        setMenu({ open: false, kind: "" });
      }
    },
    [],
  );

  const selectSingle = useCallback(
    (rowIndex, colIndex, { openCombo = false } = {}) => {
      setSelAnchor({ row: rowIndex, col: colIndex });
      setSelected(new Set([cellKey(rowIndex, colIndex)]));
      activateCell(rowIndex, colIndex, { openCombo });
    },
    [activateCell],
  );

  const selectSingleRef = useRef(selectSingle);
  selectSingleRef.current = selectSingle;

  /** Click row number → select entire row (Sheets/Excel). */
  const selectEntireRow = useCallback(
    (rowIndex) => {
      const colCount = sheetColumnsRef.current.length;
      const next = new Set();
      for (let c = 0; c < colCount; c += 1) next.add(cellKey(rowIndex, c));
      setSelected(next);
      setSelAnchor({ row: rowIndex, col: 0 });
      activateCell(rowIndex, 0, { openCombo: false });
    },
    [activateCell],
  );

  /** Click column letter → select entire column (used area + buffer). */
  const selectEntireColumn = useCallback(
    (colIndex) => {
      let last = 39;
      const grid = rowsRef.current;
      for (let r = 0; r < grid.length; r += 1) {
        if (rowHasCellValues(grid[r]) || rowHasStyles(grid[r])) {
          last = Math.max(last, r);
        }
      }
      const endRow = Math.min(MAX_SHEET_ROWS - 1, Math.max(39, last + 15));
      const next = new Set();
      for (let r = 0; r <= endRow; r += 1) next.add(cellKey(r, colIndex));
      setSelected(next);
      setSelAnchor({ row: 0, col: colIndex });
      activateCell(0, colIndex, { openCombo: false });
    },
    [activateCell],
  );

  const handleCellMouseDown = useCallback(
    (e, rowIndex, colIndex, colType) => {
      if (e.button !== 0) return;
      if (e.shiftKey) {
        e.preventDefault();
        const range = buildRangeSet(selAnchorRef.current, { row: rowIndex, col: colIndex });
        setSelected(range);
        setActive({ row: rowIndex, col: colIndex });
        const col = sheetColumnsRef.current[colIndex];
        const row = rowsRef.current[rowIndex];
        const value = getCellValue(row, col) || "";
        editOriginRef.current = value;
        setDraft({ row: rowIndex, col: colIndex, text: value });
        setMenu({ open: false, kind: "" });
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setSelected((prev) => {
          const next = new Set(prev);
          const key = cellKey(rowIndex, colIndex);
          if (next.has(key) && next.size > 1) next.delete(key);
          else next.add(key);
          return next;
        });
        setSelAnchor({ row: rowIndex, col: colIndex });
        activateCell(rowIndex, colIndex, { openCombo: false });
        return;
      }
      selectSingle(rowIndex, colIndex, { openCombo: isComboType(colType) });
    },
    [activateCell, selectSingle],
  );

  const commitDraftToCell = useCallback(
    (rowIndex, colIndex, text, { save = true, finalize = save } = {}) => {
      const col = sheetColumnsRef.current[colIndex];
      const colType = resolveColType(col, sheetModeRef.current);
      let value = text;
      // Finalize date/time on Tab / Enter / blur — not while typing each key
      if (finalize && colType === "date") {
        value = normalizeDisplayDate(text, monthKeyRef.current);
      } else if (finalize && colType === "time") {
        value = normalizeDisplayTime(text);
      }
      if (finalize && value !== text) {
        setDraft((d) =>
          d && d.row === rowIndex && d.col === colIndex ? { ...d, text: value } : d,
        );
      }
      updateRow(
        rowIndex,
        (r) => {
          if (colType === "client") {
            return { ...setCellValue(r, col, value), clientId: null };
          }
          return setCellValue(r, col, value);
        },
        { save },
      );
      return value;
    },
    [updateRow],
  );

  /** After Tab/Enter/click navigation, focus the active cell input (Sheets-like). */
  const focusActiveCellInput = useCallback((rowIndex, colIndex, { selectAll = true } = {}) => {
    const run = () => {
      const root = sheetRef.current;
      if (!root) return;
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLElement &&
        activeEl.classList?.contains(styles.formulaInput)
      ) {
        return;
      }
      const input = root.querySelector(`[data-cell-key="${rowIndex}:${colIndex}"]`);
      if (!(input instanceof HTMLInputElement) || input.readOnly) return;
      input.focus({ preventScroll: true });
      if (selectAll) {
        try {
          input.select();
        } catch {
          /* ignore */
        }
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, []);

  const focusActiveCellInputRef = useRef(focusActiveCellInput);
  focusActiveCellInputRef.current = focusActiveCellInput;

  const commitDraftToCellRef = useRef(commitDraftToCell);
  commitDraftToCellRef.current = commitDraftToCell;

  /** Apply font/fill to every selected cell (Shift/Ctrl ranges). Sheets/Excel-like. */
  const applySelectionStyle = useCallback(
    (patch) => {
      if (!sheetEditableRef.current) return;
      let keys = sortedSelectedKeys(selectedRef.current);
      if (!keys.length) {
        const { row, col } = activeRef.current;
        keys = [cellKey(row, col)];
      }
      // Expand to full rectangle if selection is sparse (Excel fill behavior on range)
      const positions = keys.map(parseCellKey);
      const r0 = Math.min(...positions.map((p) => p.row));
      const r1 = Math.max(...positions.map((p) => p.row));
      const c0 = Math.min(...positions.map((p) => p.col));
      const c1 = Math.max(...positions.map((p) => p.col));
      const applyKeys = [];
      for (let r = r0; r <= r1; r += 1) {
        for (let c = c0; c <= c1; c += 1) {
          const k = cellKey(r, c);
          if (selectedRef.current.has(k) || keys.length === 1) applyKeys.push(k);
        }
      }
      if (!applyKeys.length) applyKeys.push(...keys);

      const byRow = new Map();
      for (const key of applyKeys) {
        const { row, col } = parseCellKey(key);
        if (!byRow.has(row)) byRow.set(row, []);
        byRow.get(row).push(col);
      }
      setRows((prev) => {
        const next = [...prev];
        for (const [rowIndex, cols] of byRow.entries()) {
          if (!next[rowIndex]) continue;
          let row = {
            ...next[rowIndex],
            extras: { ...(next[rowIndex].extras || {}) },
            cellStyles: { ...(next[rowIndex].cellStyles || {}) },
          };
          for (const colIndex of cols) {
            const col = sheetColumnsRef.current[colIndex];
            if (col && !col.isPad) row = setCellStyle(row, col, patch);
          }
          next[rowIndex] = row;
        }
        rowsRef.current = next;
        return next;
      });
      for (const rowIndex of byRow.keys()) scheduleSave(rowIndex);
      if (applyKeys.length > 1) {
        toast.success(`Formatting applied to ${applyKeys.length} cells`);
      }
    },
    [scheduleSave, toast],
  );

  const currentBorderSide = useCallback(() => {
    const preset =
      BORDER_STYLE_PRESETS.find((p) => p.key === borderStyleKey) || BORDER_STYLE_PRESETS[0];
    return { width: preset.width, style: preset.style, color: borderColor };
  }, [borderColor, borderStyleKey]);

  /**
   * Apply border placement like Google Sheets:
   * all | inner | horizontal | vertical | outer | left | top | right | bottom | clear
   */
  const applyBordersToSelection = useCallback(
    (mode) => {
      if (!sheetEditableRef.current) return;
      const side = currentBorderSide();
      const { r0, r1, c0, c1 } = selectionBounds(selectedRef.current, activeRef.current);

      const patchFor = (r, c) => {
        if (mode === "clear") return { borders: emptyBorders() };
        const borders = {};
        if (mode === "all") {
          borders.top = side;
          borders.right = side;
          borders.bottom = side;
          borders.left = side;
        } else if (mode === "outer") {
          if (r === r0) borders.top = side;
          if (r === r1) borders.bottom = side;
          if (c === c0) borders.left = side;
          if (c === c1) borders.right = side;
        } else if (mode === "inner") {
          if (r > r0) borders.top = side;
          if (r < r1) borders.bottom = side;
          if (c > c0) borders.left = side;
          if (c < c1) borders.right = side;
        } else if (mode === "horizontal") {
          if (r > r0) borders.top = side;
          if (r < r1) borders.bottom = side;
        } else if (mode === "vertical") {
          if (c > c0) borders.left = side;
          if (c < c1) borders.right = side;
        } else if (mode === "left" && c === c0) borders.left = side;
        else if (mode === "top" && r === r0) borders.top = side;
        else if (mode === "right" && c === c1) borders.right = side;
        else if (mode === "bottom" && r === r1) borders.bottom = side;
        return Object.keys(borders).length ? { borders } : null;
      };

      const touched = new Set();
      setRows((prev) => {
        const next = [...prev];
        for (let r = r0; r <= r1; r += 1) {
          if (!next[r]) continue;
          let row = {
            ...next[r],
            extras: { ...(next[r].extras || {}) },
            cellStyles: { ...(next[r].cellStyles || {}) },
          };
          let changed = false;
          for (let c = c0; c <= c1; c += 1) {
            const col = sheetColumnsRef.current[c];
            if (!col || col.isPad) continue;
            const patch = patchFor(r, c);
            if (!patch) continue;
            row = setCellStyle(row, col, patch);
            changed = true;
          }
          if (changed) {
            next[r] = row;
            touched.add(r);
          }
        }
        rowsRef.current = next;
        return next;
      });
      touched.forEach((ri) => scheduleSave(ri));
      setBorderMenuOpen(false);
      setBorderColorOpen(false);
      setBorderStyleOpen(false);
    },
    [currentBorderSide, scheduleSave],
  );

  const copySelection = useCallback(async () => {
    const keys = sortedSelectedKeys(selectedRef.current);
    if (!keys.length) return;
    const positions = keys.map(parseCellKey);
    const r0 = Math.min(...positions.map((p) => p.row));
    const r1 = Math.max(...positions.map((p) => p.row));
    const c0 = Math.min(...positions.map((p) => p.col));
    const c1 = Math.max(...positions.map((p) => p.col));
    const lines = [];
    const currentDraft = draftRef.current;
    for (let r = r0; r <= r1; r += 1) {
      const cells = [];
      for (let c = c0; c <= c1; c += 1) {
        if (!selectedRef.current.has(cellKey(r, c))) {
          cells.push("");
          continue;
        }
        const col = sheetColumnsRef.current[c];
        const row = rowsRef.current[r];
        let text = getCellValue(row, col) || "";
        if (currentDraft && currentDraft.row === r && currentDraft.col === c) text = currentDraft.text;
        cells.push(String(text).replace(/\t/g, " ").replace(/\n/g, " "));
      }
      lines.push(cells.join("\t"));
    }
    const tsv = lines.join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed — allow clipboard access");
    }
  }, [toast]);

  const copySelectionRef = useRef(copySelection);
  copySelectionRef.current = copySelection;

  const pasteSelection = useCallback(async () => {
    if (!sheetEditableRef.current) return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
      const start = activeRef.current;
      const mode = sheetModeRef.current;
      const cols = sheetColumnsRef.current;
      const touched = new Set();
      setRows((prev) => {
        const next = [...prev];
        lines.forEach((line, ri) => {
          const parts = line.split("\t");
          parts.forEach((part, ci) => {
            const rowIndex = start.row + ri;
            const colIndex = start.col + ci;
            if (rowIndex >= MAX_SHEET_ROWS || colIndex >= cols.length) return;
            const col = cols[colIndex];
            const colType = resolveColType(col, mode);
            let row = {
              ...next[rowIndex],
              extras: { ...(next[rowIndex].extras || {}) },
              cellStyles: { ...(next[rowIndex].cellStyles || {}) },
            };
            let cellText = part;
            if (colType === "date") {
              cellText = normalizeDisplayDate(part, monthKeyRef.current);
            } else if (colType === "time") {
              cellText = normalizeDisplayTime(part);
            }
            if (colType === "client") {
              row = { ...setCellValue(row, col, cellText), clientId: null };
            } else {
              row = setCellValue(row, col, cellText);
            }
            if (rowHasWorkValues(row) && !String(row.date || "").trim()) {
              row.date = todayDisplayDate();
              row.dateIso = todayIsoDate();
            }
            next[rowIndex] = row;
            touched.add(rowIndex);
          });
        });
        return next;
      });
      touched.forEach((r) => scheduleSave(r));
      toast.success("Pasted");
    } catch {
      toast.error("Paste failed — allow clipboard access");
    }
  }, [scheduleSave, toast]);

  const pasteSelectionRef = useRef(pasteSelection);
  pasteSelectionRef.current = pasteSelection;

  const clearSelectedCells = useCallback(() => {
    if (!sheetEditableRef.current) return;
    const keys = sortedSelectedKeys(selectedRef.current);
    if (!keys.length) return;
    const mode = sheetModeRef.current;
    const touched = new Set();
    setRows((prev) => {
      const next = [...prev];
      for (const key of keys) {
        const { row: rowIndex, col: colIndex } = parseCellKey(key);
        const col = sheetColumnsRef.current[colIndex];
        if (!col || !next[rowIndex]) continue;
        const colType = resolveColType(col, mode);
        let row = {
          ...next[rowIndex],
          extras: { ...(next[rowIndex].extras || {}) },
          cellStyles: { ...(next[rowIndex].cellStyles || {}) },
        };
        row = setCellValue(row, col, "");
        if (colType === "client" || col.key === "clientName") {
          row.clientId = null;
        }
        next[rowIndex] = row;
        touched.add(rowIndex);
      }
      return next;
    });
    const { row, col } = activeRef.current;
    if (selectedRef.current.has(cellKey(row, col))) {
      setDraft({ row, col, text: "" });
      editOriginRef.current = "";
    }
    touched.forEach((r) => scheduleSave(r));
  }, [scheduleSave]);

  const clearSelectedCellsRef = useRef(clearSelectedCells);
  clearSelectedCellsRef.current = clearSelectedCells;

  const exportMonthPdf = useCallback(() => {
    setExportingPdf(true);
    try {
      const filled = [];
      rowsRef.current.forEach((row, idx) => {
        // PDF: only rows with actual text (skip color-only empty rows)
        if (!rowHasCellValues(row)) return;
        filled.push({ idx, row });
      });
      const monthLabel = tabNames[monthKey] || formatMonthTab(monthKey);
      const roleLabel = effectiveJobRole || staffName || "—";
      const cols = sheetColumnsRef.current;
      const FIXED_KEYS = new Set([
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
      const labeled = cols.filter(
        (c) =>
          String(c.label || headers[c.letter] || "").trim() ||
          FIXED_KEYS.has(c.storageKey),
      );
      const headerLetters = (labeled.length ? labeled : cols).slice(0, 10);
      const th = headerLetters
        .map((c) => `<th>${headers[c.letter] || c.label || c.letter}</th>`)
        .join("");
      const body = filled
        .map(({ row }) => {
          const tds = headerLetters
            .map((c) => {
              const v = getCellValue(row, c) || "";
              return `<td>${String(v)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}</td>`;
            })
            .join("");
          return `<tr>${tds}</tr>`;
        })
        .join("");

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${monthLabel} — Daily Report</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: Arial, sans-serif; color: #111; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .meta { font-size: 12px; color: #444; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #e8f0fe; font-weight: 700; }
  tr:nth-child(even) td { background: #fafafa; }
  .foot { margin-top: 14px; font-size: 11px; color: #666; }
</style></head><body>
  <h1>Daily Report Statement</h1>
  <div class="meta">Month: <strong>${monthLabel}</strong> · Role: <strong>${roleLabel}</strong> · Generated: ${new Date().toLocaleString()}</div>
  <table><thead><tr>${th}</tr></thead><tbody>${
    body || `<tr><td colspan="${headerLetters.length}">No entries this month</td></tr>`
  }</tbody></table>
  <div class="foot">Pixdot Staff Workspace — use Print → Save as PDF</div>
  <script>window.onload=function(){window.print();}</script>
</body></html>`;

      const w = window.open("", "_blank");
      if (!w) {
        toast.error("Pop-up blocked — allow pop-ups to export PDF");
        return;
      }
      w.document.open();
      w.document.write(html);
      w.document.close();
      toast.success("PDF statement opened — choose Save as PDF in print dialog");
    } finally {
      setExportingPdf(false);
    }
  }, [headers, monthKey, effectiveJobRole, staffName, tabNames, toast]);

  useEffect(() => {
    const moveActive = (dRow, dCol, { extend = false } = {}) => {
      const cur = activeRef.current;
      const cols = sheetColumnsRef.current;
      const nextRow = Math.max(0, Math.min(MAX_SHEET_ROWS - 1, cur.row + dRow));
      const nextCol = Math.max(0, Math.min(cols.length - 1, cur.col + dCol));
      if (extend) {
        const range = buildRangeSet(selAnchorRef.current, { row: nextRow, col: nextCol });
        setSelected(range);
        setActive({ row: nextRow, col: nextCol });
        const col = cols[nextCol];
        const row = rowsRef.current[nextRow];
        const value = getCellValue(row, col) || "";
        setDraft({ row: nextRow, col: nextCol, text: value });
        setMenu({ open: false, kind: "" });
      } else {
        selectSingleRef.current(nextRow, nextCol);
      }
      // Tab/Enter preventDefault — must manually focus next input or typing dies
      focusActiveCellInputRef.current(nextRow, nextCol, { selectAll: true });
      return { row: nextRow, col: nextCol };
    };

    const commitActiveDraft = () => {
      const d = draftRef.current;
      const { row, col } = activeRef.current;
      if (d && d.row === row && d.col === col) {
        commitDraftToCellRef.current(row, col, d.text, { save: true });
      } else {
        const colDef = sheetColumnsRef.current[col];
        const rowData = rowsRef.current[row];
        commitDraftToCellRef.current(row, col, getCellValue(rowData, colDef) || "", {
          save: true,
        });
      }
      setMenu({ open: false, kind: "" });
    };

    const onKey = (e) => {
      if (deleteConfirmRef.current) {
        if (e.key === "Escape") {
          e.preventDefault();
          setDeleteConfirm(null);
        }
        return;
      }

      const sheetEl = sheetRef.current;
      const target = e.target;
      const inSheet =
        sheetEl &&
        (sheetEl === document.activeElement ||
          sheetEl.contains(document.activeElement) ||
          (target instanceof Node && sheetEl.contains(target)));
      if (!inSheet) return;

      const mod = e.ctrlKey || e.metaKey;
      const key = e.key;
      const lower = key.toLowerCase();

      if (mod && lower === "c") {
        e.preventDefault();
        copySelectionRef.current();
        return;
      }
      if (mod && lower === "x") {
        if (!sheetEditableRef.current) return;
        e.preventDefault();
        copySelectionRef.current();
        setDeleteConfirm({ mode: "cut" });
        return;
      }
      if (mod && lower === "v") {
        if (!sheetEditableRef.current) return;
        e.preventDefault();
        pasteSelectionRef.current();
        return;
      }

      if (key === "Delete" || key === "Backspace") {
        if (!sheetEditableRef.current) return;
        const selSize = selectedRef.current.size;
        if (selSize > 1 || key === "Delete") {
          e.preventDefault();
          setDeleteConfirm({ mode: "delete" });
          return;
        }
        if (key === "Backspace" && selSize === 1 && target?.tagName === "INPUT") {
          const val = String(target.value || "");
          const start = target.selectionStart ?? 0;
          const end = target.selectionEnd ?? 0;
          const allSelected = val.length > 0 && start === 0 && end === val.length;
          if (val.length > 0 && !allSelected && (start !== 0 || end !== start || end < val.length)) {
            return;
          }
          if (val.length > 0 && !allSelected) return;
        }
        e.preventDefault();
        setDeleteConfirm({ mode: "delete" });
        return;
      }

      if (key === "Escape") {
        e.preventDefault();
        const { row, col } = activeRef.current;
        const origin = editOriginRef.current;
        commitDraftToCellRef.current(row, col, origin, { save: true });
        setDraft({ row, col, text: origin });
        setMenu({ open: false, kind: "" });
        setTabMenu(null);
        if (fullscreenRef.current) setFullscreen(false);
        return;
      }

      if (key === "Enter" && !mod) {
        if (menuRef.current.open && (e.defaultPrevented || target?.tagName === "INPUT")) {
          // Combo may have handled pick; still move down after commit
        }
        e.preventDefault();
        commitActiveDraft();
        moveActive(1, 0);
        return;
      }

      if (key === "Tab") {
        e.preventDefault();
        commitActiveDraft();
        moveActive(0, e.shiftKey ? -1 : 1);
        return;
      }

      if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") {
        const comboOpen = menuRef.current.open;
        if (comboOpen && (key === "ArrowUp" || key === "ArrowDown") && e.defaultPrevented) {
          return;
        }

        // While editing a single cell, Left/Right move the caret (Google Sheets-like).
        if (
          !e.shiftKey &&
          selectedRef.current.size === 1 &&
          target?.tagName === "INPUT" &&
          (key === "ArrowLeft" || key === "ArrowRight")
        ) {
          const val = String(target.value || "");
          const start = target.selectionStart ?? 0;
          const end = target.selectionEnd ?? 0;
          if (start !== end) return; // let browser collapse/move selection
          if (key === "ArrowLeft" && start > 0) return;
          if (key === "ArrowRight" && end < val.length) return;
        }

        e.preventDefault();
        const dRow = key === "ArrowUp" ? -1 : key === "ArrowDown" ? 1 : 0;
        const dCol = key === "ArrowLeft" ? -1 : key === "ArrowRight" ? 1 : 0;
        if (e.shiftKey) {
          moveActive(dRow, dCol, { extend: true });
        } else {
          moveActive(dRow, dCol);
        }
        return;
      }

      // If focus left the cell input after Tab, still allow typing into the active cell
      if (
        sheetEditableRef.current &&
        !mod &&
        !e.altKey &&
        key.length === 1 &&
        target?.tagName !== "INPUT" &&
        target?.tagName !== "TEXTAREA" &&
        target?.tagName !== "SELECT"
      ) {
        const { row, col } = activeRef.current;
        e.preventDefault();
        setDraft({ row, col, text: key });
        commitDraftToCellRef.current(row, col, key, { save: false });
        focusActiveCellInputRef.current(row, col, { selectAll: false });
        requestAnimationFrame(() => {
          const input = sheetRef.current?.querySelector(`[data-cell-key="${row}:${col}"]`);
          if (input instanceof HTMLInputElement) {
            const len = String(input.value || "").length;
            try {
              input.setSelectionRange(len, len);
            } catch {
              /* ignore */
            }
          }
        });
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const onScroll = (e) => setScrollTop(e.currentTarget.scrollTop);

  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const visibleCount = Math.ceil(viewportH / ROW_H) + OVERSCAN * 2;
  const end = Math.min(MAX_SHEET_ROWS, start + visibleCount);
  const offsetY = start * ROW_H;

  const activeCol = sheetColumns[active.col];
  const activeRow = rows[active.row];
  const activeStoredValue = getCellValue(activeRow, activeCol);
  const activeDraftText = draftTextFor(active.row, active.col, activeStoredValue);
  const activeStyle = getCellStyle(activeRow, activeCol);
  const activeSheetRow = active.row + dataRowOffset;

  // Sheets-like: highlight column letters + row numbers for the selection
  const headerHighlight = useMemo(() => {
    const cols = new Set();
    const rowIdxs = new Set();
    for (const key of selected) {
      const p = parseCellKey(key);
      cols.add(p.col);
      rowIdxs.add(p.row);
    }
    cols.add(active.col);
    rowIdxs.add(active.row);
    return { cols, rows: rowIdxs };
  }, [selected, active.col, active.row]);

  const openMenu = (kind) => setMenu({ open: true, kind });
  const closeMenu = () => setMenu({ open: false, kind: "" });

  const addMonthTab = () => {
    const base = months.length ? months[months.length - 1] : monthKey;
    const next = shiftMonthKey(base, 1);
    persistMonths([...months, next]);
    setMonthKey(next);
  };

  const ensurePrevMonth = () => {
    const base = months.length ? months[0] : monthKey;
    const prev = shiftMonthKey(base, -1);
    persistMonths([...months, prev]);
    setMonthKey(prev);
  };

  const startRenameTab = (m) => {
    setRenamingTab(m);
    setRenameValue(tabNames[m] || formatMonthTab(m));
    setTabMenu(null);
  };

  const commitRenameTab = () => {
    if (!renamingTab) return;
    const name = renameValue.trim();
    setTabNames((prev) => {
      const next = { ...prev };
      if (!name || name === formatMonthTab(renamingTab)) delete next[renamingTab];
      else next[renamingTab] = name;
      saveTabNames(next);
      return next;
    });
    setRenamingTab(null);
    setRenameValue("");
  };

  const deleteMonthTab = async (m) => {
    setTabMenu(null);
    if (months.length <= 1) {
      toast.error("At least one month sheet is required.");
      return;
    }
    const ok = window.confirm(
      `Delete sheet “${tabLabel(m)}”?\nAll report rows in this month will be removed.`,
    );
    if (!ok) return;
    try {
      await api.delete("/api/reports/sheet/month", {
        data: {
          monthKey: m,
          staffId: isAdmin ? staffId : undefined,
        },
      });
      setTabNames((prev) => {
        const next = { ...prev };
        delete next[m];
        saveTabNames(next);
        return next;
      });
      const remaining = months.filter((x) => x !== m);
      persistMonths(remaining);
      if (monthKey === m) {
        setMonthKey(remaining[remaining.length - 1] || monthKeyFromDate());
      }
      toast.success("Month sheet deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete month sheet.");
    }
  };

  const cellInputStyle = (row, col, value) => {
    const st = getCellStyle(row, col);
    const customFill = st.background && st.background !== "transparent";
    const bg =
      customFill
        ? st.background
        : resolveColType(col, sheetMode) === "status" && value
          ? statusColor(value)
          : undefined;
    return {
      fontFamily: st.fontFamily || "Arial",
      fontSize: `${st.fontSize || 12}px`,
      background: bg || "transparent",
    };
  };

  const cellBoxStyle = (row, col, value, { isSel } = {}) => {
    const st = getCellStyle(row, col);
    const inputStyle = cellInputStyle(row, col, value);
    const customFill = inputStyle.background && inputStyle.background !== "transparent";
    return {
      width: widthOf(col.letter),
      background: customFill ? inputStyle.background : isSel ? "#e8f0fe" : inputStyle.background,
      ...bordersToCss(st.borders),
    };
  };

  const onConfirmDelete = () => {
    clearSelectedCells();
    setDeleteConfirm(null);
  };

  const staffParams = useCallback(() => {
    return isAdmin && staffId ? { staffId } : undefined;
  }, [isAdmin, staffId]);

  const openAddColumn = () => {
    setAddColumnForm({ label: "", fieldType: "text", afterKey: "" });
    setAddColumnOpen(true);
  };

  const submitAddColumn = async () => {
    const label = String(addColumnForm.label || "").trim();
    if (!label) {
      toast.error("Column name is required.");
      return;
    }
    try {
      await api.post(
        "/api/daily-report/fields",
        {
          label,
          fieldType: addColumnForm.fieldType,
          afterKey: addColumnForm.afterKey || undefined,
          ...(isAdmin && staffId ? { staffId } : {}),
        },
        { params: staffParams() },
      );
      setAddColumnOpen(false);
      await loadFields();
      toast.success("Column added.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add column.");
    }
  };

  const submitEditColumn = async () => {
    if (!editColumn?.id) return;
    const label = String(editColumn.label || "").trim();
    if (!label) {
      toast.error("Column name is required.");
      return;
    }
    try {
      await api.put(
        `/api/daily-report/fields/${editColumn.id}`,
        { label, ...(isAdmin && staffId ? { staffId } : {}) },
        { params: staffParams() },
      );
      setEditColumn(null);
      await loadFields();
      toast.success("Column updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update column.");
    }
  };

  const confirmDeleteColumn = async () => {
    if (!fieldConfirm || fieldConfirm.kind !== "column") return;
    try {
      await api.delete(`/api/daily-report/fields/${fieldConfirm.id}`, {
        params: staffParams(),
        data: isAdmin && staffId ? { staffId } : undefined,
      });
      setFieldConfirm(null);
      setColMenuLetter(null);
      await loadFields();
      toast.success("Column deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete column.");
    }
  };

  const reloadFieldsAndOptionsModal = async (fieldId) => {
    const fields = await loadFields();
    const cols = columnsFromStaffFields(fields);
    const nextCol = cols.find((c) => String(c.id) === String(fieldId));
    if (nextCol) setOptionsModal(nextCol);
  };

  const addOption = async () => {
    const col = optionsModal;
    if (!col?.id) return;
    const label = String(optionDraft || "").trim();
    if (!label) {
      toast.error("Option name is required.");
      return;
    }
    try {
      await api.post(
        `/api/daily-report/fields/${col.id}/options`,
        { label, ...(isAdmin && staffId ? { staffId } : {}) },
        { params: staffParams() },
      );
      setOptionDraft("");
      await reloadFieldsAndOptionsModal(col.id);
      toast.success("Option added.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add option.");
    }
  };

  const saveEditingOption = async () => {
    if (!editingOption?.id) return;
    const label = String(editingOption.label || "").trim();
    if (!label) {
      toast.error("Option name is required.");
      return;
    }
    try {
      await api.put(
        `/api/daily-report/options/${editingOption.id}`,
        { label, ...(isAdmin && staffId ? { staffId } : {}) },
        { params: staffParams() },
      );
      setEditingOption(null);
      await reloadFieldsAndOptionsModal(optionsModal?.id);
      toast.success("Option updated.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update option.");
    }
  };

  const confirmDeleteOption = async () => {
    if (!fieldConfirm || fieldConfirm.kind !== "option") return;
    try {
      await api.delete(`/api/daily-report/options/${fieldConfirm.id}`, {
        params: staffParams(),
        data: isAdmin && staffId ? { staffId } : undefined,
      });
      setFieldConfirm(null);
      await reloadFieldsAndOptionsModal(optionsModal?.id);
      toast.success("Option deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete option.");
    }
  };

  const onConfirmFieldAction = () => {
    if (fieldConfirm?.kind === "column") confirmDeleteColumn();
    else if (fieldConfirm?.kind === "option") confirmDeleteOption();
  };

  const staffSubtitle = [
    todaySubtitleDate(),
    staffName ? staffName : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      className={`${adminStyles.adminPageSection} ${styles.page} ${
        fullscreen ? styles.pageFullscreen : ""
      }`}
    >
      <div className={`${adminStyles.pageHeading} ${styles.headingRow}`}>
        <div className={styles.titleRowCompact}>
          <div className={styles.titleBlock}>
            <h2 className={adminStyles.pageHeadingTitle}>
              {isAdmin ? "Daily Report" : "My Daily Report"}
            </h2>
            {fullscreen ? null : (
              <p className={`${adminStyles.pageHeadingSub} ${styles.titleSub}`}>
                {isAdmin
                  ? staffName
                    ? `${todaySubtitleDate()} · ${staffName}`
                    : "View or edit a staff member’s personal report sheet"
                  : staffSubtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className={styles.toolsMenuBtn}
            onClick={() => setToolsMenuOpen((v) => !v)}
            aria-expanded={toolsMenuOpen}
            aria-label={toolsMenuOpen ? "Close tools menu" : "Open tools menu"}
            title="Tools"
          >
            {toolsMenuOpen ? <FaXmark /> : <FaEllipsisVertical />}
          </button>
        </div>

        <div
          className={`${styles.toolbar} ${styles.toolsPanel} ${
            toolsMenuOpen ? styles.toolsPanelOpen : ""
          }`}
        >
          {isAdmin ? (
            <>
              {showAdminStaffPicker ? (
                <>
                  <span className={styles.toolbarLabel}>Staff</span>
                  <select
                    className={styles.staffSelect}
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    aria-label="Select staff"
                  >
                    <option value="">Select staff…</option>
                    {filteredStaffList.map((s) => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <span className={styles.toolbarLabel}>Role filter</span>
                  <select
                    className={styles.staffSelect}
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setStaffId("");
                    }}
                    aria-label="Filter by role"
                  >
                    <option value="">All roles</option>
                    {distinctRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
              {staffId ? (
                <div className={styles.viewToggle} role="group" aria-label="View or edit">
                  <button
                    type="button"
                    className={`${styles.toolBtn} ${viewMode === "view" ? styles.toolBtnActive : ""}`}
                    onClick={() => setViewMode("view")}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className={`${styles.toolBtn} ${viewMode === "edit" ? styles.toolBtnActive : ""}`}
                    onClick={() => setViewMode("edit")}
                  >
                    Edit
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
          <div className={styles.toolbarPrimary}>
            {canManageColumns ? (
              <button
                type="button"
                className={`${styles.toolBtn} ${styles.addColBtn}`}
                onClick={() => {
                  openAddColumn();
                  setToolsMenuOpen(false);
                }}
              >
                + Add Column
              </button>
            ) : null}
            <label className={styles.filterWrap}>
              <span className={styles.toolbarLabel}>Filter date</span>
              <input
                type="date"
                className={styles.filterInput}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                aria-label="Filter by date"
              />
            </label>
            {dateFilter ? (
              <button type="button" className={adminStyles.buttonGhost} onClick={() => setDateFilter("")}>
                Clear
              </button>
            ) : null}
            <span className={`${styles.saveHint} ${saving ? styles.saveHintSaving : ""}`}>
              {!sheetEditable
                ? "View only"
                : saving
                  ? "Saving…"
                  : "Auto-saves on edit"}
            </span>
          </div>

          <div className={styles.toolsPanelExtras}>
            <select
              className={styles.formatSelect}
              value={activeStyle.fontFamily || "Arial"}
              onChange={(e) => applySelectionStyle({ fontFamily: e.target.value })}
              aria-label="Font family"
              disabled={!sheetEditable}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              className={`${styles.formatSelect} ${styles.formatSize}`}
              value={activeStyle.fontSize || 12}
              onChange={(e) => applySelectionStyle({ fontSize: Number(e.target.value) })}
              aria-label="Font size"
              disabled={!sheetEditable}
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className={styles.swatchRow} role="group" aria-label="Fill color">
              {FILL_COLORS.map((color) => {
                const activeFill =
                  (activeStyle.background || "transparent") === color ||
                  (!activeStyle.background && color === "transparent");
                return (
                  <button
                    key={color}
                    type="button"
                    className={`${styles.swatch} ${activeFill ? styles.swatchActive : ""}`}
                    style={{
                      background:
                        color === "transparent"
                          ? "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 10px 10px"
                          : color,
                    }}
                    title={color}
                    aria-label={`Fill ${color}`}
                    disabled={!sheetEditable}
                    onClick={() => applySelectionStyle({ background: color })}
                  />
                );
              })}
            </div>

            <div className={styles.borderToolWrap}>
              <button
                type="button"
                className={`${styles.borderToolBtn} ${borderMenuOpen ? styles.toolBtnActive : ""}`}
                disabled={!sheetEditable}
                aria-label="Borders"
                title="Borders"
                onClick={() => {
                  setBorderMenuOpen((o) => !o);
                  setBorderColorOpen(false);
                  setBorderStyleOpen(false);
                }}
              >
                <BorderIcon kind="all" />
              </button>
              {borderMenuOpen ? (
                <div className={styles.borderMenu} role="dialog" aria-label="Border options">
                  <div className={styles.borderPlacementGrid}>
                    {[
                      ["all", "All borders"],
                      ["inner", "Inner borders"],
                      ["horizontal", "Horizontal borders"],
                      ["vertical", "Vertical borders"],
                      ["outer", "Outer borders"],
                      ["left", "Left border"],
                      ["top", "Top border"],
                      ["right", "Right border"],
                      ["bottom", "Bottom border"],
                      ["clear", "Clear borders"],
                    ].map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        className={styles.borderPlaceBtn}
                        title={label}
                        aria-label={label}
                        onClick={() => applyBordersToSelection(mode)}
                      >
                        <BorderIcon kind={mode} />
                      </button>
                    ))}
                  </div>
                  <div className={styles.borderMenuDivider} />
                  <div className={styles.borderStyleCol}>
                    <div className={styles.borderColorWrap}>
                      <button
                        type="button"
                        className={styles.borderColorBtn}
                        title="Border color"
                        aria-label="Border color"
                        onClick={() => {
                          setBorderColorOpen((o) => !o);
                          setBorderStyleOpen(false);
                        }}
                      >
                        <span className={styles.borderPencil}>✎</span>
                        <span
                          className={styles.borderColorBar}
                          style={{ background: borderColor }}
                        />
                      </button>
                      {borderColorOpen ? (
                        <div className={styles.borderColorPop}>
                          <div className={styles.borderColorGrid}>
                            {BORDER_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                className={`${styles.borderColorSwatch} ${
                                  borderColor === c ? styles.swatchActive : ""
                                }`}
                                style={{ background: c }}
                                title={c}
                                aria-label={`Border color ${c}`}
                                onClick={() => {
                                  setBorderColor(c);
                                  setBorderColorOpen(false);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className={styles.borderStyleWrap}>
                      <button
                        type="button"
                        className={styles.borderStyleBtn}
                        title="Border style"
                        aria-label="Border style"
                        onClick={() => {
                          setBorderStyleOpen((o) => !o);
                          setBorderColorOpen(false);
                        }}
                      >
                        <span className={styles.borderStylePreview} data-style={borderStyleKey} />
                      </button>
                      {borderStyleOpen ? (
                        <div className={styles.borderStylePop}>
                          {BORDER_STYLE_PRESETS.map((p) => (
                            <button
                              key={p.key}
                              type="button"
                              className={`${styles.borderStyleOption} ${
                                borderStyleKey === p.key ? styles.borderStyleOptionActive : ""
                              }`}
                              onClick={() => {
                                setBorderStyleKey(p.key);
                                setBorderStyleOpen(false);
                              }}
                            >
                              <span
                                className={styles.borderStyleLine}
                                style={{
                                  borderBottomWidth: p.width,
                                  borderBottomStyle: p.style,
                                  borderBottomColor: "#202124",
                                }}
                              />
                              {borderStyleKey === p.key ? <span>✓</span> : null}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={styles.toolbarSpacer} />

            <div className={styles.panelActionRow}>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={() => copySelection()}
                disabled={!sheetEditable}
              >
                Copy
              </button>
              <button
                type="button"
                className={styles.toolBtn}
                onClick={() => pasteSelection()}
                disabled={!sheetEditable}
              >
                Paste
              </button>
              <button
                type="button"
                className={styles.pdfBtn}
                onClick={() => {
                  exportMonthPdf();
                  setToolsMenuOpen(false);
                }}
                disabled={exportingPdf}
              >
                {exportingPdf ? "PDF…" : "PDF Statement"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isAdmin && !staffId ? (
        <p className={styles.loading}>Select a staff member</p>
      ) : (
        <div className={styles.sheetShell} ref={sheetRef} tabIndex={-1}>
          <div className={styles.formulaBar}>
            <span className={styles.formulaName}>
              {activeCol?.letter}
              {activeSheetRow}
            </span>
            <input
              className={styles.formulaInput}
              value={activeDraftText}
              readOnly={!sheetEditable}
              onChange={(e) => {
                if (!sheetEditable) return;
                const text = e.target.value;
                setDraftText(active.row, active.col, text);
                commitDraftToCell(active.row, active.col, text, { save: false });
                const colType = resolveColType(activeCol, sheetMode);
                if (isComboType(colType)) openMenu(colType);
              }}
              onFocus={() => {
                setDraftText(active.row, active.col, activeStoredValue || "");
                const colType = resolveColType(activeCol, sheetMode);
                if (sheetEditable && isComboType(colType)) openMenu(colType);
              }}
              onBlur={() => {
                if (!sheetEditable) return;
                commitDraftToCell(active.row, active.col, activeDraftText, { save: true });
              }}
              onKeyDown={(e) => {
                if (!sheetEditable) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitDraftToCell(active.row, active.col, activeDraftText, { save: true });
                  closeMenu();
                  const nextRow = Math.min(MAX_SHEET_ROWS - 1, active.row + 1);
                  selectSingle(nextRow, active.col);
                }
              }}
              aria-label="Formula bar"
            />
            {selected.size > 1 ? (
              <span className={styles.selHint}>{selected.size} cells</span>
            ) : null}
          </div>

          {loading ? (
            <div className={styles.loading}>Loading sheet…</div>
          ) : (
            <div className={styles.gridScroll} ref={scrollRef} onScroll={onScroll}>
              <div className={styles.headerBlock}>
                <div
                  className={`${styles.headerRow} ${styles.letterRow}`}
                  style={{ gridTemplateColumns: `var(--sheet-row-head) ${colTemplate}` }}
                >
                  <div className={styles.corner} />
                  {sheetColumns.map((col, colIndex) => {
                    const isActiveCol = active.col === colIndex;
                    const inSelCol = headerHighlight.cols.has(colIndex);
                    return (
                      <div
                        key={col.letter}
                        className={`${styles.colLetter} ${
                          isActiveCol
                            ? styles.colLetterActive
                            : inSelCol
                              ? styles.colLetterSelected
                              : ""
                        }`}
                        style={{ width: widthOf(col.letter) }}
                        aria-current={isActiveCol ? "true" : undefined}
                        title={`Select column ${col.letter}`}
                        onMouseDown={(e) => {
                          if (e.button !== 0) return;
                          if (e.target?.closest?.(`.${styles.colResize}`)) return;
                          e.preventDefault();
                          selectEntireColumn(colIndex);
                          sheetRef.current?.focus?.();
                        }}
                      >
                        {col.letter}
                        <ColResizeHandle onResizeStart={(e) => startColResize(col.letter, e)} />
                      </div>
                    );
                  })}
                </div>

                {showHeadingRow ? (
                  <div
                    className={`${styles.headerRow} ${styles.titleRow}`}
                    style={{ gridTemplateColumns: `var(--sheet-row-head) ${colTemplate}` }}
                  >
                    <div className={`${styles.rowHead} ${styles.titleRowHead}`}>1</div>
                    {sheetColumns.map((col, colIndex) => {
                      const isActiveCol = active.col === colIndex;
                      const inSelCol = headerHighlight.cols.has(colIndex);
                      return (
                      <div
                        key={col.letter}
                        className={`${styles.colTitle} ${
                          isActiveCol
                            ? styles.colTitleActive
                            : inSelCol
                              ? styles.colTitleSelected
                              : ""
                        }`}
                        style={{ width: widthOf(col.letter) }}
                      >
                        <input
                          className={styles.colTitleInput}
                          value={headers[col.letter] || ""}
                          readOnly={Boolean(col.id) || !sheetEditable}
                          onChange={(e) => {
                            if (col.id || !sheetEditable) return;
                            updateHeader(col.letter, e.target.value);
                          }}
                          aria-label={`Header ${col.letter}`}
                        />
                        {col.id && !col.isPad && canManageColumns ? (
                          <div className={styles.colMenuWrap} onMouseDown={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className={styles.colMenuBtn}
                              aria-label={`Column menu ${col.letter}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setColMenuLetter((prev) => (prev === col.letter ? null : col.letter));
                              }}
                            >
                              ⋮
                            </button>
                            {colMenuLetter === col.letter ? (
                              <div className={styles.colMenu} onMouseDown={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setColMenuLetter(null);
                                    setEditColumn({
                                      id: col.id,
                                      label: headers[col.letter] || col.label || "",
                                    });
                                  }}
                                >
                                  Edit Column
                                </button>
                                {isManageableOptionsType(col) ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setColMenuLetter(null);
                                      setOptionDraft("");
                                      setEditingOption(null);
                                      setOptionsModal(col);
                                    }}
                                  >
                                    Manage Options
                                  </button>
                                ) : null}
                                {col.id ? (
                                  <button
                                    type="button"
                                    className={styles.colMenuDanger}
                                    onClick={() => {
                                      setColMenuLetter(null);
                                      setFieldConfirm({ kind: "column", id: col.id });
                                    }}
                                  >
                                    Delete Column
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <ColResizeHandle onResizeStart={(e) => startColResize(col.letter, e)} />
                      </div>
                    );
                    })}
                  </div>
                ) : null}
              </div>

              <div className={styles.gridInner} style={{ height: MAX_SHEET_ROWS * ROW_H }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                  {Array.from({ length: end - start }, (_, i) => {
                    const rowIndex = start + i;
                    const row = rows[rowIndex];
                    const sheetRowNum = rowIndex + dataRowOffset;
                    const isActiveRow = active.row === rowIndex;
                    const inSelRow = headerHighlight.rows.has(rowIndex);

                    return (
                      <div
                        key={rowIndex}
                        className={styles.dataRow}
                        style={{ gridTemplateColumns: `var(--sheet-row-head) ${colTemplate}` }}
                      >
                        <div
                          className={`${styles.rowHead} ${
                            isActiveRow
                              ? styles.rowHeadActive
                              : inSelRow
                                ? styles.rowHeadSelected
                                : ""
                          }`}
                          aria-current={isActiveRow ? "true" : undefined}
                          title={`Select row ${sheetRowNum}`}
                          onMouseDown={(e) => {
                            if (e.button !== 0) return;
                            e.preventDefault();
                            selectEntireRow(rowIndex);
                            sheetRef.current?.focus?.();
                          }}
                        >
                          {sheetRowNum}
                        </div>
                        {sheetColumns.map((col, colIndex) => {
                          const colType = resolveColType(col, sheetMode);
                          const stored = getCellValue(row, col);
                          const isActive = active.row === rowIndex && active.col === colIndex;
                          const isSel = selected.has(cellKey(rowIndex, colIndex));
                          const value = isActive ? draftTextFor(rowIndex, colIndex, stored) : stored;
                          const inputStyle = cellInputStyle(row, col, value);
                          const comboOpen =
                            isActive && menu.open && menu.kind === colType && isComboType(colType);

                          return (
                            <div
                              key={col.letter}
                              className={`${styles.cell} ${isActive ? styles.cellActive : ""} ${
                                isSel && !isActive ? styles.cellSelected : ""
                              } ${isSel && isActive ? styles.cellSelectedActive : ""}`}
                              style={cellBoxStyle(row, col, value, { isSel })}
                              title={value || undefined}
                              onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex, colType)}
                            >
                              {isComboType(colType) && colType !== "client" ? (
                                <OptionCombobox
                                  value={stored}
                                  options={col.options || []}
                                  open={comboOpen}
                                  draftText={draftTextFor(rowIndex, colIndex, stored)}
                                  placeholder={isActive && sheetEditable ? "Type or choose..." : ""}
                                  inputStyle={inputStyle}
                                  readOnly={!sheetEditable}
                                  cellKeyAttr={`${rowIndex}:${colIndex}`}
                                  onFocusCell={() =>
                                    selectSingle(rowIndex, colIndex, {
                                      openCombo: sheetEditable,
                                    })
                                  }
                                  onOpen={() => openMenu(colType)}
                                  onClose={closeMenu}
                                  onDraftChange={(q) => setDraftText(rowIndex, colIndex, q)}
                                  onCommit={(next, { save }) => {
                                    setDraftText(rowIndex, colIndex, next);
                                    commitDraftToCell(rowIndex, colIndex, next, { save });
                                  }}
                                  onPick={(opt) => {
                                    setDraftText(rowIndex, colIndex, opt);
                                    commitDraftToCell(rowIndex, colIndex, opt, { save: true });
                                    closeMenu();
                                  }}
                                />
                              ) : colType === "client" ? (
                                <div className={styles.comboWrap}>
                                  <input
                                    className={styles.cellInput}
                                    style={inputStyle}
                                    value={value}
                                    readOnly={!sheetEditable}
                                    data-cell-key={`${rowIndex}:${colIndex}`}
                                    placeholder={
                                      isActive && sheetEditable
                                        ? clientsLoading
                                          ? "Loading…"
                                          : "Type client…"
                                        : ""
                                    }
                                    onFocus={() =>
                                      selectSingle(rowIndex, colIndex, {
                                        openCombo: sheetEditable,
                                      })
                                    }
                                    onChange={(e) => {
                                      if (!sheetEditable) return;
                                      const q = e.target.value;
                                      setDraftText(rowIndex, colIndex, q);
                                      openMenu("client");
                                      commitDraftToCell(rowIndex, colIndex, q, { save: false });
                                    }}
                                    onKeyDown={(e) => {
                                      if (!sheetEditable) return;
                                      if (e.key === "ArrowDown") {
                                        e.preventDefault();
                                        if (!comboOpen) openMenu("client");
                                        setClientHighlight((h) =>
                                          Math.min(h + 1, Math.max(filteredClients.length - 1, 0)),
                                        );
                                      } else if (e.key === "ArrowUp") {
                                        e.preventDefault();
                                        setClientHighlight((h) => Math.max(h - 1, 0));
                                      } else if (e.key === "Enter") {
                                        e.preventDefault();
                                        const pick =
                                          filteredClients[
                                            Math.min(
                                              clientHighlight,
                                              Math.max(filteredClients.length - 1, 0),
                                            )
                                          ] || filteredClients[0];
                                        if (pick) {
                                          setDraftText(rowIndex, colIndex, pick.name);
                                          updateRow(rowIndex, (r) => ({
                                            ...r,
                                            clientId: pick.id,
                                            clientName: pick.name,
                                          }));
                                          closeMenu();
                                        } else {
                                          commitDraftToCell(rowIndex, colIndex, value, {
                                            save: true,
                                          });
                                          closeMenu();
                                        }
                                      } else if (e.key === "Escape") {
                                        e.preventDefault();
                                        closeMenu();
                                      }
                                    }}
                                    onBlur={() => {
                                      if (!sheetEditable) return;
                                      setTimeout(() => closeMenu(), 150);
                                      scheduleSave(rowIndex);
                                    }}
                                  />
                                  {sheetEditable ? (
                                    <button
                                      type="button"
                                      className={styles.comboCaret}
                                      tabIndex={-1}
                                      aria-label="Show clients"
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        activateCell(rowIndex, colIndex, { openCombo: !comboOpen });
                                        if (comboOpen) closeMenu();
                                        else openMenu("client");
                                      }}
                                    >
                                      ▾
                                    </button>
                                  ) : null}
                                  {comboOpen && sheetEditable ? (
                                    <div className={styles.clientMenu}>
                                      {filteredClients.length === 0 ? (
                                        <div className={styles.clientEmpty}>
                                          {String(value || "").trim()
                                            ? `Press Enter to use “${String(value).trim()}”`
                                            : "No clients found"}
                                        </div>
                                      ) : (
                                        filteredClients.map((c, idx) => (
                                          <button
                                            key={c.id}
                                            type="button"
                                            className={`${styles.clientOption} ${
                                              idx === clientHighlight
                                                ? styles.clientOptionActive
                                                : ""
                                            }`}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onMouseEnter={() => setClientHighlight(idx)}
                                            onClick={() => {
                                              setDraftText(rowIndex, colIndex, c.name);
                                              updateRow(rowIndex, (r) => ({
                                                ...r,
                                                clientId: c.id,
                                                clientName: c.name,
                                              }));
                                              closeMenu();
                                            }}
                                          >
                                            {c.name}
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                <input
                                  className={styles.cellInput}
                                  style={inputStyle}
                                  value={value}
                                  readOnly={!sheetEditable}
                                  data-cell-key={`${rowIndex}:${colIndex}`}
                                  placeholder={
                                    isActive && sheetEditable
                                      ? colType === "date"
                                        ? "DD-MM-YYYY"
                                        : colType === "time"
                                          ? "1.45am"
                                          : ""
                                      : ""
                                  }
                                  onFocus={() => selectSingle(rowIndex, colIndex)}
                                  onChange={(e) => {
                                    if (!sheetEditable) return;
                                    const text = e.target.value;
                                    setDraftText(rowIndex, colIndex, text);
                                    commitDraftToCell(rowIndex, colIndex, text, { save: false });
                                  }}
                                  onBlur={() => {
                                    if (!sheetEditable) return;
                                    if (colType === "date" || colType === "time") {
                                      commitDraftToCell(rowIndex, colIndex, value, {
                                        save: true,
                                        finalize: true,
                                      });
                                    } else {
                                      scheduleSave(rowIndex);
                                    }
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className={styles.sheetTabs} role="tablist" aria-label="Month sheets">
            <div className={styles.sheetTabsLeft}>
              <button
                type="button"
                className={styles.tabAdd}
                onClick={ensurePrevMonth}
                title="Previous month"
              >
                ‹
              </button>
              {months.map((m) =>
                renamingTab === m ? (
                  <input
                    key={m}
                    className={styles.tabRenameInput}
                    value={renameValue}
                    autoFocus
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRenameTab}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitRenameTab();
                      } else if (e.key === "Escape") {
                        setRenamingTab(null);
                      }
                    }}
                    aria-label="Rename sheet"
                  />
                ) : (
                  <div key={m} className={styles.tabItem}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={m === monthKey}
                      className={`${styles.tabBtn} ${m === monthKey ? styles.tabActive : ""}`}
                      onClick={() => setMonthKey(m)}
                      onDoubleClick={() => startRenameTab(m)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        openTabMenuAt(m, e.clientX, e.clientY, e.currentTarget);
                      }}
                      onTouchStart={(e) => startTabLongPress(m, e)}
                      onTouchEnd={clearTabLongPress}
                      onTouchMove={clearTabLongPress}
                      onTouchCancel={clearTabLongPress}
                      title="Long-press or right-click for Rename / Delete"
                    >
                      {tabLabel(m)}
                    </button>
                    <button
                      type="button"
                      className={styles.tabMoreBtn}
                      aria-label={`Options for ${tabLabel(m)}`}
                      title="Rename / Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        const wrap = e.currentTarget.parentElement;
                        openTabMenuAt(m, e.clientX, e.clientY, wrap);
                      }}
                    >
                      ⋮
                    </button>
                  </div>
                ),
              )}
              <button
                type="button"
                className={styles.tabAdd}
                onClick={addMonthTab}
                title="Add next month sheet"
              >
                +
              </button>
            </div>
            <button
              type="button"
              className={styles.fullscreenBtn}
              onClick={() => setFullscreen((v) => !v)}
              title={fullscreen ? "Exit full screen (Esc)" : "Full screen"}
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            >
              {fullscreen ? "><" : "<>"}
            </button>
          </div>

          {tabMenu ? (
            <div
              className={styles.tabContextMenu}
              style={{ left: tabMenu.x, top: tabMenu.y }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <button type="button" onClick={() => startRenameTab(tabMenu.monthKey)}>
                Rename
              </button>
              <button
                type="button"
                className={styles.tabMenuDanger}
                onClick={() => deleteMonthTab(tabMenu.monthKey)}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteConfirm)}
        title="Delete data"
        message="Are you sure you want to delete this data?"
        confirmText="Delete"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={onConfirmDelete}
      />

      <ConfirmModal
        open={Boolean(fieldConfirm)}
        title={fieldConfirm?.kind === "option" ? "Delete option" : "Delete column"}
        message={
          fieldConfirm?.kind === "option"
            ? "Are you sure you want to delete this option?"
            : "Are you sure you want to delete this column? Existing data in this column may no longer be displayed."
        }
        confirmText="Delete"
        onCancel={() => setFieldConfirm(null)}
        onConfirm={onConfirmFieldAction}
      />

      {addColumnOpen ? (
        <div className={adminStyles.modalBackdrop} onClick={() => setAddColumnOpen(false)}>
          <div
            className={adminStyles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <h3 className={adminStyles.cardTitle} style={{ marginTop: 0 }}>
              Add Column
            </h3>
            <label className={adminStyles.cardSub} style={{ display: "block", marginBottom: 6 }}>
              Column Name
            </label>
            <input
              className={adminStyles.input}
              value={addColumnForm.label}
              onChange={(e) => setAddColumnForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Priority"
              autoFocus
            />
            <label
              className={adminStyles.cardSub}
              style={{ display: "block", margin: "14px 0 6px" }}
            >
              Input Type
            </label>
            <div style={{ display: "grid", gap: 6 }}>
              {ADD_COLUMN_TYPES.map((t) => (
                <label key={t.value} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="radio"
                    name="fieldType"
                    checked={addColumnForm.fieldType === t.value}
                    onChange={() => setAddColumnForm((f) => ({ ...f, fieldType: t.value }))}
                  />
                  {t.label}
                </label>
              ))}
            </div>
            <label
              className={adminStyles.cardSub}
              style={{ display: "block", margin: "14px 0 6px" }}
            >
              Add after (optional)
            </label>
            <select
              className={adminStyles.input}
              value={addColumnForm.afterKey}
              onChange={(e) => setAddColumnForm((f) => ({ ...f, afterKey: e.target.value }))}
            >
              <option value="">End of sheet</option>
              {labeledColumns.map((c) => (
                <option key={c.id || c.letter} value={c.fieldKey || c.storageKey || c.key}>
                  {c.label || headers[c.letter] || c.letter}
                </option>
              ))}
            </select>
            <div className={adminStyles.modalActions}>
              <button
                type="button"
                className={adminStyles.buttonGhost}
                onClick={() => setAddColumnOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className={adminStyles.buttonPrimary} onClick={submitAddColumn}>
                Add Column
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editColumn ? (
        <div className={adminStyles.modalBackdrop} onClick={() => setEditColumn(null)}>
          <div
            className={adminStyles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 400 }}
          >
            <h3 className={adminStyles.cardTitle} style={{ marginTop: 0 }}>
              Edit Column
            </h3>
            <label className={adminStyles.cardSub} style={{ display: "block", marginBottom: 6 }}>
              Column Name
            </label>
            <input
              className={adminStyles.input}
              value={editColumn.label}
              onChange={(e) => setEditColumn((c) => ({ ...c, label: e.target.value }))}
              autoFocus
            />
            <div className={adminStyles.modalActions}>
              <button
                type="button"
                className={adminStyles.buttonGhost}
                onClick={() => setEditColumn(null)}
              >
                Cancel
              </button>
              <button type="button" className={adminStyles.buttonPrimary} onClick={submitEditColumn}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {optionsModal ? (
        <div
          className={adminStyles.modalBackdrop}
          onClick={() => {
            setOptionsModal(null);
            setEditingOption(null);
            setOptionDraft("");
          }}
        >
          <div
            className={adminStyles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <h3 className={adminStyles.cardTitle} style={{ marginTop: 0 }}>
              Manage Options — {optionsModal.label || "Column"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {(optionsModal.optionItems || []).length === 0 ? (
                <p className={adminStyles.cardSub} style={{ margin: 0 }}>
                  No options yet.
                </p>
              ) : (
                (optionsModal.optionItems || []).map((opt) => {
                  const oid = opt.id || opt._id;
                  const isEditing = editingOption && String(editingOption.id) === String(oid);
                  return (
                    <div
                      key={oid || opt.label}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      {isEditing ? (
                        <>
                          <input
                            className={adminStyles.input}
                            style={{ flex: 1 }}
                            value={editingOption.label}
                            onChange={(e) =>
                              setEditingOption((o) => ({ ...o, label: e.target.value }))
                            }
                          />
                          <button
                            type="button"
                            className={adminStyles.buttonPrimary}
                            onClick={saveEditingOption}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className={adminStyles.buttonGhost}
                            onClick={() => setEditingOption(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span style={{ flex: 1 }}>{opt.label}</span>
                          <button
                            type="button"
                            className={adminStyles.buttonGhost}
                            onClick={() => setEditingOption({ id: oid, label: opt.label })}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={adminStyles.buttonDanger}
                            onClick={() => setFieldConfirm({ kind: "option", id: oid })}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className={adminStyles.input}
                style={{ flex: 1 }}
                value={optionDraft}
                onChange={(e) => setOptionDraft(e.target.value)}
                placeholder="New option"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOption();
                  }
                }}
              />
              <button type="button" className={adminStyles.buttonPrimary} onClick={addOption}>
                Add Option
              </button>
            </div>
            <div className={adminStyles.modalActions}>
              <button
                type="button"
                className={adminStyles.buttonGhost}
                onClick={() => {
                  setOptionsModal(null);
                  setEditingOption(null);
                  setOptionDraft("");
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
