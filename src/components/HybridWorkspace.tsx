/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import {
  Grid,
  FileText,
  Terminal,
  CheckSquare,
  Sparkles,
  Link,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  LayoutGrid,
  CornerDownLeft,
  Settings,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Bookmark
} from "lucide-react";
import { SmartFile, HybridBlock, CellData, LockLevel } from "../types";
import { evaluateFormula } from "../utils/formulas";

interface HybridWorkspaceProps {
  file: SmartFile;
  onUpdateFile: (updatedFile: SmartFile) => void;
  onLogActivity: (type: "edit" | "copy", details: string) => void;
  onAddClipboardEntry: (content: string, type: string, cellAddress: string) => void;
}

export default function HybridWorkspace({
  file,
  onUpdateFile,
  onLogActivity,
  onAddClipboardEntry,
}: HybridWorkspaceProps) {
  const blocks = file.hybridBlocks || [];
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Prompt variable text stores
  const [promptBindings, setPromptBindings] = useState<Record<string, string>>({});

  // Ensure there is at least one block if empty
  if (blocks.length === 0) {
    const freshBlock: HybridBlock = {
      id: `hy_${Date.now()}`,
      type: "document",
      title: "Secure Workspace Hub Memo",
      docContent: "Modular Sandbox initialized. Add sheet grids, raw coding files, check lists, and AI prompt blocks to map your customized view.",
    };
    onUpdateFile({
      ...file,
      hybridBlocks: [freshBlock],
      updatedAt: Date.now(),
    });
  }

  const saveBlocksList = (newBlocks: HybridBlock[]) => {
    onUpdateFile({
      ...file,
      hybridBlocks: newBlocks,
      updatedAt: Date.now(),
    });
  };

  const handleCreateBlock = (type: "spreadsheet" | "document" | "code" | "checklist" | "prompt" | "reference") => {
    const newBlock: HybridBlock = {
      id: `hy_${Date.now()}`,
      type,
      title: `Secured ${type.toUpperCase()}`,
    };

    if (type === "spreadsheet") {
      newBlock.spreadsheetData = {
        rows: 5,
        cols: 5,
        cells: {
          A1: { value: "Label", lockLevel: LockLevel.NONE },
          B1: { value: "Weight", lockLevel: LockLevel.NONE },
          A2: { value: "Hardware", lockLevel: LockLevel.NONE },
          B2: { value: "350", lockLevel: LockLevel.NONE },
          A3: { value: "Software", lockLevel: LockLevel.NONE },
          B3: { value: "120", lockLevel: LockLevel.NONE },
          A4: { value: "Total", lockLevel: LockLevel.NONE },
          B4: { value: "470", lockLevel: LockLevel.NONE },
        },
      };
    } else if (type === "document") {
      newBlock.docContent = "Type workspace instructions or references...";
    } else if (type === "code") {
      newBlock.codeLanguage = "typescript";
      newBlock.docContent = "const endpoint = 'https://crypt.vault/api';";
    } else if (type === "checklist") {
      newBlock.checklistItems = [
        { id: "1", text: "Encrypt personal backups", done: false },
        { id: "2", text: "Configure multi-factor security", done: true },
      ];
    } else if (type === "prompt") {
      newBlock.promptTemplate = "Generate a secure code skeleton containing API keys using: $PROMPTVAR";
    } else if (type === "reference") {
      newBlock.referenceUrl = "https://wiki.vault/smart_sheets";
      newBlock.docContent = "Private internal handbook database link";
    }

    saveBlocksList([...blocks, newBlock]);
    setShowAddMenu(false);
    onLogActivity("edit", `Appended hybrid block module: ${type}`);
  };

  const deleteBlock = (id: string) => {
    const list = blocks.filter(b => b.id !== id);
    saveBlocksList(list);
    onLogActivity("edit", "Deleted hybrid workspace component block");
  };

  // Modify nested spreadsheet value
  const handleSpreadsheetCellEdit = (blockId: string, address: string, val: string) => {
    const list = blocks.map(b => {
      if (b.id === blockId && b.spreadsheetData) {
        const cells = { ...b.spreadsheetData.cells };
        cells[address] = {
          value: val,
          lockLevel: LockLevel.NONE,
        };
        return {
          ...b,
          spreadsheetData: {
            ...b.spreadsheetData,
            cells,
          },
        };
      }
      return b;
    });
    saveBlocksList(list);
  };

  // Evaluate template prompts with variables
  const getCompiledPrompt = (blockId: string, template: string) => {
    const textVal = promptBindings[blockId] || "";
    return template.replace("$PROMPTVAR", textVal);
  };

  return (
    <div className="flex-1 bg-[#020402] font-mono text-emerald-400 p-6 overflow-y-auto select-none scrollbar-thin scrollbar-thumb-emerald-900">
      
      {/* Upper Title Hub */}
      <div className="border border-emerald-500/10 bg-emerald-950/5 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <LayoutGrid size={22} className="text-[#ffaa00]" />
          <div>
            <h1 className="text-sm font-bold tracking-widest text-[#00ffcc] uppercase">Hybrid Bento Canvas: {file.name}</h1>
            <p className="text-[10px] text-emerald-600">Assemble spreadsheet boxes, checklists, documents, bookmarks, and automated prompt files inside single layouts.</p>
          </div>
        </div>

        {/* Append block shortcuts trigger */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 rounded text-xs font-bold text-emerald-100 transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>APPEND COMPONENT MODULE</span>
          </button>

          {showAddMenu && (
            <div className="absolute right-0 mt-2 bg-black/95 border border-emerald-500/30 w-52 rounded shadow-2xl z-40 p-1.5 font-mono text-xs">
              <div className="px-2 py-1 text-[8.5px] text-emerald-600 block uppercase font-bold border-b border-emerald-950 mb-1">
                Insert Element Block
              </div>
              
              <button
                onClick={() => handleCreateBlock("spreadsheet")}
                className="w-full text-left px-2 py-1.5 hover:bg-emerald-950/20 text-emerald-400 rounded flex items-center gap-2"
              >
                <Grid size={12} className="text-emerald-500" />
                <span>Micro Spreadsheet</span>
              </button>

              <button
                onClick={() => handleCreateBlock("document")}
                className="w-full text-left px-2 py-1.5 hover:bg-emerald-950/20 text-emerald-400 rounded flex items-center gap-2"
              >
                <FileText size={12} className="text-[#00ffcc]" />
                <span>Document Memo Notes</span>
              </button>

              <button
                onClick={() => handleCreateBlock("code")}
                className="w-full text-left px-2 py-1.5 hover:bg-emerald-950/20 text-emerald-400 rounded flex items-center gap-2"
              >
                <Terminal size={12} className="text-indigo-400" />
                <span>Developer Script File</span>
              </button>

              <button
                onClick={() => handleCreateBlock("checklist")}
                className="w-full text-left px-2 py-1.5 hover:bg-emerald-950/20 text-emerald-400 rounded flex items-center gap-2"
              >
                <CheckSquare size={12} className="text-[#ffbb00]" />
                <span>Bento Task Checker</span>
              </button>

              <button
                onClick={() => handleCreateBlock("prompt")}
                className="w-full text-left px-2 py-1.5 hover:bg-emerald-950/20 text-emerald-400 rounded flex items-center gap-2"
              >
                <Sparkles size={12} className="text-[#00ff99]" />
                <span>Automated Prompt File</span>
              </button>

              <button
                onClick={() => handleCreateBlock("reference")}
                className="w-full text-left px-2 py-1.5 hover:bg-emerald-950/20 text-emerald-400 rounded flex items-center gap-2"
              >
                <Link size={12} className="text-cyan-400" />
                <span>Reference URL link</span>
              </button>

            </div>
          )}
        </div>
      </div>

      {/* Main Blocks Scroll loop canvas items */}
      <div className="space-y-6 max-w-4xl mx-auto pb-32">
        {blocks.map((block, idx) => {
          return (
            <div
              key={block.id}
              className="bg-[#050a06]/95 border border-emerald-950 hover:border-emerald-500/20 rounded p-4 relative overflow-visible shadow-lg transition-all"
            >
              {/* Header Title action block */}
              <div className="flex items-center justify-between border-b border-emerald-950 pb-2 mb-3 select-none">
                <div className="flex items-center gap-2">
                  <div className="text-emerald-700 bg-black/40 h-6 w-6 rounded border border-emerald-950/60 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    className="bg-transparent font-bold text-xs text-emerald-100 uppercase border-b border-transparent focus:border-emerald-500/40 outline-none w-48 font-mono select-text"
                    value={block.title}
                    onChange={(e) => {
                      const updated = blocks.map(b => (b.id === block.id ? { ...b, title: e.target.value } : b));
                      saveBlocksList(updated);
                    }}
                  />
                  <span className="text-[8px] bg-emerald-950/40 px-1.5 py-0.5 border border-emerald-900 rounded text-emerald-500 uppercase">
                    {block.type}
                  </span>
                </div>

                <button
                  onClick={() => deleteBlock(block.id)}
                  className="text-emerald-700 hover:text-red-400 font-bold"
                  title="Remove Component Frame"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* DRAW SPECIFIC payload widget templates */}
              
              {/* SPECIFIC: embedded spreadsheet */}
              {block.type === "spreadsheet" && block.spreadsheetData && (
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-950 select-none">
                  <table className="border-collapse text-[10px] text-emerald-400 font-mono w-full">
                    <thead>
                      <tr className="bg-black/35 font-bold border-b border-emerald-900/40 select-none">
                        <th className="p-1 border border-emerald-950 w-8"></th>
                        {["A", "B", "C", "D", "E"].map(h => (
                          <th key={h} className="p-1 border border-emerald-950 text-center w-24 text-emerald-600">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((rowNum) => (
                        <tr key={rowNum} className="hover:bg-emerald-950/5">
                          <td className="p-1 border border-emerald-950 text-center bg-black/20 text-emerald-700 font-bold">{rowNum}</td>
                          {["A", "B", "C", "D", "E"].map((col) => {
                            const addr = `${col}${rowNum}`;
                            const cell = block.spreadsheetData!.cells[addr] || { value: "" };
                            return (
                              <td key={col} className="p-0 border border-emerald-950">
                                <input
                                  type="text"
                                  className="w-full bg-transparent p-1 border-none focus:outline-none focus:bg-emerald-950/20 text-center selection:bg-emerald-800 select-text"
                                  value={cell.value}
                                  onChange={(e) => handleSpreadsheetCellEdit(block.id, addr, e.target.value)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SPECIFIC: Rich document paragraph text */}
              {block.type === "document" && (
                <textarea
                  className="w-full h-24 text-xs font-mono bg-black/40 border border-emerald-950 rounded p-2.5 text-emerald-300 focus:outline-none focus:border-emerald-500 select-text"
                  placeholder="Record local instructions notes..."
                  value={block.docContent || ""}
                  onChange={(e) => {
                    const list = blocks.map(b => (b.id === block.id ? { ...b, docContent: e.target.value } : b));
                    saveBlocksList(list);
                  }}
                />
              )}

              {/* SPECIFIC: Code block scripts editor */}
              {block.type === "code" && (
                <div className="space-y-1 select-text">
                  <div className="flex items-center justify-between text-[9px] text-emerald-750 font-sans px-1">
                    <span>Language Syntax: TYPE_SCRIPT</span>
                  </div>
                  <textarea
                    className="w-full h-24 text-[10px] bg-black border border-emerald-950 text-[#00ffcc] p-2 rounded focus:outline-none focus:border-[#00ffcc] font-mono leading-relaxed select-text"
                    placeholder="const hash = sha256('access');"
                    value={block.docContent || ""}
                    onChange={(e) => {
                      const list = blocks.map(b => (b.id === block.id ? { ...b, docContent: e.target.value } : b));
                      saveBlocksList(list);
                    }}
                  />
                </div>
              )}

              {/* SPECIFIC: checklist blocks tasks */}
              {block.type === "checklist" && block.checklistItems && (
                <div className="space-y-1.5 select-none text-xs">
                  {block.checklistItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => {
                          const updatedItems = block.checklistItems!.map(cit =>
                            cit.id === item.id ? { ...cit, done: !cit.done } : cit
                          );
                          const list = blocks.map(b => (b.id === block.id ? { ...b, checklistItems: updatedItems } : b));
                          saveBlocksList(list);
                        }}
                        className="h-3.5 w-3.5 bg-black border-emerald-950 text-emerald-400 focus:outline-none cursor-pointer"
                      />
                      <span className={`text-[11px] ${item.done ? "line-through opacity-40 text-emerald-700" : "text-emerald-300"}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}

                  {/* Quick Add item */}
                  <button
                    onClick={() => {
                      const txt = prompt("Target Action checkbox name?");
                      if (!txt) return;
                      const updatedItems = [
                        ...block.checklistItems!,
                        { id: Date.now().toString(), text: txt, done: false },
                      ];
                      const list = blocks.map(b => (b.id === block.id ? { ...b, checklistItems: updatedItems } : b));
                      saveBlocksList(list);
                    }}
                    className="text-[9px] hover:underline text-[#00ffcc] font-bold block pt-1 cursor-pointer"
                  >
                    + ADD ACTION STEP
                  </button>
                </div>
              )}

              {/* SPECIFIC: Dynamic Prompt files automation templates */}
              {block.type === "prompt" && (
                <div className="space-y-3 font-mono text-xs select-text">
                  <div className="bg-black/40 p-2.5 rounded border border-emerald-950 space-y-1">
                    <span className="text-[9px] text-[#00ffcc] block uppercase font-bold text-left">Prompt Frame template</span>
                    <textarea
                      className="w-full text-[11px] bg-transparent outline-none border-none resize-none text-emerald-250 select-text font-mono"
                      value={block.promptTemplate || ""}
                      onChange={(e) => {
                        const list = blocks.map(b => (b.id === block.id ? { ...b, promptTemplate: e.target.value } : b));
                        saveBlocksList(list);
                      }}
                      rows={2}
                    />
                  </div>

                  {/* Input value variable dynamic builder */}
                  <div className="flex gap-2 items-center select-text">
                    <span className="text-[10px] text-emerald-700 font-bold font-mono">BIND_VAR ($PROMPTVAR):</span>
                    <input
                      type="text"
                      className="flex-1 text-xs bg-black border border-emerald-950 px-2 h-7 rounded focus:outline-none focus:border-emerald-500 text-emerald-300 font-mono select-text"
                      placeholder="Insert parameter e.g., 'React forms'..."
                      value={promptBindings[block.id] || ""}
                      onChange={(e) => {
                        setPromptBindings(prev => ({ ...prev, [block.id]: e.target.value }));
                      }}
                    />
                    
                    {/* Clipboard copy helper */}
                    <button
                      onClick={() => {
                        const payload = getCompiledPrompt(block.id, block.promptTemplate || "");
                        navigator.clipboard.writeText(payload);
                        onAddClipboardEntry(payload, "Prompt Vault Evaluation", block.title);
                        onLogActivity("copy", "Evaluated prompt and copied clean compiled string to clipboard");
                        alert("Prompt compiled and copied successfully!");
                      }}
                      className="h-7 px-2.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500 rounded text-[10px] flex items-center gap-1.5 font-bold cursor-pointer"
                      title="Compile and copy prompt"
                    >
                      <Copy size={11} />
                      <span>COPY FORMAT</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SPECIFIC: Reference Bookmarks URLs */}
              {block.type === "reference" && (
                <div className="space-y-3 font-mono text-xs select-text">
                  <div className="bg-black/35 p-2 rounded border border-emerald-950 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Link size={12} className="text-cyan-400 shrink-0" />
                      <input
                        type="text"
                        className="bg-transparent text-[11px] text-cyan-400 hover:underline border-none outline-none focus:ring-0 focus:underline focus:bg-emerald-950/20 w-80 truncate"
                        value={block.referenceUrl || ""}
                        onChange={(e) => {
                          const list = blocks.map(b => (b.id === block.id ? { ...b, referenceUrl: e.target.value } : b));
                          saveBlocksList(list);
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (block.referenceUrl) {
                          navigator.clipboard.writeText(block.referenceUrl);
                          onLogActivity("copy", "Copied reference URL bookmark");
                          alert("URL Bookmarked copied!");
                        }
                      }}
                      className="text-[9px] bg-emerald-950 border border-emerald-950 px-2 py-1 rounded hover:bg-emerald-900 text-emerald-300 font-bold shrink-0 cursor-pointer"
                    >
                      COPY LINK
                    </button>
                  </div>
                  <textarea
                    className="w-full h-11 text-[11px] bg-transparent border border-emerald-950/40 focus:outline-none focus:border-emerald-500 rounded p-1.5 text-emerald-600 font-mono"
                    placeholder="Notes comments attached..."
                    value={block.docContent || ""}
                    onChange={(e) => {
                      const list = blocks.map(b => (b.id === block.id ? { ...b, docContent: e.target.value } : b));
                      saveBlocksList(list);
                    }}
                  />
                </div>
              )}

            </div>
          );
        })}

        {blocks.length === 0 && (
          <p className="text-emerald-700/60 font-sans text-center py-16">Custom hybrid page is empty. Append components above.</p>
        )}
      </div>

    </div>
  );
}
