"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { createNote, useNotes, useUsers } from "@/lib/data";
import Avatar from "@/components/Avatar";

function fmtUpdated(ms: number | undefined): string {
  if (!ms) return "เมื่อสักครู่";
  return new Date(ms).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

export default function NotesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const notes = useNotes();
  const users = useUsers();
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [creating, setCreating] = useState(false);

  const userById = useMemo(() => new Map((users ?? []).map((u) => [u.uid, u])), [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (notes ?? []).filter(
      (n) =>
        (!onlyMine || n.authorUid === user?.uid) &&
        (!q || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q)),
    );
  }, [notes, search, onlyMine, user?.uid]);

  async function newNote() {
    if (!user) return;
    setCreating(true);
    try {
      const id = await createNote(user.uid);
      router.push(`/notes/${id}?edit=1`);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">โน้ต</h1>
        <button
          onClick={newNote}
          disabled={creating}
          className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          + เขียนโน้ตใหม่
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาโน้ต…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          เฉพาะของฉัน
        </label>
      </div>

      {notes === null ? (
        <p className="mt-10 text-center text-slate-400">กำลังโหลด…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-slate-400">
          {notes.length === 0 ? "ยังไม่มีโน้ต เริ่มเขียนโน้ตแรกได้เลย" : "ไม่พบโน้ตที่ค้นหา"}
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((n) => {
            const author = userById.get(n.authorUid);
            return (
              <li key={n.id}>
                <Link
                  href={`/notes/${n.id}`}
                  className="block rounded-xl bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-900"
                >
                  <h2 className="truncate text-lg font-semibold">
                    {n.title || <span className="text-slate-400">ไม่มีชื่อ</span>}
                  </h2>
                  {n.excerpt && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{n.excerpt}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    {author && <Avatar user={author} size="sm" />}
                    <span>{author?.displayName ?? "ไม่ทราบผู้เขียน"}</span>
                    <span>·</span>
                    <span>แก้ไขล่าสุด {fmtUpdated(n.updatedAt?.toMillis())}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
