/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum LockLevel {
  NONE = 0,
  SOFT = 1,       // Single-click unlock
  PROTECTED = 2,  // Yes/No confirmation dialog
  VAULT = 3,      // Password confirmation
  PERMANENT = 4   // Explicit recovery process required
}

export enum WorkspaceType {
  SPREADSHEET = "spreadsheet",
  DOCUMENT = "document",
  HYBRID = "hybrid"
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string; // Text hex/tailwind
  bg?: string;    // Bg hex/tailwind
  align?: "left" | "center" | "right";
  fontSize?: number;
}

export interface ConditionalFormat {
  id: string;
  type: "contains" | "greater_than" | "less_than" | "equal_to" | "empty";
  value: string;
  style: CellStyle;
}

export interface CellHistoryEntry {
  timestamp: number;
  user: string;
  oldValue: string;
  newValue: string;
  oldFormula?: string;
  newFormula?: string;
}

export interface CellComment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
}

export interface CellData {
  value: string;
  formula?: string; // starts with =
  style?: CellStyle;
  lockLevel: LockLevel;
  lockPassword?: string; // for Vault locks
  dropdownOptions?: string[]; // for data validation
  isCheckbox?: boolean;
  isChecked?: boolean;
  note?: string;
  comments?: CellComment[];
  history?: CellHistoryEntry[];
}

export interface SheetData {
  id: string;
  name: string;
  rows: number;
  cols: number;
  cells: Record<string, CellData>; // key e.g., "A1", "B12"
  frozenRows: number;
  frozenCols: number;
  isProtected?: boolean;
  isHidden?: boolean;
  conditionalFormats?: ConditionalFormat[];
}

export interface DocumentBlock {
  id: string;
  type: "heading1" | "heading2" | "paragraph" | "bullet_list_item" | "numbered_list_item" | "checklist_item" | "code_block" | "quote" | "callout" | "table" | "image";
  content: string; // text content, or URL for images
  checked?: boolean; // for checklist_item
  collapsed?: boolean; // for collapsible structures
  language?: string; // for code_block
  depth?: number; // for nested lists
  metadata?: Record<string, any>;
}

export interface HybridBlock {
  id: string;
  type: "spreadsheet" | "document" | "code" | "checklist" | "prompt" | "reference";
  title: string;
  spreadsheetData?: {
    rows: number;
    cols: number;
    cells: Record<string, CellData>;
  };
  docContent?: string;
  codeLanguage?: string;
  checklistItems?: { id: string; text: string; done: boolean }[];
  promptTemplate?: string;
  referenceUrl?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null for root-level
  color?: string; // Hex color for hacker theme styling
  icon?: string; // Lucide icon identifier
  isPinned?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  isLocked?: boolean;
  password?: string;
}

export interface SmartFile {
  id: string;
  name: string;
  folderId: string | null;
  type: WorkspaceType;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  isPinned?: boolean;
  // Specific payloads:
  sheets?: SheetData[]; // for spreadsheet workspace
  activeSheetId?: string;
  docBlocks?: DocumentBlock[]; // for document workspace
  hybridBlocks?: HybridBlock[]; // for hybrid workspace
  isLocked?: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  fileId?: string;
  fileName?: string;
  type: "edit" | "delete" | "lock" | "unlock" | "paste" | "import" | "copy" | "restore";
  details: string;
}

export interface CopyHistoryEntry {
  id: string;
  timestamp: number;
  content: string;
  type: string; // e.g. Plain Text, Markdown, CSV, Formula...
  cellAddress?: string;
  fileName?: string;
}

export interface TrashItem {
  id: string;
  originalId: string;
  name: string;
  type: "file" | "folder";
  fileType?: WorkspaceType;
  deletedAt: number;
  originalParentId: string | null;
  payload: any; // complete backup of file or folder
}

export interface SearchResult {
  fileId: string;
  fileName: string;
  fileType: WorkspaceType;
  path: string; // folder path e.g., "Vault/Prompts"
  matchType: "title" | "content" | "formula" | "tag" | "comment";
  matchSnippet: string;
  targetAddress?: string; // A1 address if cell match
}
