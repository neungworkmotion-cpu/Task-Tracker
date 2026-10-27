"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { deleteNote, updateNote, useNote, useUsers } from "@/lib/data";
import type { Note } from "@/lib/types";
import Avatar from "@/components/Avatar";
import NoteEditor from "@/components/notes/NoteEditor";

const MAX_CONTENT_CHARS = 900_000;
const AUTOSAVE_MS = 800;

type SaveState = "idle" | "saving" | "saved" | "error";

function makeExcerpt(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, 200);
}

export default function NotePage() {
  return (
    <Suspense fallback={<p className="mt-10 text-center text-slate-400">กำลังโหลด…</p>}>
      <NoteView />
    </Suspense>
  );
}

function NoteView() {
  const { noteId } = useParams<{ noteId: string }>();
  const loaded = useNote(noteId);

  if (!loaded) return <p className="mt-10 text-center text-slate-400">กำลังโหลด…</p>;
  if (!loaded.note) {
    return (
      <div className="mt-10 text-center text-slate-400">
        <p>ไม่พบโน้ตนี้ อาจถูกลบไปแล้ว</p>
        <Link href="/notes" className="mt-2 inline-block text-indigo-600 hover:underline">
          ← กลับไปหน้าโน้ต
        </Link>
      </div>
    );
  }
  return <NoteArticle key={loaded.note.id} note={loaded.note} />;
}

function NoteArticle({ note }: { note: Note }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const users = useUsers();
  const author = users?.find((u) => u.uid === note.authorUid);
  const canEdit = note.authorUid === user?.uid || profile?.role === "admin";

  const [editRequested, setEditing] = useState(() => searchParams.get("edit") === "1");
  const editing = editRequested && canEdit;
  const [title, setTitle] = useState(note.title);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");

  const pending = useRef<{ title?: string; content?: string; excerpt?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const data = pending.current;
    if (!Object.keys(data).length) return;
    pending.current = {};
    if ((data.content?.length ?? 0) > MAX_CONTENT_CHARS) {
      setSaveState("error");
      setSaveError("โน้ตใหญ่เกินไป (รูปเยอะเกิน) ลองลบรูปบางรูปออก");
      return;
    }
    setSaveState("saving");
    try {
      await updateNote(note.id, data);
      setSaveState("saved");
      setSaveError("");
    } catch (e) {
      setSaveState("error");
      setSaveError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  }, [note.id]);

  const queue = useCallback(
    (data: { title?: string; content?: string; excerpt?: string }) => {
      pending.current = { ...pending.current, ...data };
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_MS);
    },
    [flush],
  );

  useEffect(() => () => void flush(), [flush]);

  async function finishEditing() {
    await flush();
    setEditing(false);
    router.replace(`/notes/${note.id}`);
  }

  async function remove() {
    if (!window.confirm(`ลบโน้ต "${note.title || "ไม่มีชื่อ"}" ใช่ไหม?`)) return;
    pending.current = {};
    if (timer.current) clearTimeout(timer.current);
    await deleteNote(note.id);
    router.replace("/notes");
  }

  const updatedAt = note.updatedAt?.toDate().toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/notes" className="text-slate-500 hover:text-indigo-600">
          ← โน้ตทั้งหมด
        </Link>
        <span className="ml-auto text-xs text-slate-400">
          {saveState === "saving" && "กำลังบันทึก…"}
          {saveState === "saved" && "บันทึกแล้ว"}
          {saveState === "error" && <span className="text-red-600">{saveError}</span>}
        </span>
        {canEdit &&
          (editing ? (
            <button
              onClick={finishEditing}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
            >
              เสร็จ
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setTitle(note.title);
                  setEditing(true);
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                ✏️ แก้ไข
              </button>
              <button
                onClick={remove}
                className="rounded-lg px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                ลบ
              </button>
            </>
          ))}
      </div>

      <article className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-10 dark:bg-slate-900">
        {editing ? (
          <textarea
            value={title}
            rows={1}
            autoFocus={!note.title}
            onChange={(e) => {
              const value = e.target.value.replace(/\n/g, " ");
              setTitle(value);
              queue({ title: value });
            }}
            placeholder="ชื่อเรื่อง"
            style={{ background: "transparent", border: "none" }}
            className="field-sizing-content w-full resize-none p-0 text-3xl font-bold outline-none sm:text-4xl"
          />
        ) : (
          <h1 className="text-3xl font-bold sm:text-4xl">
            {note.title || <span className="text-slate-400">ไม่มีชื่อ</span>}
          </h1>
        )}

        <div className="mt-4 mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Avatar user={author} size="sm" />
          <span>{author?.displayName ?? "ไม่ทราบผู้เขียน"}</span>
          {updatedAt && (
            <>
              <span>·</span>
              <span>แก้ไขล่าสุด {updatedAt}</span>
            </>
          )}
        </div>

        <NoteEditor
          content={note.content}
          editable={editing}
          onChange={(html, text) => queue({ content: html, excerpt: makeExcerpt(text) })}
        />
      </article>
    </div>
  );
}
