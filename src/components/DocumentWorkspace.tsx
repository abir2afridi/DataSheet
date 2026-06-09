/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  Bookmark,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  Printer,
  Sliders,
  Type,
  MessageSquare,
  Sparkles,
  Link,
  Table,
  Terminal,
  Heading1,
  Heading2,
  List,
  CheckSquare,
  CornerDownLeft,
  BookOpen,
  ArrowDownUp,
  Workflow
} from "lucide-react";
import { SmartFile, DocumentBlock } from "../types";

interface DocumentWorkspaceProps {
  file: SmartFile;
  onUpdateFile: (updatedFile: SmartFile) => void;
  onLogActivity: (type: "edit" | "copy", details: string) => void;
  onAddClipboardEntry: (content: string, type: string, cellAddress: string) => void;
}

export default function DocumentWorkspace({
  file,
  onUpdateFile,
  onLogActivity,
  onAddClipboardEntry,
}: DocumentWorkspaceProps) {
  const blocks = useMemo(() => file.docBlocks || [], [file.docBlocks]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);

  // Focus managers
  const blockInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Ensure there is at least one paragraph block if completely empty
  useEffect(() => {
    if (blocks.length === 0) {
      const defaultBlock: DocumentBlock = {
        id: `blk_${Date.now()}`,
        type: "paragraph",
        content: "Welcome to your secure Document space. Type '/' to trigger slash block templates...",
      };
      onUpdateFile({
        ...file,
        docBlocks: [defaultBlock],
        updatedAt: Date.now(),
      });
    }
  }, [file, blocks, onUpdateFile]);

  // Compute text statistics metrics
  const stats = useMemo(() => {
    const rawAllText = blocks.map(b => b.content).join(" ");
    const words = rawAllText.trim() ? rawAllText.trim().split(/\s+/).length : 0;
    const chars = rawAllText.length;
    const readTime = Math.max(1, Math.round(words / 220)); // reading estimate
    return { words, chars, readTime };
  }, [blocks]);

  // Table of Contents outline (Headings finder)
  const outlineList = useMemo(() => {
    return blocks.filter(b => b.type === "heading1" || b.type === "heading2");
  }, [blocks]);

  // Command item categories for slash controls popup drawer
  const slashItems: { type: DocumentBlock["type"]; title: string; desc: string; icon: React.ReactNode }[] = [
    { type: "paragraph", title: "Paragraph text", desc: "Start writing normal body text.", icon: <Type size={14} /> },
    { type: "heading1", title: "Heading level 1", desc: "Configure massive title headers.", icon: <Heading1 size={14} /> },
    { type: "heading2", title: "Heading level 2", desc: "Configure standard section subheaders.", icon: <Heading2 size={14} /> },
    { type: "bullet_list_item", title: "Bullet points List", desc: "Spin up styled bullet point details.", icon: <List size={14} /> },
    { type: "checklist_item", title: "Secured Checklist", desc: "Build check targets track completions.", icon: <CheckSquare size={14} /> },
    { type: "code_block", title: "Encrypted Code Frame", desc: "Embed syntax logs with mono font.", icon: <Terminal size={14} /> },
    { type: "quote", title: "Anchor Callout Quote", desc: "Contrast comments within custom borders.", icon: <BookOpen size={14} /> },
  ];

  const filteredSlashItems = slashItems.filter(item =>
    item.title.toLowerCase().includes(slashQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(slashQuery.toLowerCase())
  );

  // Document Core updater helper
  const saveBlockListChange = (newBlocks: DocumentBlock[]) => {
    onUpdateFile({
      ...file,
      docBlocks: newBlocks,
      updatedAt: Date.now(),
    });
  };

  const handleBlockContentChange = (id: string, text: string) => {
    // Slash matching check: only trigger when / is the very first character
    const currentBlock = blocks.find(b => b.id === id);
    if (text === "/") {
      setShowSlashMenu(true);
      setSlashQuery("");
    } else {
      setShowSlashMenu(false);
    }

    const updated = blocks.map(b => (b.id === id ? { ...b, content: text } : b));
    saveBlockListChange(updated);
  };

  // Convert block archetype template on select
  const convertBlockType = (id: string, type: DocumentBlock["type"]) => {
    const updated = blocks.map(b => {
      if (b.id === id) {
        // Strip out starting slash if they converted from menu
        let cleanText = b.content;
        if (cleanText.startsWith("/")) {
          cleanText = "";
        }
        return { ...b, type, content: cleanText };
      }
      return b;
    });
    saveBlockListChange(updated);
    setShowSlashMenu(false);
    onLogActivity("edit", `Upgraded document block type to: ${type}`);

    // Re-focus on active block
    setTimeout(() => {
      blockInputRefs.current[id]?.focus();
    }, 40);
  };

  const insertNewBlockBelow = (activeId: string) => {
    const currentIndex = blocks.findIndex(b => b.id === activeId);
    const newBlockId = `blk_${Date.now()}`;
    const newBlock: DocumentBlock = {
      id: newBlockId,
      type: "paragraph",
      content: "",
    };

    const newBlocksList = [...blocks];
    newBlocksList.splice(currentIndex + 1, 0, newBlock);

    saveBlockListChange(newBlocksList);
    setActiveBlockId(newBlockId);

    // Auto-focus new block input element
    setTimeout(() => {
      blockInputRefs.current[newBlockId]?.focus();
    }, 50);
  };

  const deleteBlockAndMergePrev = (id: string) => {
    // Do not delete last remaining block
    if (blocks.length <= 1) return;

    const currentIndex = blocks.findIndex(b => b.id === id);
    if (currentIndex < 0) return;

    // If it's the first block, just delete without merging
    if (currentIndex === 0) {
      const newBlocksList = blocks.filter(b => b.id !== id);
      saveBlockListChange(newBlocksList);
      setActiveBlockId(newBlocksList[0]?.id || null);
      return;
    }

    const prevBlock = blocks[currentIndex - 1];
    const currentBlock = blocks[currentIndex];

    // Append current text to previous text block
    const updatedPrevText = prevBlock.content + currentBlock.content;

    const newBlocksList = blocks
      .map((b, idx) => {
        if (idx === currentIndex - 1) {
          return { ...b, content: updatedPrevText };
        }
        return b;
      })
      .filter(b => b.id !== id);

    saveBlockListChange(newBlocksList);
    setActiveBlockId(prevBlock.id);

    // Auto focus previous text block cursor matching position
    setTimeout(() => {
      const el = blockInputRefs.current[prevBlock.id];
      if (el) {
        el.focus();
        el.setSelectionRange(prevBlock.content.length, prevBlock.content.length);
      }
    }, 50);
  };

  // Handle slash menus arrow movements
  const handleBlockKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, id: string) => {
    if (showSlashMenu && filteredSlashItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev + 1) % filteredSlashItems.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashMenuIndex(prev => (prev - 1 + filteredSlashItems.length) % filteredSlashItems.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const selectionItem = filteredSlashItems[slashMenuIndex];
        if (selectionItem) {
          convertBlockType(id, selectionItem.type);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashMenu(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      insertNewBlockBelow(id);
    } else if (e.key === "Enter" && e.shiftKey) {
      // Allow Shift+Enter for newline within same block (textarea doesn't support this natively in single-line mode)
    } else if (e.key === "Backspace" && blocks.find(b => b.id === id)?.content === "") {
      e.preventDefault();
      deleteBlockAndMergePrev(id);
    }
  };

  // Generate complete clean Markdown representation for clipboard imports
  const copyCompleteDocumentMarkdown = () => {
    const lines = blocks.map(b => {
      switch (b.type) {
        case "heading1":
          return `# ${b.content}\n`;
        case "heading2":
          return `## ${b.content}\n`;
        case "bullet_list_item":
          return `- ${b.content}`;
        case "checklist_item":
          return `- [${b.checked ? "x" : " "}] ${b.content}`;
        case "quote":
          return `> ${b.content}\n`;
        case "code_block":
          return `\`\`\`${b.language || "text"}\n${b.content}\n\`\`\`\n`;
        default:
          return `${b.content}\n`;
      }
    });

    const output = lines.join("\n");
    navigator.clipboard.writeText(output);
    onAddClipboardEntry(output, "Document - Markdown Export", "Entire File");
    onLogActivity("copy", "Exported and copied entire document as markdown structure");
    alert("Copied document payload successfully as MD!");
  };

  return (
    <div className="flex-1 flex bg-[#020403] overflow-hidden select-none relative font-mono">
      
      {/* Structural Outline Sidebar cabinet Left */}
      <div className="w-56 border-r border-emerald-500/10 bg-[#030604] p-3 flex flex-col h-full shrink-0 hidden md:flex select-none">
        <div className="border-b border-emerald-950 pb-2 mb-3 flex items-center gap-1.5 text-xs">
          <Bookmark size={13} className="text-[#00ffcc]" />
          <span className="font-bold uppercase tracking-wider text-emerald-300">File Outline</span>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 text-[10px] scrollbar-thin scrollbar-thumb-emerald-950">
          {outlineList.map(block => (
            <button
              key={block.id}
              onClick={() => {
                blockInputRefs.current[block.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
                setActiveBlockId(block.id);
              }}
              className={`w-full text-left truncate py-1 hover:text-emerald-300 ${
                block.type === "heading1" ? "pl-1.5 font-bold text-emerald-400" : "pl-4 text-emerald-500"
              }`}
            >
              • {block.content || "Empty Section Head"}
            </button>
          ))}
          {outlineList.length === 0 && (
            <p className="text-emerald-700/60 font-sans py-6 text-center leading-relaxed">
              No logical structural coordinates mapped yet. Write Heading 1 or Heading 2.
            </p>
          )}
        </div>

        {/* Word Statistics box */}
        <div className="bg-[#050906] border border-emerald-950 rounded p-2 text-[9px] space-y-1 mt-auto shrink-0 select-none">
          <span className="text-emerald-600 block uppercase font-bold tracking-wider">Metrics Telemetry</span>
          <div className="flex justify-between">
            <span className="text-emerald-700">WORDS COUNT:</span>
            <span className="font-bold text-emerald-300">{stats.words}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-700">CHARS COUNT:</span>
            <span className="font-bold text-emerald-400">{stats.chars}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-700">READ TIME:</span>
            <span className="font-bold text-[#00ffcc]">{stats.readTime} min</span>
          </div>
        </div>
      </div>

      {/* Primary document scroller canvas */}
      <div className="flex-1 overflow-y-auto relative p-6 sm:p-12 scrollbar-thin scrollbar-thumb-emerald-950 flex flex-col h-full bg-[#020403]">
        
        {/* Document Action overlay */}
        <div className="max-w-2xl w-full mx-auto mb-6 flex items-center justify-between border-b border-emerald-950 pb-3 font-mono shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#00ff99]" />
            <h2 className="text-xs font-black uppercase text-emerald-300">Secured Obsidian Composer</h2>
          </div>
          
          <button
            onClick={copyCompleteDocumentMarkdown}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950 border border-emerald-500 text-emerald-300 hover:bg-emerald-900 rounded text-[10px] font-bold cursor-pointer transition-all"
            title="Export elements cleanly ready for local notes importers"
          >
            <Copy size={11} />
            <span>EXPORT MD</span>
          </button>
        </div>

        {/* Custom interactive text blocks wrapper */}
        <div className="max-w-2xl w-full mx-auto space-y-3.5 pb-24 flex-1 select-text">
          {blocks.map((block) => {
            const isActive = activeBlockId === block.id;

            return (
              <div
                key={block.id}
                className={`relative group flex items-start gap-3 rounded transition-all ${
                  isActive ? "bg-emerald-950/5 pl-2" : ""
                }`}
              >
                {/* Block selector control */}
                <div className="opacity-0 group-hover:opacity-40 transition-opacity flex items-center gap-1 absolute -left-12 top-1.5 text-emerald-600">
                  <button
                    onClick={() => convertBlockType(block.id, "heading1")}
                    className="hover:text-[#00ffcc] p-0.5"
                    title="Header size 1"
                  >
                    H1
                  </button>
                  <button
                    onClick={() => {
                      if (blocks.length <= 1) return;
                      const list = [...blocks];
                      const idx = list.findIndex(b => b.id === block.id);
                      list.splice(idx, 1);
                      saveBlockListChange(list);
                    }}
                    className="hover:text-red-400 p-0.5"
                    title="Vaporize item block"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

                {/* Left Element Markers depending on block classification */}
                {block.type === "bullet_list_item" && (
                  <span className="text-[#00ff99] text-base leading-none select-none mt-2.5 shrink-0">•</span>
                )}
                {block.type === "checklist_item" && (
                  <input
                    type="checkbox"
                    checked={block.checked || false}
                    onChange={() => {
                      const updated = blocks.map(b =>
                        b.id === block.id ? { ...b, checked: !b.checked } : b
                      );
                      saveBlockListChange(updated);
                      onLogActivity("edit", "Toggled checklist task status completed");
                    }}
                    className="h-4 w-4 bg-black border-emerald-950 text-emerald-400 focus:outline-none rounded cursor-pointer mt-2 shrink-0"
                  />
                )}
                {block.type === "quote" && (
                  <div className="w-1 bg-[#ffaa00] rounded self-stretch shrink-0 mt-1 mb-1" />
                )}

                {/* Core block rich textarea */}
                <textarea
                  ref={el => {
                    blockInputRefs.current[block.id] = el;
                  }}
                  rows={1}
                  className={`w-full bg-transparent resize-none border-none outline-none focus:ring-0 focus:outline-none p-1 font-mono transition-all selection:bg-emerald-800 ${
                    block.type === "heading1"
                      ? "text-lg font-extrabold tracking-tight text-[#00ffcc]"
                      : block.type === "heading2"
                      ? "text-base font-bold text-emerald-300"
                      : block.type === "code_block"
                      ? "bg-black border border-emerald-950 p-2 text-[11px] rounded text-emerald-400 leading-relaxed font-mono"
                      : block.type === "quote"
                      ? "text-xs italic text-yellow-500/90 font-serif"
                      : "text-xs text-emerald-200/90 leading-relaxed"
                  } ${block.checked ? "line-through opacity-40 text-emerald-700" : ""}`}
                  placeholder={
                    block.type === "heading1"
                      ? "Title Level 1..."
                      : block.type === "heading2"
                      ? "Subheading Level 2..."
                      : block.type === "code_block"
                      ? "Raw encrypted source config logs..."
                      : "Type normal content block..."
                  }
                  value={block.content}
                  onChange={e => handleBlockContentChange(block.id, e.target.value)}
                  onFocus={() => {
                    setActiveBlockId(block.id);
                    setShowSlashMenu(false);
                  }}
                  onKeyDown={e => handleBlockKeyDown(e, block.id)}
                  style={{ height: "auto" }}
                />

                {/* Inline Slash command menu popover floating layer */}
                {isActive && showSlashMenu && filteredSlashItems.length > 0 && (
                  <div className="absolute top-8 left-4 bg-black/95 border border-emerald-500/40 w-56 rounded shadow-2xl z-40 p-1 font-mono text-[10px] space-y-0.5 select-none">
                    <div className="px-2 py-1 text-[8px] text-emerald-600 block uppercase font-bold border-b border-emerald-950">
                      Core Block Templates
                    </div>
                    {filteredSlashItems.map((item, index) => (
                      <button
                        key={item.type}
                        onClick={() => convertBlockType(block.id, item.type)}
                        className={`w-full text-left px-2 py-2 rounded flex items-center gap-2 transition-colors cursor-pointer ${
                          index === slashMenuIndex
                            ? "bg-emerald-950/40 text-emerald-300 font-bold border-l-2 border-emerald-500 pl-1.5"
                            : "hover:bg-emerald-950/10 text-emerald-500/80"
                        }`}
                      >
                        <div className="text-emerald-500 shrink-0">{item.icon}</div>
                        <div>
                          <p className="font-bold leading-none">{item.title}</p>
                          <p className="text-[8px] opacity-60 mt-0.5">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
