import { useEffect, useState } from "react";
import { User, Shield, FileText, Folder, Activity, Sun, Moon, Terminal, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";

interface ProfileProps {
  filesCount: number;
  foldersCount: number;
  logsCount: number;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export default function Profile({
  filesCount,
  foldersCount,
  logsCount,
  theme,
  onToggleTheme,
}: ProfileProps) {
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; avatar: string | null } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserInfo({
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
          email: user.email || "",
          avatar: user.user_metadata?.avatar_url || null,
        });
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <div className="max-w-lg mx-auto w-full space-y-6">
        <div className="border border-emerald-500/20 bg-black/40">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-emerald-500/10">
            <Terminal size={12} className="text-emerald-500" />
            <span className="text-[9px] text-emerald-600 uppercase tracking-wider">profile::identity</span>
            <span className="ml-auto text-[9px] text-emerald-800">{new Date().toISOString().slice(0, 10)}</span>
          </div>

          <div className="p-5 space-y-5">
            {/* Avatar / Identity */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 border-2 border-emerald-500/30 bg-black/50 flex items-center justify-center overflow-hidden">
                {userInfo?.avatar ? (
                  <img src={userInfo.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={28} className="text-emerald-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-emerald-500" />
                  <span className="text-emerald-300 text-sm font-bold uppercase tracking-wider">
                    {userInfo?.name || "Loading..."}
                  </span>
                </div>
                {userInfo?.email && (
                  <div className="flex items-center gap-1.5 mt-1 text-emerald-600">
                    <Mail size={10} />
                    <span className="text-[10px]">{userInfo.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1 text-emerald-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] uppercase tracking-wider">VAULT INFRA: ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-emerald-500/20 bg-black/30 p-3 text-center">
                <FileText size={16} className="text-emerald-500 mx-auto mb-1" />
                <span className="text-emerald-300 text-sm font-bold block">{filesCount}</span>
                <span className="text-[9px] text-emerald-600 uppercase">Workspaces</span>
              </div>
              <div className="border border-emerald-500/20 bg-black/30 p-3 text-center">
                <Folder size={16} className="text-emerald-500 mx-auto mb-1" />
                <span className="text-emerald-300 text-sm font-bold block">{foldersCount}</span>
                <span className="text-[9px] text-emerald-600 uppercase">Folders</span>
              </div>
              <div className="border border-emerald-500/20 bg-black/30 p-3 text-center">
                <Activity size={16} className="text-emerald-500 mx-auto mb-1" />
                <span className="text-emerald-300 text-sm font-bold block">{logsCount}</span>
                <span className="text-[9px] text-emerald-600 uppercase">Log Entries</span>
              </div>
            </div>

            {/* Account Info */}
            <div className="border border-emerald-500/20 bg-black/30 p-3 space-y-2">
              <div className="text-[9px] text-emerald-600 uppercase tracking-wider font-bold">Account</div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-emerald-600">Identity</span>
                <span className="text-emerald-300">{userInfo?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-emerald-600">Email</span>
                <span className="text-emerald-300">{userInfo?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-emerald-600">Storage</span>
                <span className="text-emerald-300">Supabase Cloud</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-emerald-600">Version</span>
                <span className="text-emerald-300">v2.4.0</span>
              </div>
            </div>

            {/* Actions */}
            <div>
              <button
                onClick={onToggleTheme}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 hover:border-emerald-500/60 transition-all"
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                Switch to {theme === "dark" ? "Light" : "Dark"} Theme
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[8px] text-emerald-800/50">
          Profile synced with Supabase. Data stored securely in the cloud.
        </p>
      </div>
    </div>
  );
}
