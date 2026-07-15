"use client";

import { useState } from "react";
import type { Comment, UserDoc } from "@/lib/types";
import Avatar from "@/components/Avatar";
import ImageLightbox from "./ImageLightbox";

function fmtTime(c: Comment): string {
  if (!c.createdAt) return "";
  return c.createdAt.toDate().toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CommentList({
  comments,
  users,
}: {
  comments: Comment[] | null;
  users: UserDoc[];
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const byUid = new Map(users.map((u) => [u.uid, u]));

  if (comments === null)
    return <p className="py-4 text-center text-xs text-slate-400">กำลังโหลดคอมเมนต์…</p>;
  if (!comments.length)
    return <p className="py-4 text-center text-xs text-slate-400">ยังไม่มีคอมเมนต์</p>;

  return (
    <ul className="space-y-3">
      {comments.map((c) => {
        const author = byUid.get(c.authorUid);
        const isReject = c.kind === "reject";
        return (
          <li key={c.id} className="flex gap-2.5">
            <Avatar user={author} size="sm" />
            <div
              className={`min-w-0 flex-1 rounded-xl px-3 py-2 ${
                isReject ? "border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40" : "bg-slate-100 dark:bg-slate-800"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold">
                  {author?.displayName ?? "ไม่ทราบชื่อ"}
                  {isReject && <span className="ml-1.5 text-red-600">❌ Reject</span>}
                </span>
                <span className="shrink-0 text-[10px] text-slate-400">{fmtTime(c)}</span>
              </div>
              {c.text && <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.text}</p>}
              {c.images?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={img}
                      alt={`รูปแนบ ${i + 1}`}
                      onClick={() => setLightbox(img)}
                      className="h-20 max-w-40 cursor-zoom-in rounded-lg border border-slate-200 dark:border-slate-700 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
      {lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </ul>
  );
}
