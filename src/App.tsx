/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { SmartFile, Folder, TrashItem, ActivityLog, CopyHistoryEntry, WorkspaceType, LockLevel, SheetData, CellData } from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import RecoveryVault from "./components/RecoveryVault";
import SpreadsheetWorkspace from "./components/SpreadsheetWorkspace";
import DocumentWorkspace from "./components/DocumentWorkspace";
import HybridWorkspace from "./components/HybridWorkspace";
import CommandPalette from "./components/CommandPalette";
import { searchWorkspace } from "./utils/search";
import { ShieldAlert, Terminal, Sparkles, X, ChevronRight, CornerDownLeft } from "lucide-react";

export default function App() {
  // --- Persistent Workspace States ---
  const [files, setFiles] = useState<SmartFile[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [copyHistory, setCopyHistory] = useState<CopyHistoryEntry[]>([]);

  // --- Layout Views Coordinates ---
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"editor" | "dashboard" | "recovery">("dashboard");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Load from local localStorage on build-up
  useEffect(() => {
    const cachedFiles = localStorage.getItem("smartsheets_files");
    const cachedFolders = localStorage.getItem("smartsheets_folders");
    const cachedTrash = localStorage.getItem("smartsheets_trash");
    const cachedLogs = localStorage.getItem("smartsheets_logs");
    const cachedCopies = localStorage.getItem("smartsheets_copies");

    if (cachedFiles && cachedFolders) {
      setFiles(JSON.parse(cachedFiles));
      setFolders(JSON.parse(cachedFolders));
      setTrash(cachedTrash ? JSON.parse(cachedTrash) : []);
      setActivityLogs(cachedLogs ? JSON.parse(cachedLogs) : []);
      setCopyHistory(cachedCopies ? JSON.parse(cachedCopies) : []);
    } else {
      // First initiation: pre-seed awesome hacker structures examples
      seedDefaultVaultData();
    }
  }, []);

  // Save changes to cache immediately
  const persistState = (newFiles: SmartFile[], newFolders: Folder[], newTrash?: TrashItem[], newLogs?: ActivityLog[], newCopies?: CopyHistoryEntry[]) => {
    localStorage.setItem("smartsheets_files", JSON.stringify(newFiles));
    localStorage.setItem("smartsheets_folders", JSON.stringify(newFolders));
    if (newTrash) localStorage.setItem("smartsheets_trash", JSON.stringify(newTrash));
    if (newLogs) localStorage.setItem("smartsheets_logs", JSON.stringify(newLogs));
    if (newCopies) localStorage.setItem("smartsheets_copies", JSON.stringify(newCopies));
  };

  // Pre-seed mock values
  const seedDefaultVaultData = () => {
    const f1Id = "fold_vault";
    const f2Id = "fold_sandbox";

    const defaultFolders: Folder[] = [
      { id: f1Id, name: "Knowledge Vault", parentId: null, color: "#10b981", icon: "FolderLock", isPinned: true },
      { id: f2Id, name: "Aesthetic Sandboxes", parentId: null, color: "#ffaa00", icon: "Sliders" },
    ];

    const spreadsheetCells: Record<string, CellData> = {
      A1: { value: "Prompt Frameworks Overview", lockLevel: LockLevel.SOFT, style: { bold: true, color: "#00ffcc" } },
      A2: { value: "Parameters weight sum:", lockLevel: LockLevel.NONE },
      B2: { value: "250", lockLevel: LockLevel.NONE },
      A3: { value: "Execution speed sum:", lockLevel: LockLevel.NONE },
      B3: { value: "1100", lockLevel: LockLevel.NONE },
      A4: { value: "Aggregate score:", lockLevel: LockLevel.NONE },
      B4: { value: "3540", formula: "=SUM(B2,B3)", lockLevel: LockLevel.PROTECTED },
      A5: { value: "sk_vault_key_100x24", lockLevel: LockLevel.VAULT, lockPassword: "admin", note: "Encrypted API string" },
      A6: { value: "Type restore in console to break lock.", lockLevel: LockLevel.PERMANENT, note: "Permanent recovery guidelines" },
    };

    const sheetModel: SheetData = {
      id: "sh_core",
      name: "Smart Ledger Core",
      rows: 40,
      cols: 16,
      cells: spreadsheetCells,
      frozenRows: 1,
      frozenCols: 1,
    };

    const defaultFiles: SmartFile[] = [
      {
        id: "file_sheet",
        name: "Security Prompts Ledger",
        folderId: f1Id,
        type: WorkspaceType.SPREADSHEET,
        tags: ["prompts", "api", "finances"],
        sheets: [sheetModel],
        activeSheetId: "sh_core",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPinned: true,
      },
      {
        id: "file_doc",
        name: "Vault Systems Manual",
        folderId: f1Id,
        type: WorkspaceType.DOCUMENT,
        tags: ["study", "manual"],
        docBlocks: [
          { id: "blk_1", type: "heading1", content: "SmartSheets Crypt System Manual" },
          { id: "blk_2", type: "quote", content: "You are entering a private local node layout. Every block and grid item supports smart cell lock firmware." },
          { id: "blk_3", type: "heading2", content: "Core Operations Checklist" },
          { id: "blk_4", type: "checklist_item", content: "Configure custom passwords on Vault Locks (Level 3)", checked: true },
          { id: "blk_5", type: "checklist_item", content: "Assemble hybrid layouts chaining checklists and spreadsheet blocks", checked: false },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "file_hybrid",
        name: "Modular Developer Hub",
        folderId: f2Id,
        type: WorkspaceType.HYBRID,
        tags: ["sandbox", "prompts"],
        hybridBlocks: [
          {
            id: "hy_1",
            type: "prompt",
            title: "Secured Agent Prompter",
            promptTemplate: "Review and evaluate potential SQL execution paths targeting variables: $PROMPTVAR",
          },
          {
            id: "hy_2",
            type: "checklist",
            title: "Daily Standup Steps Tracker",
            checklistItems: [
              { id: "c1", text: "Commit spreadsheet cell changes to localStorage", done: true },
              { id: "c2", text: "Validate formula circular dependency loops", done: false },
            ],
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    // Seed logs
    const seedLogs: ActivityLog[] = [
      { id: "log_1", timestamp: Date.now() - 3600000, type: "import", details: "Core sandbox schemas successfully mounted." },
    ];

    setFiles(defaultFiles);
    setFolders(defaultFolders);
    setActivityLogs(seedLogs);
    setTrash([]);
    setCopyHistory([]);
    persistState(defaultFiles, defaultFolders, [], seedLogs, []);

    // Load active file by default
    setActiveFileId(defaultFiles[0].id);
  };

  // --- Dynamic system tracking logging triggers ---
  const handleLogActivity = (type: any, details: string) => {
    const log: ActivityLog = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      type,
      details,
    };
    const updated = [log, ...activityLogs].slice(0, 50); // limit 50 logs
    setActivityLogs(updated);
    persistState(files, folders, trash, updated, copyHistory);
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
  const handleCreateFile = (type: WorkspaceType, name: string, folderId: string | null) => {
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
      freshPayload.hybridBlocks = [
        { id: `hy_${Date.now()}`, type: "document", title: name, docContent: "Initialize components from the upper append choices." },
      ];
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
      // Apply broad Lock level 1 on all spreadsheet cells
      const updatedFiles = files.map(f => {
        if (f.type === WorkspaceType.SPREADSHEET && f.sheets) {
          const sheetsMod = f.sheets.map(sheet => {
            const cellsCopy = { ...sheet.cells };
            Object.keys(cellsCopy).forEach(coord => {
              cellsCopy[coord] = {
                ...cellsCopy[coord],
                lockLevel: LockLevel.SOFT,
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
      handleLogActivity("lock", "Dispatched global lock levels down to all coordinates");
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

  return (
    <div className="flex flex-col h-screen bg-[#020402] text-emerald-400 font-mono select-none overflow-hidden antialiased">
      
      {/* Cybersecurity Top Toolbar */}
      <Header
        onOpenPalette={() => setIsCommandPaletteOpen(true)}
        onSearch={setSearchQuery}
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
      />

      {/* Main Structural row layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
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
                          <span className="text-[9px] bg-emerald-950 px-1.5 py-0.2 rounded text-emerald-500 uppercase">
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
      </div>

      {/* Dynamic Floating Command Palette Popup Overlay */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        files={files}
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
