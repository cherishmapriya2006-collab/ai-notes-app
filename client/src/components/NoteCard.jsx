import { motion } from "framer-motion";
import { Pin, Star, Archive, Trash2, RotateCcw } from "lucide-react";

const stripHtml = (s = "") => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const FONT_STYLES = {
  inter: '"Inter", ui-sans-serif, system-ui',
  georgia: 'Georgia, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
};

export default function NoteCard({ note, onOpen, onUpdate, onDelete }) {
  const colorClass = `note-${note.color || "default"}`;
  const dark = note.color === "default" || !note.color;
  const previewFontStyle = { fontFamily: FONT_STYLES[note.fontFamily || "inter"] || FONT_STYLES.inter };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={`${colorClass} rounded-2xl p-4 cursor-pointer shadow-lg border ${
        dark ? "border-white/10" : "border-black/5"
      } group`}
      onClick={() => onOpen(note)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={`font-semibold line-clamp-1 ${dark ? "" : "text-slate-900"}`}>
          {note.title || "Untitled"}
        </h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onUpdate(note._id, { pinned: !note.pinned })}
            className="p-1 rounded hover:bg-black/10" title="Pin">
            <Pin className={`w-4 h-4 ${note.pinned ? "fill-current" : ""}`} />
          </button>
          <button onClick={() => onUpdate(note._id, { favorite: !note.favorite })}
            className="p-1 rounded hover:bg-black/10" title="Favorite">
            <Star className={`w-4 h-4 ${note.favorite ? "fill-current text-yellow-500" : ""}`} />
          </button>
          {!note.trashed ? (
            <>
              <button onClick={() => onUpdate(note._id, { archived: !note.archived })}
                className="p-1 rounded hover:bg-black/10" title="Archive">
                <Archive className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(note._id)} className="p-1 rounded hover:bg-black/10" title="Trash">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => onUpdate(note._id, { trashed: false })}
                className="p-1 rounded hover:bg-black/10" title="Restore">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(note._id)}
                className="p-1 rounded hover:bg-black/10 text-red-400" title="Delete forever">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
      <p
        className={`text-sm mt-2 line-clamp-4 ${dark ? "text-slate-300" : "text-slate-700"}`}
        style={previewFontStyle}
      >
        {stripHtml(note.content) || "Empty note"}
      </p>
      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {note.tags.slice(0, 3).map((t) => (
            <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full ${
              dark ? "bg-white/10 text-slate-300" : "bg-black/10 text-slate-700"}`}>#{t}</span>
          ))}
        </div>
      )}
      <div className={`text-[11px] mt-3 ${dark ? "text-slate-500" : "text-slate-600"}`}>
        {new Date(note.updatedAt).toLocaleString()}
      </div>
    </motion.div>
  );
}
