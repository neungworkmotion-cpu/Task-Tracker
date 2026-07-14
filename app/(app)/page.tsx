"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/useAuth";
import { createProject, deleteProject, updateProject, useProjects } from "@/lib/data";
import type { Project } from "@/lib/types";

const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6"];

function ProjectCard({ project }: { project: Project }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);

  async function save() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== project.name) await updateProject(project.id, { name: trimmed });
    setEditing(false);
  }

  return (
    <div className="group relative rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md">
      <span
        className="absolute inset-x-0 top-0 h-1.5 rounded-t-xl"
        style={{ background: project.color }}
      />
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="mt-1"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={save}
            className="w-full rounded-lg border border-indigo-300 px-2 py-1 text-sm outline-none"
          />
        </form>
      ) : (
        <Link href={`/board/${project.id}`} className="mt-1 block">
          <h2 className="truncate font-semibold">{project.name}</h2>
          <p className="mt-1 text-xs text-slate-400">เปิดบอร์ด →</p>
        </Link>
      )}
      <div className="absolute right-2 top-3 hidden gap-1 group-hover:flex">
        <button
          onClick={() => setEditing(true)}
          className="rounded p-1 text-xs text-slate-400 hover:bg-slate-100"
          title="เปลี่ยนชื่อ"
        >
          ✏️
        </button>
        <button
          onClick={() => {
            if (confirm(`ลบโปรเจกต์ "${project.name}" พร้อมการ์ดทั้งหมด?`)) deleteProject(project.id);
          }}
          className="rounded p-1 text-xs text-slate-400 hover:bg-red-50"
          title="ลบ"
        >
          🗑️
        </button>
      </div>
      <div className="mt-3 flex gap-2 text-xs text-slate-500">
        <Link href={`/board/${project.id}`} className="rounded-lg bg-slate-100 px-2 py-1 hover:bg-indigo-50 hover:text-indigo-700">
          Kanban
        </Link>
        <Link href={`/sprints/${project.id}`} className="rounded-lg bg-slate-100 px-2 py-1 hover:bg-indigo-50 hover:text-indigo-700">
          Sprints
        </Link>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const projects = useProjects();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !user) return;
    await createProject(name.trim(), color, user.uid);
    setName("");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-bold">โปรเจกต์</h1>

      <form onSubmit={submit} className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อโปรเจกต์ใหม่…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full ${color === c ? "ring-2 ring-slate-400 ring-offset-1" : ""}`}
              style={{ background: c }}
              aria-label={`สี ${c}`}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          + สร้าง
        </button>
      </form>

      {projects === null ? (
        <p className="mt-8 text-center text-sm text-slate-400">กำลังโหลด…</p>
      ) : projects.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-400">
          ยังไม่มีโปรเจกต์ — สร้างอันแรกด้านบนได้เลย
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
