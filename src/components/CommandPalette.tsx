/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Search, Terminal, FileText, Grid, LayoutGrid, X, FolderCode } from "lucide-react";
import { SmartFile, WorkspaceType } from "../types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: SmartFile[];
  onSelectFile: (fileId: string) => void;
  onCreateFile: (type: WorkspaceType, name: string) => void;
  onRunSystemAction: (action: string) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  files,
  onSelectFile,
  onCreateFile,
  onRunSystemAction,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
      setQuery("");
    }
  }, [isOpen]);

  // Handle global keybindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K" || e.key === "/")) {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter criteria
  const isSystemCommand = query.startsWith(">");
  const cleanQuery = isSystemCommand ? query.substring(1).trim().toUpperCase() : query.toUpperCase();

  const systemCommands = [
    { cmd: ">LOCK ALL", desc: "Instantly lock all workspaces with soft locks", action: "lock_all" },
    { cmd: ">BACKUP", desc: "Export entire database as raw JSON state file", action: "backup" },
    { cmd: ">PURGE TRASH", desc: "Permanently delete items in Recovery Bin", action: "purge" },
    { cmd: ">NEW SHEETS", desc: "Deploy a fresh Spreadsheet workspace file", action: "new_sheets" },
    { cmd: ">NEW DOC", desc: "Deploy a fresh Document workspace file", action: "new_doc" },
    { cmd: ">NEW HYBRID", desc: "Deploy a fresh Hybrid document workspace file", action: "new_hybrid" },
    { cmd: ">SYSTEM STATS", desc: "Switch dashboard view to system audit console", action: "view_stats" },
    { cmd: ">RECOVERY CENTER", desc: "Trigger system recovery interface", action: "view_recovery" },
  ];

  const matchedSystem = systemCommands.filter(
    c => c.cmd.includes(cleanQuery) || c.desc.toUpperCase().includes(cleanQuery)
  );

  const matchedFiles = files.filter(f => f.name.toUpperCase().includes(cleanQuery));

  const totalItems = isSystemCommand ? matchedSystem.length : matchedFiles.length + 1; // +1 for "or create new" if typing

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Enter") {
      e.preventDefault();
      triggerSelectedAction();
    }
  };

  const triggerSelectedAction = () => {
    if (isSystemCommand) {
      const selected = matchedSystem[selectedIndex];
      if (selected) {
        onRunSystemAction(selected.action);
        onClose();
      }
    } else {
      if (selectedIndex < matchedFiles.length) {
        onSelectFile(matchedFiles[selectedIndex].id);
        onClose();
      } else if (query.trim()) {
        // Create new spreadsheet by default if not exists
        onCreateFile(WorkspaceType.SPREADSHEET, query.trim());
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/80 backdrop-blur-sm p-4">
      <div
        id="command-palette"
        className="w-full max-w-xl bg-[#0a0f0d] border border-emerald-500/30 rounded-lg shadow-2xl overflow-hidden font-mono text-emerald-400 max-h-[80vh] flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Banner */}
        <div className="bg-emerald-950/20 px-4 py-2 border-b border-emerald-500/20 text-xs flex justify-between items-center text-emerald-500">
          <div className="flex items-center gap-1.5">
            <Terminal size={14} className="animate-pulse" />
            <span>SMARTSHEETS CORE TERMINAL v3.8</span>
          </div>
          <span className="opacity-60">ESC to quit</span>
        </div>

        {/* Input */}
        <div className="flex items-center px-4 py-3 border-b border-emerald-500/20 bg-black/40 gap-3">
          <Search size={18} className="text-emerald-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none outline-none text-emerald-300 placeholder-emerald-800 text-sm focus:ring-0 focus:outline-none"
            placeholder="Type search query, or use '>' for developer commands..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-emerald-700 hover:text-emerald-400">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Console view list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[50vh] scrollbar-thin scrollbar-thumb-emerald-900">
          {isSystemCommand ? (
            /* System Command Mode */
            matchedSystem.length > 0 ? (
              matchedSystem.map((item, index) => (
                <button
                  key={item.action}
                  onClick={() => {
                    onRunSystemAction(item.action);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded flex items-center justify-between text-xs transition-colors ${
                    index === selectedIndex
                      ? "bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500 pl-2.5"
                      : "hover:bg-emerald-950/10 text-emerald-500/80"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="opacity-60" />
                    <span>{item.cmd}</span>
                  </div>
                  <span className="text-[10px] opacity-60 text-emerald-600 font-sans">{item.desc}</span>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-emerald-700">No matching system commands found.</div>
            )
          ) : (
            /* Standard File Search View */
            <>
              {matchedFiles.length > 0 && (
                <div className="px-2 py-1 text-[10px] text-emerald-700 uppercase tracking-widest font-bold">
                  Files Located ({matchedFiles.length})
                </div>
              )}
              {matchedFiles.map((file, index) => (
                <button
                  key={file.id}
                  onClick={() => {
                    onSelectFile(file.id);
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded flex items-center justify-between text-xs transition-colors ${
                    index === selectedIndex
                      ? "bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500 pl-2.5"
                      : "hover:bg-emerald-950/10 text-emerald-500/80"
                  }`}
                >
                  <div className="flex items-center gap-2 max-w-[70%]">
                    {file.type === WorkspaceType.SPREADSHEET && <Grid size={14} className="text-emerald-500 shrink-0" />}
                    {file.type === WorkspaceType.DOCUMENT && <FileText size={14} className="text-[#00ffcc] shrink-0" />}
                    {file.type === WorkspaceType.HYBRID && <LayoutGrid size={14} className="text-[#ff9900] shrink-0" />}
                    <span className="truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {file.tags.slice(0, 2).map(t => (
                      <span key={t} className="text-[9px] bg-emerald-950/40 px-1.5 py-0.5 rounded text-emerald-600">
                        #{t}
                      </span>
                    ))}
                    <span className="text-[10px] uppercase text-emerald-700/80">{file.type}</span>
                  </div>
                </button>
              ))}

              {/* Dynamic Creation block */}
              {query.trim() && (
                <button
                  onClick={() => {
                    onCreateFile(WorkspaceType.SPREADSHEET, query.trim());
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 text-xs transition-colors mt-2 ${
                    selectedIndex === matchedFiles.length
                      ? "bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500 pl-2.5"
                      : "hover:bg-emerald-950/10 text-emerald-600"
                  }`}
                >
                  <FolderCode size={14} />
                  <span>
                    Deploy new core <strong className="text-emerald-400">"{query.trim()}"</strong> Spreadsheet
                  </span>
                </button>
              )}

              {matchedFiles.length === 0 && !query.trim() && (
                <div className="p-8 text-center text-xs text-emerald-700">
                  <p>Begin typing to filter files...</p>
                  <p className="mt-1 text-[10px] opacity-60">e.g., "Passwords", "Prompts", "My Ledger"</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#050806] px-4 py-2 text-[10px] text-emerald-600 border-t border-emerald-500/15 flex justify-between items-center">
          <span>Navigation: [↑↓] select, [ENTER] execute</span>
          <span>Tip: Type <b className="text-emerald-400">&gt;LOCK</b> for global lockdowns</span>
        </div>
      </div>
    </div>
  );
}
