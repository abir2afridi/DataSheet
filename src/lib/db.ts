import { supabaseAdmin } from "./supabase";
const supabase = supabaseAdmin;
import type { SmartFile, Folder, TrashItem, ActivityLog, CopyHistoryEntry, CellData, SheetData, DocumentBlock, HybridBlock } from "../types";

// ============================================================
// AUTH
// ============================================================
export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ============================================================
// FOLDERS
// ============================================================
export async function getFolders(userId: string): Promise<Folder[]> {
  const { data } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  return (data || []).map(mapFolder);
}

export async function createFolder(name: string, parentId: string | null, userId: string): Promise<Folder> {
  const { data, error } = await supabase
    .from("folders")
    .insert({ name, parent_id: parentId, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return mapFolder(data);
}

export async function updateFolder(id: string, updates: Partial<Folder>) {
  const { error } = await supabase.from("folders").update(toDbFolder(updates)).eq("id", id);
  if (error) throw error;
}

export async function deleteFolder(id: string) {
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// WORKSPACES (files)
// ============================================================
export async function getWorkspaces(userId: string): Promise<SmartFile[]> {
  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return (data || []).map(mapWorkspace);
}

export async function createWorkspace(
  name: string,
  type: string,
  folderId: string | null,
  userId: string
): Promise<SmartFile> {
  const { data, error } = await supabase
    .from("workspaces")
    .insert({ name, type, folder_id: folderId, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return mapWorkspace(data);
}

export async function updateWorkspace(id: string, updates: Partial<SmartFile>) {
  const { error } = await supabase.from("workspaces").update(toDbWorkspace(updates)).eq("id", id);
  if (error) throw error;
}

export async function deleteWorkspace(id: string) {
  const { error } = await supabase.from("workspaces").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// SHEETS
// ============================================================
export async function getSheets(workspaceId: string): Promise<SheetData[]> {
  const { data } = await supabase
    .from("sheets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order");
  return (data || []).map(mapSheet);
}

export async function createSheet(workspaceId: string, name: string): Promise<SheetData> {
  const { data, error } = await supabase
    .from("sheets")
    .insert({ workspace_id: workspaceId, name })
    .select()
    .single();
  if (error) throw error;
  return mapSheet(data);
}

// ============================================================
// CELLS
// ============================================================
export async function getCells(sheetId: string): Promise<Record<string, CellData>> {
  const { data } = await supabase
    .from("cells")
    .select("*")
    .eq("sheet_id", sheetId);
  const result: Record<string, CellData> = {};
  (data || []).forEach(c => {
    result[c.cell_key] = {
      value: c.value || "",
      formula: c.formula,
      lockLevel: c.lock_level,
      lockPassword: c.lock_password,
      isCheckbox: c.is_checkbox,
      isChecked: c.is_checked,
      note: c.note,
      style: c.style,
      dropdownOptions: c.dropdown_options,
    };
  });
  return result;
}

export async function upsertCells(sheetId: string, cells: Record<string, CellData>) {
  const rows = Object.entries(cells).map(([key, cell]) => ({
    sheet_id: sheetId,
    cell_key: key,
    value: cell.value,
    formula: cell.formula,
    lock_level: cell.lockLevel || 0,
    lock_password: cell.lockPassword,
    is_checkbox: cell.isCheckbox || false,
    is_checked: cell.isChecked || false,
    note: cell.note,
    style: cell.style || {},
    dropdown_options: cell.dropdownOptions || [],
  }));
  const { error } = await supabase.from("cells").upsert(rows, {
    onConflict: "sheet_id, cell_key",
    ignoreDuplicates: false,
  });
  if (error) throw error;
}

// ============================================================
// ACTIVITY LOGS
// ============================================================
export async function getActivityLogs(userId: string): Promise<ActivityLog[]> {
  const { data } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data || []).map(l => ({
    id: l.id,
    timestamp: new Date(l.created_at).getTime(),
    type: l.type,
    details: l.details,
  }));
}

export async function createActivityLog(userId: string, type: string, details: string) {
  const { error } = await supabase.from("activity_logs").insert({ user_id: userId, type, details });
  if (error) throw error;
}

// ============================================================
// COPY HISTORY
// ============================================================
export async function createCopyHistory(userId: string, entry: CopyHistoryEntry) {
  const { error } = await supabase.from("cell_copy_history").insert({
    user_id: userId,
    content: entry.content,
    type: entry.type,
    cell_address: entry.cellAddress,
    workspace_name: entry.fileName,
  });
  if (error) throw error;
}

// ============================================================
// RECYCLE BIN
// ============================================================
export async function getRecycleBin(userId: string): Promise<TrashItem[]> {
  const { data } = await supabase
    .from("recycle_bin")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data || []).map(r => ({
    id: r.id,
    originalId: r.original_id,
    name: r.name,
    type: r.item_type === "folder" ? "folder" : "file",
    deletedAt: new Date(r.created_at).getTime(),
    originalParentId: null,
    payload: r.payload,
  }));
}

export async function addToRecycleBin(userId: string, item: TrashItem) {
  const { error } = await supabase.from("recycle_bin").insert({
    user_id: userId,
    original_id: item.originalId,
    name: item.name,
    item_type: item.type === "folder" ? "folder" : "workspace",
    payload: item.payload,
  });
  if (error) throw error;
}

export async function restoreFromRecycleBin(id: string) {
  const { error } = await supabase.from("recycle_bin").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// TAGS
// ============================================================
export async function getTags(userId: string) {
  const { data } = await supabase.from("tags").select("*").eq("user_id", userId);
  return data || [];
}

export async function createTag(userId: string, name: string, color?: string) {
  const { data, error } = await supabase
    .from("tags")
    .insert({ user_id: userId, name, color })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
// SETTINGS
// ============================================================
export async function getUserSettings(userId: string) {
  const { data } = await supabase.from("user_settings").select("*").eq("user_id", userId).single();
  return data;
}

export async function updateUserSettings(userId: string, settings: { theme?: string }) {
  const { error } = await supabase.from("user_settings").update(settings).eq("user_id", userId);
  if (error) throw error;
}

// ============================================================
// DOCUMENT BLOCKS
// ============================================================
export async function getDocumentBlocks(workspaceId: string): Promise<DocumentBlock[]> {
  const { data } = await supabase
    .from("document_blocks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order");
  return (data || []).map((b: any) => ({
    id: b.id,
    type: b.type,
    content: b.content || "",
    checked: b.checked,
    language: b.language,
    depth: b.depth,
    metadata: b.metadata,
  }));
}

export async function upsertDocumentBlocks(workspaceId: string, blocks: DocumentBlock[]) {
  const rows = blocks.map((b, i) => ({
    id: b.id,
    workspace_id: workspaceId,
    type: b.type,
    content: b.content,
    checked: b.checked || false,
    language: b.language,
    depth: b.depth || 0,
    sort_order: i,
    metadata: b.metadata || {},
  }));
  const { error } = await supabase.from("document_blocks").upsert(rows, {
    onConflict: "id",
    ignoreDuplicates: false,
  });
  if (error) throw error;
}

// ============================================================
// HYBRID BLOCKS
// ============================================================
export async function getHybridBlocks(workspaceId: string): Promise<HybridBlock[]> {
  const { data } = await supabase
    .from("hybrid_blocks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order");
  return (data || []).map((b: any) => ({
    id: b.id,
    type: b.type,
    title: b.title || "",
    docContent: b.doc_content,
    codeLanguage: b.code_language,
    promptTemplate: b.prompt_template,
    referenceUrl: b.reference_url,
    spreadsheetData: b.spreadsheet_rows
      ? { rows: b.spreadsheet_rows, cols: b.spreadsheet_cols, cells: {} }
      : undefined,
    checklistItems: [],
  }));
}

export async function upsertHybridBlocks(workspaceId: string, blocks: HybridBlock[]) {
  const { error } = await supabase.from("hybrid_blocks").upsert(
    blocks.map((b, i) => ({
      id: b.id,
      workspace_id: workspaceId,
      type: b.type,
      title: b.title || "",
      doc_content: b.docContent,
      code_language: b.codeLanguage,
      prompt_template: b.promptTemplate,
      reference_url: b.referenceUrl,
      spreadsheet_rows: b.spreadsheetData?.rows || 5,
      spreadsheet_cols: b.spreadsheetData?.cols || 5,
      sort_order: i,
    })),
    { onConflict: "id", ignoreDuplicates: false }
  );
  if (error) throw error;
}

export async function getHybridChecklistItems(hybridBlockId: string) {
  const { data } = await supabase
    .from("hybrid_checklist_items")
    .select("*")
    .eq("hybrid_block_id", hybridBlockId)
    .order("sort_order");
  return (data || []).map((c: any) => ({
    id: c.id,
    text: c.text,
    done: c.done,
  }));
}

export async function upsertHybridChecklistItems(hybridBlockId: string, items: { id: string; text: string; done: boolean }[]) {
  const { error } = await supabase.from("hybrid_checklist_items").upsert(
    items.map((c, i) => ({
      id: c.id,
      hybrid_block_id: hybridBlockId,
      text: c.text,
      done: c.done,
      sort_order: i,
    })),
    { onConflict: "id", ignoreDuplicates: false }
  );
  if (error) throw error;
}

export async function getHybridCells(hybridBlockId: string): Promise<Record<string, CellData>> {
  const { data } = await supabase
    .from("hybrid_cells")
    .select("*")
    .eq("hybrid_block_id", hybridBlockId);
  const result: Record<string, CellData> = {};
  (data || []).forEach((c: any) => {
    result[c.cell_key] = {
      value: c.value || "",
      lockLevel: c.lock_level,
    };
  });
  return result;
}

export async function upsertHybridCells(hybridBlockId: string, cells: Record<string, CellData>) {
  const rows = Object.entries(cells).map(([key, cell]) => ({
    hybrid_block_id: hybridBlockId,
    cell_key: key,
    value: cell.value,
    lock_level: cell.lockLevel || 0,
  }));
  const { error } = await supabase.from("hybrid_cells").upsert(rows, {
    onConflict: "hybrid_block_id, cell_key",
    ignoreDuplicates: false,
  });
  if (error) throw error;
}

// ============================================================
// HELPERS
// ============================================================
function mapFolder(db: any): Folder {
  return {
    id: db.id,
    name: db.name,
    parentId: db.parent_id,
    color: db.color,
    icon: db.icon,
    isPinned: db.is_pinned,
    isFavorite: db.is_favorite,
    isArchived: db.is_archived,
    isLocked: db.is_locked,
    password: db.password,
  };
}

function toDbFolder(f: Partial<Folder>): any {
  const db: any = {};
  if (f.name !== undefined) db.name = f.name;
  if (f.parentId !== undefined) db.parent_id = f.parentId;
  if (f.color !== undefined) db.color = f.color;
  if (f.icon !== undefined) db.icon = f.icon;
  if (f.isPinned !== undefined) db.is_pinned = f.isPinned;
  if (f.isFavorite !== undefined) db.is_favorite = f.isFavorite;
  if (f.isArchived !== undefined) db.is_archived = f.isArchived;
  if (f.isLocked !== undefined) db.is_locked = f.isLocked;
  if (f.password !== undefined) db.password = f.password;
  return db;
}

function mapWorkspace(db: any): SmartFile {
  return {
    id: db.id,
    name: db.name,
    folderId: db.folder_id,
    type: db.type,
    tags: db.tags || [],
    isFavorite: db.is_favorite,
    isPinned: db.is_pinned,
    isLocked: db.is_locked,
    createdAt: new Date(db.created_at).getTime(),
    updatedAt: new Date(db.updated_at).getTime(),
  };
}

function toDbWorkspace(w: Partial<SmartFile>): any {
  const db: any = {};
  if (w.name !== undefined) db.name = w.name;
  if (w.folderId !== undefined) db.folder_id = w.folderId;
  if (w.tags !== undefined) db.tags = w.tags;
  if (w.isFavorite !== undefined) db.is_favorite = w.isFavorite;
  if (w.isPinned !== undefined) db.is_pinned = w.isPinned;
  if (w.isLocked !== undefined) db.is_locked = w.isLocked;
  return db;
}

function mapSheet(db: any): SheetData {
  return {
    id: db.id,
    name: db.name,
    rows: db.rows,
    cols: db.cols,
    cells: {},
    frozenRows: db.frozen_rows,
    frozenCols: db.frozen_cols,
    isProtected: db.is_protected,
    isHidden: db.is_hidden,
  };
}
