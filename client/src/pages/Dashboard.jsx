import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, Sparkles, X, Wand2, Tags, Type } from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/api";
import Sidebar from "../components/Sidebar";
import NoteCard from "../components/NoteCard";
import Editor from "../components/Editor";

const COLORS = ["default", "pink", "blue", "purple", "yellow", "green"];

export default function Dashboard() {
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [activeTag, setActiveTag] = useState(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null); // current editing note
  const fileInput = useRef(null);
  const saveTimer = useRef(null);

  const load = async () => {
    try { const { data } = await api.get("/notes"); setNotes(data); }
    catch { toast.error("Failed to load notes"); }
  };
  useEffect(() => { load(); }, []);

  const tags = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => n.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  const filtered = useMemo(() => {
    const list = notes.filter((n) => {
      if (filter === "trashed") { if (!n.trashed) return false; }
      else if (n.trashed) return false;

      // Archived notes should only be visible when the `archived` filter is active.
      if (filter === "archived") {
        if (!n.archived) return false;
      } else {
        if (n.archived) return false;
      }
      if (filter === "pinned" && !n.pinned) return false;
      if (filter === "favorite" && !n.favorite) return false;
      if (activeTag && !n.tags?.includes(activeTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q))) return false;
      }
      return true;
    });

    // Ensure pinned notes always render before unpinned notes.
    // Among pinned/unpinned groups, show most recently-updated first so newly pinned notes appear at top.
    list.sort((a, b) => {
      if (a.pinned === b.pinned) {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      return a.pinned ? -1 : 1;
    });

    return list;
  }, [notes, filter, activeTag, search]);

  const create = async () => {
    try {
      const { data } = await api.post("/notes", { title: "Untitled", content: "" });
      // Append new notes so a pinned note can return to its original slot on unpin.
      setNotes((prev) => [...prev, data]);
      setOpen(data);
    } catch { toast.error("Could not create note"); }
  };

  // low-level API update that replaces note with server response
  const apiUpdate = async (id, patch, silent = false) => {
    try {
      const { data } = await api.put(`/notes/${id}`, patch);
      // preserve client-side ordering; update fields from server
      setNotes((prev) => prev.map((n) => (n._id === id ? { ...n, ...data } : n)));
      if (open?._id === id) setOpen((o) => ({ ...o, ...data }));
      if (!silent) toast.success("Updated");
    } catch { toast.error("Update failed"); }
  };

  // public update wrapper: handle pin toggles locally so unpin restores original place
  const update = async (id, patch, silent = false) => {
    // handle pin toggle specially to keep original position
    if (Object.prototype.hasOwnProperty.call(patch, "pinned")) {
      setNotes((prev) => {
        const idx = prev.findIndex((n) => n._id === id);
        if (idx === -1) return prev;
        const note = prev[idx];
        const newPinned = Boolean(patch.pinned);
        if (note.pinned === newPinned) return prev;

        // make a shallow copy
        const next = prev.slice();

        if (newPinned) {
          // pin: remember original index and move to top
          const updated = { ...note, pinned: true, _originalIndex: idx, updatedAt: new Date().toISOString() };
          next.splice(idx, 1);
          next.unshift(updated);
          // persist
          apiUpdate(id, patch, silent);
          return next;
        }

        // unpin: restore to original index if known, otherwise just keep order among unpinned
        const updated = { ...note, pinned: false };
        next.splice(idx, 1);
        const original = note._originalIndex;
        let insertAt = typeof original === "number" ? Math.min(original, next.length) : next.length;
        // ensure we insert after any still-pinned notes
        const firstUnpinned = next.findIndex((n) => !n.pinned);
        if (firstUnpinned !== -1) insertAt = Math.max(insertAt, firstUnpinned);
        updated._originalIndex = undefined;
        next.splice(insertAt, 0, updated);
        // persist
        apiUpdate(id, patch, silent);
        return next;
      });
      return;
    }

    // default: delegate to API update
    await apiUpdate(id, patch, silent);
  };

  const remove = async (id) => {
    try {
      await api.delete(`/notes/${id}${filter === "trashed" ? "?permanent=true" : ""}`);
      if (filter === "trashed") setNotes((p) => p.filter((n) => n._id !== id));
      else setNotes((p) => p.map((n) => (n._id === id ? { ...n, trashed: true } : n)));
      if (open?._id === id) setOpen(null);
    } catch { toast.error("Delete failed"); }
  };

  // autosave
  const queueSave = (patch) => {
    if (!open) return;
    setOpen({ ...open, ...patch });
    setNotes((prev) => prev.map((n) => (n._id === open._id ? { ...n, ...patch } : n)));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => update(open._id, patch, true), 700);
  };

  const handleUploadClick = () => fileInput.current?.click();
  const handleFiles = async (files) => {
    if (!files?.length || !open) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("images", f));
    try {
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const newImages = [...(open.images || []), ...data.urls];
      const html = (open.content || "") + data.urls.map((u) => `<p><img src="${u}" /></p>`).join("");
      queueSave({ images: newImages, content: html });
      toast.success(`${data.urls.length} image(s) uploaded`);
    } catch { toast.error("Upload failed"); }
  };

  const aiAction = async (kind) => {
    if (!open) return;
    try {
      const { data } = await api.post(`/ai/${kind}`, { content: open.content });
      if (kind === "title") queueSave({ title: data.title });
      if (kind === "summarize") queueSave({ content: `<blockquote>✨ ${data.summary}</blockquote>` + (open.content || "") });
      if (kind === "keywords") queueSave({ tags: Array.from(new Set([...(open.tags || []), ...data.keywords])) });
      toast.success("AI done");
    } catch { toast.error("AI failed"); }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        filter={filter} setFilter={setFilter}
        tags={tags} activeTag={activeTag} setActiveTag={setActiveTag}
      />

      <main className="flex-1 p-3 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input className="input pl-10" placeholder="Search notes..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={create}><Plus className="w-4 h-4" /> New note</button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <Sparkles className="w-10 h-10 mx-auto text-violet-400 mb-3" />
            <p className="text-slate-400">No notes here yet. Click "New note" to start.</p>
          </div>
        ) : (
          <motion.div layout className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {filtered.map((n) => (
                <NoteCard key={n._id} note={n} onOpen={setOpen} onUpdate={update} onDelete={remove} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Editor drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-end"
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28 }}
              className="w-full md:w-[640px] h-full bg-slate-900 border-l border-white/10 overflow-y-auto p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <input
                  value={open.title}
                  onChange={(e) => queueSave({ title: e.target.value })}
                  className="bg-transparent text-2xl font-bold flex-1 outline-none"
                  placeholder="Note title"
                />
                <button className="btn-ghost" onClick={() => setOpen(null)}><X className="w-5 h-5" /></button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs text-slate-400 mr-1">Color:</span>
                {COLORS.map((c) => (
                  <button key={c} onClick={() => queueSave({ color: c })}
                    title={c}
                    className={`w-6 h-6 rounded-full border-2 ${open.color === c ? "border-violet-400" : "border-white/10"}`}
                    style={{ background: c === "default" ? "#1e293b" : `var(--tw-${c})` }}>
                    <span className={`block w-full h-full rounded-full note-${c}`} />
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <button className="btn-ghost text-xs" onClick={() => aiAction("title")}><Type className="w-3.5 h-3.5" /> AI Title</button>
                <button className="btn-ghost text-xs" onClick={() => aiAction("summarize")}><Wand2 className="w-3.5 h-3.5" /> Summarize</button>
                <button className="btn-ghost text-xs" onClick={() => aiAction("keywords")}><Tags className="w-3.5 h-3.5" /> Keywords</button>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              >
                <Editor
                  value={open.content}
                  onChange={(html) => queueSave({ content: html })}
                  onUploadImage={handleUploadClick}
                  fontFamily={open.fontFamily || "inter"}
                  onFontFamilyChange={(fontFamily) => queueSave({ fontFamily })}
                />
                <input ref={fileInput} type="file" accept="image/*" multiple hidden
                  onChange={(e) => handleFiles(e.target.files)} />
                <p className="text-xs text-slate-500 mt-2">Tip: drag & drop images directly into the editor.</p>
              </div>

              <div className="mt-3">
                <input
                  className="input"
                  placeholder="Add tags (comma separated)"
                  defaultValue={open.tags?.join(", ") || ""}
                  onBlur={(e) => {
                    const tags = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                    queueSave({ tags });
                  }}
                />
              </div>

              <div className="text-xs text-slate-500 mt-4">
                Last edited {new Date(open.updatedAt).toLocaleString()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
