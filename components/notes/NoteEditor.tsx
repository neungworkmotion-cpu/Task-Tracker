"use client";

import { useEffect, useRef } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extensions";
import { compressImage } from "@/lib/image";

const PROSE =
  "prose prose-slate dark:prose-invert max-w-none focus:outline-none prose-img:rounded-lg prose-pre:bg-slate-900";

async function insertImages(editor: Editor, files: File[]) {
  for (const file of files) {
    const src = await compressImage(file);
    editor.chain().focus().setImage({ src, alt: file.name }).run();
  }
}

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
}

export default function NoteEditor({
  content,
  editable,
  onChange,
}: {
  content: string;
  editable: boolean;
  onChange?: (html: string, text: string) => void;
}) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    content,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Image.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: "เริ่มเขียนได้เลย…" }),
    ],
    editorProps: {
      attributes: { class: `${PROSE} min-h-[50vh]` },
      handlePaste: (_view, event) => {
        const files = imageFiles(event.clipboardData?.files);
        if (!files.length || !editor) return false;
        insertImages(editor, files);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = imageFiles((event as DragEvent).dataTransfer?.files);
        if (!files.length || !editor) return false;
        insertImages(editor, files);
        return true;
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current?.(editor.getHTML(), editor.getText()),
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    if (!editor || editable || editor.getHTML() === content) return;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [editor, editable, content]);

  if (!editor) return <div className="min-h-[50vh]" />;

  return (
    <div>
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor }) => ({
      h1: editor.isActive("heading", { level: 1 }),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      code: editor.isActive("code"),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      quote: editor.isActive("blockquote"),
      codeBlock: editor.isActive("codeBlock"),
      link: editor.isActive("link"),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  });

  function pickImages() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = () => insertImages(editor, imageFiles(input.files));
    input.click();
  }

  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("ใส่ลิงก์ (เว้นว่างเพื่อเอาลิงก์ออก)", prev ?? "https://");
    if (url === null) return;
    const chain = editor.chain().focus().extendMarkRange("link");
    if (url.trim() === "") chain.unsetLink().run();
    else chain.setLink({ href: url.trim() }).run();
  }

  const groups: { label: string; title: string; active?: boolean; disabled?: boolean; run: () => void; className?: string }[][] = [
    [
      { label: "H1", title: "หัวข้อใหญ่", active: s.h1, run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
      { label: "H2", title: "หัวข้อ", active: s.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
      { label: "H3", title: "หัวข้อย่อย", active: s.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    ],
    [
      { label: "B", title: "ตัวหนา (⌘B)", active: s.bold, className: "font-bold", run: () => editor.chain().focus().toggleBold().run() },
      { label: "I", title: "ตัวเอียง (⌘I)", active: s.italic, className: "italic", run: () => editor.chain().focus().toggleItalic().run() },
      { label: "U", title: "ขีดเส้นใต้ (⌘U)", active: s.underline, className: "underline", run: () => editor.chain().focus().toggleUnderline().run() },
      { label: "S", title: "ขีดฆ่า", active: s.strike, className: "line-through", run: () => editor.chain().focus().toggleStrike().run() },
      { label: "</>", title: "โค้ดในบรรทัด", active: s.code, className: "font-mono", run: () => editor.chain().focus().toggleCode().run() },
      { label: "🔗", title: "ลิงก์", active: s.link, run: setLink },
    ],
    [
      { label: "• รายการ", title: "รายการแบบจุด", active: s.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
      { label: "1. รายการ", title: "รายการแบบตัวเลข", active: s.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
      { label: "❝", title: "ข้อความอ้างอิง", active: s.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
      { label: "{ }", title: "บล็อกโค้ด", active: s.codeBlock, className: "font-mono", run: () => editor.chain().focus().toggleCodeBlock().run() },
      { label: "―", title: "เส้นคั่น", run: () => editor.chain().focus().setHorizontalRule().run() },
      { label: "🖼️", title: "แทรกรูป (หรือวาง/ลากรูปลงมาได้เลย)", run: pickImages },
    ],
    [
      { label: "↶", title: "ย้อนกลับ (⌘Z)", disabled: !s.canUndo, run: () => editor.chain().focus().undo().run() },
      { label: "↷", title: "ทำซ้ำ (⇧⌘Z)", disabled: !s.canRedo, run: () => editor.chain().focus().redo().run() },
    ],
  ];

  return (
    <div className="sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white/95 py-2 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      {groups.map((group, i) => (
        <div key={i} className="flex items-center gap-0.5 border-slate-200 pr-1 [&:not(:last-child)]:border-r dark:border-slate-700">
          {group.map((b) => (
            <button
              key={b.title}
              type="button"
              title={b.title}
              disabled={b.disabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={b.run}
              className={`min-w-8 rounded-md px-2 py-1 text-sm disabled:opacity-30 ${b.className ?? ""} ${
                b.active
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
