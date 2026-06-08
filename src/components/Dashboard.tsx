/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, GitCommit, FileSpreadsheet, FileText, LayoutGrid, Clock, Calendar, CheckSquare, Trash2, Key, Database, Cpu, Lock } from "lucide-react";
import { SmartFile, ActivityLog, CopyHistoryEntry, LockLevel } from "../types";

interface DashboardProps {
  files: SmartFile[];
  activityLogs: ActivityLog[];
  copyHistory: CopyHistoryEntry[];
  onSelectFile: (fileId: string) => void;
  onClearLogs: () => void;
  onRestoreFromLogs: (logId: string) => void;
}

export default function Dashboard({
  files,
  activityLogs,
  copyHistory,
  onSelectFile,
  onClearLogs,
  onRestoreFromLogs,
}: DashboardProps) {
  // Compute key file characteristics
  const totalFilesCount = files.length;
  const sheetCount = files.filter(f => f.type === "spreadsheet").length;
  const docCount = files.filter(f => f.type === "document").length;
  const hybridCount = files.filter(f => f.type === "hybrid").length;

  // Compute lock states across all cells in spreadsheets
  let totalCells = 0;
  let softLocks = 0;
  let protectedLocks = 0;
  let vaultLocks = 0;
  let permanentLocks = 0;

  files.forEach(f => {
    if (f.type === "spreadsheet" && f.sheets) {
      f.sheets.forEach(sheet => {
        Object.values(sheet.cells).forEach(cell => {
          totalCells++;
          if (cell.lockLevel === LockLevel.SOFT) softLocks++;
          if (cell.lockLevel === LockLevel.PROTECTED) protectedLocks++;
          if (cell.lockLevel === LockLevel.VAULT) vaultLocks++;
          if (cell.lockLevel === LockLevel.PERMANENT) permanentLocks++;
        });
      }
    );
    }
  });

  const totalLockedCellsCount = softLocks + protectedLocks + vaultLocks + permanentLocks;

  // Storage usage mock (based on records weight)
  const byteWeight = totalFilesCount * 4520 + totalCells * 324 + activityLogs.length * 128;
  const storageKb = (byteWeight / 1024).toFixed(2);
  const storagePercent = Math.min(Math.max(Math.round((byteWeight / 50000) * 100), 2), 98);

  // Compute Tag statistics
  const tagCounts: Record<string, number> = {};
  files.forEach(f => {
    f.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="flex-1 bg-[#020503] font-mono text-emerald-400 p-6 overflow-y-auto space-y-6 select-none scrollbar-thin scrollbar-thumb-emerald-900">
      
      {/* Upper Status Banner */}
      <div className="border border-emerald-500/20 bg-emerald-950/5 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-[#00ff99] animate-pulse shrink-0" />
          <div>
            <h1 className="text-sm font-bold tracking-widest text-emerald-100 uppercase">Personal Knowledge Core Monitor</h1>
            <p className="text-[10px] text-emerald-500/80">Diagnostic firmware online. File systems encrypted. Secure transmission validated.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <div className="bg-black/40 border border-emerald-950 px-2.5 py-1.5 rounded flex items-center gap-1.5 min-w-[100px]">
            <Cpu size={12} className="text-[#00ffcc]" />
            <div>
              <span className="text-emerald-700 block uppercase font-bold text-[8px]">Processor Uptime</span>
              <span className="text-emerald-300 font-sans font-semibold">100% SECURE</span>
            </div>
          </div>
          <div className="bg-black/40 border border-emerald-950 px-2.5 py-1.5 rounded flex items-center gap-1.5 min-w-[100px]">
            <Database size={12} className="text-[#ffaa00]" />
            <div>
              <span className="text-emerald-700 block uppercase font-bold text-[8px]">Encrypted Pool</span>
              <span className="text-emerald-300 font-bold">{storageKb} KB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid statistics panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Documents */}
        <div className="bg-[#050906] border border-emerald-950 rounded p-4 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute right-2 top-2 text-emerald-950 opacity-40 group-hover:opacity-80 transition-opacity">
            <FileText size={48} />
          </div>
          <span className="text-[9px] text-emerald-600 block uppercase tracking-wider font-bold">Document Files</span>
          <span className="text-3xl font-black text-[#00ffcc] tracking-tight">{docCount}</span>
          <span className="text-[9px] block text-emerald-500 opacity-60 mt-1 uppercase font-semibold">Active Rich Document Cells</span>
        </div>

        {/* Total Spreadsheets */}
        <div className="bg-[#050906] border border-emerald-950 rounded p-4 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute right-2 top-2 text-emerald-950 opacity-40 group-hover:opacity-80 transition-opacity">
            <FileSpreadsheet size={48} />
          </div>
          <span className="text-[9px] text-emerald-600 block uppercase tracking-wider font-bold">Spreadsheet Files</span>
          <span className="text-3xl font-black text-emerald-300 tracking-tight">{sheetCount}</span>
          <span className="text-[9px] block text-emerald-500 opacity-60 mt-1 uppercase font-semibold">Multiple sheet tab structures</span>
        </div>

        {/* Total Hybrid items */}
        <div className="bg-[#050906] border border-emerald-950 rounded p-4 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute right-2 top-2 text-emerald-950 opacity-40 group-hover:opacity-80 transition-opacity">
            <LayoutGrid size={48} />
          </div>
          <span className="text-[9px] text-emerald-600 block uppercase tracking-wider font-bold">Hybrid Bento Files</span>
          <span className="text-3xl font-black text-[#ffaa00] tracking-tight">{hybridCount}</span>
          <span className="text-[9px] block text-emerald-500 opacity-60 mt-1 uppercase font-semibold">Modular canvas compositions</span>
        </div>

        {/* Locked Proportions */}
        <div className="bg-[#050906] border border-emerald-950 rounded p-4 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute right-2 top-2 text-emerald-950 opacity-40 group-hover:opacity-80 transition-opacity">
            <Shield size={48} />
          </div>
          <span className="text-[9px] text-emerald-600 block uppercase tracking-wider font-bold">Safe Lock Cells</span>
          <span className="text-3xl font-black text-emerald-100 tracking-tight">{totalLockedCellsCount}</span>
          <span className="text-[9px] block text-emerald-500 opacity-60 mt-1 uppercase font-semibold">Total Cells Protected</span>
        </div>

      </div>

      {/* Section layout with Charts / Locks Analysis & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column Left: Visual Telemetry + Lock Statistics */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Security Deep Lock metrics */}
          <div className="bg-[#040805]/95 border border-emerald-950 rounded p-4">
            <div className="flex items-center gap-1.5 border-b border-emerald-950 pb-2 mb-3">
              <Shield size={14} className="text-[#00ffcc]" />
              <h2 className="text-xs font-bold uppercase text-emerald-100">Smart Cell Lock Statistics</h2>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Level 1 Soft Locks */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-emerald-500">Soft Lock (L1)</span>
                  <span className="font-bold text-emerald-300">{softLocks} cells</span>
                </div>
                <div className="w-full h-2 bg-black rounded border border-emerald-950 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${totalLockedCellsCount > 0 ? (softLocks / totalLockedCellsCount) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[9px] text-emerald-650 opacity-60 mt-0.5">Unlocked via quick bypass.</p>
              </div>

              {/* Level 2 Confirmation Locks */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-emerald-500">Protected Lock (L2)</span>
                  <span className="font-bold text-[#00ffcc]">{protectedLocks} cells</span>
                </div>
                <div className="w-full h-2 bg-black rounded border border-emerald-950 overflow-hidden">
                  <div
                    className="h-full bg-[#00ffcc]"
                    style={{ width: `${totalLockedCellsCount > 0 ? (protectedLocks / totalLockedCellsCount) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[9px] text-emerald-650 opacity-60 mt-0.5">Requires warning click validation.</p>
              </div>

              {/* Level 3 Password Locks */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-emerald-400">Vault Password Lock (L3)</span>
                  <span className="font-bold text-[#ff9900]">{vaultLocks} cells</span>
                </div>
                <div className="w-full h-2 bg-black rounded border border-emerald-950 overflow-hidden">
                  <div
                    className="h-full bg-[#ff9900]"
                    style={{ width: `${totalLockedCellsCount > 0 ? (vaultLocks / totalLockedCellsCount) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[9px] text-emerald-650 opacity-60 mt-0.5">Protected with encrypted keys.</p>
              </div>

              {/* Level 4 Permanent Locks */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-red-400 animate-pulse">Permanent Airgap Lock (L4)</span>
                  <span className="font-bold text-red-500">{permanentLocks} cells</span>
                </div>
                <div className="w-full h-2 bg-black rounded border border-emerald-950 overflow-hidden font-mono">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${totalLockedCellsCount > 0 ? (permanentLocks / totalLockedCellsCount) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[9px] text-red-650 opacity-80 mt-0.5">Bypassed only via Recovery Console.</p>
              </div>
            </div>
          </div>

          {/* Tag Distribution metrics */}
          <div className="bg-[#040805]/95 border border-emerald-950 rounded p-4">
            <div className="flex items-center gap-1.5 border-b border-emerald-950 pb-2 mb-3">
              <Calendar size={14} className="text-emerald-500" />
              <h2 className="text-xs font-bold uppercase text-emerald-100">Tag Distribution</h2>
            </div>
            {sortedTags.length > 0 ? (
              <div className="space-y-2 text-xs">
                {sortedTags.map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400">#{tag}</span>
                    <div className="flex-1 mx-3 h-1 bg-emerald-950 rounded overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(count / files.length) * 100}%` }} />
                    </div>
                    <span className="text-emerald-300 font-bold">{count} unit{count > 1 ? "s" : ""}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-emerald-700 text-center py-4">No tag indices established.</p>
            )}
          </div>

          {/* Storage Capacity Widget */}
          <div className="bg-[#040805]/95 border border-emerald-950 rounded p-4">
            <div className="text-xs uppercase text-emerald-100 font-bold flex items-center gap-1.5 justify-between mb-2">
              <span>Encrypted Partition</span>
              <span>{storageKb} KB / 50 KB</span>
            </div>
            <div className="w-full h-3 bg-black rounded border border-emerald-950 p-0.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-[#00ffcc] shadow-[0_0_8px_#10b981]"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            <p className="text-[9px] text-emerald-700 mt-1 uppercase font-bold tracking-widest text-right">SYSTEM ALLOC_OK</p>
          </div>

        </div>

        {/* Column Right: Cyber Security Logs and Instant Copy Registry */}
        <div className="lg:col-span-2 space-y-6">

          {/* Live Activity Logs */}
          <div className="bg-[#040805]/95 border border-emerald-950 rounded p-4 flex flex-col h-[320px]">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2 mb-3">
              <div className="flex items-center gap-1.5">
                <GitCommit size={14} className="text-[#00ffbb] animate-spin" />
                <h2 className="text-xs font-bold uppercase text-emerald-100">Vault Audit Trail Terminal</h2>
              </div>
              {activityLogs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="text-[9px] bg-red-950/20 border border-red-950 hover:bg-red-900/35 text-red-400 px-2 py-0.5 rounded transition-all"
                >
                  PURGE TRAIL
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs scrollbar-thin scrollbar-thumb-emerald-950">
              {activityLogs.length > 0 ? (
                activityLogs.map((log) => (
                  <div key={log.id} className="border-b border-emerald-950/40 pb-1.5 flex items-start gap-2 select-text">
                    <span className="text-[9px] text-emerald-600 font-sans mt-0.5 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border shrink-0 mr-1.5 ${
                          log.type === "delete" 
                            ? "bg-red-950/20 border-red-950 text-red-400" 
                            : log.type === "lock" 
                            ? "bg-blue-950/20 border-blue-950 text-blue-400"
                            : log.type === "unlock"
                            ? "bg-amber-950/20 border-amber-950 text-amber-400"
                            : "bg-emerald-950/20 border-emerald-950 text-emerald-400"
                        }`}>
                          {log.type}
                        </span>
                        {log.type === "edit" && (
                          <button
                            onClick={() => onRestoreFromLogs(log.id)}
                            className="bg-emerald-950 hover:bg-emerald-800 text-[8px] text-emerald-400 font-bold px-1.5 rounded transition-all shrink-0"
                            title="Undo edit action based on snapshot log details"
                          >
                            Rollback
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-250 mt-1">{log.details}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-emerald-700 font-sans">
                  <Cpu size={24} className="text-emerald-900 mb-2" />
                  <p className="text-xs">Zero anomalous events logged.</p>
                  <p className="text-[10px] opacity-60">System activities are audited in secure memory logs.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Copy Register Tracker */}
          <div className="bg-[#040805]/95 border border-emerald-950 rounded p-4 flex flex-col h-[230px]">
            <div className="flex items-center gap-1.5 border-b border-emerald-950 pb-2 mb-3">
              <Key size={14} className="text-[#ff9900]" />
              <h2 className="text-xs font-bold uppercase text-emerald-100">Clipboard Cache & Copy Registry</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 text-xs scrollbar-thin scrollbar-thumb-emerald-950 select-text">
              {copyHistory.length > 0 ? (
                copyHistory.map((item) => (
                  <div key={item.id} className="bg-black/35 border border-emerald-950 p-2 rounded flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[9px] text-[#ff9900] font-sans">
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                        <span className="opacity-40">|</span>
                        <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900 px-1 py-0.2 rounded text-[8px]">
                          {item.type}
                        </span>
                        {item.cellAddress && (
                          <span className="text-[#00ffcc]">[{item.cellAddress}]</span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px] md:max-w-[420px] text-emerald-200">
                        {item.content}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.content);
                      }}
                      className="text-[9px] bg-emerald-950 border border-emerald-900 px-2 py-1 rounded hover:bg-emerald-900 text-emerald-400 shrink-0 font-bold cursor-pointer"
                    >
                      RE-COPY
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-emerald-700 font-sans">
                  <CheckSquare size={24} className="text-emerald-900 mb-1" />
                  <p className="text-xs">Copy Cache empty.</p>
                  <p className="text-[10px] opacity-60">Any quick copies from cell hovers will log historical traces here.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Quick Access Grid: Recent Workspace Nodes */}
      <div className="bg-[#040805]/95 border border-emerald-950 rounded p-4">
        <div className="flex items-center gap-1.5 border-b border-emerald-950 pb-2 mb-3">
          <Clock size={14} className="text-emerald-500" />
          <h2 className="text-xs font-bold uppercase text-emerald-100">Frequently Accessed Cyber Channels</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {files.slice(0, 3).map(file => (
            <div
              key={`recent-${file.id}`}
              onClick={() => onSelectFile(file.id)}
              className="bg-black/40 border border-emerald-950/60 hover:border-emerald-500/20 p-3 rounded flex items-center justify-between cursor-pointer select-none transition-all group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {file.type === "spreadsheet" && <FileSpreadsheet size={16} className="text-emerald-400" />}
                {file.type === "document" && <FileText size={16} className="text-[#00ffcc]" />}
                {file.type === "hybrid" && <LayoutGrid size={16} className="text-[#ffaa00]" />}
                <div className="overflow-hidden">
                  <span className="text-[11px] block text-emerald-300 font-bold truncate group-hover:text-emerald-100 transition-colors">
                    {file.name}
                  </span>
                  <span className="text-[8px] text-emerald-600 block uppercase font-bold text-left">{file.type}</span>
                </div>
              </div>
              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full group-hover:animate-ping" />
            </div>
          ))}

          {files.length === 0 && (
            <p className="col-span-3 text-center text-xs text-emerald-700 font-sans py-4">No file nodes loaded into memory.</p>
          )}
        </div>
      </div>

    </div>
  );
}
