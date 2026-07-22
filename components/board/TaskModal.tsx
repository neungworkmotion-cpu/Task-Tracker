"use client";

import { useEffect, useState } from "react";
import type { Attachment, Module, Sprint, Task, TaskStatus, UserDoc } from "@/lib/types";
import { fmtDateRange, ROLE_LABELS, STATUS_LABELS, TASK_STATUSES } from "@/lib/types";
import {
  addComment,
  assignTask,
  deleteTask,
  moveTask,
  nextOrder,
  setTaskModule,
  setTaskSprint,
  updateTask,
  useComments,
} from "@/lib/data";
import CommentList from "@/components/comments/CommentList";
import CommentInput from "@/components/comments/CommentInput";
import ImageLightbox from "@/components/comments/ImageLightbox";
import AttachmentPicker from "./AttachmentPicker";

interface Props {
  task: Task;
  tasks: Task[];
  users: UserDoc[];
  sprints: Sprint[];
  modules?: Module[];
  me: UserDoc;
  onClose: () => void;
}

function AttachmentView({ items }: { items: Attachment[] }) {
  const [zoom, setZoom] = useState<string | null>(null);
  if (!items.length) return <p className="text-sm text-slate-400">— ไม่มีไฟล์แนบ —</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((a, i) =>
        a.type.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={a.data}
            alt={a.name}
            onClick={() => setZoom(a.data)}
            className="h-20 max-w-40 cursor-zoom-in rounded-lg border border-slate-200 dark:border-slate-700 object-cover"
          />
        ) : (
          <a
            key={i}
            href={a.data}
            download={a.name}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            📎 <span className="max-w-40 truncate">{a.name}</span>
          </a>
        ),
      )}
      {zoom && <ImageLightbox src={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}

export default function TaskModal({ task, tasks, users, sprints, modules = [], me, onClose }: Props) {
  // ผู้เรียกต้อง render ด้วย key={task.id} เพื่อ reset state ตอนสลับการ์ด
  const comments = useComments(task.id);
  const [mode, setMode] = useState<"view" | "edit">("view");
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

  const assignee = users.find((u) => u.uid === task.assigneeUid);
  const mod = modules.find((m) => m.id === task.moduleId);
  const sprint = sprints.find((s) => s.id === task.sprintId);
  const dateRange = fmtDateRange(task.startDate, task.endDate);
  const attachments = task.attachments ?? [];

  const seg = (m: "view" | "edit", label: string) => (
    <button
      onClick={() => setMode(m)}
      className={`rounded-md px-3 py-1 text-xs font-medium ${
        mode === m ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white" : "text-slate-500"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white dark:bg-slate-900 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 p-4">
          <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
            {seg("view", "👁 View")}
            {seg("edit", "✏️ Edit")}
          </div>
          <span className="ml-auto" />
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="ปิด">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {task.rejected && (
            <p className="rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-300">
              ❌ งานนี้ถูก reject {task.rejectedCount > 1 ? `มาแล้ว ${task.rejectedCount} ครั้ง ` : ""}— ดูเหตุผลในคอมเมนต์ด้านล่าง
            </p>
          )}

          {mode === "view" ? (
            <>
              <h2 className="text-lg font-semibold">{task.title}</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-slate-400">สถานะ</p>{STATUS_LABELS[task.status]}</div>
                <div><p className="text-xs text-slate-400">คนรับงาน</p>{assignee?.displayName ?? "—"}</div>
                <div><p className="text-xs text-slate-400">Module</p>{mod ? `🧩 ${mod.name}` : "📦 ทั่วไป"}</div>
                <div><p className="text-xs text-slate-400">สปรินต์</p>{sprint?.name ?? "—"}</div>
              </div>
              <div>
                <p className="text-xs text-slate-400">ช่วงวัน</p>
                <p className="text-sm">{dateRange || "—"}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-400">รายละเอียด</p>
                <p className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-sm">
                  {task.description || "— ไม่มีรายละเอียด —"}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-400">ไฟล์แนบ</p>
                <AttachmentView items={attachments} />
              </div>
            </>
          ) : (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg font-semibold text-slate-900 outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                      <option key={u.uid} value={u.uid}>{u.displayName} ({ROLE_LABELS[u.role] ?? u.role})</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-slate-500">
                  Module
                  <select
                    value={task.moduleId ?? ""}
                    onChange={(e) => setTaskModule(task.id, e.target.value || null)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                  >
                    <option value="">📦 ทั่วไป</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>🧩 {m.name}</option>
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
                <label className="text-xs text-slate-500">
                  วันเริ่ม
                  <input
                    type="date"
                    value={task.startDate ?? ""}
                    onChange={(e) => updateTask(task.id, { startDate: e.target.value || null })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                  />
                </label>
                <label className="text-xs text-slate-500">
                  วันสิ้นสุด
                  <input
                    type="date"
                    value={task.endDate ?? ""}
                    min={task.startDate ?? undefined}
                    onChange={(e) => updateTask(task.id, { endDate: e.target.value || null })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                  />
                </label>
              </div>

              <label className="block text-xs text-slate-500">
                รายละเอียด
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={saveDescription}
                  rows={4}
                  placeholder="อธิบายงาน…"
                  className="mt-1 w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </label>

              <div>
                <p className="mb-1 text-xs text-slate-500">ไฟล์แนบ (≤700KB ต่อไฟล์)</p>
                <AttachmentPicker
                  attachments={attachments}
                  onChange={(next) => updateTask(task.id, { attachments: next })}
                />
              </div>
            </>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold text-slate-500">
              คอมเมนต์ {comments?.length ? `(${comments.length})` : ""}
            </h3>
            <CommentList comments={comments} users={users} />
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 p-3">
          <CommentInput onSubmit={(text, images) => addComment(task, text, images, me)} />
          {mode === "edit" && (
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
          )}
        </div>
      </div>
    </div>
  );
}
