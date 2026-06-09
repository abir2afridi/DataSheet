import { useEffect, useState, useRef, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Code2, Star, GitFork, Users, GitCommit, Zap, ExternalLink,
  Calendar, Clock, MapPin, Link as LinkIcon, Twitter, Package,
  Folder, Activity, Signal, Radio, Globe, Cloud, Terminal,
  ChevronRight, ArrowUpRight, Eye, BookOpen, Sparkles
} from "lucide-react";

const GITHUB_USERNAME = "abir2afridi";

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  location: string;
  blog: string;
  twitter_username: string;
  company: string;
  created_at: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
}

interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
  payload: { action?: string; ref?: string };
}

const FALLBACK_USER: GitHubUser = {
  login: "abir2afridi",
  avatar_url: "https://avatars.githubusercontent.com/u/101024750?v=4",
  name: "Abir Hasan Siam",
  bio: "Full-stack developer & security researcher. Building secure, scalable systems with React, TypeScript, and Rust.",
  public_repos: 28,
  followers: 42,
  following: 37,
  location: "Bangladesh",
  blog: "https://github.com/abir2afridi",
  twitter_username: "abir2afridi",
  company: "Independent",
  created_at: "2022-04-15T10:00:00Z",
};

const FALLBACK_REPOS: GitHubRepo[] = Array.from({ length: 6 }, (_, i) => ({
  id: 1000 + i,
  name: ["smartsheets", "rust-core", "nexus-db", "cipher-vault", "pulse-monitor", "block-forge"][i],
  description: ["Secure workspace vault with cell-level encryption", "High-performance async runtime core", "Distributed key-value store with consensus", "Military-grade credential manager", "Real-time system monitoring dashboard", "Modular block editor framework"][i],
  html_url: `https://github.com/abir2afridi/${["smartsheets", "rust-core", "nexus-db", "cipher-vault", "pulse-monitor", "block-forge"][i]}`,
  stargazers_count: [128, 89, 67, 45, 32, 24][i],
  forks_count: [24, 18, 12, 8, 6, 4][i],
  language: ["TypeScript", "Rust", "Go", "Rust", "TypeScript", "TypeScript"][i],
  updated_at: new Date(Date.now() - i * 86400000 * 3).toISOString(),
}));

const FALLBACK_EVENTS: GitHubEvent[] = Array.from({ length: 12 }, (_, i) => ({
  id: `evt_${i}`,
  type: ["PushEvent", "CreateEvent", "IssuesEvent", "PullRequestEvent", "PushEvent", "WatchEvent", "PushEvent", "ForkEvent", "IssuesEvent", "CreateEvent", "PushEvent", "ReleaseEvent"][i],
  repo: { name: `abir2afridi/${["smartsheets", "rust-core", "nexus-db", "smartsheets", "cipher-vault", "block-forge", "pulse-monitor", "rust-core", "smartsheets", "nexus-db", "block-forge", "cipher-vault"][i]}` },
  created_at: new Date(Date.now() - i * 3600000 * 2).toISOString(),
  payload: { action: ["opened", "created", "closed", "merged", "pushed", "started", "pushed", "forked", "opened", "created", "pushed", "published"][i] },
}));

const FALLBACK_ALL_REPOS: GitHubRepo[] = Array.from({ length: 30 }, (_, i) => ({
  id: 2000 + i,
  name: `repo-${i}`,
  description: "Sample repository",
  html_url: "https://github.com/abir2afridi",
  stargazers_count: Math.floor(Math.random() * 50),
  forks_count: Math.floor(Math.random() * 10),
  language: ["TypeScript", "Rust", "Go", "Python", "JavaScript", "C++"][i % 6],
  updated_at: new Date().toISOString(),
}));

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function eventLabel(type: string) {
  const map: Record<string, string> = {
    PushEvent: "pushed to", CreateEvent: "created", IssuesEvent: "opened issue",
    PullRequestEvent: "PR", WatchEvent: "starred", ForkEvent: "forked",
    ReleaseEvent: "released", DeleteEvent: "deleted",
  };
  return map[type] || type.replace("Event", "").toLowerCase();
}

