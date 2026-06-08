/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import {
  FolderOpen,
  FolderClosed,
  ChevronRight,
  ChevronDown,
  Grid,
  FileText,
  LayoutGrid,
  Plus,
  Trash2,
  FolderPlus,
  Pin,
  Star,
  Settings,
  MoreVertical,
  Lock,
  Archive,
  BarChart2,
  Tag,
  EyeOff
} from "lucide-react";
import { SmartFile, Folder, WorkspaceType } from "../types";

interface SidebarProps {
  files: SmartFile[];
  folders: Folder[];
  activeFileId: string | null;
  activeView: "editor" | "dashboard" | "recovery";
  onSelectFile: (fileId: string) => void;
  onSelectView: (view: "editor" | "dashboard" | "recovery") => void;
  onCreateFile: (type: WorkspaceType, name: string, folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onDeleteFile: (fileId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFavoriteFile: (fileId: string) => void;
  onTogglePinFile: (fileId: string) => void;
  onLockFolder: (folderId: string) => void;
  onArchiveFolder: (folderId: string) => void;
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export default function Sidebar({
  files,
  folders,
  activeFileId,
  activeView,
  onSelectFile,
  onSelectView,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onDeleteFolder,
  onToggleFavoriteFile,
  onTogglePinFile,
  onLockFolder,
  onArchiveFolder,
  activeTag,
  onSelectTag,
}: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [activeMenuFolderId, setActiveMenuFolderId] = useState<string | null>(null);
  const [activeMenuFileId, setActiveMenuFileId] = useState<string | null>(null);

  // Creation overlay toggles
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState<WorkspaceType>(WorkspaceType.SPREADSHEET);
  const [creationFolderTarget, setCreationFolderTarget] = useState<string | null>(null);

  // Group tags
  const allTags = Array.from(new Set(files.flatMap(f => f.tags || [])));

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateFolderClick = (parentId: string | null) => {
    setCreationFolderTarget(parentId);
    setNewFolderName("");
    setShowNewFolderModal(true);
  };

  const handleCreateFileClick = (folderId: string | null) => {
    setCreationFolderTarget(folderId);
    setNewFileName("");
    setShowNewFileModal(true);
  };

  const executeCreateFolder = () => {
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), creationFolderTarget);
    setShowNewFolderModal(false);
    setNewFolderName("");
  };

  const executeCreateFile = () => {
    if (!newFileName.trim()) return;
    onCreateFile(newFileType, newFileName.trim(), creationFolderTarget);
    setShowNewFileModal(false);
    setNewFileName("");
  };

  // recursive rendering helper for folders and their sub-folders/files
  const renderFolderNode = (folder: Folder, depth = 0) => {
    const isExpanded = !!expandedFolders[folder.id];
    const subfolders = folders.filter(f => f.parentId === folder.id && !f.isArchived);
    const folderFiles = files.filter(f => f.folderId === folder.id);
    const hasChildren = subfolders.length > 0 || folderFiles.length > 0;

    return (
      <div key={folder.id} className="select-none">
        {/* Folder Header */}
        <div
          className="group flex items-center justify-between py-1 px-2 rounded hover:bg-emerald-950/10 cursor-pointer text-xs"
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0" onClick={() => toggleFolder(folder.id)}>
            <div className="text-emerald-600">
              {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <div className="w-3.5" />}
            </div>
            <div style={{ color: folder.color || "#10b981" }} className="shrink-0">
              {isExpanded ? <FolderOpen size={14} /> : <FolderClosed size={14} />}
            </div>
            <span
              className={`truncate font-semibold tracking-wide ${
                folder.isLocked ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {folder.name}
              {folder.isLocked && <Lock size={10} className="inline ml-1 text-red-500 animate-pulse" />}
            </span>
          </div>

          {/* Quick Menu */}
          <div className="hidden group-hover:flex items-center gap-1 shrink-0 text-emerald-600">
            <button
              onClick={() => handleCreateFileClick(folder.id)}
              className="hover:text-emerald-400 p-0.5"
              title="New File Inside"
            >
              <Plus size={12} />
            </button>
            <button
              onClick={() => handleCreateFolderClick(folder.id)}
              className="hover:text-emerald-400 p-0.5"
              title="New Subfolder"
            >
              <FolderPlus size={12} />
            </button>
            <button
              onClick={() => {
                setActiveMenuFolderId(activeMenuFolderId === folder.id ? null : folder.id);
                setActiveMenuFileId(null);
              }}
              className="hover:text-emerald-400 p-0.5"
            >
              <MoreVertical size={12} />
            </button>
          </div>
        </div>

        {/* Dropdown options */}
        {activeMenuFolderId === folder.id && (
          <div className="mx-2 my-1 bg-black/90 border border-emerald-500/20 rounded p-1 text-[10px] space-y-1">
            <button
              onClick={() => {
                onLockFolder(folder.id);
                setActiveMenuFolderId(null);
              }}
              className="w-full text-left px-2 py-1 hover:bg-emerald-950/20 flex items-center gap-1.5 text-emerald-400"
            >
              <Lock size={10} />
              <span>{folder.isLocked ? "Remove Folder Lock" : "Secure Lock Folder"}</span>
            </button>
            <button
              onClick={() => {
                onArchiveFolder(folder.id);
                setActiveMenuFolderId(null);
              }}
              className="w-full text-left px-2 py-1 hover:bg-emerald-950/20 flex items-center gap-1.5 text-emerald-400"
            >
              <Archive size={10} />
              <span>{folder.isArchived ? "Unarchive" : "Archive Folder"}</span>
            </button>
            <button
              onClick={() => {
                onDeleteFolder(folder.id);
                setActiveMenuFolderId(null);
              }}
              className="w-full text-left px-2 py-1 hover:bg-red-950/20 flex items-center gap-1.5 text-red-400 border-t border-emerald-900/30"
            >
              <Trash2 size={10} />
              <span>Purge To Vault Trash</span>
            </button>
          </div>
        )}

        {/* Folder Contents */}
        {isExpanded && (
          <div className="space-y-0.5 mt-0.5">
            {/* Draw nested folders */}
            {subfolders.map(sub => renderFolderNode(sub, depth + 1))}

            {/* Draw nested files */}
            {folderFiles.map(file => (
              <div
                key={file.id}
                style={{ paddingLeft: `${(depth + 1) * 12 + 20}px` }}
                className={`group flex items-center justify-between py-1 pr-2 rounded text-xs transition-colors ${
                  activeFileId === file.id && activeView === "editor"
                    ? "bg-emerald-950/30 text-emerald-200 border-r-2 border-emerald-500 font-bold"
                    : "hover:bg-emerald-950/5 text-emerald-500/80 hover:text-emerald-400"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 cursor-pointer flex-1" onClick={() => {
                  onSelectFile(file.id);
                  onSelectView("editor");
                }}>
                  {file.type === WorkspaceType.SPREADSHEET && <Grid size={12} className="text-emerald-500 shrink-0" />}
                  {file.type === WorkspaceType.DOCUMENT && <FileText size={12} className="text-[#00ffcc] shrink-0" />}
                  {file.type === WorkspaceType.HYBRID && <LayoutGrid size={12} className="text-[#ff9900] shrink-0" />}
                  <span className="truncate">{file.name}</span>
                </div>

                <div className="hidden group-hover:flex items-center gap-1 text-emerald-600 ml-1">
                  <button onClick={() => onToggleFavoriteFile(file.id)} className="hover:text-yellow-400 p-0.5">
                    <Star size={11} className={file.isFavorite ? "fill-yellow-500 text-yellow-500" : ""} />
                  </button>
                  <button onClick={() => onTogglePinFile(file.id)} className="hover:text-cyan-400 p-0.5">
                    <Pin size={11} className={file.isPinned ? "fill-cyan-500 text-cyan-500" : ""} />
                  </button>
                  <button
                    onClick={() => {
                      setActiveMenuFileId(activeMenuFileId === file.id ? null : file.id);
                      setActiveMenuFolderId(null);
                    }}
                    className="hover:text-emerald-400 p-0.5"
                  >
                    <MoreVertical size={11} />
                  </button>
                </div>

                {/* File Dropdown Actions */}
                {activeMenuFileId === file.id && (
                  <div className="absolute right-2 bg-black/95 border border-emerald-500/40 rounded p-1 text-[10px] space-y-1 z-30 shadow-xl">
                    <button
                      onClick={() => {
                        onDeleteFile(file.id);
                        setActiveMenuFileId(null);
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-red-950/20 flex items-center gap-1.5 text-red-400"
                    >
                      <Trash2 size={10} />
                      <span>Delete Work Unit</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = folders.filter(f => f.parentId === null && !f.isArchived);
  const rootFiles = files.filter(f => f.folderId === null);

  const pinnedFiles = files.filter(f => f.isPinned);
  const favoriteFiles = files.filter(f => f.isFavorite);

  return (
    <div className="w-64 bg-[#080d0b] border-r border-emerald-500/20 flex flex-col h-full font-mono text-emerald-400 select-none overflow-hidden text-xs shrink-0">
      
      {/* Upper Navigation (Module links) */}
      <div className="p-3 border-b border-emerald-500/10 space-y-1">
        <button
          onClick={() => onSelectView("dashboard")}
          className={`w-full flex items-center gap-2.5 py-2 px-3 rounded text-left transition-all ${
            activeView === "dashboard"
              ? "bg-emerald-950/40 text-emerald-300 border-l-2 border-[#10b981]"
              : "hover:bg-emerald-950/10 text-emerald-500/70"
          }`}
        >
          <BarChart2 size={14} className="text-[#10b981]" />
          <span className="font-bold uppercase tracking-wider">Security Analytics</span>
        </button>

        <button
          onClick={() => onSelectView("recovery")}
          className={`w-full flex items-center gap-2.5 py-2 px-3 rounded text-left transition-all ${
            activeView === "recovery"
              ? "bg-red-950/15 text-red-400 border-l-2 border-red-500"
              : "hover:bg-red-950/5 text-emerald-500/70"
          }`}
        >
          <Trash2 size={14} className="text-red-500 shrink-0" />
          <span className="font-bold uppercase tracking-widest">Recovery Vault</span>
        </button>
      </div>

      {/* Main Folder Explorer Tree */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-emerald-950/50">
        
        {/* Core Controls */}
        <div className="flex justify-between items-center text-[10px] text-emerald-600 uppercase font-black tracking-widest border-b border-emerald-950/50 pb-1">
          <span>Personal Data Vault</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCreateFolderClick(null)}
              className="hover:text-emerald-400"
              title="Add Root Folder"
            >
              <FolderPlus size={13} />
            </button>
            <button
              onClick={() => handleCreateFileClick(null)}
              className="hover:text-emerald-400"
              title="Add Root Workspace"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Dynamic Nested Explorer Grid */}
        <div className="space-y-1">
          {rootFolders.map(folder => renderFolderNode(folder, 0))}
          
          {rootFiles.map(file => (
            <div
              key={file.id}
              className={`group flex items-center justify-between py-1 px-3 rounded transition-colors ${
                activeFileId === file.id && activeView === "editor"
                  ? "bg-emerald-950/30 text-emerald-200 border-r-2 border-emerald-500 font-bold"
                  : "hover:bg-emerald-950/5 text-emerald-500/80 hover:text-emerald-400"
              }`}
            >
              <div
                className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                onClick={() => {
                  onSelectFile(file.id);
                  onSelectView("editor");
                }}
              >
                {file.type === WorkspaceType.SPREADSHEET && <Grid size={12} className="text-emerald-500 shrink-0" />}
                {file.type === WorkspaceType.DOCUMENT && <FileText size={12} className="text-[#00ffcc] shrink-0" />}
                {file.type === WorkspaceType.HYBRID && <LayoutGrid size={12} className="text-[#ff9900] shrink-0" />}
                <span className="truncate">{file.name}</span>
              </div>

              <div className="hidden group-hover:flex items-center gap-1 text-emerald-600 ml-1">
                <button onClick={() => onToggleFavoriteFile(file.id)} className="hover:text-yellow-400 p-0.5">
                  <Star size={11} className={file.isFavorite ? "fill-yellow-500 text-yellow-500" : ""} />
                </button>
                <button onClick={() => onTogglePinFile(file.id)} className="hover:text-cyan-400 p-0.5">
                  <Pin size={11} className={file.isPinned ? "fill-cyan-500 text-cyan-500" : ""} />
                </button>
                <button
                  onClick={() => {
                    setActiveMenuFileId(activeMenuFileId === file.id ? null : file.id);
                    setActiveMenuFolderId(null);
                  }}
                  className="hover:text-emerald-400 p-0.5"
                >
                  <MoreVertical size={11} />
                </button>
              </div>

              {/* Duplicate Menu */}
              {activeMenuFileId === file.id && (
                <div className="absolute left-10 bg-black/95 border border-emerald-500/40 rounded p-1 text-[10px] space-y-1 z-30 shadow-xl">
                  <button
                    onClick={() => {
                      onDeleteFile(file.id);
                      setActiveMenuFileId(null);
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-red-950/20 flex items-center gap-1.5 text-red-400"
                  >
                    <Trash2 size={10} />
                    <span>Delete File Node</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {rootFolders.length === 0 && rootFiles.length === 0 && (
            <div className="text-center py-6 text-emerald-700/60 font-sans text-[11px]">
              No active files detected.<br />Deploy using the [+] indicators.
            </div>
          )}
        </div>

        {/* Shortcuts View (Favorites or Pinned) */}
        {(pinnedFiles.length > 0 || favoriteFiles.length > 0) && (
          <div className="space-y-2 border-t border-emerald-950/50 pt-2.5">
            <div className="text-[10px] text-emerald-600 uppercase font-black tracking-widest pb-1">
              Pinned Channels
            </div>
            <div className="space-y-1 text-[11px]">
              {pinnedFiles.map(file => (
                <div
                  key={`pin-${file.id}`}
                  onClick={() => {
                    onSelectFile(file.id);
                    onSelectView("editor");
                  }}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-emerald-950/10 cursor-pointer text-emerald-300"
                >
                  <Pin size={10} className="text-cyan-400 fill-cyan-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
              {favoriteFiles.map(file => (
                <div
                  key={`fav-${file.id}`}
                  onClick={() => {
                    onSelectFile(file.id);
                    onSelectView("editor");
                  }}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-emerald-950/10 cursor-pointer text-yellow-400"
                >
                  <Star size={10} className="fill-yellow-500 text-yellow-500 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags Navigator */}
        {allTags.length > 0 && (
          <div className="space-y-2 border-t border-emerald-950/50 pt-2.5">
            <div className="text-[10px] text-emerald-600 uppercase font-black tracking-widest pb-1 flex justify-between items-center">
              <span>Secure Classifications</span>
              {activeTag && (
                <button onClick={() => onSelectTag(null)} className="text-[9px] text-[#00ffcc] lowercase hover:underline">
                  clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => onSelectTag(activeTag === tag ? null : tag)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                    activeTag === tag
                      ? "bg-[#022c22] border-emerald-500 text-[#00ff99] font-bold"
                      : "bg-[#030705] border-emerald-950 hover:border-emerald-700 text-emerald-600 hover:text-emerald-400"
                  }`}
                >
                  <Tag size={8} />
                  <span>#{tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* System Node details */}
      <div className="p-3 bg-[#030604] border-t border-emerald-500/20 text-[10px] text-emerald-600 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>VAULT INFRA: READY</span>
        </div>
        <span className="opacity-50">L_M: v1.0.4</span>
      </div>

      {/* New Folder Modal Dialog */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#0b100d] border border-emerald-500 rounded p-4 font-mono max-w-sm w-full shadow-2xl">
            <h3 className="text-emerald-400 text-xs font-bold uppercase mb-2">Create New Secured Vault Directory</h3>
            <input
              type="text"
              className="w-full text-xs font-mono bg-black border border-emerald-900 rounded p-2 text-emerald-300 focus:outline-none focus:border-emerald-500 mb-3"
              placeholder="e.g. Passwords, Prompts..."
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && executeCreateFolder()}
            />
            <div className="flex justify-end gap-2 text-[11px]">
              <button
                onClick={() => setShowNewFolderModal(false)}
                className="px-2.5 py-1 text-emerald-700 hover:text-emerald-400"
              >
                Cancel
              </button>
              <button
                onClick={executeCreateFolder}
                className="px-3 py-1 bg-emerald-950 border border-emerald-500 text-emerald-300 hover:bg-emerald-900 rounded"
              >
                Deploy Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Workspace File Modal Dialog */}
      {showNewFileModal && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#0b100d] border border-emerald-500 rounded p-4 font-mono max-w-sm w-full shadow-2xl">
            <h3 className="text-emerald-400 text-xs font-bold uppercase mb-2">Initialize Smart Work Unit File</h3>
            <input
              type="text"
              className="w-full text-xs bg-black border border-emerald-900 rounded p-2 text-emerald-300 focus:outline-none focus:border-emerald-500 mb-3 font-mono"
              placeholder="e.g. prompt_templates, research_notes..."
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && executeCreateFile()}
            />
            
            <div className="space-y-1 mb-4">
              <label className="text-[10px] text-emerald-600 block uppercase font-bold">Select Core Archetype</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setNewFileType(WorkspaceType.SPREADSHEET)}
                  className={`flex flex-col items-center justify-center py-2 rounded border text-xs ${
                    newFileType === WorkspaceType.SPREADSHEET
                      ? "bg-emerald-950/35 border-emerald-500 text-emerald-300"
                      : "bg-black border-emerald-900 hover:border-emerald-700 text-emerald-600"
                  }`}
                >
                  <Grid size={16} />
                  <span className="text-[9px] mt-1 font-bold">Grid</span>
                </button>

                <button
                  onClick={() => setNewFileType(WorkspaceType.DOCUMENT)}
                  className={`flex flex-col items-center justify-center py-2 rounded border text-xs ${
                    newFileType === WorkspaceType.DOCUMENT
                      ? "bg-emerald-950/35 border-[#00ffcc] text-[#00ffcc]"
                      : "bg-black border-emerald-900 hover:border-emerald-700 text-emerald-600"
                  }`}
                >
                  <FileText size={16} />
                  <span className="text-[9px] mt-1 font-bold">Document</span>
                </button>

                <button
                  onClick={() => setNewFileType(WorkspaceType.HYBRID)}
                  className={`flex flex-col items-center justify-center py-2 rounded border text-xs ${
                    newFileType === WorkspaceType.HYBRID
                      ? "bg-emerald-950/35 border-[#ff9900] text-[#ff9900]"
                      : "bg-black border-emerald-900 hover:border-emerald-700 text-emerald-600"
                  }`}
                >
                  <LayoutGrid size={16} />
                  <span className="text-[9px] mt-1 font-bold">Hybrid</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-[11px]">
              <button
                onClick={() => setShowNewFileModal(false)}
                className="px-2.5 py-1 text-emerald-700 hover:text-emerald-400"
              >
                Abort
              </button>
              <button
                onClick={executeCreateFile}
                className="px-3 py-1 bg-[#101c18] border border-emerald-500 text-emerald-300 hover:bg-emerald-900 rounded font-bold"
              >
                Provision File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
