import { Terminal, Shield, Lock, Copy, Search, Folder, Database, Server, Globe, BookOpen, Target, Eye, Cpu, Sparkles, ChevronRight } from "lucide-react";

export default function About() {
  const stats = [
    { icon: Lock, label: "Lock Levels", value: "5", accent: "text-red-400" },
    { icon: Copy, label: "Copy Modes", value: "5", accent: "text-cyan-400" },
    { icon: Folder, label: "Workspace Types", value: "3", accent: "text-[#00ffcc]" },
    { icon: Search, label: "Search Depth", value: "Full", accent: "text-yellow-400" },
  ];

  const features = [
    {
      icon: Lock,
      title: "Smart Cell Lock System",
      desc: "Five-tier protection — NONE, SOFT, PROTECTED, VAULT, PERMANENT. Each cell individually locked with its own security level and optional password. Bulk lock/unlock across ranges.",
    },
    {
      icon: Copy,
      title: "Instant Copy Engine",
      desc: "Hover any non-empty cell to copy. Choose from plain text, formula, markdown, JSON, or CSV. Full copy history with timestamps and source tracking.",
    },
    {
      icon: Search,
      title: "Global Fuzzy Search",
      desc: "Levenshtein-powered search across filenames, cell contents, formulas, notes, tags, document blocks, and hybrid content — all from a single query.",
    },
    {
      icon: Database,
      title: "Trinity Workspace Model",
      desc: "Three distinct workspace types — Spreadsheet (formula engine, multi-sheet, styling), Document (block-based editor with slash commands), and Hybrid (modular canvas combining all formats).",
    },
    {
      icon: Shield,
      title: "Supabase-Backed Storage",
      desc: "Every workspace is secured with Supabase authentication and database. Data is stored in PostgreSQL with Row Level Security. Google sign-in for secure access.",
    },
    {
      icon: Eye,
      title: "Activity Audit Trail",
      desc: "Every action — edit, delete, lock, unlock, paste, import, copy, restore — logged with precise timestamps. Full visibility into workspace history.",
    },
  ];

  const workflow = [
    { step: "01", title: "Create", desc: "Deploy a Spreadsheet, Document, or Hybrid workspace from the sidebar or command palette (Ctrl+K)." },
    { step: "02", title: "Secure", desc: "Apply cell-level locks with five protection tiers. Enable Unlock Mode in the header for quick unlocking." },
    { step: "03", title: "Work", desc: "Use formulas, block editing, checklists, code blocks, and templates. Changes auto-save to Supabase." },
    { step: "04", title: "Recover", desc: "Deleted items go to Recovery Vault. Restore or permanently purge with full audit trail." },
  ];

  const faqs = [
    { q: "Where is my data stored?", a: "Your workspaces, folders, and all content are stored in Supabase PostgreSQL database. Data is encrypted in transit and at rest. Each user's data is isolated via Row Level Security." },
    { q: "How do I sign in?", a: "Sign in with your Google account. Authentication is handled by Supabase Auth with OAuth 2.0. No passwords to remember." },
    { q: "Is my data private?", a: "Yes. Row Level Security ensures only you can access your data. Each Supabase policy scopes access to your authenticated user ID. No telemetry, tracking, or data sharing." },
    { q: "What happens if I clear my browser data?", a: "Nothing. All data is stored in the cloud (Supabase), not in your browser. Just sign in again and your workspace is restored." },
    { q: "How does cell locking work?", a: "Five levels: NONE (freely editable), SOFT (click to unlock), PROTECTED (confirmation dialog), VAULT (password required), PERMANENT (recovery-only). Locked cells block edits, overwrites, pastes, and formula modifications." },
  ];

  return (
    <div className="flex-1 bg-[#020503] font-mono text-emerald-400 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full p-4 md:p-6 space-y-4 select-none">

        {/* Hero */}
        <div className="border border-emerald-500/20 bg-emerald-950/5 rounded overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-500/10 bg-black/30">
            <Terminal size={12} className="text-emerald-500" />
            <span className="text-[9px] text-emerald-600 uppercase tracking-wider">system::about</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-800">v2.4.0</span>
            </div>
          </div>
          <div className="p-5 md:p-8 text-center relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.03)_0%,_transparent_70%)] pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded border-2 border-emerald-500/30 bg-black/50 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Terminal size={32} className="text-emerald-400" />
              </div>
              <h1 className="text-emerald-100 text-lg md:text-xl font-black uppercase tracking-[0.15em] mb-2">DataSheet</h1>
              <p className="text-emerald-500/80 text-[11px] md:text-xs uppercase tracking-wider font-bold mb-3">
                Cloud-Backed Secure Workspace
              </p>
              <p className="text-emerald-600/70 text-[10px] max-w-lg mx-auto leading-relaxed">
                A matrix-grade cloud workspace combining spreadsheets, documents, and hybrid vaults
                with military-grade cell locking, instant copy systems, and Supabase-backed persistence.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="bg-[#050906] border border-emerald-950 rounded p-3 text-center group hover:border-emerald-500/20 transition-all">
              <s.icon size={18} className={`${s.accent} mx-auto mb-1 group-hover:scale-110 transition-transform`} />
              <span className="text-emerald-100 text-lg font-black tracking-tight block">{s.value}</span>
              <span className="text-[9px] text-emerald-600 uppercase tracking-wider font-bold">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="bg-[#050906] border border-emerald-950 rounded p-4 hover:border-emerald-500/20 transition-all">
          <div className="flex items-center gap-2 mb-3 border-b border-emerald-950/50 pb-2">
            <Target size={13} className="text-emerald-500" />
            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Mission &amp; Vision</span>
          </div>
          <div className="space-y-3 text-[11px] leading-relaxed">
            <p className="text-emerald-400/90">
              DataSheet was built to solve a fundamental problem: <span className="text-emerald-200 font-bold">you should never lose important data</span>.
              Spreadsheet errors, accidental deletions, overwritten cells — traditional tools offer no safety net.
            </p>
            <p className="text-emerald-500/80">
              Our vision is a cloud-backed workspace where every cell, every block, and every document
              is protected by granular security controls. Sign in with Google, access your data from anywhere,
              and never worry about local storage again.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-[#050906] border border-emerald-950 rounded p-4 hover:border-emerald-500/20 transition-all">
          <div className="flex items-center gap-2 mb-3 border-b border-emerald-950/50 pb-2">
            <Cpu size={13} className="text-emerald-500" />
            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Core Capabilities</span>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {features.map((f, i) => (
              <div key={i} className="bg-black/30 border border-emerald-950 rounded p-3 group hover:border-emerald-500/20 hover:bg-emerald-950/5 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <f.icon size={12} className="text-emerald-500 shrink-0" />
                  <span className="text-[11px] text-emerald-200 font-bold">{f.title}</span>
                </div>
                <p className="text-[10px] text-emerald-500/70 leading-relaxed pl-[20px]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow */}
        <div className="bg-[#050906] border border-emerald-950 rounded p-4 hover:border-emerald-500/20 transition-all">
          <div className="flex items-center gap-2 mb-3 border-b border-emerald-950/50 pb-2">
            <BookOpen size={13} className="text-emerald-500" />
            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Workflow</span>
          </div>
          <div className="space-y-1">
            {workflow.map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-2 rounded hover:bg-emerald-950/5 transition-all">
                <div className="flex items-center justify-center w-6 h-6 rounded bg-emerald-950/30 border border-emerald-900/40 shrink-0 mt-0.5">
                  <span className="text-[9px] text-emerald-500 font-black">{s.step}</span>
                </div>
                <div className="flex items-start gap-2 min-w-0">
                  <ChevronRight size={10} className="text-emerald-700 mt-1 shrink-0" />
                  <div>
                    <span className="text-[11px] text-emerald-200 font-bold block">{s.title}</span>
                    <span className="text-[10px] text-emerald-500/70">{s.desc}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-[#050906] border border-emerald-950 rounded p-4 hover:border-emerald-500/20 transition-all">
          <div className="flex items-center gap-2 mb-3 border-b border-emerald-950/50 pb-2">
            <Server size={13} className="text-emerald-500" />
            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Technology Stack</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { name: "React 19", role: "UI Framework" },
              { name: "TypeScript", role: "Type Safety" },
              { name: "Vite 6", role: "Build Tool" },
              { name: "Tailwind CSS 4", role: "Styling" },
              { name: "Supabase", role: "Database & Auth" },
              { name: "Google OAuth", role: "Authentication" },
              { name: "PostgreSQL", role: "Data Storage" },
            ].map((t, i) => (
              <div key={i} className="bg-black/30 border border-emerald-950 rounded p-2 text-center hover:border-emerald-500/20 transition-all">
                <span className="text-[11px] text-emerald-200 font-bold block">{t.name}</span>
                <span className="text-[9px] text-emerald-600">{t.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-[#050906] border border-emerald-950 rounded p-4 hover:border-emerald-500/20 transition-all">
          <div className="flex items-center gap-2 mb-3 border-b border-emerald-950/50 pb-2">
            <Shield size={13} className="text-emerald-500" />
            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">Security &amp; Privacy</span>
          </div>
          <div className="space-y-2 text-[10px] text-emerald-500/70 leading-relaxed">
            <p>Authentication is handled by Supabase Auth with Google OAuth 2.0. All database access uses Row Level Security — each query is scoped to your authenticated user ID.</p>
            <p>Data is stored in Supabase PostgreSQL with encryption in transit (TLS) and at rest. The cell lock system operates client-side with five protection tiers. Recovery Vault maintains complete payload backups of deleted items.</p>
            <p className="flex items-center gap-1.5">
              <Sparkles size={10} className="text-emerald-500 shrink-0" />
              <span>No analytics, no cookies, no tracking scripts. Your data belongs to you.</span>
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-[#050906] border border-emerald-950 rounded p-4 hover:border-emerald-500/20 transition-all">
          <div className="flex items-center gap-2 mb-3 border-b border-emerald-950/50 pb-2">
            <Globe size={13} className="text-emerald-500" />
            <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">FAQ</span>
          </div>
          <div className="space-y-1">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded hover:bg-emerald-950/5 transition-all">
                <summary className="flex items-center gap-2 px-3 py-2 text-[11px] text-emerald-200 font-bold cursor-pointer list-none rounded hover:bg-black/20 transition-all">
                  <span className="text-emerald-700 text-[9px] font-black shrink-0">Q{i + 1}.</span>
                  {faq.q}
                  <span className="ml-auto text-emerald-700 group-open:text-emerald-400 text-xs transition-all">+</span>
                </summary>
                <div className="px-3 pb-2 pl-8 text-[10px] text-emerald-500/70 leading-relaxed border-t border-emerald-950/30 pt-2 ml-0">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border border-emerald-500/10 bg-black/30 rounded p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-[9px] text-emerald-700">
            <Terminal size={10} className="text-emerald-600" />
            <span>DataSheet v2.4.0 — Cloud-Backed Secure Workspace</span>
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[8px] text-emerald-800 mt-1">Built with React · TypeScript · Supabase · Google OAuth</p>
        </div>
      </div>
    </div>
  );
}
