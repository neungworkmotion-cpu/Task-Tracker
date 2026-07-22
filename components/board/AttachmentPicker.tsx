"use client";

import { useState } from "react";
import type { Attachment } from "@/lib/types";
import {
  compressImage,
  dataUrlBytes,
  fileToDataUrl,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/image";

function fileIcon(type: string): string {
  if (type.startsWith("image/")) return "🖼️";
  if (type.includes("pdf")) return "📕";
  if (type.includes("zip") || type.includes("compressed")) return "🗜️";
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv")) return "📊";
  if (type.includes("word") || type.includes("document")) return "📄";
  return "📎";
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AttachmentPicker({
  attachments,
  onChange,
}: {
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setError("");
    const next = [...attachments];
    for (const file of files) {
      try {
        // รูป → บีบด้วย canvas, อื่นๆ → base64 ตรง
        const data = file.type.startsWith("image/")
          ? await compressImage(file)
          : await fileToDataUrl(file);
        const size = dataUrlBytes(data);
        if (size > MAX_ATTACHMENT_BYTES) {
          setError(`"${file.name}" ใหญ่เกิน (${humanSize(size)}) — จำกัด 700KB ต่อไฟล์`);
          continue;
        }
        next.push({ name: file.name, type: file.type || "application/octet-stream", data, size });
      } catch {
        setError(`อ่านไฟล์ "${file.name}" ไม่สำเร็จ`);
      }
    }
    onChange(next);
    setBusy(false);
  }

  return (
    <div>
      {attachments.length > 0 && (
        <ul className="mb-2 space-y-1">
          {attachments.map((a, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs"
            >
              <span>{fileIcon(a.type)}</span>
              <span className="min-w-0 flex-1 truncate">{a.name}</span>
              <span className="shrink-0 text-slate-400">{humanSize(a.size)}</span>
              <button
                type="button"
                onClick={() => onChange(attachments.filter((_, j) => j !== i))}
                className="shrink-0 text-slate-400 hover:text-red-600"
                aria-label="ลบไฟล์"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
        📎 {busy ? "กำลังแนบ…" : "แนบไฟล์"}
        <input type="file" multiple hidden onChange={handleFiles} disabled={busy} />
      </label>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
