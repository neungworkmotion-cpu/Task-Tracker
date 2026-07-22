"use client";

import { Draggable } from "@hello-pangea/dnd";
import { fmtDateRange, type Sprint, type Task, type UserDoc } from "@/lib/types";
import Avatar from "@/components/Avatar";

interface Props {
  task: Task;
  index: number;
  users: UserDoc[];
  sprints: Sprint[];
  onOpen: (task: Task) => void;
  onApprove?: (task: Task) => void;
  onReject?: (task: Task) => void;
}

export default function TaskCard({ task, index, users, sprints, onOpen, onApprove, onReject }: Props) {
  const assignee = users.find((u) => u.uid === task.assigneeUid);
  const sprint = sprints.find((s) => s.id === task.sprintId);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpen(task)}
          className={`cursor-pointer rounded-xl border bg-white dark:bg-slate-900 p-3 shadow-sm transition hover:shadow-md ${
            snapshot.isDragging ? "rotate-1 shadow-lg ring-2 ring-indigo-300" : "border-slate-200 dark:border-slate-700"
          }`}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {task.rejected && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-300">
                ❌ rejected{task.rejectedCount > 1 ? ` ×${task.rejectedCount}` : ""}
              </span>
            )}
            {sprint && (
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-medium text-indigo-600">
                🏃 {sprint.name}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium leading-snug">{task.title}</p>
          {fmtDateRange(task.startDate, task.endDate) && (
            <p className="mt-1 text-[11px] text-slate-400">📅 {fmtDateRange(task.startDate, task.endDate)}</p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {task.commentCount > 0 && <>💬 {task.commentCount}</>}
              {task.attachments && task.attachments.length > 0 && <> 📎 {task.attachments.length}</>}
            </span>
            <Avatar user={assignee} size="sm" />
          </div>
          {task.status === "test" && onApprove && onReject && (
            <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onApprove(task)}
                className="flex-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => onReject(task)}
                className="flex-1 rounded-lg bg-red-50 dark:bg-red-950/40 py-1 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100"
              >
                ❌ Reject
              </button>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
