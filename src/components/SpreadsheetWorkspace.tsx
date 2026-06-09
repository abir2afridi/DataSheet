/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Lock,
  Unlock,
  Clipboard,
  CheckCircle,
  CornerDownLeft,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  FolderLock,
  FileCheck,
  Eye,
  Type,
  Maximize,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
  EyeOff,
  History,
  MessageSquare
} from "lucide-react";
import { SmartFile, SheetData, CellData, LockLevel, CellStyle } from "../types";
import { parseCellAddress, colLabelToIdx, idxToColLabel, evaluateFormula, detectFormulaError } from "../utils/formulas";
import { getCells, upsertCells, getSheets, createSheet } from "../lib/db";

interface SpreadsheetWorkspaceProps {
  file: SmartFile;
  onUpdateFile: (updatedFile: SmartFile) => void;
  unlockModeActive: boolean;
  onLogActivity: (type: "edit" | "lock" | "unlock" | "copy" | "paste", details: string) => void;
  onAddClipboardEntry: (content: string, type: string, cellAddress: string) => void;
}

export default function SpreadsheetWorkspace({
  file,
  onUpdateFile,
  unlockModeActive,
  onLogActivity,
  onAddClipboardEntry,
}: SpreadsheetWorkspaceProps) {
  // Safe sheet fallbacks
  const sheets = file.sheets || [];
  const [activeSheetId, setActiveSheetId] = useState(file.activeSheetId || sheets[0]?.id || "");

  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];

  // Grid Coordinate details
  const rowCount = activeSheet?.rows || 40;
  const colCount = activeSheet?.cols || 16;
  const cells = activeSheet?.cells || {};

  // Form selections and focus
  const [selectedCell, setSelectedCell] = useState<string | null>(null); // e.g. "A1"
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editInputVal, setEditInputVal] = useState("");
  const [formulaInputVal, setFormulaInputVal] = useState("");

  // Style popovers and tools
  const [textColorTarget, setTextColorTarget] = useState("#ffffff");
  const [bgColorTarget, setBgColorTarget] = useState("#052e16");
  const [frozenRowsCount, setFrozenRowsCount] = useState(activeSheet?.frozenRows || 0);

  // Smart lock triggers
  const [showLockConfigModal, setShowLockConfigModal] = useState(false);
  const [lockTargetCell, setLockTargetCell] = useState<string | null>(null);
  const [lockPasswordInput, setLockPasswordInput] = useState("");
  const [lockLevelSelected, setLockLevelSelected] = useState<LockLevel>(LockLevel.SOFT);

  // Security Unlock popups
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockTargetAddr, setUnlockTargetAddr] = useState<string | null>(null);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState("");
  const [unlockError, setUnlockError] = useState("");

  // Instant Copy Clipboard popover on hover
  const [hoverCell, setHoverCell] = useState<string | null>(null);
  const [showCopyPopover, setShowCopyPopover] = useState<string | null>(null);

  // Sidebar drawers for notes and history
  const [showCellDetailsDrawer, setShowCellDetailsDrawer] = useState(false);
  const [drawerNoteText, setDrawerNoteText] = useState("");

  // Ref selectors for inline editing transitions
  const editorInputRef = useRef<HTMLInputElement>(null);
  const formulaDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Column & Row resize state
  const [colWidths, setColWidths] = useState<Record<number, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({});
  const resizeRef = useRef<{
    type: "col" | "row";
    index: number;
    startX: number;
    startY: number;
    startSize: number;
  } | null>(null);

  const DEF_COL_WIDTH = 96;
  const DEF_ROW_HEIGHT = 24;

  // Window-level resize mouse handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const r = resizeRef.current;
      if (r.type === "col") {
        const diff = e.clientX - r.startX;
        const newWidth = Math.max(40, r.startSize + diff);
        setColWidths(prev => ({ ...prev, [r.index]: Math.round(newWidth) }));
      } else {
        const diff = e.clientY - r.startY;
        const newHeight = Math.max(20, r.startSize + diff);
        setRowHeights(prev => ({ ...prev, [r.index]: Math.round(newHeight) }));
      }
    };
    const handleMouseUp = () => {
      resizeRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Clean up formula debounce on unmount
  useEffect(() => {
    return () => {
      if (formulaDebounceRef.current) clearTimeout(formulaDebounceRef.current);
    };
  }, []);

  // Autosave cells to Supabase on change
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  useEffect(() => {
    if (!activeSheetId) return;
    const t = setTimeout(async () => {
      try {
        await upsertCells(activeSheetId, cellsRef.current);
      } catch {}
    }, 2000);
    return () => clearTimeout(t);
  }, [cells, activeSheetId]);

  // Load cells from Supabase on mount
  useEffect(() => {
    if (!activeSheetId || !file.id) return;
    const loadCells = async () => {
      try {
        const dbSheets = await getSheets(file.id);
        if (dbSheets.length > 0) {
          const dbCells = await getCells(activeSheetId);
          if (Object.keys(dbCells).length > 0) {
            const updatedSheet = { ...activeSheet, cells: dbCells };
            const updatedSheets = sheets.map(s => (s.id === updatedSheet.id ? updatedSheet : s));
            onUpdateFile({ ...file, sheets: updatedSheets, updatedAt: Date.now() });
          }
        }
      } catch {}
    };
    loadCells();
  }, [activeSheetId]);

  // Reset active sheet selection automatically
  useEffect(() => {
    if (sheets.length > 0) {
      const stillValid = sheets.some(s => s.id === activeSheetId);
      if (!activeSheetId || !stillValid) {
        setActiveSheetId(sheets[0].id);
      }
    }
  }, [sheets, activeSheetId]);

  // Sync inputs when active selection shifts
  useEffect(() => {
    if (selectedCell && activeSheet) {
      const cell = activeSheet.cells[selectedCell];
      setFormulaInputVal(cell?.formula || cell?.value || "");
      setEditInputVal(cell?.value || "");
      setDrawerNoteText(cell?.note || "");
    } else {
      setFormulaInputVal("");
      setEditInputVal("");
      setDrawerNoteText("");
    }
  }, [selectedCell, activeSheetId]);

  // Handle keyboard coordinates arrow switches
  useEffect(() => {
    if (isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      const parsed = parseCellAddress(selectedCell);
      if (!parsed) return;

      let r = parsed.rowIdx;
      let c = parsed.colIdx;

      switch (e.key) {
        case "ArrowDown":
          r = Math.min(r + 1, rowCount - 1);
          break;
        case "ArrowUp":
          r = Math.max(r - 1, 0);
          break;
        case "ArrowRight":
          c = Math.min(c + 1, colCount - 1);
          break;
        case "ArrowLeft":
          c = Math.max(c - 1, 0);
          break;
        case "Enter":
          // Open editor
          e.preventDefault();
          handleDoubleClick(selectedCell);
          return;
        default:
          return; // Skip other keys
      }

      e.preventDefault();
      const target = `${idxToColLabel(c)}${r + 1}`;
      setSelectedCell(target);
      // Clean selection range
      setDragStart(target);
      setDragEnd(target);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, isEditing, rowCount, colCount]);

  // Handle paste events with lock protection
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isEditing) return;
      const target = selectedCell;
      if (!target) return;
      const parsed = parseCellAddress(target);
      if (!parsed) return;

      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;

      e.preventDefault();

      const rows = text.split("\n").filter(r => r.length > 0);
      const pasteData = rows.map(r => r.split("\t"));

      const newCells = { ...cells };
      let modifiedCount = 0;

      pasteData.forEach((rowData, ri) => {
        rowData.forEach((val, ci) => {
          const addr = `${idxToColLabel(parsed.colIdx + ci)}${parsed.rowIdx + ri + 1}`;
          const existing = newCells[addr];
          if (existing && existing.lockLevel !== LockLevel.NONE) return; // Skip locked
          newCells[addr] = { ...(existing || { value: "", lockLevel: LockLevel.NONE }), value: val };
          modifiedCount++;
        });
      });

      if (modifiedCount > 0) {
        updateSheetInFile({ ...activeSheet, cells: newCells });
        onLogActivity("paste", `Pasted ${modifiedCount} cell(s) starting at [${target}]`);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [selectedCell, isEditing, cells, activeSheet]);

  // Compute bounding box for cell selections (Bulk actions)
  const selectionRange = useMemo(() => {
    if (!dragStart || !dragEnd) return selectedCell ? [selectedCell] : [];
    const start = parseCellAddress(dragStart);
    const end = parseCellAddress(dragEnd);
    if (!start || !end) return [];

    const out: string[] = [];
    const minRow = Math.min(start.rowIdx, end.rowIdx);
    const maxRow = Math.max(start.rowIdx, end.rowIdx);
    const minCol = Math.min(start.colIdx, end.colIdx);
    const maxCol = Math.max(start.colIdx, end.colIdx);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        out.push(`${idxToColLabel(c)}${r + 1}`);
      }
    }
    return out;
  }, [dragStart, dragEnd, selectedCell]);

  if (!activeSheet) {
    return (
      <div className="flex-1 bg-black text-emerald-500 font-mono p-12 text-center">
        No worksheets initialized for this workspace. Use the sheets controller to spin up nodes.
      </div>
    );
  }

  // Update file container schema helper
  const updateSheetInFile = (updatedSheet: SheetData) => {
    const updatedSheets = sheets.map(s => (s.id === updatedSheet.id ? updatedSheet : s));
    onUpdateFile({
      ...file,
      sheets: updatedSheets,
      updatedAt: Date.now(),
    });
  };

  const handleCellMouseDown = (cellAddress: string) => {
    setIsMouseDown(true);
    // If unlock mode active, check lock and unlock
    const cell = cells[cellAddress];
    if (unlockModeActive && cell && cell.lockLevel !== LockLevel.NONE) {
      setSelectedCell(cellAddress);
      // SOFT lock: single-click auto-unlock without modal
      if (cell.lockLevel === LockLevel.SOFT) {
        const updatedCell: CellData = { ...cell, lockLevel: LockLevel.NONE, lockPassword: undefined };
        updateSheetInFile({
          ...activeSheet,
          cells: { ...cells, [cellAddress]: updatedCell },
        });
        onLogActivity("unlock", `Bypassed soft lock on cell [${cellAddress}]`);
        return;
      }
      setUnlockTargetAddr(cellAddress);
      setUnlockPasswordInput("");
      setUnlockError("");
      setShowUnlockModal(true);
      return;
    }

    setSelectedCell(cellAddress);
    setDragStart(cellAddress);
    setDragEnd(cellAddress);
    setIsEditing(false);
  };

  const handleCellMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleCellDrag = (cellAddress: string) => {
    if (dragStart && isMouseDown) {
      setDragEnd(cellAddress);
    }
  };

  const handleDoubleClick = (cellAddress: string) => {
    const cell = cells[cellAddress];
    // Check lock restriction
    if (cell && cell.lockLevel !== LockLevel.NONE) {
      // Cell is locked. Flash error/warn
      alert(`CELL IS SECURED [Level ${cell.lockLevel}]. Enable UNLOCK MODE to perform safe edits.`);
      return;
    }

    setSelectedCell(cellAddress);
    setIsEditing(true);
    setEditInputVal(cell?.value || "");
    setTimeout(() => {
      editorInputRef.current?.focus();
    }, 40);
  };

  // Cell database updating logic
  const saveActiveCellChange = (newValue: string, forceFormula?: string) => {
    if (!selectedCell) return;
    const currentCell = cells[selectedCell] || { value: "", lockLevel: LockLevel.NONE };

    // Prevent modifications if locked
    if (currentCell.lockLevel !== LockLevel.NONE) return;

    let finalVal = newValue;
    let finalFormula = forceFormula !== undefined ? forceFormula : (newValue.startsWith("=") ? newValue : undefined);

    // Track cell history
    const oldVal = currentCell.value || "";
    const oldFormula = currentCell.formula;

    const historyEntry = {
      timestamp: Date.now(),
      user: "Local Crypt-Admin",
      oldValue: oldVal,
      newValue: finalVal,
      oldFormula,
      newFormula: finalFormula,
    };

    const updatedCell: CellData = {
      ...currentCell,
      value: finalFormula ? evaluateFormula(finalFormula, sheets, activeSheet.id) : finalVal,
      formula: finalFormula,
      history: [...(currentCell.history || []), historyEntry],
    };

    const newCells = { ...cells, [selectedCell]: updatedCell };

    // Formula dependencies re-evaluator. Re-evaluate all other unlocked sheet formulas
    Object.keys(newCells).forEach(coord => {
      const c = newCells[coord];
      if (c && c.formula && c.formula.startsWith("=") && c.lockLevel === LockLevel.NONE) {
        newCells[coord] = { ...c, value: evaluateFormula(c.formula, sheets, activeSheet.id) };
      }
    });

    updateSheetInFile({
      ...activeSheet,
      cells: newCells,
    });

    setIsEditing(false);
    onLogActivity("edit", `Modified cell [${selectedCell}] from "${oldVal}" to "${finalVal}"`);
  };

  // Dynamic range format modifier
  const applyStylesToSelection = (styleChanges: Partial<CellStyle>) => {
    if (selectionRange.length === 0) return;

    const newCells = { ...cells };
    let modifiedCount = 0;
    selectionRange.forEach(addr => {
      const cell = newCells[addr] || { value: "", lockLevel: LockLevel.NONE };
      if (cell.lockLevel === LockLevel.NONE) {
        newCells[addr] = {
          ...cell,
          style: {
            ...(cell.style || {}),
            ...styleChanges,
          },
        };
        modifiedCount++;
      }
    });

    updateSheetInFile({ ...activeSheet, cells: newCells });
    onLogActivity("edit", `Formatted ${modifiedCount} selected cells`);
  };

  // Setup sheet locking options
  const handleLockSetupClick = () => {
    if (!selectedCell) return;
    setLockTargetCell(selectedCell);
    setLockPasswordInput("");
    setLockLevelSelected(LockLevel.SOFT);
    setShowLockConfigModal(true);
  };

  const executeLockingCell = () => {
    if (!lockTargetCell) return;
    const cell = cells[lockTargetCell] || { value: "", lockLevel: LockLevel.NONE };

    // Apply lock
    const updatedCell: CellData = {
      ...cell,
      lockLevel: lockLevelSelected,
      lockPassword: lockLevelSelected === LockLevel.VAULT ? lockPasswordInput : undefined,
    };

    // Bulk apply or single coordinate
    const targetRange = selectionRange.length > 0 ? selectionRange : [lockTargetCell];
    const newCells = { ...cells };

    targetRange.forEach(addr => {
      const targetC = cells[addr] || { value: "", lockLevel: LockLevel.NONE };
      newCells[addr] = {
        ...targetC,
        lockLevel: lockLevelSelected,
        lockPassword: lockLevelSelected === LockLevel.VAULT ? lockPasswordInput : undefined,
      };
    });

    updateSheetInFile({
      ...activeSheet,
      cells: newCells,
    });

    setShowLockConfigModal(false);
    onLogActivity(
      "lock",
      `Secured cells [${targetRange.join(", ")}] with lock level ${LockLevel[lockLevelSelected]}`
    );
  };

  // Security confirmation unlocking validator
  const executeUnlockCell = () => {
    if (!unlockTargetAddr) return;
    const cell = cells[unlockTargetAddr];
    if (!cell) return;

    // Validate levels
    if (cell.lockLevel === LockLevel.SOFT) {
      // Direct pass
    } else if (cell.lockLevel === LockLevel.PROTECTED) {
      // Action approved
    } else if (cell.lockLevel === LockLevel.VAULT) {
      if (unlockPasswordInput !== cell.lockPassword) {
        setUnlockError("CRYPT KEY DISCREPANCY. DECRYPTION ABORTED.");
        return;
      }
    } else if (cell.lockLevel === LockLevel.PERMANENT) {
      // Require special recovery verify
      if (unlockPasswordInput.toLowerCase() !== "restore") {
        setUnlockError("ADMIN AUTHORIZATION REQUIREMENT. TYPE 'restore'!");
        return;
      }
    }

    // Success: remove lock
    const updatedCell: CellData = {
      ...cell,
      lockLevel: LockLevel.NONE,
      lockPassword: undefined,
    };

    updateSheetInFile({
      ...activeSheet,
      cells: {
        ...cells,
        [unlockTargetAddr]: updatedCell,
      },
    });

    setShowUnlockModal(false);
    setSelectedCell(unlockTargetAddr);
    setDragStart(unlockTargetAddr);
    setDragEnd(unlockTargetAddr);
    setUnlockTargetAddr(null);
    onLogActivity("unlock", `Bypassed smart lock on cell [${unlockTargetAddr}]`);
  };

  // Instant Copy Clipboard dispatchers
  const copyCellContent = (addr: string, mode: "plain" | "formula" | "markdown" | "json" | "csv") => {
    const cell = cells[addr];
    if (!cell) return;

    const val = cell.value || "";
    const formulaStr = cell.formula || "";
    let dispatchText = val;

    if (mode === "formula") {
      dispatchText = formulaStr || val;
    } else if (mode === "markdown") {
      dispatchText = `| Cell (${addr}) | Content |\n|---|---|\n| \`${addr}\` | ${val} |`;
    } else if (mode === "json") {
      dispatchText = JSON.stringify({ cell: addr, value: val, formula: formulaStr || null, lock: cell.lockLevel });
    } else if (mode === "csv") {
      dispatchText = `"${addr}","${val.replace(/"/g, '""')}"`;
    }

    navigator.clipboard.writeText(dispatchText);
    onAddClipboardEntry(dispatchText, `Spreadsheet - ${mode.toUpperCase()}`, addr);
    onLogActivity("copy", `Copied cell [${addr}] contents via mode: ${mode}`);

    // Flash Toast Feedback
    setShowCopyPopover(null);
  };

  // Tab controllers: create sheet
  const handleAddNewSheet = () => {
    const newId = `sheet_${Date.now()}`;
    const newName = `Sheet ${sheets.length + 1}`;
    const newSheet: SheetData = {
      id: newId,
      name: newName,
      rows: 40,
      cols: 15,
      cells: {},
      frozenRows: 0,
      frozenCols: 0,
    };

    onUpdateFile({
      ...file,
      sheets: [...sheets, newSheet],
      activeSheetId: newId,
    });
    setActiveSheetId(newId);
    onLogActivity("edit", `Generated new sheet node: "${newName}"`);
  };

  // Tab controllers: delete sheet
  const handleDeleteSheet = (id: string) => {
    if (sheets.length <= 1) {
      alert("Minimum system layout requirement: 1 sheets core mandatory.");
      return;
    }
    const filtered = sheets.filter(s => s.id !== id);
    const nextActive = filtered[0].id;

    onUpdateFile({
      ...file,
      sheets: filtered,
      activeSheetId: nextActive,
    });
    setActiveSheetId(nextActive);
    onLogActivity("edit", `Vaporized sheet core ID: ${id}`);
  };

  // Tab controllers: duplicate sheet
  const handleDuplicateSheet = (s: SheetData) => {
    const newId = `sheet_${Date.now()}`;
    const newName = `${s.name} (Copy)`;
    const duplicated: SheetData = {
      ...s,
      id: newId,
      name: newName,
      cells: { ...s.cells },
    };

    onUpdateFile({
      ...file,
      sheets: [...sheets, duplicated],
      activeSheetId: newId,
    });
    setActiveSheetId(newId);
    onLogActivity("edit", `Duplicated sheet core. Deployment title: "${newName}"`);
  };

  // Checkbox cells converter toggle
  const toggleCheckboxCell = (addr: string) => {
    const cell = cells[addr] || { value: "", lockLevel: LockLevel.NONE };
    if (cell.lockLevel !== LockLevel.NONE) return;

    updateSheetInFile({
      ...activeSheet,
      cells: {
        ...cells,
        [addr]: {
          ...cell,
          isChecked: !cell.isChecked,
          value: (!cell.isChecked).toString().toUpperCase(),
        },
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030604] overflow-hidden relative">
      
      {/* Dynamic Grid Controls Toolbar */}
      <div className="bg-[#050906] border-b border-emerald-500/15 p-2 flex flex-wrap items-center justify-between gap-3 text-emerald-400 select-none shrink-0 font-mono">
        <div className="flex flex-wrap items-center gap-1">
          {/* Quick lock Selection button */}
          <button
            onClick={handleLockSetupClick}
            disabled={!selectedCell}
            className="flex items-center gap-1.5 h-7 px-2.5 bg-[#0e1f18] hover:bg-[#163528] rounded text-emerald-300 font-bold border border-emerald-500/20 disabled:opacity-40 text-xs cursor-pointer select-none"
            title="Lock active selected ranges"
          >
            <Lock size={12} className="text-red-400 animate-pulse" />
            <span>Lock Block</span>
          </button>

          <div className="h-6 w-[1px] bg-emerald-500/10 mx-1 hidden sm:block" />

          {/* Quick cell styles */}
          <button
            onClick={() => applyStylesToSelection({ bold: true })}
            className="h-7 w-8 bg-emerald-950/20 hover:bg-emerald-900 border border-emerald-950 rounded flex items-center justify-center font-bold text-xs"
            title="Bold Selection Grid"
          >
            <Bold size={12} />
          </button>
          <button
            onClick={() => applyStylesToSelection({ italic: true })}
            className="h-7 w-8 bg-emerald-950/20 hover:bg-emerald-900 border border-emerald-950 rounded flex items-center justify-center italic text-xs"
            title="Italic Selection Grid"
          >
            <Italic size={12} />
          </button>
          <button
            onClick={() => applyStylesToSelection({ underline: true })}
            className="h-7 w-8 bg-emerald-950/20 hover:bg-emerald-900 border border-emerald-950 rounded flex items-center justify-center underline text-xs"
            title="Underline Selection Grid"
          >
            <Underline size={12} />
          </button>

          <div className="h-6 w-[1px] bg-emerald-500/10 mx-1" />

          {/* Alignment controls */}
          <button
            onClick={() => applyStylesToSelection({ align: "left" })}
            className="h-7 w-8 bg-emerald-950/20 hover:bg-emerald-900 border border-emerald-950 rounded flex items-center justify-center"
          >
            <AlignLeft size={12} />
          </button>
          <button
            onClick={() => applyStylesToSelection({ align: "center" })}
            className="h-7 w-8 bg-emerald-950/20 hover:bg-emerald-900 border border-emerald-950 rounded flex items-center justify-center"
          >
            <AlignCenter size={12} />
          </button>
          <button
            onClick={() => applyStylesToSelection({ align: "right" })}
            className="h-7 w-8 bg-emerald-950/20 hover:bg-emerald-900 border border-emerald-950 rounded flex items-center justify-center"
          >
            <AlignRight size={12} />
          </button>

          <div className="h-6 w-[1px] bg-emerald-500/10 mx-1" />

          {/* Color picker shortcuts */}
          <button
            onClick={() => applyStylesToSelection({ bg: "#252525", color: "#39ff14" })}
            className="h-7 px-2 bg-black border border-emerald-950 rounded text-[10px] text-[#39ff14] flex items-center gap-1 font-bold"
            title="Splat Cyber Scheme"
          >
            <Palette size={10} />
            <span>Neon Grid</span>
          </button>

          <div className="h-6 w-[1px] bg-emerald-500/10 mx-1 hidden lg:block" />

          {/* Form checkbox validator converter */}
          <button
            onClick={() => {
              if (!selectedCell) return;
              const cell = cells[selectedCell] || { value: "", lockLevel: LockLevel.NONE };
              updateSheetInFile({
                ...activeSheet,
                cells: {
                  ...cells,
                  [selectedCell]: { ...cell, isCheckbox: true, value: "FALSE" },
                },
              });
            }}
            disabled={!selectedCell}
            className="h-7 px-2 bg-[#091511] text-[10px] text-emerald-300 font-bold border border-emerald-500/10 rounded flex items-center gap-1.5 cursor-pointer"
            title="Convert cell to high-fidelity checkbox toggle"
          >
            <Clipboard size={10} />
            <span>ADD CHECKBOX</span>
          </button>
        </div>

        {/* Layout Side drawers triggers (Notes history panels) */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => {
              if (selectedCell) setShowCellDetailsDrawer(!showCellDetailsDrawer);
            }}
            disabled={!selectedCell}
            className={`h-7 px-2.5 border rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
              showCellDetailsDrawer
                ? "bg-emerald-950 border-emerald-500 text-emerald-200"
                : "bg-emerald-950/10 border-emerald-900 hover:border-emerald-600 text-emerald-400"
            } disabled:opacity-40`}
          >
            <History size={12} />
            <span>Cell Logs & Notes</span>
          </button>
        </div>
      </div>

      {/* Grid Formula Input Line */}
      <div className="bg-[#040604] border-b border-emerald-500/10 p-1.5 flex items-center gap-2 font-mono text-xs select-none shrink-0">
        <span className="text-emerald-700 font-bold w-12 text-center select-none bg-black/40 py-1 rounded">
          {selectedCell || "SEC"}
        </span>
        <span className="text-[#00ffcc] font-black">=</span>
        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            className="w-full h-8 px-2 bg-black/60 text-[#00ffcc] border border-emerald-500/15 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded text-xs select-text"
            placeholder="Introduce aggregate commands, formula triggers e.g., =SUM(A1:B3) or =B5 + C5"
            value={formulaInputVal}
            onChange={e => {
              const val = e.target.value;
              setFormulaInputVal(val);
              if (selectedCell) {
                const current = cells[selectedCell] || { value: "", lockLevel: LockLevel.NONE };
                if (current.lockLevel === LockLevel.NONE) {
                  if (formulaDebounceRef.current) clearTimeout(formulaDebounceRef.current);
                  formulaDebounceRef.current = setTimeout(() => {
                    saveActiveCellChange(val);
                  }, 300);
                }
              }
            }}
            disabled={!selectedCell}
          />
        </div>
      </div>

      {/* Main Grid View Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Core Matrix Scroller */}
        <div className="flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-emerald-900" onMouseUp={handleCellMouseUp}>
          <table className="w-full border-collapse table-fixed text-xs font-mono text-emerald-400 mb-12">
            <thead>
              {/* Columns labels header row */}
              <tr className="bg-[#050a06] text-emerald-600 border-b border-emerald-500/20 select-none">
                <th className="w-12 h-6 border-r border-[#10b981]/40 font-black text-center sticky top-0 left-0 bg-[#050a06] z-25 text-[10px]">
                  ID
                </th>
                {Array.from({ length: colCount }).map((_, c) => {
                  const letter = idxToColLabel(c);
                  return (
                  <th
                    key={`col-${letter}`}
                    className="w-24 h-6 border-r border-[#10b981]/40 font-black text-center sticky top-0 bg-[#050a06] z-20 text-[10px] select-none relative"
                    style={{ width: colWidths[c] ? `${colWidths[c]}px` : undefined }}
                  >
                    {letter}
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-emerald-500/30 active:bg-emerald-500/50 z-30"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        resizeRef.current = { type: "col", index: c, startX: e.clientX, startY: 0, startSize: colWidths[c] || DEF_COL_WIDTH };
                        document.body.style.cursor = "col-resize";
                        document.body.style.userSelect = "none";
                      }}
                    />
                    </th>
                  );
                })}
              </tr>
            </thead>
            
            <tbody>
              {Array.from({ length: rowCount }).map((_, r) => {
                const rowNum = r + 1;
                return (
                  <tr key={`row-${rowNum}`} className="h-6 border-b border-[#10b981]/40 hover:bg-[#07130c]/30">
                    {/* Sticky row indicator */}
                    <td className="sticky left-0 bg-[#050a06] font-bold text-emerald-600 border-r border-[#10b981]/50 text-center select-none text-[10px] w-12 z-10 relative"
                      style={{ height: rowHeights[r] ? `${rowHeights[r]}px` : undefined }}
                    >
                      {rowNum}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-emerald-500/30 active:bg-emerald-500/50 z-30"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          resizeRef.current = { type: "row", index: r, startX: 0, startY: e.clientY, startSize: rowHeights[r] || DEF_ROW_HEIGHT };
                          document.body.style.cursor = "row-resize";
                          document.body.style.userSelect = "none";
                        }}
                      />
                    </td>

                    {/* Columns nodes indices */}
                    {Array.from({ length: colCount }).map((_, c) => {
                      const letter = idxToColLabel(c);
                      const addr = `${letter}${rowNum}`;
                      const cell = cells[addr] || { value: "", lockLevel: LockLevel.NONE };

                      const isSelected = selectedCell === addr;
                      const isInSelection = selectionRange.includes(addr);

                      // Style setups
                      const customStyle = cell.style || {};
                      const alignClass =
                        customStyle.align === "center"
                          ? "text-center"
                          : customStyle.align === "right"
                          ? "text-right"
                          : "text-left";

                      // Identify lock design attributes
                      let cellBorderColor = "border-[#10b981]/40";
                      let cellBgClass = "bg-transparent";

                      if (cell.lockLevel === LockLevel.SOFT) {
                        cellBorderColor = "border-sky-500/20";
                        cellBgClass = "bg-sky-950/5";
                      } else if (cell.lockLevel === LockLevel.PROTECTED) {
                        cellBorderColor = "border-amber-500/30";
                        cellBgClass = "bg-amber-950/5";
                      } else if (cell.lockLevel === LockLevel.VAULT) {
                        cellBorderColor = "border-orange-500/40";
                        cellBgClass = "bg-orange-950/10";
                      } else if (cell.lockLevel === LockLevel.PERMANENT) {
                        cellBorderColor = "border-red-500/50";
                        cellBgClass = "bg-red-950/15";
                      }

                      if (isInSelection) {
                        cellBgClass = "bg-[#10b981]/10";
                        cellBorderColor = "border-[#10b981]/40";
                      }
                      if (isSelected) {
                        cellBgClass = "bg-[#10b981]/20";
                        cellBorderColor = "border-[#00ffcc]";
                      }

                      return (
                        <td
                          key={addr}
                          onMouseDown={() => handleCellMouseDown(addr)}
                          onMouseEnter={() => {
                            handleCellDrag(addr);
                            setHoverCell(addr);
                          }}
                          onMouseLeave={() => {
                            setHoverCell(null);
                          }}
                          onMouseUp={handleCellMouseUp}
                          onDoubleClick={() => handleDoubleClick(addr)}
                          className={`relative border-r px-1.5 cursor-cell overflow-hidden whitespace-nowrap text-ellipsis transition-colors select-none group font-mono ${cellBgClass} ${cellBorderColor} ${alignClass}`}
                          style={{
                            height: rowHeights[r] ? `${rowHeights[r]}px` : DEF_ROW_HEIGHT,
                            fontWeight: customStyle.bold ? "bold" : "normal",
                            fontStyle: customStyle.italic ? "italic" : "normal",
                            textDecoration: customStyle.underline ? "underline" : "none",
                            color: customStyle.color || undefined,
                            backgroundColor: customStyle.bg || undefined,
                          }}
                          title={`Coord: ${addr}${cell.lockLevel > 0 ? ` (Locked: ${LockLevel[cell.lockLevel]})` : ""}`}
                        >
                          <div className="flex items-center justify-between w-full h-full relative overflow-hidden">
                            
                            {/* Checkbox rendering */}
                            {cell.isCheckbox ? (
                              <input
                                type="checkbox"
                                checked={cell.isChecked || false}
                                onChange={() => toggleCheckboxCell(addr)}
                                className="h-3.5 w-3.5 rounded bg-black border-emerald-900 text-emerald-500 focus:outline-none cursor-pointer"
                              />
                            ) : (
                              /* Standard Value rendering */
                              <span className="truncate w-full pr-4">{cell.value || ""}</span>
                            )}

                            {/* Secure Lock Badge icons rendering */}
                            {cell.lockLevel > 0 && (
                              <Lock
                                size={10}
                                className={`shrink-0 ${
                                  cell.lockLevel === LockLevel.PERMANENT
                                    ? "text-red-500 animate-pulse"
                                    : cell.lockLevel === LockLevel.VAULT
                                    ? "text-orange-400"
                                    : "text-emerald-500/60"
                                }`}
                              />
                            )}

                            {/* HOVER INSTANT COPY POPUP TRIGGERS (Flagship Feature) */}
                            {hoverCell === addr && (cell.value || cell.formula) && (
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#09100d] border border-emerald-500/40 rounded flex items-center pr-1 h-[20px] shadow-lg z-10 select-none">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCopyPopover(showCopyPopover === addr ? null : addr);
                                  }}
                                  className="p-1 text-emerald-300 hover:text-[#00ffcc] cursor-pointer"
                                  title="Quick Cell Hover Copy Options"
                                >
                                  <Clipboard size={10} />
                                </button>
                              </div>
                            )}

                            {/* Inline Dropdown Options Selector list if opened */}
                            {showCopyPopover === addr && (
                              <div
                                className="absolute top-5 right-0 bg-black/95 border border-emerald-500/60 p-1 rounded rounded-tr-none z-30 shadow-2xl flex flex-col font-mono text-[9px] min-w-[130px] select-none"
                                onMouseLeave={() => setShowCopyPopover(null)}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyCellContent(addr, "plain");
                                  }}
                                  className="w-full text-left px-2 py-1 text-emerald-400 hover:bg-emerald-950/20 rounded"
                                >
                                  Copy Text Value
                                </button>
                                {cell.formula && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyCellContent(addr, "formula");
                                    }}
                                    className="w-full text-left px-2 py-1 text-[#00ffcc] hover:bg-emerald-950/20 rounded font-bold"
                                  >
                                    Copy Raw Formula
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyCellContent(addr, "markdown");
                                  }}
                                  className="w-full text-left px-2 py-1 text-emerald-400 hover:bg-emerald-950/20 rounded"
                                >
                                  Copy Markdown Table
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyCellContent(addr, "json");
                                  }}
                                  className="w-full text-left px-2 py-1 text-yellow-400 hover:bg-emerald-950/20 rounded"
                                >
                                  Copy JSON Node
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Dynamic double click double-editing line */}
                          {isEditing && isSelected && (
                            <div className="absolute inset-0 bg-black z-10 flex items-center p-0.5">
                              <input
                                ref={editorInputRef}
                                type="text"
                                className="w-full h-full bg-black text-emerald-300 outline-none border-none text-xs px-1 select-text"
                                value={editInputVal}
                                onChange={e => setEditInputVal(e.target.value)}
                                onBlur={() => saveActiveCellChange(editInputVal)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") saveActiveCellChange(editInputVal);
                                  if (e.key === "Escape") setIsEditing(false);
                                }}
                              />
                            </div>
                          )}

                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Column Right: Notes details drawer cabinet */}
        {showCellDetailsDrawer && selectedCell && (
          <div className="w-64 border-l border-emerald-500/15 bg-[#050907] flex flex-col h-full font-mono text-emerald-400 p-4 space-y-4 shrink-0 overflow-y-auto select-none">
            <div className="border-b border-emerald-950 pb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-200">Coord [{selectedCell}] Ledger</span>
              <button
                onClick={() => setShowCellDetailsDrawer(false)}
                className="text-[10px] text-emerald-600 hover:text-emerald-400"
              >
                Close
              </button>
            </div>

            {/* Note manager */}
            <div className="space-y-1">
              <label className="text-[9px] text-emerald-600 uppercase font-black tracking-widest block">Cell Memo Note</label>
              <textarea
                className="w-full h-16 text-[10px] bg-black border border-emerald-950 rounded p-1.5 text-emerald-300 focus:outline-none focus:border-emerald-500 font-mono"
                placeholder="Attach private annotations, parameters descriptions..."
                value={drawerNoteText}
                onChange={e => {
                  setDrawerNoteText(e.target.value);
                  const current = cells[selectedCell] || { value: "", lockLevel: LockLevel.NONE };
                  if (current.lockLevel === LockLevel.NONE) {
                    updateSheetInFile({
                      ...activeSheet,
                      cells: {
                        ...cells,
                        [selectedCell]: { ...current, note: e.target.value },
                      },
                    });
                  }
                }}
              />
            </div>

            {/* Micro modification history logs */}
            <div className="space-y-2 flex-1 flex flex-col overflow-hidden">
              <span className="text-[9px] text-emerald-600 uppercase font-black tracking-widest block">Audit History</span>
              <div className="flex-1 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-emerald-950 text-[10px] select-text">
                {cells[selectedCell]?.history && cells[selectedCell].history!.length > 0 ? (
                  cells[selectedCell].history!.map((entry, idx) => (
                    <div key={idx} className="border-b border-emerald-950 pb-1.5">
                      <div className="flex justify-between text-[8px] text-emerald-600">
                        <span>{entry.user}</span>
                        <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-emerald-300 mt-0.5 truncate">
                        {entry.oldValue ? `"${entry.oldValue}"` : "NULL"} → <strong className="text-emerald-100">"{entry.newValue}"</strong>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-emerald-700 text-center py-4 text-[10px]">No modification history compiled.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Tabs list & Extension tools footer */}
      <div className="h-10 bg-[#050906] border-t border-emerald-500/15 flex items-center justify-between px-3 shrink-0 font-mono text-xs select-none">
        
        {/* Worksheets list tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pr-4">
          {sheets.map(sheet => {
            const isActive = sheet.id === activeSheetId;
            return (
              <div
                key={sheet.id}
                className={`flex items-center gap-2 h-7 px-2.5 rounded text-xs transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#101c13] text-emerald-300 border-t-2 border-emerald-500"
                    : "bg-black/30 hover:bg-emerald-950/20 text-emerald-600 hover:text-emerald-400"
                }`}
                onClick={() => setActiveSheetId(sheet.id)}
              >
                <span className="font-semibold">{sheet.name}</span>
                
                {/* Actions context menu */}
                <span className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateSheet(sheet);
                    }}
                    className="p-0.5 hover:text-emerald-300 text-emerald-700 hover:bg-black/40 rounded transition-all"
                    title="Duplicate Tab Core"
                  >
                    <Copy size={9} />
                  </button>
                  {sheets.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSheet(sheet.id);
                      }}
                      className="p-0.5 hover:text-red-400 text-emerald-700 hover:bg-black/40 rounded"
                    >
                      <Trash2 size={9} />
                    </button>
                  )}
                </span>
              </div>
            );
          })}

          <button
            onClick={handleAddNewSheet}
            className="h-7 w-7 bg-emerald-950/15 border border-emerald-950 rounded flex items-center justify-center hover:bg-emerald-900 text-emerald-400 transition-all cursor-pointer"
            title="Deploy secondary worksheet tab"
          >
            <Plus size={11} />
          </button>
        </div>

        {/* Selection statistics indicator display */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] text-emerald-600 uppercase">
          {selectionRange.length > 1 && (
            <span>Selection: <b className="text-emerald-300">{selectionRange.length} items</b></span>
          )}
          <span>Grid payload size: <b className="text-emerald-300">{Object.keys(cells).length} nodes</b></span>
        </div>
      </div>

      {/* Flagship Lock setup Options Modal popup dialog */}
      {showLockConfigModal && lockTargetCell && (
        <div className="fixed inset-0 z-45 bg-black/75 flex items-center justify-center p-4" onClick={() => setShowLockConfigModal(false)}>
          <div className="bg-[#0c120e] border border-emerald-500 rounded p-5 font-mono max-w-sm w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center gap-2 border-b border-emerald-900 pb-2">
              <FolderLock size={16} className="text-red-400 animate-pulse" />
              <h3 className="text-xs font-bold text-emerald-100 uppercase">Configure Smart Cell Locks</h3>
            </div>

            <div className="text-[11px] text-emerald-505 bg-black/40 p-2 border border-emerald-950 rounded flex flex-col gap-1.5 leading-relaxed">
              <span>Target range size: <b className="text-[#00ffcc]">{selectionRange.length} cells</b></span>
              <span className="opacity-70">Secured matrices cannot be cleared, overwritten, or modified accidentally.</span>
            </div>

            {/* Select lock levels */}
            <div className="space-y-1">
              <label className="text-[9px] text-emerald-600 uppercase font-black tracking-widest block">Select Lock Rating</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                
                <button
                  onClick={() => setLockLevelSelected(LockLevel.SOFT)}
                  className={`p-2 rounded border text-left flex flex-col gap-0.5 ${
                    lockLevelSelected === LockLevel.SOFT
                      ? "bg-emerald-950/40 border-sky-400/40 text-sky-400 font-bold"
                      : "bg-black border-emerald-950 text-emerald-600 hover:border-emerald-800"
                  }`}
                >
                  <span className="text-[10px]">Soft Lock (L1)</span>
                  <span className="text-[8px] opacity-70">1-click unlock</span>
                </button>

                <button
                  onClick={() => setLockLevelSelected(LockLevel.PROTECTED)}
                  className={`p-2 rounded border text-left flex flex-col gap-0.5 ${
                    lockLevelSelected === LockLevel.PROTECTED
                      ? "bg-emerald-950/40 border-amber-400/40 text-amber-400 font-bold"
                      : "bg-black border-emerald-950 text-emerald-600 hover:border-emerald-800"
                  }`}
                >
                  <span className="text-[10px]">Protected (L2)</span>
                  <span className="text-[8px] opacity-70">Confirms override</span>
                </button>

                <button
                  onClick={() => setLockLevelSelected(LockLevel.VAULT)}
                  className={`p-2 rounded border text-left flex flex-col gap-0.5 ${
                    lockLevelSelected === LockLevel.VAULT
                      ? "bg-emerald-950/40 border-orange-400/45 text-orange-400 font-bold"
                      : "bg-black border-emerald-950 text-emerald-600 hover:border-emerald-800"
                  }`}
                >
                  <span className="text-[10px]">Vault Lock (L3)</span>
                  <span className="text-[8px] opacity-70">Requires key pass</span>
                </button>

                <button
                  onClick={() => setLockLevelSelected(LockLevel.PERMANENT)}
                  className={`p-2 rounded border text-left flex flex-col gap-0.5 ${
                    lockLevelSelected === LockLevel.PERMANENT
                      ? "bg-emerald-950/40 border-red-400/45 text-red-500 font-bold animate-pulse"
                      : "bg-black border-emerald-950 text-emerald-600 hover:border-emerald-800"
                  }`}
                >
                  <span className="text-[10px]">Permanent (L4)</span>
                  <span className="text-[8px] opacity-70">Emergency code only</span>
                </button>

              </div>
            </div>

            {/* Vault lock encryption key */}
            {lockLevelSelected === LockLevel.VAULT && (
              <div className="space-y-1.5">
                <label className="text-[9px] text-emerald-600 uppercase font-black tracking-widest block">Encryption Key Password</label>
                <input
                  type="password"
                  className="w-full text-xs bg-black border border-emerald-950 p-2 rounded text-emerald-400 focus:outline-none focus:border-orange-500 placeholder-emerald-950"
                  placeholder="Insert custom decryption passkey..."
                  value={lockPasswordInput}
                  onChange={e => setLockPasswordInput(e.target.value)}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 text-[11px] pt-2">
              <button
                onClick={() => setShowLockConfigModal(false)}
                className="px-2.5 py-1 text-emerald-700 hover:text-emerald-400 cursor-pointer"
              >
                Abort
              </button>
              <button
                onClick={executeLockingCell}
                className="px-3.5 py-1.5 bg-[#102418] border border-emerald-500 text-emerald-100 hover:bg-emerald-900 rounded font-bold cursor-pointer"
              >
                DEPLOY ENCRYPT_SHIELD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Confirm override unlocking popups modal */}
      {showUnlockModal && unlockTargetAddr && (
        <div className="fixed inset-0 z-45 bg-black/85 flex items-center justify-center p-4" onClick={() => { setShowUnlockModal(false); setUnlockTargetAddr(null); }}>
          <div className="bg-[#0e0a0a] border border-red-900 rounded p-5 font-mono max-w-sm w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            
            <div className="flex items-center gap-2 border-b border-red-950 pb-2 text-red-400">
              <Unlock size={16} className="animate-bounce" />
              <h3 className="text-xs font-bold uppercase tracking-widest">SMARTSHEETS SECURITY DECRYPTION</h3>
            </div>

            <div className="text-[11px] text-red-400/80 bg-red-950/10 p-2 border border-red-950/30 rounded flex flex-col gap-1">
              <span>Bypassing lock state: <b className="text-red-200">[{unlockTargetAddr}]</b></span>
              <span>Level locked: <b className="text-red-200">{LockLevel[cells[unlockTargetAddr]?.lockLevel || 0]}</b></span>
            </div>

            {/* Warning details instructions based on levels */}
            {cells[unlockTargetAddr]?.lockLevel === LockLevel.PROTECTED && (
              <p className="text-[10px] text-red-400 leading-relaxed font-sans">
                You are about to modify a highly secure coordinate cell in your second brain workbook. Select override below to bypass.
              </p>
            )}

            {cells[unlockTargetAddr]?.lockLevel === LockLevel.VAULT && (
              <div className="space-y-1.5">
                <label className="text-[9px] text-[#ff9900] uppercase font-black block">Decryption Password Key Required</label>
                <input
                  type="password"
                  className="w-full text-xs bg-black border border-orange-950 text-orange-400 focus:outline-none focus:border-orange-500 rounded p-2"
                  placeholder="Enter custom Vault decryption pass..."
                  value={unlockPasswordInput}
                  onChange={e => setUnlockPasswordInput(e.target.value)}
                />
              </div>
            )}

            {cells[unlockTargetAddr]?.lockLevel === LockLevel.PERMANENT && (
              <div className="space-y-1.5">
                <label className="text-[9px] text-red-400 uppercase font-black block leading-relaxed">
                  AIRGAP RECOVERY MODE DIRECTIVE.<br />TYPE THE AUTHORIZATION ACTION WORD <b className="text-red-200">'restore'</b> TO VERIFY BYPASS.
                </label>
                <input
                  type="text"
                  className="w-full text-xs bg-black border border-red-950 text-red-400 focus:outline-none focus:border-red-500 rounded p-2 uppercase"
                  placeholder="Type 'restore' to authenticate..."
                  value={unlockPasswordInput}
                  onChange={e => setUnlockPasswordInput(e.target.value)}
                />
              </div>
            )}

            {unlockError && (
              <p className="text-[10px] text-red-500 bg-red-950/20 border border-red-950/60 p-1.5 rounded animate-pulse text-center">
                {unlockError}
              </p>
            )}

            <div className="flex justify-end gap-2 text-[11px] pt-1">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockTargetAddr(null);
                }}
                className="px-2.5 py-1 text-red-700 hover:text-red-400 cursor-pointer"
              >
                Abort
              </button>
              <button
                onClick={executeUnlockCell}
                className="px-3.5 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500 rounded text-red-100 font-bold cursor-pointer"
              >
                BYPASS_LOCK_SHIELD
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
