"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  createModule,
  deleteModule,
  updateModule,
  useModules,
  useProjects,
  useTasks,
} from "@/lib/data";
import { GENERAL_MODULE, progressOf, type Module, type Task } from "@/lib/types";
import ProgressBar from "@/components/ProgressBar";

function ModuleCard({
  projectId,
  moduleId,
  name,
  tasks,
  module,
  allTasks,
}: {
  projectId: string;
  moduleId: string;
  name: string;
  tasks: Task[];
  module?: Module; // undefined = bucket ทั่วไป (แก้/ลบไม่ได้)
  allTasks: Task[];
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const progress = progressOf(tasks);

  async function save() {
    const trimmed = editName.trim();
    if (module && trimmed && trimmed !== module.name) await updateModule(module.id, { name: trimmed });
    setEditing(false);
  }

  return (
    <div className="group relative rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:shadow-md">
      {editing && module ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={save}
            className="w-full rounded-lg border border-indigo-300 px-2 py-1 text-sm outline-none"
          />
        </form>
      ) : (
        <Link href={`/board/${projectId}/${moduleId}`} className="block">
          <h2 className="truncate font-semibold">
            {module ? "🧩" : "📦"} {name}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {tasks.length} การ์ด · เปิดบอร์ด →
          </p>
        </Link>
      )}
      <div className="mt-3">
        <ProgressBar {...progress} />
      </div>
      {module && (
        <div className="absolute right-2 top-3 hidden gap-1 group-hover:flex">
          <button
            onClick={() => {
              setEditName(module.name);
              setEditing(true);
            }}
            className="rounded p-1 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="เปลี่ยนชื่อ"
          >
            ✏️
          </button>
          <button
            onClick={() => {
              if (confirm(`ลบ module "${module.name}"? (การ์ดจะย้ายไป "ทั่วไป")`))
                deleteModule(module.id, allTasks);
            }}
            className="rounded p-1 text-xs text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40"
            title="ลบ"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProjectModulesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const projects = useProjects();
  const modules = useModules(projectId);
  const tasks = useTasks(projectId);
  const project = projects?.find((p) => p.id === projectId);
  const [name, setName] = useState("");

  const generalTasks = (tasks ?? []).filter(
    (t) => !t.moduleId || !modules?.some((m) => m.id === t.moduleId),
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const order = modules?.length ? Math.max(...modules.map((m) => m.order)) + 1 : 1;
    await createModule(projectId, name.trim(), order);
    setName("");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">←</Link>
        <h1 className="text-xl font-bold" style={{ color: project?.color }}>
          {project?.name ?? "…"}
        </h1>
        <span className="text-xs text-slate-400">— Modules</span>
        <Link
          href={`/sprints/${projectId}`}
          className="ml-auto rounded-lg bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:text-indigo-600"
        >
          🏃 Sprint planning
        </Link>
      </div>

      {tasks && tasks.length > 0 && (
        <div className="mt-3 rounded-xl bg-white dark:bg-slate-900 p-3 shadow-sm">
          <p className="mb-1.5 text-xs font-semibold text-slate-500">ความคืบหน้ารวมทั้งโปรเจกต์</p>
          <ProgressBar {...progressOf(tasks)} />
        </div>
      )}

      <form onSubmit={submit} className="mt-3 flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 p-3 shadow-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อ module ใหม่ เช่น ระบบสมาชิก, หน้าชำระเงิน…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          + สร้าง module
        </button>
      </form>

      {modules === null || tasks === null ? (
        <p className="mt-8 text-center text-sm text-slate-400">กำลังโหลด…</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <ModuleCard
              key={m.id}
              projectId={projectId}
              moduleId={m.id}
              name={m.name}
              module={m}
              tasks={tasks.filter((t) => t.moduleId === m.id)}
              allTasks={tasks}
            />
          ))}
          {(generalTasks.length > 0 || modules.length === 0) && (
            <ModuleCard
              projectId={projectId}
              moduleId={GENERAL_MODULE}
              name="ทั่วไป"
              tasks={generalTasks}
              allTasks={tasks}
            />
          )}
        </div>
      )}
    </div>
  );
}
