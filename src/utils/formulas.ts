/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SheetData, CellData } from "../types";

// Convert column letter A, B, C... to 0-based index
export function colLabelToIdx(label: string): number {
  let idx = 0;
  const uppercase = label.trim().toUpperCase();
  for (let i = 0; i < uppercase.length; i++) {
    idx = idx * 26 + (uppercase.charCodeAt(i) - 64);
  }
  return idx - 1;
}

// Convert 0-based index to column letter A, B, C...
export function idxToColLabel(idx: number): string {
  let label = "";
  let temp = idx;
  while (temp >= 0) {
    label = String.fromCharCode((temp % 26) + 65) + label;
    temp = Math.floor(temp / 26) - 1;
  }
  return label;
}

// Parse cell reference, e.g., "Sheet1!B5" or "B5"
export interface ParsedAddress {
  sheetName: string | null;
  colLabel: string;
  rowNumber: number;
  colIdx: number;
  rowIdx: number;
}

export function parseCellAddress(address: string): ParsedAddress | null {
  const clean = address.trim().toUpperCase();
  // Split sheet optional part
  let sheetName: string | null = null;
  let remaining = clean;

  if (clean.includes("!")) {
    const parts = clean.split("!");
    sheetName = parts[0].replace(/['"]/g, ""); // remove potential quotes
    remaining = parts[1];
  }

  // Extract letters at beginning, then numbers
  const match = remaining.match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;

  const colLabel = match[1];
  const rowStr = match[2];
  const rowNumber = parseInt(rowStr, 10);
  const colIdx = colLabelToIdx(colLabel);
  const rowIdx = rowNumber - 1;

  return {
    sheetName,
    colLabel,
    rowNumber,
    colIdx,
    rowIdx,
  };
}

// Expands range string like "A1:B3" to individual cells
export function expandRange(rangeStr: string): string[] {
  const parts = rangeStr.split(":");
  if (parts.length !== 2) return [rangeStr];

  const start = parseCellAddress(parts[0]);
  const end = parseCellAddress(parts[1]);

  if (!start || !end) return [];

  const out: string[] = [];
  const minRow = Math.min(start.rowIdx, end.rowIdx);
  const maxRow = Math.max(start.rowIdx, end.rowIdx);
  const minCol = Math.min(start.colIdx, end.colIdx);
  const maxCol = Math.max(start.colIdx, end.colIdx);

  const prefix = start.sheetName ? `${start.sheetName}!` : "";

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      out.push(`${prefix}${idxToColLabel(c)}${r + 1}`);
    }
  }

  return out;
}

// Safely looks up string value of cell
export function getCellValue(
  address: string,
  sheets: SheetData[],
  currentSheetId: string,
  visited: Set<string>
): string {
  const parsed = parseCellAddress(address);
  if (!parsed) return "0";

  // Identify target sheet
  let targetSheet = sheets.find(s => s.id === currentSheetId);
  if (parsed.sheetName) {
    const namedSheet = sheets.find(s => s.name.toUpperCase() === parsed.sheetName);
    if (namedSheet) targetSheet = namedSheet;
  }

  if (!targetSheet) return "#REF!";

  const cellKey = `${parsed.colLabel}${parsed.rowNumber}`;
  const cell = targetSheet.cells[cellKey];
  if (!cell) return "";

  // Evaluate if cell has a formula and hasn't been compiled
  if (cell.formula && cell.formula.startsWith("=")) {
    // Determine unique global coordinate to prevent cycle
    const absoluteCoord = `${targetSheet.id}!${cellKey}`;
    if (visited.has(absoluteCoord)) {
      return "#CIRCULAR!";
    }
    const newVisited = new Set(visited);
    newVisited.add(absoluteCoord);
    return evaluateFormula(cell.formula, sheets, targetSheet.id, newVisited);
  }

  return cell.value || "";
}

