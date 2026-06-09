/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Lock, Unlock, Search, Terminal, Radio, Shield, HelpCircle, Eye, Sun, Moon, Menu, X, Cloud, CheckCircle, AlertCircle } from "lucide-react";

interface HeaderProps {
  onOpenPalette: () => void;
  onSearch: (q: string) => void;
  searchQuery?: string;
  unlockModeActive: boolean;
  onToggleUnlockMode: () => void;
  lockStats: { locked: number; total: number; vault: number };
  activeWorkspaceName?: string;
  onToggleTheme: () => void;
  theme?: "dark" | "light";
  onToggleMobileSidebar?: () => void;
  mobileSidebarOpen?: boolean;
  isHome?: boolean;
  onLogin?: () => void;
  syncStatus?: "saved" | "saving" | "error";
}

export default function Header({
  onOpenPalette,
  onSearch,
  searchQuery = "",
  unlockModeActive,
  onToggleUnlockMode,
  lockStats,
  activeWorkspaceName = "SYSTEM",
  onToggleTheme,
  theme = "dark",
  onToggleMobileSidebar,
  mobileSidebarOpen,
  isHome = false,
  onLogin,
  syncStatus = "saved",
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [pulse, setPulse] = useState(true);

  // Sync clock dynamically
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Soft ticking signal indicator
  useEffect(() => {
    const pInterval = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(pInterval);
  }, []);

  // Compute cell protection statistics safely to prevent division
  const lockPercent = lockStats.total > 0 ? Math.round((lockStats.locked / lockStats.total) * 100) : 0;

  return (
    <header className="h-14 bg-[#050806] border-b border-emerald-500/30 flex items-center justify-between px-4 font-mono text-emerald-400 z-50 shrink-0 select-none">
      {/* Mobile sidebar toggle */}
      <button
        onClick={onToggleMobileSidebar}
        className="lg:hidden h-8 w-8 rounded bg-[#101b17] hover:bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500 flex items-center justify-center transition-all mr-2"
        title={mobileSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {mobileSidebarOpen ? <X size={14} /> : <Menu size={14} />}
      </button>

      {/* Brand area */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded border border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
          <Terminal size={16} className={`${pulse ? "text-emerald-400" : "text-emerald-600"} transition-all`} />
          <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-sm font-black tracking-widest text-[#00ff99]">
            <span>SMARTSHEETS</span>
            <span className="h-1.5 w-1.5 bg-emerald-400 animate-pulse inline-block" />
          </div>
          <p className="text-[9px] text-emerald-600 tracking-wider">SECURE PERSONAL VAULT</p>
        </div>
      </div>

      {/* Active node selector status */}
      {!isHome && (
        <div className="hidden md:flex items-center gap-2 border-l border-emerald-500/20 pl-4">
          <Radio size={12} className="text-emerald-500 animate-pulse shrink-0" />
          <span className="text-[10px] text-emerald-600 uppercase">SYS_NODE:</span>
          <span className="text-[10px] text-emerald-300 font-bold truncate max-w-[120px] bg-emerald-950/30 px-1.5 py-0.5 border border-emerald-900/40 rounded">
            {activeWorkspaceName}
          </span>
        </div>
      )}

      {/* Real-time Search Box */}
      {!isHome && (
        <div className="flex-1 max-w-sm mx-4 relative hidden sm:block">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600" />
          <input
            type="text"
            className="w-full h-8 pl-8 pr-3 rounded bg-black/50 border border-emerald-500/20 text-xs text-emerald-300 placeholder-emerald-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
            placeholder="Fuzzy Search index (Ctrl + K)..."
            value={searchQuery || ""}
            onChange={e => onSearch(e.target.value)}
          />
        </div>
      )}

      {/* Flagship Controls (Locks & Unlock Mode Indicator) */}
      <div className="flex items-center gap-3">
        {/* Dynamic Security Locker Bar */}
        {!isHome && (
          <div className="hidden lg:flex items-center gap-2 bg-emerald-950/20 border border-emerald-900/30 rounded px-2.5 py-1 text-[10px]">
            <Shield size={12} className="text-emerald-500 shrink-0" />
            <span className="text-emerald-600">VAULT LOAD:</span>
            <div className="w-16 h-1.5 bg-emerald-950 rounded overflow-hidden border border-emerald-900/60 relative">
              <div
                className="h-full bg-emerald-500 shadow-[0_0_5px_#10b981] transition-all duration-500"
                style={{ width: `${lockPercent}%` }}
              />
            </div>
            <span className="font-bold text-center text-emerald-300">{lockPercent}% Locked</span>
            {lockStats.vault > 0 && (
              <span className="text-red-500 text-[9px] animate-pulse ml-1">
                ({lockStats.vault} VAULTED)
              </span>
            )}
          </div>
        )}

        {/* Cloud Sync Status Indicator — like Google Sheets "Sync to Drive" */}
        {!isHome && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] transition-all duration-300 ${
            syncStatus === "saving"
              ? "bg-emerald-950/30 border border-emerald-500/30 text-emerald-400"
              : syncStatus === "error"
              ? "bg-red-950/30 border border-red-500/30 text-red-400"
              : "bg-emerald-950/10 border border-emerald-900/20 text-emerald-600"
          }`}>
            {syncStatus === "saving" ? (
              <>
                <Cloud size={12} className="animate-bounce text-emerald-400" />
                <span className="font-bold">Saving...</span>
              </>
            ) : syncStatus === "error" ? (
              <>
                <AlertCircle size={12} className="text-red-400" />
                <span>Sync Error</span>
              </>
            ) : (
              <>
                <CheckCircle size={12} className="text-emerald-500" />
                <span>Saved</span>
              </>
            )}
          </div>
        )}

        {/* Global UNLOCK MODE toggle */}
        {!isHome && (
          <button
            onClick={onToggleUnlockMode}
            className={`flex items-center gap-1.5 h-8 px-2.5 rounded text-xs transition-all duration-200 border cursor-pointer select-none ${
              unlockModeActive
                ? "bg-red-950/40 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                : "bg-emerald-950/10 border-emerald-800/30 hover:border-emerald-500 text-emerald-500"
            }`}
            title={unlockModeActive ? "Unlock mode is active" : "Enable quick unlock template mode"}
          >
            {unlockModeActive ? (
              <>
                <Unlock size={12} className="text-red-400 animate-bounce" />
                <span className="font-bold">UNLOCK MODE ON</span>
              </>
            ) : (
              <>
                <Lock size={12} className="text-emerald-600" />
                <span>UNLOCK MODE OFF</span>
              </>
            )}
          </button>
        )}

        {/* Command Palette Terminal Trigger */}
        {!isHome && (
          <button
            onClick={onOpenPalette}
            className="h-8 w-8 rounded bg-[#101b17] hover:bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500 flex items-center justify-center transition-all"
            title="Terminal console [Ctrl+/ or Cmd+/]"
          >
            <Terminal size={14} />
          </button>
        )}

        {/* Sign In — visible on home page */}
        {isHome && (
          <button
            onClick={onLogin}
            className="border border-emerald-500/20 px-4 py-1.5 text-emerald-500 text-xs hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all"
          >
            Sign In
          </button>
        )}

        {/* High Density Theme Switcher */}
        <button
          onClick={onToggleTheme}
          className="h-8 w-8 rounded bg-[#101b17] hover:bg-emerald-900/30 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500 flex items-center justify-center transition-all"
          title={theme === "dark" ? "Switch to Light Paper Mode" : "Switch to Dark Terminal Mode"}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* System live atomic clock */}
        <div className="hidden xl:flex flex-col text-right">
            <span className="text-[10px] text-emerald-400 font-bold tabular-nums">
              {currentTime}
            </span>
            <span className="text-[8px] text-emerald-600 tracking-widest uppercase">
              SEC_CHANNEL_SECURE
            </span>
          </div>
      </div>
    </header>
  );
}
