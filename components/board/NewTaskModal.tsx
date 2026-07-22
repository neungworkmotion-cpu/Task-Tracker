"use client";

import { useState } from "react";
import type { Attachment } from "@/lib/types";
import AttachmentPicker from "./AttachmentPicker";

interface Props {
  onCreate: (data: {
    title: string;
    startDate: string | null;
    endDate: string | null;
    attachments: Attachment[];
  }) => Promise<void>;
  onClose: () => void;
}

export default function NewTaskModal({ onCreate, onClose }: Props) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await onCreate({
        title: title.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        attachments,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-white dark:bg-slate-900 p-4 shadow-xl sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">การ์ดใหม่ (Todo)</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="ปิด">✕</button>
        </div>

        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="ชื่องาน…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />

        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="text-xs text-slate-500">
            วันเริ่ม
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900" />
          </label>
          <label className="text-xs text-slate-500">
            วันสิ้นสุด
            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900" />
          </label>
        </div>

        <div className="mt-3">
          <p className="mb-1 text-xs text-slate-500">ไฟล์แนบ (≤700KB ต่อไฟล์)</p>
          <AttachmentPicker attachments={attachments} onChange={setAttachments} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={!title.trim() || busy}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {busy ? "กำลังสร้าง…" : "+ สร้างการ์ด"}
          </button>
        </div>
      </form>
    </div>
  );
}