function eventIcon(type: string) {
  switch (type) {
    case "PushEvent": return <GitCommit size={10} />;
    case "CreateEvent": return <Globe size={10} />;
    case "IssuesEvent": return <BookOpen size={10} />;
    case "PullRequestEvent": return <GitFork size={10} />;
    case "WatchEvent": return <Star size={10} />;
    case "ForkEvent": return <GitFork size={10} />;
    case "ReleaseEvent": return <Package size={10} />;
    default: return <Activity size={10} />;
  }
}

export default function Developer({ theme }: { theme?: "dark" | "light" }) {
  const isDark = theme !== "light";
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [events, setEvents] = useState<GitHubEvent[]>([]);
  const [allRepos, setAllRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const signalRef = useRef<HTMLDivElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const link1 = document.createElement("link");
    link1.rel = "stylesheet";
    link1.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&display=swap";
    document.head.appendChild(link1);
    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href = "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link2);
    Promise.all([
      new Promise(r => link1.onload = r),
      new Promise(r => link2.onload = r),
    ]).then(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [userRes, reposRes, eventsRes, allReposRes] = await Promise.all([
          fetch(`https://api.github.com/users/${GITHUB_USERNAME}`),
          fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`),
          fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events?per_page=12`),
          fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`),
        ]);
        if (!userRes.ok || !reposRes.ok) throw new Error("API limit");
        const [u, r, e, ar] = await Promise.all([
          userRes.json(), reposRes.json(), eventsRes.json(), allReposRes.json(),
        ]);
        setUser(u); setRepos(r); setEvents(e || []); setAllRepos(ar || []);
      } catch {
        setUser(FALLBACK_USER);
        setRepos(FALLBACK_REPOS);
        setEvents(FALLBACK_EVENTS);
        setAllRepos(FALLBACK_ALL_REPOS);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Auto-scroll signal feed
  useEffect(() => {
    if (!signalRef.current || events.length === 0) return;
    const id = setInterval(() => {
      if (!signalRef.current) return;
      signalRef.current.scrollTop = signalRef.current.scrollHeight;
    }, 2000);
    return () => clearInterval(id);
  }, [events]);

  const langCounts: Record<string, number> = {};
  allRepos.forEach(r => {
    if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1;
  });
  const langData = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));
  const COLORS = ["#0066FF", "#00E5FF", "#FF0055", "#FFD600", "#00FF88", "#FF6600"];
  const totalStars = allRepos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = allRepos.reduce((s, r) => s + r.forks_count, 0);

  const heatmap = useMemo(() => {
    const weeks = 24;
    return Array.from({ length: 7 }, () =>
      Array.from({ length: weeks }, (_, wi) => {
        const base = Math.sin(wi * 0.5) * 0.5 + 0.5;
        return Math.random() > 0.4 ? Math.min(4, Math.floor(base * Math.random() * 5) + 1) : 0;
      })
    );
  }, []);

  if (loading) {
    return (
      <div className="flex-1 bg-[#0A0A0A] flex items-center justify-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0066FF] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-[#0066FF] text-xs tracking-widest uppercase">Connecting to GitHub API...</p>
        </div>
      </div>
    );
  }

  const fontStyle = fontsLoaded ? "'Syne', sans-serif" : "system-ui, sans-serif";
  const monoFont = fontsLoaded ? "'JetBrains Mono', monospace" : "'Courier New', monospace";

  const bg = isDark ? "bg-[#0A0A0A]" : "bg-[#f0f0f0]";
  const cardBg = isDark ? "bg-white/[0.04]" : "bg-white";
  const cardBorder = isDark ? "border-white/[0.15]" : "border-gray-300";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-white/80" : "text-gray-800";
  const textTertiary = isDark ? "text-white/60" : "text-gray-600";
  const textMuted = isDark ? "text-white/40" : "text-gray-500";
  const textDim = isDark ? "text-white/30" : "text-gray-400";
  const innerBorder = isDark ? "border-white/[0.08]" : "border-gray-200";
  const innerCardBg = isDark ? "bg-white/[0.03]" : "bg-gray-50";
  const hoverBg = isDark ? "hover:bg-white/[0.04]" : "hover:bg-gray-100";

  return (
    <div className={`flex-1 ${bg} overflow-x-hidden overflow-y-auto relative`} style={{ fontFamily: monoFont }}>
      {/* HERO */}
        <section className="w-full px-6 md:px-12 lg:px-20 py-12 md:py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_rgba(0,102,255,0.08)_0%,_transparent_70%)]" />
          <div className="relative grid xl:grid-cols-12 gap-8 items-center max-w-full">
            {/* Left - Name */}
            <div className="xl:col-span-7 space-y-6 min-w-0">
              <div className="space-y-2">
                <p className="text-[#0066FF] text-xs tracking-[0.3em] uppercase font-semibold" style={{ fontFamily: monoFont }}>Developer Console // Identity</p>
                <h1 className="text-5xl md:text-7xl xl:text-[7rem] font-black uppercase leading-[0.85] tracking-[-0.03em] ${isDark ? 'text-white/30' : 'text-gray-200'}"
                    style={{ fontFamily: fontStyle, WebkitTextStroke: isDark ? "1px rgba(255,255,255,0.3)" : "1px rgba(0,0,0,0.15)" }}>
                  {user?.name?.split(" ")[0] || "ABIR"}
                </h1>
                <h1 className={`text-5xl md:text-7xl xl:text-[7rem] font-black uppercase leading-[0.85] tracking-[-0.03em] ${textPrimary} mt-[-0.1em]`}
                    style={{ fontFamily: fontStyle }}>
                  {user?.name?.split(" ").slice(1).join(" ") || "HASAN"}
                </h1>
              </div>
              <p className={`${textSecondary} text-sm leading-relaxed max-w-xl`} style={{ fontFamily: monoFont }}>
                {user?.bio || "Full-stack developer & security researcher."}
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { icon: MapPin, text: user?.location || "Bangladesh" },
                  { icon: Twitter, text: `@${user?.twitter_username || "abir2afridi"}` },
                  { icon: LinkIcon, text: "github.com/abir2afridi", href: "https://github.com/abir2afridi" },
                  { icon: Calendar, text: `Joined ${new Date(user?.created_at || "").getFullYear() || 2022}` },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-1.5 text-[10px] ${textTertiary} uppercase tracking-wider`}>
                    <item.icon size={12} className="text-[#0066FF]" />
                    {item.href ? <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-[#0066FF] transition-colors">{item.text}</a> : <span>{item.text}</span>}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button className="px-5 py-2.5 bg-[#0066FF] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#0052CC] transition-all shadow-[0_0_20px_rgba(0,102,255,0.3)] hover:shadow-[0_0_30px_rgba(0,102,255,0.5)]">
                  <a href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <Code2 size={14} /> View Profile
                  </a>
                </button>
                <button className={`px-5 py-2.5 border ${isDark ? 'border-white/30 text-white/80' : 'border-gray-400 text-gray-700'} text-xs font-bold tracking-widest uppercase hover:border-[#0066FF]/60 hover:text-[#0066FF] transition-all`}>
                  <a href={`https://github.com/${GITHUB_USERNAME}?tab=repositories`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <Folder size={14} /> Explore Repos
                  </a>
                </button>
              </div>
            </div>

            {/* Right - Avatar with scanline */}
            <div className="xl:col-span-5 flex justify-center xl:justify-end relative min-w-0">
              <div className="relative group">
                <div className="w-56 h-56 md:w-72 md:h-72 relative overflow-hidden border-2 border-[#0066FF]/50 shadow-[0_0_40px_rgba(0,102,255,0.3)]">
                  <img
                    src={user?.avatar_url || FALLBACK_USER.avatar_url}
                    alt={user?.name || "Developer"}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#0066FF]" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#0066FF]" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#0066FF]" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#0066FF]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="w-full px-6 md:px-12 lg:px-20 pb-12">
          <div className="grid xl:grid-cols-12 gap-6 max-w-full">

            {/* Sidebar (3 cols) - Stats + Donut */}
            <div className="xl:col-span-3 space-y-6 min-w-0">

              {/* Core Stats */}
              <div className={`border ${cardBorder} p-5 ${cardBg}`}>
                <h3 className="text-[#0066FF] text-[10px] tracking-[0.25em] uppercase font-bold mb-4 flex items-center gap-2" style={{ fontFamily: monoFont }}>
                  <Activity size={12} /> Performance Hub
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Star, label: "Star Impact", value: totalStars.toString(), color: "#FFD600", desc: "Across all public repos" },
                    { icon: GitFork, label: "Fork Density", value: (totalForks / Math.max(allRepos.length, 1)).toFixed(1), color: "#00E5FF", desc: "Avg forks per repository" },
                    { icon: Folder, label: "Repos Node", value: allRepos.length.toString(), color: "#0066FF", desc: "Total public repositories" },
                    { icon: Users, label: "Followers", value: (user?.followers || 42).toString(), color: "#00FF88", desc: "Developer network" },
                  ].map((s, i) => (
                    <div key={i} className={`group border ${isDark ? 'border-white/[0.1]' : 'border-gray-200'} p-3 hover:border-[#0066FF]/30 ${hoverBg} transition-all cursor-default`}
                         style={{ borderLeft: `2px solid ${s.color}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[9px] ${textTertiary} uppercase tracking-wider`} style={{ fontFamily: monoFont }}>{s.label}</span>
                        <s.icon size={12} style={{ color: s.color }} />
                      </div>
                      <span className={`text-2xl font-black ${textPrimary}`} style={{ fontFamily: fontStyle }}>{s.value}</span>
                      <p className={`text-[8px] ${textMuted} mt-0.5 tracking-wider`}>{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Language Donut */}
              <div className={`border ${cardBorder} p-5 ${cardBg}`}>
                <h3 className="text-[#0066FF] text-[10px] tracking-[0.25em] uppercase font-bold mb-4 flex items-center gap-2" style={{ fontFamily: monoFont }}>
                  <Radio size={12} /> Visual Intelligence
                </h3>
                {langData.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={langData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" stroke="none">
                          {langData.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="w-full space-y-1.5 mt-2">
                      {langData.map((l, i) => (
                        <div key={l.name} className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className={textSecondary} style={{ fontFamily: monoFont }}>{l.name}</span>
                          </div>
                          <span className={`${textMuted} font-bold`} style={{ fontFamily: monoFont }}>{l.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className={`${textMuted} text-[10px] text-center py-6`}>No language data available</p>
                )}
              </div>

              {/* Quick Info */}
              <div className={`border ${cardBorder} p-5 ${cardBg}`}>
                <h3 className="text-[#0066FF] text-[10px] tracking-[0.25em] uppercase font-bold mb-3 flex items-center gap-2" style={{ fontFamily: monoFont }}>
                  <Cloud size={12} /> System Info
                </h3>
                <div className="space-y-2 text-[10px]">
                  {[
                    { label: "Username", value: user?.login || "abir2afridi" },
                    { label: "Company", value: user?.company || "Independent" },
                    { label: "Following", value: (user?.following || 37).toString() },
                    { label: "Node Version", value: "v20.11.0" },
                    { label: "Environment", value: "Production" },
                  ].map((s, i) => (
                    <div key={i} className={`flex justify-between border-b ${innerBorder} pb-1.5`}>
                      <span className={`${textTertiary} tracking-wider uppercase`}>{s.label}</span>
                      <span className={`${textPrimary} font-semibold`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content (9 cols) */}
            <div className="xl:col-span-9 space-y-6 min-w-0">

              {/* Contribution Pulse */}
              <div className={`border ${cardBorder} p-5 ${cardBg}`}>
                <h3 className="text-[#0066FF] text-[10px] tracking-[0.25em] uppercase font-bold mb-4 flex items-center gap-2" style={{ fontFamily: monoFont }}>
                  <Signal size={12} /> Contribution Pulse
                  <span className={`ml-auto text-[9px] ${textMuted} font-normal tracking-normal`}>
                    {heatmap.flat().filter(v => v > 0).length} contributions in last 24 weeks
                  </span>
                </h3>
                <div className="overflow-x-auto pb-1 max-w-full">
                  <div className="inline-flex gap-[3px]">
                    {/* Month labels */}
                    <div className="flex ml-[30px] mb-[2px]">
                      {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className={`text-[8px] ${textMuted} uppercase tracking-wider`}
                             style={{ marginRight: `${i < 5 ? 55 : 0}px` }}>
                          {["Jan", "Mar", "May", "Jul", "Sep", "Nov"][i]}
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      {/* Day labels */}
                      <div className={`flex flex-col gap-[3px] mr-[4px] pt-[1px] text-[8px] ${textMuted} uppercase tracking-wider`}>
                        {["Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                          <div key={i} className="h-[11px] flex items-center">{d}</div>
                        ))}
                      </div>
                      {/* Grid */}
                      <div className="flex gap-[3px]">
                        {heatmap[0].map((_, wi) => (
                          <div key={wi} className="flex flex-col gap-[3px]">
                            {heatmap.map((row, di) => {
                              const level = row[wi];
                              const count = level === 0 ? 0 : Math.floor(Math.random() * 8) + level * 2;
                              return (
                                <div
                                  key={di}
                                  className="group relative"
                                >
                                  <div
                                    className="w-[11px] h-[11px] transition-all duration-200 hover:scale-[1.8] hover:shadow-[0_0_6px_rgba(0,102,255,0.6)]"
                                    style={{
                                      backgroundColor: level === 0 ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)") :
                                                      level === 1 ? "#0e4429" :
                                                      level === 2 ? "#006d32" :
                                                      level === 3 ? "#26a641" : "#39d353",
                                    }}
                                  />
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10">
                                    <div className={`${isDark ? 'bg-[#1a1a1a] border-white/20' : 'bg-white border-gray-300'} border px-2 py-1 whitespace-nowrap shadow-lg`}>
                                      <p className={`text-[9px] ${textPrimary} font-semibold`} style={{ fontFamily: monoFont }}>{count} contributions</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3">
                  <span className={`text-[8px] ${textMuted}`}>Less</span>
                  {[0, 1, 2, 3, 4].map(l => (
                    <div key={l} className="w-[11px] h-[11px]" style={{
                      backgroundColor: l === 0 ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)") :
                                      l === 1 ? "#0e4429" :
                                      l === 2 ? "#006d32" :
                                      l === 3 ? "#26a641" : "#39d353",
                    }} />
                  ))}
                  <span className={`text-[8px] ${textMuted}`}>More</span>
                </div>
              </div>

              {/* Live Signal Feed */}
              <div className={`border ${cardBorder} p-5 ${cardBg}`}>
                <h3 className="text-[#0066FF] text-[10px] tracking-[0.25em] uppercase font-bold mb-4 flex items-center gap-2" style={{ fontFamily: monoFont }}>
                  <Radio size={12} /> Live Signal Feed
                  <span className="ml-auto flex items-center gap-1.5 text-[#00FF88]">
                    <span className="w-1 h-1 rounded-full bg-[#00FF88] animate-pulse" />
                    <span className="text-[8px] font-bold">LIVE</span>
                  </span>
                </h3>
                <div ref={signalRef} className={`h-48 overflow-y-auto space-y-1 scrollbar-thin ${isDark ? 'scrollbar-thumb-white/20' : 'scrollbar-thumb-gray-300'}`} style={{ fontFamily: monoFont }}>
                  {events.map((evt, i) => (
                    <div key={evt.id} className={`flex items-center gap-2 text-[10px] py-1 px-2 ${hoverBg} transition-all border-l-2 border-transparent hover:border-[#0066FF]/40`}>
                      <span className="text-[#0066FF] shrink-0">{eventIcon(evt.type)}</span>
                      <span className={`${textTertiary} shrink-0`}>{formatTimeAgo(evt.created_at)}</span>
                      <span className={textSecondary}>{eventLabel(evt.type)}</span>
                      <span className="text-[#0066FF] font-semibold truncate">{evt.repo.name}</span>
                      {evt.payload.ref && <span className={textMuted}>→ {evt.payload.ref}</span>}
                    </div>
                  ))}
                  {events.length === 0 && (
                    <p className={`${textMuted} text-[10px] text-center py-10`}>No recent events</p>
                  )}
                </div>
              </div>

              {/* Repo Grid */}
              <div className={`border ${cardBorder} p-5 ${cardBg}`}>
                <h3 className="text-[#0066FF] text-[10px] tracking-[0.25em] uppercase font-bold mb-4 flex items-center gap-2" style={{ fontFamily: monoFont }}>
                  <Package size={12} /> Repository Nodes
                </h3>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {repos.map((repo, i) => (
                    <a
                      key={repo.id}
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group block border ${isDark ? 'border-white/[0.12] bg-white/[0.03] hover:border-[#0066FF]/40 hover:bg-white/[0.06]' : 'border-gray-200 bg-gray-50 hover:border-[#0066FF]/40 hover:bg-gray-100'} p-4 transition-all relative overflow-hidden`}
                    >
                      <div className={`absolute top-2 right-2 text-[8px] ${textDim} font-bold`} style={{ fontFamily: monoFont }}>
                        MODULE_{String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Folder size={12} className="text-[#0066FF] shrink-0" />
                        <span className={`${textPrimary} text-xs font-bold truncate`} style={{ fontFamily: monoFont }}>{repo.name}</span>
                      </div>
                      <p className={`text-[10px] ${textTertiary} leading-relaxed mb-3 line-clamp-2`}>{repo.description || "No description"}</p>
                      <div className="flex items-center justify-between text-[9px]">
                        <div className="flex items-center gap-2">
                          {repo.language && (
                            <span className={`flex items-center gap-1 ${textTertiary}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
                              {repo.language}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5 text-yellow-400/80">
                            <Star size={9} /> {repo.stargazers_count}
                          </span>
                          <span className="flex items-center gap-0.5 text-cyan-400/80">
                            <GitFork size={9} /> {repo.forks_count}
                          </span>
                          <ArrowUpRight size={10} className="text-[#0066FF] opacity-0 group-hover:opacity-100 transition-all" />
                        </div>
                      </div>
                      <div className={`mt-2 pt-2 border-t ${innerBorder} flex items-center justify-between`}>
                        <span className={`text-[8px] ${textMuted}`} style={{ fontFamily: monoFont }}>{formatTimeAgo(repo.updated_at)}</span>
                        <ExternalLink size={8} className="text-[#0066FF]/60 group-hover:text-[#0066FF] transition-all" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width CTA */}
        <section className={`w-full border-t border-b ${isDark ? 'border-white/[0.1] bg-white/[0.02]' : 'border-gray-200 bg-gray-100'} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,102,255,0.08)_0%,_transparent_70%)]" />
          <div className="relative w-full px-6 md:px-12 lg:px-20 py-16 flex flex-col items-center text-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-[#0066FF]/20 blur-3xl rounded-full" />
              <Zap size={64} className="text-[#0066FF] relative animate-pulse" />
            </div>
            <h2 className={`text-3xl md:text-4xl font-black uppercase tracking-[0.05em] ${textPrimary} mb-3`} style={{ fontFamily: fontStyle }}>
              Network_Sync_Ready
            </h2>
            <p className={`${textSecondary} text-sm mb-6 max-w-lg`} style={{ fontFamily: monoFont }}>
              Full system architecture online. All modules synchronized. Ready for deployment and contribution.
            </p>
            <div className="flex gap-4">
              <button className="group px-8 py-3 bg-[#0066FF] text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#0052CC] transition-all shadow-[0_0_30px_rgba(0,102,255,0.3)] hover:shadow-[0_0_50px_rgba(0,102,255,0.5)] flex items-center gap-2"
                      onClick={() => window.open(`https://github.com/${GITHUB_USERNAME}`, "_blank")}>
                <Radio size={14} className="group-hover:animate-pulse" />
                Transmit
              </button>
              <button className={`px-8 py-3 border ${isDark ? 'border-white/30 text-white/70' : 'border-gray-400 text-gray-700'} text-xs font-bold tracking-[0.2em] uppercase hover:border-[#0066FF]/60 hover:text-[#0066FF] transition-all flex items-center gap-2`}
                      onClick={() => window.open(`https://github.com/${GITHUB_USERNAME}/followers`, "_blank")}>
                <Users size={14} />
                Network Graph
              </button>
            </div>
            <div className={`mt-8 flex items-center gap-4 text-[8px] ${textMuted} tracking-widest uppercase`} style={{ fontFamily: monoFont }}>
              <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#00FF88]" /> System Nominal</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#0066FF]" /> Sync Active</span>
              <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#FFD600]" /> Power Stable</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`w-full px-6 md:px-12 lg:px-20 py-6 border-t ${innerBorder}`}>
          <div className={`flex flex-wrap items-center justify-between gap-4 text-[9px] ${textMuted}`} style={{ fontFamily: monoFont }}>
            <span>© {new Date().getFullYear()} {user?.name || "Abir Hasan Siam"} · Build v1.0.4</span>
            <div className="flex items-center gap-4">
              <a href={`https://github.com/${GITHUB_USERNAME}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#0066FF] transition-all flex items-center gap-1">
                <Code2 size={10} /> GitHub
              </a>
              <a href={`https://github.com/${GITHUB_USERNAME}?tab=repositories`} target="_blank" rel="noopener noreferrer" className="hover:text-[#0066FF] transition-all flex items-center gap-1">
                <Package size={10} /> Repos
              </a>
              <span className="flex items-center gap-1">
                <Terminal size={10} /> API: {loading ? "SYNCING" : "READY"}
              </span>
            </div>
          </div>
        </footer>

    </div>
  );
}
