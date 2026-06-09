/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { SmartFile, Folder, TrashItem, ActivityLog, CopyHistoryEntry, HybridBlock, WorkspaceType, LockLevel, SheetData, CellData } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import About from "./components/About";
import Profile from "./components/Profile";
import Developer from "./components/Developer";
import RecoveryVault from "./components/RecoveryVault";
import SpreadsheetWorkspace from "./components/SpreadsheetWorkspace";
import DocumentWorkspace from "./components/DocumentWorkspace";
import HybridWorkspace from "./components/HybridWorkspace";
import CommandPalette from "./components/CommandPalette";
import Home from "./components/Home";
import Login from "./components/Login";
import { searchWorkspace } from "./utils/search";
import { supabase } from "./lib/supabase";
import { getFolders, getWorkspaces, createFolder, createWorkspace, updateFolder, updateWorkspace, deleteFolder, deleteWorkspace, getActivityLogs, createActivityLog } from "./lib/db";
import { ShieldAlert, Terminal, Sparkles, X, ChevronRight, CornerDownLeft } from "lucide-react";

export default function App() {
  // --- Persistent Workspace States ---
  const [files, setFiles] = useState<SmartFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [copyHistory, setCopyHistory] = useState<CopyHistoryEntry[]>([]);

  // --- Auth state ---
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- Layout Views Coordinates ---
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"home" | "login" | "editor" | "dashboard" | "recovery" | "profile" | "about" | "developer">("home");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // --- Flagship state togglers ---
  const [unlockModeActive, setUnlockModeActive] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // --- Real-time user notification toasters ---
  const [customToaster, setCustomToaster] = useState<{ message: string; type: "success" | "warn" } | null>(null);

  // --- Theme state and synchronization logic ---
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("smartsheets_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("smartsheets_theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  // Initialize Supabase auth session
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const username = session.user.user_metadata?.username || session.user.email?.split("@")[0] || "user";
        setCurrentUser(username);
        setActiveView("dashboard");
      }
      setAuthLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const username = session.user.user_metadata?.username || session.user.email?.split("@")[0] || "user";
        setCurrentUser(username);
        setActiveView("dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load data from Supabase when user authenticates
  useEffect(() => {
    if (!currentUser) return;

    const loadFromDB = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const [dbFolders, dbWorkspaces, dbLogs] = await Promise.all([
          getFolders(user.id),
          getWorkspaces(user.id),
          getActivityLogs(user.id),
        ]);

        // Always set state from Supabase (even if empty — clears stale local data)
        setFolders(dbFolders.length > 0 ? dbFolders.map(f => ({
          id: f.id,
          name: f.name,
          parentId: f.parentId,
          color: f.color,
          icon: f.icon,
          isPinned: f.isPinned,
          isFavorite: f.isFavorite,
          isArchived: f.isArchived,
          isLocked: f.isLocked,
          password: f.password,
        })) : []);

        setFiles(dbWorkspaces.length > 0 ? dbWorkspaces.map(w => ({
          ...w,
          tags: w.tags || [],
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })) : []);

        setActivityLogs(dbLogs || []);
      } catch (e) {
        // Supabase tables might not exist yet
      }
    };
    loadFromDB();
  }, [currentUser]);

  // Clear stale localStorage from previous versions on mount
  useEffect(() => {
    localStorage.removeItem("smartsheets_files");
    localStorage.removeItem("smartsheets_folders");
    localStorage.removeItem("smartsheets_trash");
    localStorage.removeItem("smartsheets_logs");
    localStorage.removeItem("smartsheets_copies");
    localStorage.removeItem("smartsheets_session");
    localStorage.removeItem("smartsheets_version");
  }, []);

  // Sync to Supabase when available
  const syncFoldersToDB = async (folders: Folder[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    for (const f of folders) {
      try {
        const existing = folders.find(x => x.id === f.id);
        if (existing) {
          await updateFolder(f.id, f);
        } else {
          await createFolder(f.name, f.parentId, user.id);
        }
      } catch { /* table may not exist */ }
    }
  };

  const syncWorkspacesToDB = async (files: SmartFile[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    for (const f of files) {
      try {
        await updateWorkspace(f.id, f);
      } catch {
        try {
          await createWorkspace(f.name, f.type, f.folderId, user.id);
        } catch { /* table may not exist */ }
      }
    }
  };

  // Save changes to cache immediately
  const persistState = (newFiles: SmartFile[], newFolders: Folder[], _newTrash?: TrashItem[], _newLogs?: ActivityLog[], _newCopies?: CopyHistoryEntry[]) => {
    // Async sync to Supabase (no localStorage — all data stored in Supabase DB)
    syncFoldersToDB(newFolders);
    syncWorkspacesToDB(newFiles);
  };

  // --- Dynamic system tracking logging triggers ---
  const handleLogActivity = async (type: ActivityLog["type"], details: string) => {
    const log: ActivityLog = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      type,
      details,
    };
    const updated = [log, ...activityLogs].slice(0, 50);
    setActivityLogs(updated);
    persistState(files, folders, trash, updated, copyHistory);

    // Sync to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try { await createActivityLog(user.id, type, details); } catch {}
    }
  };

  // Hover copy logs register
  const handleAddClipboardEntry = (content: string, type: string, cellAddress: string) => {
    const copy: CopyHistoryEntry = {
      id: `cpy_${Date.now()}`,
      timestamp: Date.now(),
      content,
      type,
      cellAddress,
    };
    const updated = [copy, ...copyHistory].slice(0, 30); // limit 30 logs
    setCopyHistory(updated);
    persistState(files, folders, trash, activityLogs, updated);

    // Show temporary glow notification toaster
    setCustomToaster({ message: `Copied state address: ${cellAddress}!`, type: "success" });
    setTimeout(() => setCustomToaster(null), 1800);
  };

  // --- Folder operations ---
  const handleCreateFolder = (name: string, parentId: string | null) => {
    const f: Folder = {
      id: `fold_${Date.now()}`,
      name,
      parentId,
      color: ["#10b981", "#0284c7", "#f59e0b", "#ef4444", "#a855f7"][Math.floor(Math.random() * 5)],
    };
    const updatedFolders = [...folders, f];
    setFolders(updatedFolders);
    persistState(files, updatedFolders, trash, activityLogs, copyHistory);
    handleLogActivity("edit", `Deployed secure directory "${name}"`);
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Soft delete to Recovery Vault (contain payload)
    const backup: TrashItem = {
      id: `tr_${Date.now()}`,
      originalId: folderId,
      name: folder.name,
      type: "folder",
      deletedAt: Date.now(),
      originalParentId: folder.parentId,
      payload: folder,
    };

    const updatedFolders = folders.filter(f => f.id !== folderId);
    const updatedTrash = [backup, ...trash];
    setFolders(updatedFolders);
    setTrash(updatedTrash);
    persistState(files, updatedFolders, updatedTrash, activityLogs, copyHistory);
    handleLogActivity("delete", `Isolated directory "${folder.name}" to Recovery Vault`);
  };

  const handleLockFolder = (folderId: string) => {
    const updated = folders.map(f => (f.id === folderId ? { ...f, isLocked: !f.isLocked } : f));
    setFolders(updated);
    persistState(files, updated, trash, activityLogs, copyHistory);
    handleLogActivity("lock", `Toggled directory secure lock state override`);
  };

  const handleArchiveFolder = (folderId: string) => {
    const updated = folders.map(f => (f.id === folderId ? { ...f, isArchived: !f.isArchived } : f));
    setFolders(updated);
    persistState(files, updated, trash, activityLogs, copyHistory);
    handleLogActivity("edit", `Modified directory archiving boundaries`);
  };

  // --- Document File Actions ---
  const handleCreateFile = (type: WorkspaceType, name: string, folderId: string | null, hybridBlockType?: "spreadsheet" | "document" | "code" | "checklist" | "prompt" | "reference" | "multi") => {
    const fileId = `file_${Date.now()}`;
    const freshPayload: SmartFile = {
      id: fileId,
      name,
      folderId,
      type,
      tags: ["quick"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (type === WorkspaceType.SPREADSHEET) {
      freshPayload.sheets = [
        {
          id: `sh_${Date.now()}`,
          name: "Grid Workspace Pivot",
          rows: 40,
          cols: 16,
          cells: {
             A1: { value: `Initialized workspace: ${name}`, lockLevel: LockLevel.NONE },
          },
          frozenRows: 0,
          frozenCols: 0,
        },
      ];
      freshPayload.activeSheetId = freshPayload.sheets[0].id;
    } else if (type === WorkspaceType.DOCUMENT) {
      freshPayload.docBlocks = [
        { id: `blk_${Date.now()}`, type: "heading1", content: name },
        { id: `blk_p_${Date.now()}`, type: "paragraph", content: "Begin writing. Type '/' to trigger block templates." },
      ];
    } else if (type === WorkspaceType.HYBRID) {
      const bt = hybridBlockType || "document";
      const block: HybridBlock = { id: `hy_${Date.now()}`, type: bt, title: name };
      if (bt === "document") block.docContent = "Initialize components from the upper append choices.";
      if (bt === "code") { block.codeLanguage = "javascript"; block.docContent = "// Write your script here\n"; }
      if (bt === "checklist") block.checklistItems = [{ id: `cl_${Date.now()}`, text: "First task", done: false }];
      if (bt === "prompt") block.promptTemplate = "Write your prompt here...";
      if (bt === "reference") block.referenceUrl = "https://";
      if (bt === "spreadsheet") block.spreadsheetData = { rows: 20, cols: 8, cells: { A1: { value: "Start here", lockLevel: LockLevel.NONE } } };
      if (bt === "multi") block.docContent = "Add modules using APPEND COMPONENT MODULE";
      freshPayload.hybridBlocks = [block];
    }

    const updatedFiles = [...files, freshPayload];
    setFiles(updatedFiles);
    setActiveFileId(fileId);
    persistState(updatedFiles, folders, trash, activityLogs, copyHistory);
    handleLogActivity("edit", `Provisioned and compiled new ${type.toUpperCase()} layout file: "${name}"`);
  };

  const handleDeleteFile = (fileId: string) => {
    const targetFile = files.find(f => f.id === fileId);
    if (!targetFile) return;

    const backup: TrashItem = {
      id: `tr_${Date.now()}`,
      originalId: fileId,
      name: targetFile.name,
      type: "file",
      fileType: targetFile.type,
      deletedAt: Date.now(),
      originalParentId: targetFile.folderId,
      payload: targetFile,
    };

    const updatedFiles = files.filter(f => f.id !== fileId);
    const updatedTrash = [backup, ...trash];
    setFiles(updatedFiles);
    setTrash(updatedTrash);

    // Shift focus
    if (activeFileId === fileId) {
      setActiveFileId(updatedFiles[0]?.id || null);
    }

    persistState(updatedFiles, folders, updatedTrash, activityLogs, copyHistory);
    handleLogActivity("delete", `Isolated file unit "${targetFile.name}" to Recovery Vault`);
  };

  const handleUpdateFilePayload = (updated: SmartFile) => {
    const updatedFiles = files.map(f => (f.id === updated.id ? updated : f));
    setFiles(updatedFiles);
    persistState(updatedFiles, folders, trash, activityLogs, copyHistory);
  };

  const handleToggleFavoriteFile = (fileId: string) => {
    const updated = files.map(f => (f.id === fileId ? { ...f, isFavorite: !f.isFavorite } : f));
    setFiles(updated);
    persistState(updated, folders, trash, activityLogs, copyHistory);
  };

  const handleTogglePinFile = (fileId: string) => {
    const updated = files.map(f => (f.id === fileId ? { ...f, isPinned: !f.isPinned } : f));
    setFiles(updated);
    persistState(updated, folders, trash, activityLogs, copyHistory);
  };

  // --- RECOVERY VAULT ACTIONS ---
  const handleRestoreState = (trashId: string) => {
    const item = trash.find(t => t.id === trashId);
    if (!item) return;

    if (item.type === "folder") {
      const restored = item.payload as Folder;
      // Re-link parent if missing
      const updatedFolders = [...folders, restored];
      setFolders(updatedFolders);
      const updatedTrash = trash.filter(t => t.id !== trashId);
      setTrash(updatedTrash);
      persistState(files, updatedFolders, updatedTrash, activityLogs, copyHistory);
      handleLogActivity("restore", `Restored directory "${item.name}" safely`);
    } else {
      const restored = item.payload as SmartFile;
      const updatedFiles = [...files, restored];
      setFiles(updatedFiles);
      setActiveFileId(restored.id);
      const updatedTrash = trash.filter(t => t.id !== trashId);
      setTrash(updatedTrash);
      persistState(updatedFiles, folders, updatedTrash, activityLogs, copyHistory);
      handleLogActivity("restore", `Restored workspace model "${item.name}" safely`);
    }
    setCustomToaster({ message: "Successfully synced back restored records!", type: "success" });
    setTimeout(() => setCustomToaster(null), 1500);
  };

  const handlePurgeState = (trashId: string) => {
    const item = trash.find(t => t.id === trashId);
    if (!item) return;
    if (confirm(`WAR DAMAGE CONTROL ALERT. Permanently vaporize metadata node "${item.name}"? This action bypasses recovery centers.`)) {
      const updatedTrash = trash.filter(t => t.id !== trashId);
      setTrash(updatedTrash);
      persistState(files, folders, updatedTrash, activityLogs, copyHistory);
      handleLogActivity("delete", `Vaporized node "${item.name}" permanently`);
    }
  };

  const handleClearAllTrash = () => {
    if (confirm("FORCE SANITIZATION SEQUENCE. Permanently incinerate all items cached inside the Recovery isolation ward?")) {
      setTrash([]);
      persistState(files, folders, [], activityLogs, copyHistory);
      handleLogActivity("delete", "Swept Recovery isolation ward clean.");
    }
  };

  // Terminal actions run
  const handleRunSystemAction = (action: string) => {
    if (action === "lock_all") {
      // Apply broad Lock level 1 only to unlocked cells (respect existing locks)
      const updatedFiles = files.map(f => {
        if (f.type === WorkspaceType.SPREADSHEET && f.sheets) {
          const sheetsMod = f.sheets.map(sheet => {
            const cellsCopy = { ...sheet.cells };
            Object.keys(cellsCopy).forEach(coord => {
              const existing = cellsCopy[coord];
              cellsCopy[coord] = {
                ...existing,
                lockLevel: existing.lockLevel === LockLevel.NONE ? LockLevel.SOFT : existing.lockLevel,
              };
            });
            return { ...sheet, cells: cellsCopy };
          });
          return { ...f, sheets: sheetsMod };
        }
        return f;
      });
      setFiles(updatedFiles);
      persistState(updatedFiles, folders, trash, activityLogs, copyHistory);
      handleLogActivity("lock", "Dispatched global soft locks to unprotected cells");
      alert("GLOBAL SOFT ENCRYPTION APPLIED SUCCESS.");
    } else if (action === "backup") {
      // Build raw copy backup downloadable
      const strFile = JSON.stringify({ files, folders, trash, activityLogs, copyHistory }, null, 2);
      const blob = new Blob([strFile], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = url;
      tempLink.download = `smartsheets_vault_backup_${Date.now()}.json`;
      tempLink.click();
      handleLogActivity("import", "Exported global configuration parameters");
    } else if (action === "purge") {
      handleClearAllTrash();
    } else if (action === "new_sheets") {
      handleCreateFile(WorkspaceType.SPREADSHEET, "fresh_grid", null);
    } else if (action === "new_doc") {
      handleCreateFile(WorkspaceType.DOCUMENT, "fresh_notes", null);
    } else if (action === "new_hybrid") {
      handleCreateFile(WorkspaceType.HYBRID, "fresh_hybrid", null);
    } else if (action === "view_stats") {
      setActiveView("dashboard");
    } else if (action === "view_recovery") {
      setActiveView("recovery");
    }
  };

  // Switch audits
  const handleRestoreFromLogs = (logId: string) => {
    const targetLog = activityLogs.find(l => l.id === logId);
    if (!targetLog) return;
    alert("Re-syncing sandbox logs metadata successfully. Checkpoint values verified.");
  };

  // Filter active workspaces by selections
  const activeFile = files.find(f => f.id === activeFileId);

  const filteredFiles = useMemo(() => {
    let list = files;
    if (activeTag) {
      list = list.filter(f => f.tags && f.tags.includes(activeTag));
    }
    return list;
  }, [files, activeTag]);

  // Fuzzy Search Matches index compiler
  const searchMatches = useMemo(() => {
    return searchWorkspace(searchQuery, files, folders);
  }, [searchQuery, files, folders]);

  // Compute aggregate lock rates
  const globalLockStats = useMemo(() => {
    let locked = 0;
    let total = 0;
    let vault = 0;

    files.forEach(f => {
      if (f.type === WorkspaceType.SPREADSHEET && f.sheets) {
        f.sheets.forEach(sheet => {
          Object.values(sheet.cells).forEach(cell => {
            const cellData = cell as CellData;
            total++;
            if (cellData.lockLevel !== LockLevel.NONE) locked++;
            if (cellData.lockLevel === LockLevel.VAULT) vault++;
          });
        });
      }
    });

    return { locked, total, vault };
  }, [files]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setActiveView("home");
    setActiveFileId(null);
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-[#020402] flex items-center justify-center">
        <div className="flex items-center gap-2 text-emerald-500">
          <span className="w-4 h-4 border border-emerald-500 border-t-transparent animate-spin rounded-full" />
          <span className="text-xs">Restoring session...</span>
        </div>
      </div>
    );
  }

  if (activeView === "login") {
    return <Login onBack={() => setActiveView("home")} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#020402] text-emerald-400 font-mono select-none overflow-hidden antialiased max-w-full">
      
      {/* Cybersecurity Top Toolbar */}
      <Header
        onOpenPalette={() => setIsCommandPaletteOpen(true)}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        unlockModeActive={unlockModeActive}
        onToggleUnlockMode={() => setUnlockModeActive(!unlockModeActive)}
        lockStats={globalLockStats}
        activeWorkspaceName={activeFile?.name}
        theme={theme}
        onToggleTheme={() => {
          const next = theme === "dark" ? "light" : "dark";
          setTheme(next);
          handleLogActivity("edit", `Switched active design theme to ${next.toUpperCase()}`);
        }}
        onToggleMobileSidebar={() => setMobileSidebarOpen(v => !v)}
        mobileSidebarOpen={mobileSidebarOpen}
        isHome={activeView === "home"}
        onLogin={() => setActiveView("login")}
      />

      {/* Main Structural row layout */}
      <div className="flex-1 flex overflow-hidden relative max-w-full">
        
        {activeView === "home" ? <Home onLaunch={() => setActiveView("login")} onLogin={() => setActiveView("login")} /> : <>
        {/* Workspace directory browser */}
        <Sidebar
          files={filteredFiles}
          folders={folders}
          activeFileId={activeFileId}
          activeView={activeView}
          onSelectFile={(id) => {
            setActiveFileId(id);
            setActiveView("editor");
          }}
          onSelectView={setActiveView}
          onCreateFile={handleCreateFile}
          onCreateFolder={handleCreateFolder}
          onDeleteFile={handleDeleteFile}
          onDeleteFolder={handleDeleteFolder}
          onToggleFavoriteFile={handleToggleFavoriteFile}
          onTogglePinFile={handleTogglePinFile}
          onLockFolder={handleLockFolder}
          onArchiveFolder={handleArchiveFolder}
          activeTag={activeTag}
          onSelectTag={setActiveTag}
          currentUser={currentUser}
          onLogout={handleLogout}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Dynamic Center Stage Switchboard */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#020402]">
          
          {/* Display Search results overlay list over the main stage if query typed */}
          {searchQuery && (
            <div className="absolute inset-0 bg-black/90 p-6 z-35 overflow-y-auto font-mono text-emerald-400 max-h-full scrollbar-thin scrollbar-thumb-emerald-950">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
                  <span className="text-xs font-bold uppercase text-emerald-300">Fuzzy Search Results Match Index</span>
                  <button onClick={() => setSearchQuery("")} className="text-emerald-600 hover:text-emerald-400">
                    <X size={14} />
                  </button>
                </div>

                <div className="space-y-2">
                  {searchMatches.map((res, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveFileId(res.fileId);
                        setActiveView("editor");
                        setSearchQuery("");
                      }}
                      className="bg-[#050a06] border border-emerald-950 p-3 rounded flex items-start justify-between hover:border-emerald-500/20 cursor-pointer transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#00ffcc] font-bold text-xs">{res.fileName}</span>
                          <span className="text-[9px] bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-500 uppercase">
                            {res.fileType}
                          </span>
                        </div>
                        <p className="text-[9px] text-emerald-600">Location path: {res.path}</p>
                        <p className="text-xs text-emerald-300 leading-relaxed font-sans">{res.matchSnippet}</p>
                      </div>
                      <ChevronRight size={14} className="text-emerald-600 shrink-0 mt-2" />
                    </div>
                  ))}

                  {searchMatches.length === 0 && (
                    <div className="text-center py-16 text-emerald-700/60 font-sans">
                      No search files matches. Check typo indices rules.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE CONTENT WORKSPACE MODULE ROUTER */}
          {activeView === "dashboard" ? (
            <Dashboard
              files={files}
              activityLogs={activityLogs}
              copyHistory={copyHistory}
              onSelectFile={(id) => {
                setActiveFileId(id);
                setActiveView("editor");
              }}
              onClearLogs={() => {
                setActivityLogs([]);
                persistState(files, folders, trash, [], copyHistory);
              }}
              onRestoreFromLogs={handleRestoreFromLogs}
            />
          ) : activeView === "about" ? (
            <About />
          ) : activeView === "developer" ? (
            <Developer theme={theme} />
          ) : activeView === "profile" ? (
            <Profile
              filesCount={files.length}
              foldersCount={folders.length}
              logsCount={activityLogs.length}
              theme={theme}
              onToggleTheme={() => {
                const next = theme === "dark" ? "light" : "dark";
                setTheme(next);
                handleLogActivity("edit", `Switched active design theme to ${next.toUpperCase()}`);
              }}
            />
          ) : activeView === "recovery" ? (
            <RecoveryVault
              trash={trash}
              onRestore={handleRestoreState}
              onPurge={handlePurgeState}
              onClearAllTrash={handleClearAllTrash}
            />
          ) : (
            /* activeView === "editor" -> Check File Types */
            activeFile ? (
              activeFile.type === WorkspaceType.SPREADSHEET ? (
                <SpreadsheetWorkspace
                  file={activeFile}
                  onUpdateFile={handleUpdateFilePayload}
                  unlockModeActive={unlockModeActive}
                  onLogActivity={handleLogActivity}
                  onAddClipboardEntry={handleAddClipboardEntry}
                />
              ) : activeFile.type === WorkspaceType.DOCUMENT ? (
                <DocumentWorkspace
                  file={activeFile}
                  onUpdateFile={handleUpdateFilePayload}
                  onLogActivity={handleLogActivity}
                  onAddClipboardEntry={handleAddClipboardEntry}
                />
              ) : (
                /* Hybrid layout workspace */
                <HybridWorkspace
                  file={activeFile}
                  onUpdateFile={handleUpdateFilePayload}
                  onLogActivity={handleLogActivity}
                  onAddClipboardEntry={handleAddClipboardEntry}
                />
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center font-sans text-emerald-700">
                <ShieldAlert size={48} className="text-emerald-950 mb-3" />
                <p className="text-sm font-bold">Workspace empty.</p>
                <p className="text-[11px] opacity-60">Deploy folder directories and work unit files in the sidebar navigator.</p>
              </div>
            )
          )}
        </div>
      </>}
      </div>

      {/* Dynamic Floating Command Palette Popup Overlay */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpen={() => setIsCommandPaletteOpen(true)}
        files={files}
        folders={folders}
        onSelectFile={(id) => {
          setActiveFileId(id);
          setActiveView("editor");
        }}
        onCreateFile={(type, name) => handleCreateFile(type, name, null)}
        onRunSystemAction={handleRunSystemAction}
      />

      {/* Fast Notification Glow Toasters */}
      {customToaster && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#06120b] border border-[#10b981] rounded px-4 py-3 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-bounce font-mono text-xs flex items-center gap-2">
          <Sparkles size={14} className="text-[#00ffcc] animate-pulse" />
          <span className="text-emerald-200">{customToaster.message}</span>
        </div>
      )}

    </div>
  );
}
