"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import {
  createSprint,
  deleteSprint,
  setTaskSprint,
  updateSprint,
  useProjects,
  useSprints,
  useTasks,
} from "@/lib/data";
import type { Sprint, Task } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const BACKLOG = "backlog";

function TaskRow({ task, index, sprints }: { task: Task; index: number; sprints: Sprint[] }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-sm ${
            snapshot.isDragging ? "ring-2 ring-indigo-300" : "border-slate-200"
          }`}
        >
          <span className="min-w-0 flex-1 truncate">{task.title}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
            {STATUS_LABELS[task.status]}
          </span>
          {/* มือถือ: ย้ายผ่าน dropdown แทนการลาก */}
          <select
            value={task.sprintId ?? BACKLOG}
            onChange={(e) => setTaskSprint(task.id, e.target.value === BACKLOG ? null : e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="rounded border border-slate-200 px-1 py-0.5 text-[10px] text-slate-500 md:hidden"
          >
            <option value={BACKLOG}>Backlog</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}
    </Draggable>
  );
}

function TaskDropList({ droppableId, tasks, sprints, empty }: {
  droppableId: string;
  tasks: Task[];
  sprints: Sprint[];
  empty: string;
}) {
  return (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`flex min-h-16 flex-col gap-1.5 rounded-xl p-1.5 transition ${
            snapshot.isDraggingOver ? "bg-indigo-50" : ""
          }`}
        >
          {tasks.length === 0 && !snapshot.isDraggingOver && (
            <p className="py-3 text-center text-xs text-slate-300">{empty}</p>
          )}
          {tasks.map((t, i) => (
            <TaskRow key={t.id} task={t} index={i} sprints={sprints} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export default function SprintsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const projects = useProjects();
  const tasks = useTasks(projectId);
  const sprints = useSprints(projectId);
  const project = projects?.find((p) => p.id === projectId);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const bySprint = useMemo(() => {
    const map = new Map<string, Task[]>();
    map.set(BACKLOG, []);
    sprints?.forEach((s) => map.set(s.id, []));
    tasks?.forEach((t) => {
      const key = t.sprintId && map.has(t.sprintId) ? t.sprintId : BACKLOG;
      map.get(key)!.push(t);
    });
    return map;
  }, [tasks, sprints]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    await createSprint(projectId, name.trim(), startDate, endDate);
    setName("");
    setStartDate("");
    setEndDate("");
  }

  function onDragEnd(result: DropResult) {
    const { destination, draggableId } = result;
    if (!destination) return;
    setTaskSprint(draggableId, destination.droppableId === BACKLOG ? null : destination.droppableId);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={`/board/${projectId}`} className="text-sm text-slate-400 hover:text-slate-600">←</Link>
        <h1 className="text-lg font-bold" style={{ color: project?.color }}>
          {project?.name ?? "…"} — Sprint planning
        </h1>
      </div>

      <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 shadow-sm">
        <label className="min-w-40 flex-1 text-xs text-slate-500">
          ชื่อสปรินต์
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น Sprint 1"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          />
        </label>
        <label className="text-xs text-slate-500">
          เริ่ม
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
        </label>
        <label className="text-xs text-slate-500">
          จบ
          <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
        </label>
        <button
          type="submit"
          disabled={!name.trim() || !startDate || !endDate}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          + สร้างสปรินต์
        </button>
      </form>

      {tasks === null || sprints === null ? (
        <p className="mt-8 text-center text-sm text-slate-400">กำลังโหลด…</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="rounded-2xl bg-slate-50 p-3">
              <h2 className="px-1 pb-2 text-sm font-semibold text-slate-600">
                📥 Backlog <span className="font-normal text-slate-400">({bySprint.get(BACKLOG)!.length})</span>
              </h2>
              <p className="px-1 pb-2 text-xs text-slate-400 max-md:hidden">ลากการ์ดไปใส่สปรินต์ทางขวา</p>
              <TaskDropList droppableId={BACKLOG} tasks={bySprint.get(BACKLOG)!} sprints={sprints} empty="ไม่มีงานค้างใน backlog" />
            </section>

            <div className="space-y-4">
              {sprints.length === 0 && (
                <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">
                  ยังไม่มีสปรินต์ — สร้างด้านบนก่อน
                </p>
              )}
              {sprints.map((s) => {
                const inSprint = bySprint.get(s.id) ?? [];
                const done = inSprint.filter((t) => t.status === "done").length;
                return (
                  <section key={s.id} className={`rounded-2xl p-3 ${s.status === "active" ? "bg-indigo-50 ring-1 ring-indigo-200" : "bg-slate-50"}`}>
                    <div className="flex flex-wrap items-center gap-2 px-1 pb-2">
                      <h2 className="text-sm font-semibold text-slate-700">🏃 {s.name}</h2>
                      {s.status === "active" && (
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">ACTIVE</span>
                      )}
                      {s.status === "done" && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">DONE</span>
                      )}
                      <span className="text-xs text-slate-400">
                        {s.startDate} → {s.endDate} · {done}/{inSprint.length} เสร็จ
                      </span>
                      <span className="ml-auto flex gap-1">
                        {s.status === "planned" && (
                          <button onClick={() => updateSprint(s.id, { status: "active" })}
                            className="rounded-lg bg-indigo-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-indigo-700">
                            ▶ Start
                          </button>
                        )}
                        {s.status === "active" && (
                          <button onClick={() => updateSprint(s.id, { status: "done" })}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-emerald-700">
                            ✔ Finish
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`ลบสปรินต์ "${s.name}"? (การ์ดจะกลับไป backlog)`)) deleteSprint(s.id, tasks);
                          }}
                          className="rounded-lg px-2 py-1 text-[10px] text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          🗑️
                        </button>
                      </span>
                    </div>
                    <TaskDropList droppableId={s.id} tasks={inSprint} sprints={sprints} empty="ลากการ์ดมาใส่สปรินต์นี้" />
                  </section>
                );
              })}
            </div>
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
