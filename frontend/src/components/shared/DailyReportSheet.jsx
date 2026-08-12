import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../lib/api.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useWorkspace } from "../../context/WorkspaceContext.jsx";
import {
  MAX_SHEET_ROWS,
  PROJECT_OPTIONS,
  TASK_OPTIONS,
  REPORT_STATUS_OPTIONS,
  ROLE_OPTIONS,
  FONT_FAMILIES,
  FONT_SIZES,
  FILL_COLORS,
  SHEET_COLUMNS,
  createEmptyGrid,
  emptyRow,
  defaultColumnWidths,
  defaultHeadersForRole,
  formatMonthTab,
  getCellValue,
  setCellValue,
  getCellStyle,
  setCellStyle,
  isRowBlank,
  monthKeyFromDate,
  rowToPayload,
  shiftMonthKey,
  todayDisplayDate,
  todayIsoDate,
  resolveColType,
} from "../../lib/dailyReportSheet.js";
import adminStyles from "../admin/Admin.module.css";
import styles from "./DailyReportSheet.module.css";

const ROW_H = 28;
const OVERSCAN = 12;
const COL_WIDTHS_KEY = "pixdot_daily_report_col_widths_v1";
const TAB_NAMES_KEY = "pixdot_daily_report_tab_names_v1";
const ROLE_KEY = "pixdot_report_role_v1";
const MIN_COL_W = 64;
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

function loadRole() {
  const saved = localStorage.getItem(ROLE_KEY);
  if (ROLE_OPTIONS.some((r) => r.value === saved)) return saved;
  return "designer";
}

function headersStorageKey(role) {
  return `pixdot_report_headers_${role}`;
}

function loadHeaders(role) {
  const defaults = defaultHeadersForRole(role);
  if (role === "others") return defaults;
  const saved = loadJson(headersStorageKey(role), null);
  if (!saved || typeof saved !== "object") return defaults;
  return { ...defaults, ...saved };
}

