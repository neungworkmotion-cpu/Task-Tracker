"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useAuth } from "@/lib/useAuth";
import {
  approveTask,
  createTask,
  moveTask,
  nextOrder,
  rejectTask,
  useProjects,
  useSprints,
  useTasks,
  useUsers,
} from "@/lib/data";
import type { Task, TaskStatus } from "@/lib/types";
import { TASK_STATUSES } from "@/lib/types";
import Column from "@/components/board/Column";
import TaskModal from "@/components/board/TaskModal";
import RejectModal from "@/components/board/RejectModal";

/** order ใหม่เมื่อวางที่ index ใน list ปลายทาง (list ไม่รวมการ์ดที่ลากอยู่) */
function orderAt(dest: Task[], index: number): number {
  const before = dest[index - 1]?.order;
  const after = dest[index]?.order;
  if (before === undefined && after === undefined) return 1;
  if (before === undefined) return after! - 1;
  if (after === undefined) return before + 1;
  return (before + after) / 2;
}

function BoardContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();

  const projects = useProjects();
  const tasks = useTasks(projectId);
  const users = useUsers();
  const sprints = useSprints(projectId);

  // null = ยังไม่ได้เลือกเอง → default เป็นสปรินต์ active (ถ้ามี)
  const [sprintChoice, setSprintChoice] = useState<string | null>(null); // all | backlog | sprintId
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [rejecting, setRejecting] = useState<Task | null>(null);

  const project = projects?.find((p) => p.id === projectId);
  const openTaskId = searchParams.get("task");
  const openTask = tasks?.find((t) => t.id === openTaskId) ?? null;
  const sprintFilter =
    sprintChoice ?? sprints?.find((s) => s.status === "active")?.id ?? "all";

  const visible = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter((t) => {
      if (sprintFilter === "backlog" && t.sprintId) return false;
      if (sprintFilter !== "all" && sprintFilter !== "backlog" && t.sprintId !== sprintFilter) return false;
      if (assigneeFilter !== "all" && t.assigneeUid !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, sprintFilter, assigneeFilter]);

  const byStatus = useMemo(() => {
    const map = {} as Record<TaskStatus, Task[]>;
    for (const s of TASK_STATUSES) map[s] = visible.filter((t) => t.status === s);
    return map;
  }, [visible]);

  if (!profile) return null;

  function setOpenTask(task: Task | null) {
    const url = task ? `/board/${projectId}?task=${task.id}` : `/board/${projectId}`;
    router.replace(url, { scroll: false });
  }

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination || !tasks) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;
    const status = destination.droppableId as TaskStatus;
    const destList = byStatus[status].filter((t) => t.id !== draggableId);
    await moveTask(task, status, orderAt(destList, destination.index), profile!, users ?? []);
  }

  async function onCreate(status: TaskStatus, title: string) {
    if (!tasks) return;
    await createTask(projectId, title, status, nextOrder(tasks, status), profile!);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">←</Link>
        <h1 className="text-lg font-bold" style={{ color: project?.color }}>
          {project?.name ?? "…"}
        </h1>
        <Link
          href={`/sprints/${projectId}`}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:text-indigo-600"
        >
          🏃 Sprint planning
        </Link>
        <div className="ml-auto flex flex-wrap gap-2">
          <select
            value={sprintFilter}
            onChange={(e) => setSprintChoice(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
          >
            <option value="all">ทุกสปรินต์</option>
            <option value="backlog">Backlog (ไม่มีสปรินต์)</option>
            {sprints?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.status === "active" ? " (active)" : ""}
              </option>
            ))}
          </select>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
          >
            <option value="all">ทุกคน</option>
            {users?.map((u) => (
              <option key={u.uid} value={u.uid}>{u.displayName}</option>
            ))}
          </select>
        </div>
      </div>

      {tasks === null ? (
        <p className="mt-12 text-center text-sm text-slate-400">กำลังโหลดบอร์ด…</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
            {TASK_STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                tasks={byStatus[status]}
                users={users ?? []}
                sprints={sprints ?? []}
                onOpen={setOpenTask}
                onApprove={(t) => approveTask(t, profile!, tasks)}
                onReject={setRejecting}
                onCreate={onCreate}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      {openTask && tasks && (
        <TaskModal
          key={openTask.id}
          task={openTask}
          tasks={tasks}
          users={users ?? []}
          sprints={sprints ?? []}
          me={profile}
          onClose={() => setOpenTask(null)}
        />
      )}
      {rejecting && tasks && (
        <RejectModal
          task={rejecting}
          onConfirm={(reason, images) => rejectTask(rejecting, reason, images, profile!, tasks)}
          onClose={() => setRejecting(null)}
        />
      )}
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense>
      <BoardContent />
    </Suspense>
  );
}
