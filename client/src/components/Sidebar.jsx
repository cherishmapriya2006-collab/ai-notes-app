import { motion } from "framer-motion";
import { Sparkles, NotebookPen, Star, Pin, Archive, Trash2, LogOut, Tag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

const items = [
  { id: "all", label: "All Notes", icon: NotebookPen },
  { id: "pinned", label: "Pinned", icon: Pin },
  { id: "favorite", label: "Favorites", icon: Star },
  { id: "archived", label: "Archived", icon: Archive },
  { id: "trashed", label: "Trash", icon: Trash2 },
];

export default function Sidebar({ filter, setFilter, tags, activeTag, setActiveTag }) {
  const { user, logout } = useAuth();
  const [font, setFont] = useState(() => (typeof window !== "undefined" && localStorage.getItem("font")) || "inter");

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.remove("font-inter", "font-georgia", "font-mono");
    document.documentElement.classList.add(`font-${font}`);
    try { localStorage.setItem("font", font); } catch (e) {}
  }, [font]);
  return (
    <aside className="hidden md:flex flex-col w-64 p-4 glass rounded-3xl m-3 sticky top-3 h-[calc(100vh-1.5rem)]">
      <div className="flex items-center gap-2 mb-6 px-1">
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="font-bold text-lg">Glow Pad</span>
      </div>

      <nav className="space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = filter === it.id;
          return (
            <button key={it.id} onClick={() => setFilter(it.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                active ? "bg-gradient-to-r from-violet-500/30 to-indigo-500/30 text-white"
                       : "text-slate-300 hover:bg-white/5"}`}>
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{it.label}</span>
            </button>
          );
        })}
      </nav>

      {tags.length > 0 && (
        <>
          <div className="text-xs uppercase text-slate-500 mt-6 mb-2 px-1">Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}
                className={`text-xs px-2 py-1 rounded-full border transition ${
                  activeTag === t
                    ? "bg-violet-500 border-violet-400 text-white"
                    : "border-white/10 text-slate-300 hover:bg-white/5"}`}>
                <Tag className="w-3 h-3 inline mr-1" />{t}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-auto">
        <div className="mb-3 px-1">
          <label className="text-xs text-slate-400 block mb-1">Font</label>
          <select value={font} onChange={(e) => setFont(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1 text-slate-200">
            <option value="inter">Inter</option>
            <option value="georgia">Georgia</option>
            <option value="mono">Mono</option>
          </select>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} className="glass rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 grid place-items-center font-semibold">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user?.name}</div>
            <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          </div>
          <button onClick={logout} className="btn-ghost p-2" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </aside>
  );
}
