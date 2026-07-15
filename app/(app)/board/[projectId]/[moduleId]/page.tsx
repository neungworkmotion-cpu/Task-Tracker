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
  useModules,
  useProjects,
  useSprints,
  useTasks,
  useUsers,
} from "@/lib/data";
import { GENERAL_MODULE, progressOf, type Task, type TaskStatus } from "@/lib/types";
import { TASK_STATUSES } from "@/lib/types";
import Column from "@/components/board/Column";
import TaskModal from "@/components/board/TaskModal";
import RejectModal from "@/components/board/RejectModal";
import ProgressBar from "@/components/ProgressBar";

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
  const { projectId, moduleId } = useParams<{ projectId: string; moduleId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useAuth();

  const projects = useProjects();
  const tasks = useTasks(projectId);
  const users = useUsers();
  const sprints = useSprints(projectId);
  const modules = useModules(projectId);

  // null = ยังไม่ได้เลือกเอง → default เป็นสปรินต์ active (ถ้ามี)
  const [sprintChoice, setSprintChoice] = useState<string | null>(null); // all | backlog | sprintId
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [rejecting, setRejecting] = useState<Task | null>(null);

  const isGeneral = moduleId === GENERAL_MODULE;
  const project = projects?.find((p) => p.id === projectId);
  const mod = modules?.find((m) => m.id === moduleId);
  const openTaskId = searchParams.get("task");
  const sprintFilter =
    sprintChoice ?? sprints?.find((s) => s.status === "active")?.id ?? "all";

  // การ์ดของ module นี้ (general = ไม่มี module หรือ module ถูกลบไปแล้ว)
  const moduleTasks = useMemo(() => {
    if (!tasks) return null;
    return tasks.filter((t) =>
      isGeneral
        ? !t.moduleId || !modules?.some((m) => m.id === t.moduleId)
        : t.moduleId === moduleId,
    );
  }, [tasks, modules, moduleId, isGeneral]);

  const openTask = moduleTasks?.find((t) => t.id === openTaskId) ?? null;

  const visible = useMemo(() => {
    if (!moduleTasks) return [];
    return moduleTasks.filter((t) => {
      if (sprintFilter === "backlog" && t.sprintId) return false;
      if (sprintFilter !== "all" && sprintFilter !== "backlog" && t.sprintId !== sprintFilter) return false;
      if (assigneeFilter !== "all" && t.assigneeUid !== assigneeFilter) return false;
      return true;
    });
  }, [moduleTasks, sprintFilter, assigneeFilter]);

  const byStatus = useMemo(() => {
    const map = {} as Record<TaskStatus, Task[]>;
    for (const s of TASK_STATUSES) map[s] = visible.filter((t) => t.status === s);
    return map;
  }, [visible]);

  if (!profile) return null;

  function setOpenTask(task: Task | null) {
    const url = task
      ? `/board/${projectId}/${moduleId}?task=${task.id}`
      : `/board/${projectId}/${moduleId}`;
    router.replace(url, { scroll: false });
  }

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination || !moduleTasks) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const task = moduleTasks.find((t) => t.id === draggableId);
    if (!task) return;
    const status = destination.droppableId as TaskStatus;
    const destList = byStatus[status].filter((t) => t.id !== draggableId);
    await moveTask(task, status, orderAt(destList, destination.index), profile!, users ?? []);
  }

  async function onCreate(status: TaskStatus, title: string) {
    if (!moduleTasks) return;
    await createTask(
      projectId,
      isGeneral ? null : moduleId,
      title,
      status,
      nextOrder(moduleTasks, status),
      profile!,
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link href={`/project/${projectId}`} className="text-sm text-slate-400 hover:text-slate-600">←</Link>
        <h1 className="text-lg font-bold" style={{ color: project?.color }}>
          {project?.name ?? "…"}
        </h1>
        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
          {isGeneral ? "📦 ทั่วไป" : `🧩 ${mod?.name ?? "…"}`}
        </span>
        <div className="w-40 max-md:hidden">
          {moduleTasks && moduleTasks.length > 0 && <ProgressBar {...progressOf(moduleTasks)} />}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <select
            value={sprintFilter}
            onChange={(e) => setSprintChoice(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
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
            className="rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
          >
            <option value="all">ทุกคน</option>
            {users?.map((u) => (
              <option key={u.uid} value={u.uid}>{u.displayName}</option>
            ))}
          </select>
        </div>
      </div>

      {moduleTasks === null ? (
        <p className="mt-12 text-center text-sm text-slate-400">กำลังโหลดบอร์ด…</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
            {TASK_STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                tasks={byStatus[status]}
                users={users ?? []}
                sprints={sprints ?? []}
                onOpen={setOpenTask}
                onApprove={(t) => approveTask(t, profile!, moduleTasks)}
                onReject={setRejecting}
                onCreate={onCreate}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      {openTask && moduleTasks && (
        <TaskModal
          key={openTask.id}
          task={openTask}
          tasks={moduleTasks}
          users={users ?? []}
          sprints={sprints ?? []}
          modules={modules ?? []}
          me={profile}
          onClose={() => setOpenTask(null)}
        />
      )}
      {rejecting && moduleTasks && (
        <RejectModal
          task={rejecting}
          onConfirm={(reason, images) => rejectTask(rejecting, reason, images, profile!, moduleTasks)}
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
