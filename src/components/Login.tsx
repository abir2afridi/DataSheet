import { useState } from "react";
import { ArrowLeft, Terminal, Lock, Database, Sparkles, ShieldAlert } from "lucide-react";
import { supabase } from "../lib/supabase";

interface LoginProps {
  onBack: () => void;
}

export default function Login({ onBack }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: siteUrl,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#020402] flex relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <button
        onClick={onBack}
        className="absolute top-4 left-4 flex items-center gap-1.5 text-emerald-600 hover:text-emerald-400 text-[10px] transition-colors z-10"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      {/* Left panel */}
      <div className="hidden md:flex w-1/2 flex-col justify-center px-12 relative">
        <div className="max-w-md ml-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-emerald-500/20 bg-black/30 mb-6">
            <Terminal size={10} className="text-emerald-500" />
            <span className="text-[8px] text-emerald-600 uppercase tracking-[0.2em]">smartsheets v2.4</span>
          </div>

          <h1 className="text-4xl font-black text-emerald-400 tracking-tight leading-none mb-3">
            Data<span className="text-[#00ffcc]">Sheet</span>
          </h1>

          <p className="text-xs text-emerald-500/60 leading-relaxed mb-8 max-w-sm">
            A matrix-grade local workspace. Encrypted cells, lock hierarchies, and terminal aesthetics — all in your browser.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-emerald-500/15 bg-black/30 flex items-center justify-center">
                <ShieldAlert size={12} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-300 font-bold">Encrypted Cells</p>
                <p className="text-[8px] text-emerald-600">5-tier lock system with recovery vault</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-emerald-500/15 bg-black/30 flex items-center justify-center">
                <Database size={12} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-300 font-bold">Cloud Storage</p>
                <p className="text-[8px] text-emerald-600">All data synced to Supabase. Access from anywhere.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-emerald-500/15 bg-black/30 flex items-center justify-center">
                <Sparkles size={12} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] text-emerald-300 font-bold">Hybrid Workspaces</p>
                <p className="text-[8px] text-emerald-600">Spreadsheets, docs & code in one interface</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 relative">
        <div className="hidden md:block absolute left-0 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent" />

        <div className="w-full max-w-sm">
          <div className="border border-emerald-500/15 bg-black/40">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-500/10 bg-black/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-600 uppercase tracking-wider">sign in</span>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 border border-emerald-500/20 bg-black/40 flex items-center justify-center mx-auto mb-4">
                  <Lock size={22} className="text-emerald-400" />
                </div>
                <h2 className="text-emerald-300 text-sm font-bold uppercase tracking-wider">Welcome</h2>
                <p className="text-[10px] text-emerald-600 mt-1">Sign in to access your workspace.</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-950/20 border border-red-500/15 px-3 py-2 mb-4">
                  <span className="text-red-400 text-[10px]">{error}</span>
                </div>
              )}

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-black/50 border border-emerald-500/25 py-3 text-emerald-300 text-xs font-bold hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border border-emerald-500 border-t-transparent animate-spin rounded-full" />
                    Connecting...
                  </span>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-[8px] text-emerald-700/50 leading-relaxed">
                By signing in, you agree to our terms of service.<br />
                Your data is stored securely in Supabase.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-[7px] text-emerald-700/50 uppercase tracking-wider">Encrypted</span>
            <span className="w-px h-2.5 bg-emerald-900/30" />
            <span className="text-[7px] text-emerald-700/50 uppercase tracking-wider">Supabase Sync</span>
            <span className="w-px h-2.5 bg-emerald-900/30" />
            <span className="text-[7px] text-emerald-700/50 uppercase tracking-wider">Cloud Backup</span>
          </div>
        </div>
      </div>
    </div>
  );
}
