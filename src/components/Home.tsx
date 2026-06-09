import { useEffect, useState, useRef } from "react";
import { Terminal, Shield, Database, Sparkles, ChevronRight } from "lucide-react";

interface HomeProps {
  onLaunch: () => void;
  onLogin: () => void;
}

const BOOT_SEQUENCE = [
  "[ OK  ] Initializing DataSheet kernel modules...",
  "[ OK  ] Loading secure vault enclave...",
  "[ OK  ] Mounting spreadsheet engine v2.4",
  "[ OK  ] Establishing encrypted workspace tunnel...",
  "[ OK  ] System ready.",
];

const SCRAMBLE_CHARS = "01(){}[]<>/\\|!@#$%^&*_+-=:;\"'~";

interface ScramblePos {
  lineIdx: number;
  charIdx: number;
}

export default function Home({ onLaunch, onLogin }: HomeProps) {
  const [bootDisplay, setBootDisplay] = useState<string[][]>([]);
  const [showContent, setShowContent] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [scrambling, setScrambling] = useState<ScramblePos | null>(null);
  const terminalRef = useRef<HTMLPreElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [bootDisplay, scrambling]);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 200);

    const t2 = setTimeout(() => {
      let display: string[][] = [];
      let lineIdx = 0;

      const showLine = () => {
        if (lineIdx >= BOOT_SEQUENCE.length) {
          setShowContent(true);
          setTimeout(() => setShowButtons(true), 400);
          return;
        }

        const line = BOOT_SEQUENCE[lineIdx];
        // Show scrambled version of the line for 40ms
        const scrambledLine = line.split('').map(() =>
          SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        );
        display[lineIdx] = scrambledLine;
        setBootDisplay(display.map(row => [...row]));
        setScrambling({ lineIdx, charIdx: 0 });

        // Then lock the real line
        setTimeout(() => {
          display[lineIdx] = line.split('');
          setBootDisplay(display.map(row => [...row]));
          setScrambling(null);
          lineIdx++;
          setTimeout(showLine, 20);
        }, 40);
      };

      showLine();
    }, 600);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="h-full w-full bg-[#020402] flex flex-col items-center justify-center p-4 relative overflow-hidden min-h-0">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="z-10 max-w-3xl w-full flex flex-col items-center justify-center min-h-0 flex-1 overflow-hidden">
        <div
          className={`transition-all duration-700 mb-6 ${showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 border border-emerald-500/30 bg-black/40 mb-6">
            <Terminal size={20} className="text-emerald-400" />
            <span className="text-[#00ffcc] text-[10px] tracking-[0.2em] uppercase font-bold">Secure Local Environment v2.4</span>
          </div>
        </div>

        <h1
          className={`text-5xl font-black text-emerald-400 mb-3 tracking-tight transition-all duration-700 ${showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
        >
          Data<span className="text-[#00ffcc]">Sheet</span>
        </h1>
        <p
          className={`text-emerald-600 text-sm mb-4 max-w-xl mx-auto leading-relaxed transition-all duration-700 delay-100 ${showTitle ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
        >
          A matrix-grade local workspace for spreadsheets, documents, and hybrid vaults.
          Encrypted cells, lock hierarchies, and terminal aesthetics — all in your browser.
        </p>

        <div
          className={`w-full max-w-lg border border-emerald-500/20 bg-black/40 mb-4 transition-all duration-700 ${showTitle ? "opacity-100" : "opacity-0"}`}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-emerald-500/10 bg-black/30">
            <Terminal size={10} className="text-emerald-500" />
            <span className="text-[8px] text-emerald-600 uppercase tracking-wider">boot sequence</span>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] text-emerald-800">{BOOT_SEQUENCE.length > bootDisplay.length ? "Booting..." : "Ready"}</span>
            </div>
          </div>
          <div className="h-[110px]">
            <pre ref={terminalRef} className="text-emerald-500/80 text-[10px] leading-relaxed font-mono whitespace-pre-wrap p-3 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-900">
              {bootDisplay.map((lineChars, li) => (
                <div key={li} className="leading-relaxed">
                  {lineChars.map((ch, ci) => {
                    const isScrambling = scrambling && scrambling.lineIdx === li && scrambling.charIdx === ci;
                    return (
                      <span
                        key={ci}
                        className={
                          isScrambling
                            ? "text-emerald-300 font-bold animate-pulse"
                            : ch === "["
                              ? "text-emerald-500"
                              : ch === "O" && ci === 4
                                ? "text-[#00ff88]"
                                : ch === "K" && ci === 5
                                  ? "text-[#00ff88]"
                                  : ch === "]"
                                    ? "text-emerald-500"
                                    : "text-emerald-400/80"
                        }
                      >
                        {ch}
                      </span>
                    );
                  })}
                </div>
              ))}
              {bootDisplay.length < BOOT_SEQUENCE.length && scrambling && (
                <span className="text-emerald-300 animate-pulse font-bold">
                  {SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]}
                </span>
              )}
              {!scrambling && bootDisplay.length < BOOT_SEQUENCE.length && (
                <span className="text-emerald-500/50 animate-pulse">▊</span>
              )}
            </pre>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 max-w-2xl mx-auto w-full transition-all duration-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
          {[
            { icon: <Database size={14} />, title: "Smart Spreadsheets", desc: "Formula engine, lock levels, cell history & clipboard tracking" },
            { icon: <Terminal size={14} />, title: "Hybrid Workspaces", desc: "Mix documents, code blocks, checklists & spreadsheets" },
            { icon: <Shield size={14} />, title: "Vault Security", desc: "5-tier lock system with recovery vault & audit logs" },
          ].map((f, i) => (
            <div
              key={i}
              className="border border-emerald-500/10 bg-black/30 p-3 text-left hover:border-emerald-500/30 transition-all"
              style={{ transitionDelay: showContent ? `${300 + i * 100}ms` : "0ms" }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-emerald-400">{f.icon}</span>
                <span className="text-emerald-300 text-xs font-bold">{f.title}</span>
              </div>
              <p className="text-[10px] text-emerald-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div
          className={`flex items-center justify-center transition-all duration-700 ${showButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
        >
          <button
            onClick={onLaunch}
            className="group flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/40 px-6 py-2.5 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all"
          >
            <Sparkles size={14} className="text-[#00ffcc]" />
            Launch Workspace
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <p className={`mt-8 text-[9px] text-emerald-800/60 transition-opacity duration-700 ${showButtons ? "opacity-100" : "opacity-0"}`}>
          All data stored locally. No cloud transmission. v2.4.0
        </p>
      </div>
    </div>
  );
}