function saveHeaders(role, headers) {
  if (role === "others") return;
  saveJson(headersStorageKey(role), headers);
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

function optionsForType(type) {
  if (type === "project") return PROJECT_OPTIONS;
  if (type === "task") return TASK_OPTIONS;
  if (type === "status") return REPORT_STATUS_OPTIONS;
  return [];
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
  return type === "client" || type === "project" || type === "task" || type === "status";
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
}) {
  const [highlight, setHighlight] = useState(0);
  const display = open ? draftText : value;

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
        onFocus={() => {
          onFocusCell?.();
          onOpen();
          onDraftChange(value || "");
        }}
        onChange={(e) => {
          const next = e.target.value;
          onDraftChange(next);
          onOpen();
          onCommit(next, { save: false });
        }}
        onKeyDown={(e) => {
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
          setTimeout(() => onClose(), 150);
          onCommit(open ? draftText : value, { save: true });
        }}
      />
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
      {open ? (
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

export default function DailyReportSheet({ mode = "staff" }) {
  const toast = useToast();
  const { clients, clientsLoading } = useWorkspace();
  const isAdmin = mode === "admin";

  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate());
  const [months, setMonths] = useState(() => [monthKeyFromDate()]);
  const [staffList, setStaffList] = useState([]);
  const [staffId, setStaffId] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [role, setRole] = useState(loadRole);
  const [headers, setHeaders] = useState(() => loadHeaders(loadRole()));
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

  const scrollRef = useRef(null);
  const sheetRef = useRef(null);
  const saveTimers = useRef({});
  const rowsRef = useRef(rows);
  const selectedRef = useRef(selected);
  const selAnchorRef = useRef(selAnchor);
  const activeRef = useRef(active);
  rowsRef.current = rows;
  selectedRef.current = selected;
  selAnchorRef.current = selAnchor;
  activeRef.current = active;

  const staffKey = isAdmin ? staffId || "admin" : "self";
  const showHeadingRow = role !== "others";
  const dataRowOffset = showHeadingRow ? 2 : 1;

  const colTemplate = useMemo(
    () => SHEET_COLUMNS.map((c) => `${colWidths[c.letter] || c.width}px`).join(" "),
    [colWidths],
  );

  const widthOf = useCallback(
    (letter) => colWidths[letter] || SHEET_COLUMNS.find((c) => c.letter === letter)?.width || 100,
    [colWidths],
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

  const loadSheet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/reports/sheet", {
        params: {
          month: monthKey,
          staffId: isAdmin ? staffId || undefined : undefined,
          date: dateFilter || undefined,
        },
      });
      const data = res.data?.data || {};
      if (Array.isArray(data.staffList)) setStaffList(data.staffList);

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
  }, [monthKey, dateFilter, isAdmin, staffId, toast, clearDraft]);

  useEffect(() => {
    loadMonths();
  }, [loadMonths]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  useEffect(() => {
    if (!isAdmin) return;
    if (staffList.length && !staffId) {
      setStaffId(String(staffList[0].id || staffList[0]._id));
    }
  }, [isAdmin, staffList, staffId]);

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
    const onKey = (e) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("pixdot-sheet-fullscreen");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("pixdot-sheet-fullscreen");
    };
  }, [fullscreen]);

  useEffect(() => {
    if (!tabMenu) return undefined;
    const close = () => setTabMenu(null);
    const t = setTimeout(() => document.addEventListener("mousedown", close), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", close);
    };
  }, [tabMenu]);

  const onRoleChange = (nextRole) => {
    setRole(nextRole);
    localStorage.setItem(ROLE_KEY, nextRole);
    setHeaders(loadHeaders(nextRole));
    setMenu({ open: false, kind: "" });
    clearDraft();
  };

  const updateHeader = (letter, value) => {
    setHeaders((prev) => {
      const next = { ...prev, [letter]: value };
      saveHeaders(role, next);
      return next;
    });
  };

  const tabLabel = useCallback((m) => tabNames[m] || formatMonthTab(m), [tabNames]);

  const persistRow = useCallback(
    async (rowIndex) => {
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
              date: saved.date || next[rowIndex].date,
              dateIso: saved.dateIso || next[rowIndex].dateIso,
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
      if (saveTimers.current[rowIndex]) clearTimeout(saveTimers.current[rowIndex]);
      saveTimers.current[rowIndex] = setTimeout(() => {
        persistRow(rowIndex);
      }, 450);
    },
    [persistRow],
  );

  const updateRow = useCallback(
    (rowIndex, updater, { save = true, autoDate = true } = {}) => {
      setRows((prev) => {
        const next = [...prev];
        let row = {
          ...prev[rowIndex],
          extras: { ...(prev[rowIndex].extras || {}) },
          cellStyles: { ...(prev[rowIndex].cellStyles || {}) },
        };
        row = typeof updater === "function" ? updater(row) : { ...row, ...updater };

        if (autoDate && !isRowBlank(row) && !String(row.date || "").trim()) {
          row.date = todayDisplayDate();
          row.dateIso = todayIsoDate();
        }

        next[rowIndex] = row;
        return next;
      });
      if (save) scheduleSave(rowIndex);
    },
    [scheduleSave],
  );

  const activateCell = useCallback(
    (rowIndex, colIndex, { openCombo = false } = {}) => {
      setActive({ row: rowIndex, col: colIndex });
      const col = SHEET_COLUMNS[colIndex];
      const row = rowsRef.current[rowIndex];
      const value = getCellValue(row, col);
      setDraft({ row: rowIndex, col: colIndex, text: value || "" });
      const colType = resolveColType(col, role);
      if (openCombo && isComboType(colType)) {
        setMenu({ open: true, kind: colType });
      } else {
        setMenu({ open: false, kind: "" });
      }
    },
    [role],
  );

  const selectSingle = useCallback(
    (rowIndex, colIndex, { openCombo = false } = {}) => {
      setSelAnchor({ row: rowIndex, col: colIndex });
      setSelected(new Set([cellKey(rowIndex, colIndex)]));
      activateCell(rowIndex, colIndex, { openCombo });
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
        const col = SHEET_COLUMNS[colIndex];
        const row = rowsRef.current[rowIndex];
        setDraft({ row: rowIndex, col: colIndex, text: getCellValue(row, col) || "" });
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
    (rowIndex, colIndex, text, { save = true } = {}) => {
      const col = SHEET_COLUMNS[colIndex];
      const colType = resolveColType(col, role);
      updateRow(
        rowIndex,
        (r) => {
          if (colType === "client") {
            return { ...setCellValue(r, col, text), clientId: null };
          }
          return setCellValue(r, col, text);
        },
        { save },
      );
    },
    [role, updateRow],
  );

  /** Apply font/fill to every selected cell (Shift/Ctrl ranges). */
  const applySelectionStyle = useCallback(
    (patch) => {
      const keys = sortedSelectedKeys(selectedRef.current);
      if (!keys.length) {
        const { row, col } = activeRef.current;
        keys.push(cellKey(row, col));
      }
      const byRow = new Map();
      for (const key of keys) {
        const { row, col } = parseCellKey(key);
        if (!byRow.has(row)) byRow.set(row, []);
        byRow.get(row).push(col);
      }
      setRows((prev) => {
        const next = [...prev];
        for (const [rowIndex, cols] of byRow.entries()) {
          let row = {
            ...next[rowIndex],
            extras: { ...(next[rowIndex].extras || {}) },
            cellStyles: { ...(next[rowIndex].cellStyles || {}) },
          };
          for (const colIndex of cols) {
            const col = SHEET_COLUMNS[colIndex];
            if (col) row = setCellStyle(row, col, patch);
          }
          next[rowIndex] = row;
        }
        return next;
      });
      for (const rowIndex of byRow.keys()) scheduleSave(rowIndex);
      if (keys.length > 1) {
        toast.success(`Formatting applied to ${keys.length} cells`);
      }
    },
    [scheduleSave, toast],
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
    for (let r = r0; r <= r1; r += 1) {
      const cells = [];
      for (let c = c0; c <= c1; c += 1) {
        if (!selectedRef.current.has(cellKey(r, c))) {
          cells.push("");
          continue;
        }
        const col = SHEET_COLUMNS[c];
        const row = rowsRef.current[r];
        let text = getCellValue(row, col) || "";
        if (draft && draft.row === r && draft.col === c) text = draft.text;
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
  }, [draft, toast]);

  const pasteSelection = useCallback(
    async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) return;
        const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
        const start = activeRef.current;
        const touched = new Set();
        setRows((prev) => {
          const next = [...prev];
          lines.forEach((line, ri) => {
            const parts = line.split("\t");
            parts.forEach((part, ci) => {
              const rowIndex = start.row + ri;
              const colIndex = start.col + ci;
              if (rowIndex >= MAX_SHEET_ROWS || colIndex >= SHEET_COLUMNS.length) return;
              const col = SHEET_COLUMNS[colIndex];
              const colType = resolveColType(col, role);
              let row = {
                ...next[rowIndex],
                extras: { ...(next[rowIndex].extras || {}) },
                cellStyles: { ...(next[rowIndex].cellStyles || {}) },
              };
              if (colType === "client") {
                row = { ...setCellValue(row, col, part), clientId: null };
              } else {
                row = setCellValue(row, col, part);
              }
              if (!isRowBlank(row) && !String(row.date || "").trim()) {
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
    },
    [role, scheduleSave, toast],
  );

  const exportMonthPdf = useCallback(() => {
    setExportingPdf(true);
    try {
      const filled = [];
      rowsRef.current.forEach((row, idx) => {
        if (isRowBlank(row)) return;
        filled.push({ idx, row });
      });
      const monthLabel = tabNames[monthKey] || formatMonthTab(monthKey);
      const roleLabel = ROLE_OPTIONS.find((r) => r.value === role)?.label || role;
      const headerLetters = SHEET_COLUMNS.filter((c) => c.letter <= "J");
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
  }, [headers, monthKey, role, tabNames, toast]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const typing =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        if (typing && String(window.getSelection?.() || "").length) return;
        e.preventDefault();
        copySelection();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        if (typing) return;
        e.preventDefault();
        pasteSelection();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [copySelection, pasteSelection]);

  const onScroll = (e) => setScrollTop(e.currentTarget.scrollTop);

  const start = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const visibleCount = Math.ceil(viewportH / ROW_H) + OVERSCAN * 2;
  const end = Math.min(MAX_SHEET_ROWS, start + visibleCount);
  const offsetY = start * ROW_H;

  const activeCol = SHEET_COLUMNS[active.col];
  const activeRow = rows[active.row];
  const activeStoredValue = getCellValue(activeRow, activeCol);
  const activeDraftText = draftTextFor(active.row, active.col, activeStoredValue);
  const activeStyle = getCellStyle(activeRow, activeCol);
  const activeSheetRow = active.row + dataRowOffset;

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
        : resolveColType(col, role) === "status" && value
          ? statusColor(value)
          : undefined;
    return {
      fontFamily: st.fontFamily || "Arial",
      fontSize: `${st.fontSize || 12}px`,
      background: bg || "transparent",
    };
  };

  return (
    <section
      className={`${adminStyles.adminPageSection} ${styles.page} ${
        fullscreen ? styles.pageFullscreen : ""
      }`}
    >
      <div className={`${adminStyles.pageHeading} ${styles.headingRow}`}>
        <div>
          <h2 className={adminStyles.pageHeadingTitle}>Daily Report</h2>
          {fullscreen ? null : (
            <p className={adminStyles.pageHeadingSub}>
              Google Sheets–style report — role templates, formatting, month tabs
            </p>
          )}
        </div>
        <div className={styles.toolbar}>
          {isAdmin ? (
            <>
              <span className={styles.toolbarLabel}>Staff</span>
              <select
                className={styles.staffSelect}
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                aria-label="Select staff"
              >
                <option value="">Select staff…</option>
                {staffList.map((s) => (
                  <option key={s.id || s._id} value={s.id || s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <span className={styles.toolbarLabel}>Role</span>
          <select
            className={styles.staffSelect}
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            aria-label="Select role"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <span className={styles.toolbarLabel}>Filter date</span>
          <input
            type="date"
            className={styles.filterInput}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date"
          />
          {dateFilter ? (
            <button type="button" className={adminStyles.buttonGhost} onClick={() => setDateFilter("")}>
              Clear
            </button>
          ) : null}
          <span className={`${styles.saveHint} ${saving ? styles.saveHintSaving : ""}`}>
            {saving ? "Saving…" : "Auto-saves on edit"}
          </span>
        </div>
      </div>

      {isAdmin && !staffId ? (
        <p className={styles.loading}>Select a staff member to open their report sheet.</p>
      ) : (
        <div className={styles.sheetShell} ref={sheetRef} tabIndex={-1}>
          <div className={styles.formatBar}>
            <select
              className={styles.formatSelect}
              value={activeStyle.fontFamily || "Arial"}
              onChange={(e) => applySelectionStyle({ fontFamily: e.target.value })}
              aria-label="Font family"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              className={styles.formatSelect}
              value={activeStyle.fontSize || 12}
              onChange={(e) => applySelectionStyle({ fontSize: Number(e.target.value) })}
              aria-label="Font size"
            >
              {FONT_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
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
                    onClick={() => applySelectionStyle({ background: color })}
                  />
                );
              })}
            </div>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={copySelection}
              title="Copy selection (Ctrl+C)"
            >
              Copy
            </button>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={pasteSelection}
              title="Paste (Ctrl+V)"
            >
              Paste
            </button>
            <button
              type="button"
              className={styles.pdfBtn}
              onClick={exportMonthPdf}
              disabled={exportingPdf}
              title="Export this month as PDF statement"
            >
              {exportingPdf ? "PDF…" : "PDF Statement"}
            </button>
            {selected.size > 1 ? (
              <span className={styles.selHint}>{selected.size} cells selected</span>
            ) : null}
          </div>

          <div className={styles.formulaBar}>
            <span className={styles.formulaName}>
              {activeCol?.letter}
              {activeSheetRow}
            </span>
            <input
              className={styles.formulaInput}
              value={activeDraftText}
              onChange={(e) => {
                const text = e.target.value;
                setDraftText(active.row, active.col, text);
                commitDraftToCell(active.row, active.col, text, { save: false });
                const colType = resolveColType(activeCol, role);
                if (isComboType(colType)) openMenu(colType);
              }}
              onFocus={() => {
                setDraftText(active.row, active.col, activeStoredValue || "");
                const colType = resolveColType(activeCol, role);
                if (isComboType(colType)) openMenu(colType);
              }}
              onBlur={() => {
                commitDraftToCell(active.row, active.col, activeDraftText, { save: true });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitDraftToCell(active.row, active.col, activeDraftText, { save: true });
                  closeMenu();
                }
              }}
              aria-label="Formula bar"
            />
          </div>

          {loading ? (
            <div className={styles.loading}>Loading sheet…</div>
          ) : (
            <div className={styles.gridScroll} ref={scrollRef} onScroll={onScroll}>
              <div className={styles.headerBlock}>
                <div
                  className={`${styles.headerRow} ${styles.letterRow}`}
                  style={{ gridTemplateColumns: `44px ${colTemplate}` }}
                >
                  <div className={styles.corner} />
                  {SHEET_COLUMNS.map((col) => (
                    <div
                      key={col.letter}
                      className={styles.colLetter}
                      style={{ width: widthOf(col.letter) }}
                    >
                      {col.letter}
                      <ColResizeHandle onResizeStart={(e) => startColResize(col.letter, e)} />
                    </div>
                  ))}
                </div>

                {showHeadingRow ? (
                  <div
                    className={`${styles.headerRow} ${styles.titleRow}`}
                    style={{ gridTemplateColumns: `44px ${colTemplate}` }}
                  >
                    <div className={`${styles.rowHead} ${styles.titleRowHead}`}>1</div>
                    {SHEET_COLUMNS.map((col) => (
                      <div
                        key={col.letter}
                        className={styles.colTitle}
                        style={{ width: widthOf(col.letter) }}
                      >
                        <input
                          className={styles.colTitleInput}
                          value={headers[col.letter] || ""}
                          onChange={(e) => updateHeader(col.letter, e.target.value)}
                          aria-label={`Header ${col.letter}`}
                        />
                        <ColResizeHandle onResizeStart={(e) => startColResize(col.letter, e)} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={styles.gridInner} style={{ height: MAX_SHEET_ROWS * ROW_H }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                  {Array.from({ length: end - start }, (_, i) => {
                    const rowIndex = start + i;
                    const row = rows[rowIndex];
                    const sheetRowNum = rowIndex + dataRowOffset;

                    return (
                      <div
                        key={rowIndex}
                        className={styles.dataRow}
                        style={{ gridTemplateColumns: `44px ${colTemplate}` }}
                      >
                        <div className={styles.rowHead}>{sheetRowNum}</div>
                        {SHEET_COLUMNS.map((col, colIndex) => {
                          const colType = resolveColType(col, role);
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
                              style={{
                                width: widthOf(col.letter),
                                background: inputStyle.background,
                              }}
                              title={value || undefined}
                              onMouseDown={(e) => handleCellMouseDown(e, rowIndex, colIndex, colType)}
                            >
                              {colType === "project" ||
                              colType === "task" ||
                              colType === "status" ? (
                                <OptionCombobox
                                  value={stored}
                                  options={optionsForType(colType)}
                                  open={comboOpen}
                                  draftText={draftTextFor(rowIndex, colIndex, stored)}
                                  placeholder={isActive ? "Type or choose…" : ""}
                                  inputStyle={inputStyle}
                                  onFocusCell={() =>
                                    selectSingle(rowIndex, colIndex, { openCombo: true })
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
                                    placeholder={
                                      isActive
                                        ? clientsLoading
                                          ? "Loading…"
                                          : "Type client…"
                                        : ""
                                    }
                                    onFocus={() =>
                                      selectSingle(rowIndex, colIndex, { openCombo: true })
                                    }
                                    onChange={(e) => {
                                      const q = e.target.value;
                                      setDraftText(rowIndex, colIndex, q);
                                      openMenu("client");
                                      commitDraftToCell(rowIndex, colIndex, q, { save: false });
                                    }}
                                    onKeyDown={(e) => {
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
                                      setTimeout(() => closeMenu(), 150);
                                      scheduleSave(rowIndex);
                                    }}
                                  />
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
                                  {comboOpen ? (
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
                                  placeholder={
                                    isActive
                                      ? colType === "date"
                                        ? "DD-MM-YYYY"
                                        : colType === "time"
                                          ? "2.45pm"
                                          : ""
                                      : ""
                                  }
                                  onFocus={() => selectSingle(rowIndex, colIndex)}
                                  onChange={(e) => {
                                    const text = e.target.value;
                                    setDraftText(rowIndex, colIndex, text);
                                    commitDraftToCell(rowIndex, colIndex, text, { save: false });
                                  }}
                                  onBlur={() => scheduleSave(rowIndex)}
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
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={m === monthKey}
                    className={`${styles.tabBtn} ${m === monthKey ? styles.tabActive : ""}`}
                    onClick={() => setMonthKey(m)}
                    onDoubleClick={() => startRenameTab(m)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setTabMenu({ monthKey: m, x: e.clientX, y: e.clientY });
                    }}
                    title="Double-click to rename · Right-click for options"
                  >
                    {tabLabel(m)}
                  </button>
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
    </section>
  );
}
