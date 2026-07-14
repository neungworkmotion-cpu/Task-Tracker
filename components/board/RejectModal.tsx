"use client";

import type { Task } from "@/lib/types";
import CommentInput from "@/components/comments/CommentInput";

interface Props {
  task: Task;
  onConfirm: (reason: string, images: string[]) => Promise<void>;
  onClose: () => void;
}

export default function RejectModal({ task, onConfirm, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <h2 className="font-semibold">❌ Reject: {task.title}</h2>
        <p className="mt-1 text-xs text-slate-500">
          บอกเหตุผลว่าทำไมไม่ผ่าน (วางรูปแคปจอได้) — การ์ดจะเด้งกลับไป Todo และแจ้งเตือนคนทำ
        </p>
        <div className="mt-3">
          <CommentInput
            autoFocus
            requireText
            placeholder="เหตุผลที่ reject… (บังคับ)"
            submitLabel="ยืนยัน Reject"
            onSubmit={async (text, images) => {
              await onConfirm(text, images);
              onClose();
            }}
          />
        </div>
        <button onClick={onClose} className="mt-2 w-full rounded-lg py-1.5 text-xs text-slate-400 hover:bg-slate-50">
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
