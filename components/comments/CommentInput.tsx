"use client";

import { useState } from "react";
import { compressImage, dataUrlBytes, imagesFromPaste, MAX_COMMENT_IMAGE_BYTES } from "@/lib/image";

interface Props {
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  requireText?: boolean;
  onSubmit: (text: string, images: string[]) => Promise<void>;
}

export default function CommentInput({
  placeholder = "พิมพ์คอมเมนต์… (วางรูปจากคลิปบอร์ดได้เลย)",
  submitLabel = "ส่ง",
  autoFocus,
  requireText,
  onSubmit,
}: Props) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function addImages(next: string[]) {
    if (!next.length) return;
    const all = [...images, ...next];
    const total = all.reduce((s, img) => s + dataUrlBytes(img), 0);
    if (total > MAX_COMMENT_IMAGE_BYTES) {
      setError("รูปรวมกันใหญ่เกินไป (จำกัด ~700KB ต่อคอมเมนต์) ลองแยกส่งหลายคอมเมนต์");
      return;
    }
    setError("");
    setImages(all);
  }

  async function handlePaste(e: React.ClipboardEvent) {
    const imgs = await imagesFromPaste(e.nativeEvent);
    addImages(imgs);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    addImages(await Promise.all(files.map(compressImage)));
  }

  async function submit() {
    const trimmed = text.trim();
    if (busy) return;
    if (!trimmed && (requireText || !images.length)) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit(trimmed, images);
      setText("");
      setImages([]);
    } catch {
      setError("ส่งไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2">
      {images.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((img, i) => (
            <span key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`แนบ ${i + 1}`} className="h-16 w-16 rounded-lg border border-slate-200 dark:border-slate-700 object-cover" />
              <button
                onClick={() => setImages(images.filter((_, j) => j !== i))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] text-white"
                aria-label="ลบรูป"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
      <textarea
        value={text}
        autoFocus={autoFocus}
        onChange={(e) => setText(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-none px-1 text-sm outline-none"
      />
      {error && <p className="px-1 pb-1 text-xs text-red-600">{error}</p>}
      <div className="flex items-center justify-between">
        <label className="cursor-pointer rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          🖼️ แนบรูป
          <input type="file" accept="image/*" multiple hidden onChange={handleFile} />
        </label>
        <button
          onClick={submit}
          disabled={busy || (!text.trim() && (requireText || !images.length))}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {busy ? "กำลังส่ง…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
