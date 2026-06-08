/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trash2, RotateCcw, AlertTriangle, ShieldCheck, RefreshCw, Layers } from "lucide-react";
import { TrashItem } from "../types";

interface RecoveryVaultProps {
  trash: TrashItem[];
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
  onClearAllTrash: () => void;
}

export default function RecoveryVault({
  trash,
  onRestore,
  onPurge,
  onClearAllTrash,
}: RecoveryVaultProps) {
  return (
    <div className="flex-1 bg-[#020503] font-mono text-emerald-400 p-6 overflow-y-auto space-y-6 select-none scrollbar-thin scrollbar-thumb-emerald-900">
      
      {/* Banner */}
      <div className="border border-red-950 bg-red-950/5 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle size={24} className="text-red-500 animate-pulse shrink-0" />
          <div>
            <h1 className="text-sm font-bold tracking-widest text-red-200 uppercase">Emergency Recovery Center</h1>
            <p className="text-[10px] text-red-500/80">
              Low-level memory sector. Deleted cells, documents, directories, or blocks are cached here and can be hot-swapped back into active cores.
            </p>
          </div>
        </div>
        {trash.length > 0 && (
          <button
            onClick={onClearAllTrash}
            className="text-[10px] bg-red-950/40 hover:bg-red-900 border border-red-500 text-red-200 px-3 py-1.5 rounded transition-all font-bold cursor-pointer"
          >
            PERMANENTLY INCINERATE ALL METADATA
          </button>
        )}
      </div>

      {/* Main Recycle Listing */}
      <div className="bg-[#040805]/95 border border-emerald-900/40 rounded p-4">
        <div className="flex items-center justify-between border-b border-emerald-950 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-red-400" />
            <h2 className="text-xs font-bold uppercase text-emerald-100">Cached Isolation Volumetrics ({trash.length})</h2>
          </div>
        </div>

        {trash.length > 0 ? (
          <div className="space-y-3">
            {trash.map((item) => (
              <div
                key={item.id}
                className="bg-[#030604] border border-red-950/40 p-3 rounded flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono transition-all hover:bg-red-950/5"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-100 font-bold border-r border-[#10b981]/30 pr-2">{item.name}</span>
                    <span className="text-[8px] bg-emerald-950/60 px-1.5 py-0.5 rounded text-emerald-400 uppercase">
                      {item.type}
                    </span>
                    {item.fileType && (
                      <span className="text-[8px] bg-red-950/40 px-1.5 py-0.5 rounded text-red-400 uppercase">
                        {item.fileType}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-emerald-600 font-sans">
                    Sector Address: <b className="text-emerald-400">{item.originalParentId ? item.originalParentId : "ROOT_CORE"}</b> | Deleted at: {new Date(item.deletedAt).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Restore button */}
                  <button
                    onClick={() => onRestore(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 rounded text-[11px] text-emerald-300 transition-all font-bold cursor-pointer"
                  >
                    <RotateCcw size={10} />
                    <span>RESTORE STATE</span>
                  </button>

                  {/* Delete Permanent button */}
                  <button
                    onClick={() => onPurge(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-black hover:bg-red-950/20 border border-red-900 rounded text-[11px] text-red-500 transition-all cursor-pointer"
                    title="Vaporize permanently"
                  >
                    <Trash2 size={10} />
                    <span>PURGE</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 flex flex-col items-center justify-center font-sans text-emerald-700">
            <ShieldCheck size={48} className="text-emerald-900 animate-pulse mb-3" />
            <p className="text-sm font-bold">Inviolable state integrity achieved.</p>
            <p className="text-[11px] opacity-60">There are no isolated deleted elements waiting in the cache sector.</p>
          </div>
        )}
      </div>

      {/* Cybernetic details panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#040805] border border-emerald-950/60 p-4 rounded text-xs">
          <h3 className="text-emerald-300 font-bold uppercase mb-2">Automated Memory Rotation</h3>
          <p className="text-emerald-600 font-sans leading-relaxed text-[11px]">
            To conserve sandbox resources, the SmartSheets local memory engine maintains cached models for instant rollbacks. Unrecovered models remain inside isolated frames unless explicit manual purging is dispatched. Perfect for retrieving lost spreadsheet coordinates.
          </p>
        </div>
        <div className="bg-[#040805] border border-emerald-950/60 p-4 rounded text-xs flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-emerald-300 font-bold uppercase">Dynamic Rollback Frame</h3>
            <p className="text-emerald-600 font-sans text-[11px]">System checkpoints track precise modifications.</p>
          </div>
          <RefreshCw size={24} className="text-emerald-800 animate-reverse-spin" />
        </div>
      </div>

    </div>
  );
}
