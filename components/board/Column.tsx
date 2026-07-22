"use client";

import { Droppable } from "@hello-pangea/dnd";
import type { Sprint, Task, TaskStatus, UserDoc } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import TaskCard from "./TaskCard";

const HEADER_COLORS: Record<TaskStatus, string> = {
  todo: "bg-slate-200 text-slate-700",
  doing: "bg-sky-100 text-sky-700",
  test: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700 dark:text-emerald-300",
  deploy: "bg-purple-100 text-purple-700",
};

interface Props {
  status: TaskStatus;
  tasks: Task[];
  users: UserDoc[];
  sprints: Sprint[];
  onOpen: (task: Task) => void;
  onApprove: (task: Task) => void;
  onReject: (task: Task) => void;
  onRequestAdd: () => void;
}

export default function Column({ status, tasks, users, sprints, onOpen, onApprove, onReject, onRequestAdd }: Props) {
  return (
    <div className="flex h-full min-h-0 w-72 shrink-0 snap-start flex-col rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-2 max-md:w-[85vw]">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${HEADER_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-slate-400">{tasks.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto rounded-xl p-1 transition ${
              snapshot.isDraggingOver ? "bg-indigo-50 dark:bg-indigo-950" : ""
            }`}
          >
            {tasks.map((t, i) => (
              <TaskCard
                key={t.id}
                task={t}
                index={i}
                users={users}
                sprints={sprints}
                onOpen={onOpen}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      {/* สร้างการ์ดได้เฉพาะคอลัมน์ Todo — คอลัมน์อื่นได้การ์ดจากการลากเท่านั้น */}
      {status === "todo" && (
        <button
          onClick={onRequestAdd}
          className="m-1 rounded-lg py-1.5 text-sm text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
        >
          + เพิ่มการ์ด
        </button>
      )}
    </div>
  );
}
