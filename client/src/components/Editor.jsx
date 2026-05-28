import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useEffect } from "react";
import {
  Bold, Italic, Underline as UL, Heading1, Heading2, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Highlighter, Image as ImgIcon,
} from "lucide-react";

const FONT_STYLES = {
  inter: '"Inter", ui-sans-serif, system-ui',
  georgia: 'Georgia, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace',
};

const Btn = ({ active, onClick, children, title }) => (
  <button type="button" onClick={onClick} title={title}
    className={`p-2 rounded-lg transition ${active ? "bg-violet-500 text-white" : "hover:bg-white/10 text-slate-300"}`}>
    {children}
  </button>
);

export default function Editor({ value, onChange, onUploadImage, fontFamily = "inter", onFontFamilyChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Start writing your thoughts..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Image.configure({ inline: false }),
      TextStyle, Color,
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || "", false);
    // eslint-disable-next-line
  }, [value]);

  if (!editor) return null;

  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff"];
  const editorFontStyle = { fontFamily: FONT_STYLES[fontFamily] || FONT_STYLES.inter };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex flex-wrap gap-1 p-2 border-b border-white/10 sticky top-0 bg-slate-900/60 backdrop-blur z-10">
        <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
        <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
        <Btn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UL className="w-4 h-4" /></Btn>
        <span className="w-px bg-white/10 mx-1" />
        <Btn title="H1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></Btn>
        <Btn title="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></Btn>
        <Btn title="Bulleted" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></Btn>
        <Btn title="Numbered" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Btn>
        <span className="w-px bg-white/10 mx-1" />
        <Btn title="Align left" onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="w-4 h-4" /></Btn>
        <Btn title="Align center" onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="w-4 h-4" /></Btn>
        <Btn title="Align right" onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="w-4 h-4" /></Btn>
        <span className="w-px bg-white/10 mx-1" />
        <Btn title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fde68a" }).run()}><Highlighter className="w-4 h-4" /></Btn>

        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange?.(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1 text-slate-200">
          <option value="">Font</option>
          <option value="inter">Inter</option>
          <option value="georgia">Georgia</option>
          <option value="mono">Mono</option>
        </select>

        <div className="flex items-center gap-1 px-1">
          {colors.map((c) => (
            <button key={c} onClick={() => editor.chain().focus().setColor(c).run()}
              style={{ background: c }} className="w-5 h-5 rounded-full border border-white/20" />
          ))}
        </div>

        <Btn title="Upload image" onClick={onUploadImage}><ImgIcon className="w-4 h-4" /></Btn>
      </div>
      <div style={editorFontStyle}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