// Global evaluation of formula string
export function evaluateFormula(
  formula: string,
  sheets: SheetData[],
  currentSheetId: string,
  visited: Set<string> = new Set()
): string {
  if (!formula.startsWith("=")) return formula;

  const rawExpression = formula.slice(1).trim();
  const upperExpr = rawExpression.toUpperCase();

  // Basic function evaluations
  try {
    // Match common function patterns e.g. SUM(A1:B3), AVERAGE(A1:B3)
    const funcMatch = upperExpr.match(/^([A-Z0-9_]+)\((.*)\)$/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      const argsRaw = funcMatch[2];

      // Parse argument strings (respecting comma inside nested scopes, but simple comma split works)
      const args = argsRaw.split(",").map(a => a.trim());

      // Expand ranges if present
      const resolvedValues: number[] = [];
      const stringValues: string[] = [];

      args.forEach(arg => {
        if (arg.includes(":")) {
          const cells = expandRange(arg);
          cells.forEach(c => {
            const val = getCellValue(c, sheets, currentSheetId, visited);
            stringValues.push(val);
            const num = parseFloat(val);
            if (!isNaN(num)) resolvedValues.push(num);
          });
        } else {
          // Check if argument is a cell reference vs numeric literal
          const isCell = parseCellAddress(arg);
          if (isCell) {
            const val = getCellValue(arg, sheets, currentSheetId, visited);
            stringValues.push(val);
            const num = parseFloat(val);
            if (!isNaN(num)) resolvedValues.push(num);
          } else {
            // Is numeric literal or quotes string
            if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
              const stripped = arg.slice(1, -1);
              stringValues.push(stripped);
            } else {
              const num = parseFloat(arg);
              if (!isNaN(num)) {
                resolvedValues.push(num);
                stringValues.push(arg);
              } else {
                stringValues.push(arg);
              }
            }
          }
        }
      });

      switch (funcName) {
        case "SUM":
          return resolvedValues.reduce((a, b) => a + b, 0).toString();
        case "AVERAGE":
          return resolvedValues.length > 0 
            ? (resolvedValues.reduce((a, b) => a + b, 0) / resolvedValues.length).toFixed(2).replace(/\.00$/, "")
            : "0";
        case "COUNT":
          return resolvedValues.length.toString();
        case "MAX":
          return resolvedValues.length > 0 ? Math.max(...resolvedValues).toString() : "0";
        case "MIN":
          return resolvedValues.length > 0 ? Math.min(...resolvedValues).toString() : "0";
        case "CONCAT":
          return stringValues.join("");
        case "UPPER":
          return stringValues.join(" ").toUpperCase();
        case "LOWER":
          return stringValues.join(" ").toLowerCase();
        case "LEN":
          return (stringValues[0] || "").length.toString();
        default:
          return `#NAME? (${funcName})`;
      }
    }

    // Solve basic inline mathematics if no direct function matched (e.g. B5 + C5 * 10)
    // Find references inside mathematical expression and replace with real numbers
    let evalStr = rawExpression;
    
    // Regular expression to match valid cell references, e.g., A1, B12, but prevent matching numbers like 10 or function names
    const refRegex = /\b([a-zA-Z!_]+[0-9]+)\b/g;
    let replacementError: string | null = null;

    evalStr = evalStr.replace(refRegex, (match) => {
      // Exclude function words
      if (["SUM", "AVERAGE", "COUNT", "MAX", "MIN", "CONCAT", "UPPER", "LOWER", "LEN"].includes(match.toUpperCase())) {
        return match;
      }
      const val = getCellValue(match, sheets, currentSheetId, visited);
      
      if (val === "#CIRCULAR!") {
        replacementError = "#CIRCULAR!";
        return "0";
      }
      if (val === "#REF!") {
        replacementError = "#REF!";
        return "0";
      }

      const num = parseFloat(val);
      return isNaN(num) ? `"${val}"` : num.toString();
    });

    if (replacementError) return replacementError;

    // Evaluate basic math safely
    // Guard against illegal JS inside string to prevent security exploits
    if (!/^[0-9+\-*/().\s"']+$|^.*#CIRCULAR.*$|^.*#REF.*$/.test(evalStr)) {
      return "#ERROR!";
    }

    // Direct arithmetic execution
    const result = new Function(`return ${evalStr}`)();
    if (result === Infinity || result === -Infinity) {
      return "#DIV/0!";
    }
    
    if (typeof result === "number" && isNaN(result)) {
      return "#ERROR!";
    }

    return (result !== undefined && result !== null) ? result.toString() : "";
  } catch (err) {
    return "#ERROR!";
  }
}

// Function helper to check for formula errors early
export function detectFormulaError(formula: string): string | null {
  if (!formula.startsWith("=")) return null;
  const upper = formula.toUpperCase();

  // Test open parenthesis matching
  let parenCount = 0;
  for (let i = 0; i < upper.length; i++) {
    if (upper[i] === "(") parenCount++;
    if (upper[i] === ")") parenCount--;
    if (parenCount < 0) return "Mismatched Parentheses";
  }
  if (parenCount !== 0) return "Unclosed Parentheses";

  // Check division by zero static check
  if (upper.includes("/0") && !upper.includes("/0.")) {
    return "Potential division by zero";
  }

  return null;
}
