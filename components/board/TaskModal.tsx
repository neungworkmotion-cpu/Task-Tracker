"use client";

import { useEffect, useState } from "react";
import type { Sprint, Task, TaskStatus, UserDoc } from "@/lib/types";
import { STATUS_LABELS, TASK_STATUSES } from "@/lib/types";
import {
  addComment,
  assignTask,
  deleteTask,
  moveTask,
  nextOrder,
  setTaskSprint,
  updateTask,
  useComments,
} from "@/lib/data";
import CommentList from "@/components/comments/CommentList";
import CommentInput from "@/components/comments/CommentInput";

interface Props {
  task: Task;
  tasks: Task[];
  users: UserDoc[];
  sprints: Sprint[];
  me: UserDoc;
  onClose: () => void;
}

export default function TaskModal({ task, tasks, users, sprints, me, onClose }: Props) {
  // ผู้เรียกต้อง render ด้วย key={task.id} เพื่อ reset state ตอนสลับการ์ด
  const comments = useComments(task.id);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function saveTitle() {
    const t = title.trim();
    if (t && t !== task.title) updateTask(task.id, { title: t });
  }
  function saveDescription() {
    if (description !== task.description) updateTask(task.id, { description });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start gap-2 border-b border-slate-100 p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            className="min-w-0 flex-1 rounded-lg px-2 py-1 text-lg font-semibold outline-none hover:bg-slate-50 focus:bg-slate-50"
          />
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="ปิด">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {task.rejected && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              ❌ งานนี้ถูก reject {task.rejectedCount > 1 ? `มาแล้ว ${task.rejectedCount} ครั้ง ` : ""}— ดูเหตุผลในคอมเมนต์ด้านล่าง
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="text-xs text-slate-500">
              สถานะ
              <select
                value={task.status}
                onChange={(e) =>
                  moveTask(task, e.target.value as TaskStatus, nextOrder(tasks, e.target.value as TaskStatus), me, users)
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              คนรับงาน
              <select
                value={task.assigneeUid ?? ""}
                onChange={(e) => assignTask(task, e.target.value || null, me)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
              >
                <option value="">— ยังไม่มี —</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>{u.displayName} ({u.role})</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              สปรินต์
              <select
                value={task.sprintId ?? ""}
                onChange={(e) => setTaskSprint(task.id, e.target.value || null)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
              >
                <option value="">— Backlog —</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.startDate} → {s.endDate})</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs text-slate-500">
            รายละเอียด
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              rows={3}
              placeholder="อธิบายงาน…"
              className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
          </label>

          <div>
            <h3 className="mb-2 text-xs font-semibold text-slate-500">
              คอมเมนต์ {comments?.length ? `(${comments.length})` : ""}
            </h3>
            <CommentList comments={comments} users={users} />
          </div>
        </div>

        <div className="border-t border-slate-100 p-3">
          <CommentInput onSubmit={(text, images) => addComment(task, text, images, me)} />
          <button
            onClick={() => {
              if (confirm(`ลบการ์ด "${task.title}"?`)) {
                deleteTask(task.id);
                onClose();
              }
            }}
            className="mt-2 text-xs text-red-500 hover:underline"
          >
            🗑️ ลบการ์ดนี้
          </button>
        </div>
      </div>
    </div>
  );
}
