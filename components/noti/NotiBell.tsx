"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { markAllNotisRead, markNotiRead, useNotis } from "@/lib/data";
import type { Noti } from "@/lib/types";

const TYPE_ICONS: Record<Noti["type"], string> = {
  moved_to_test: "🧪",
  approved: "✅",
  rejected: "❌",
  assigned: "📌",
  commented: "💬",
};

function timeAgo(n: Noti): string {
  const ms = n.createdAt ? Date.now() - n.createdAt.toMillis() : 0;
  const m = Math.floor(ms / 60000);
  if (m < 1) return "เมื่อสักครู่";
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  return `${Math.floor(h / 24)} วันที่แล้ว`;
}

export default function NotiBell() {
  const { user } = useAuth();
  const notis = useNotis(user?.uid ?? null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const unread = notis?.filter((n) => !n.read).length ?? 0;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function openNoti(n: Noti) {
    if (!n.read) markNotiRead(n.id);
    setOpen(false);
    router.push(`/board/${n.projectId}?task=${n.taskId}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 hover:bg-slate-100"
        aria-label="การแจ้งเตือน"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-semibold">การแจ้งเตือน</span>
            {unread > 0 && (
              <button
                onClick={() => notis && markAllNotisRead(notis)}
                className="text-xs text-indigo-600 hover:underline"
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {!notis?.length && (
              <li className="px-4 py-8 text-center text-sm text-slate-400">
                ยังไม่มีการแจ้งเตือน
              </li>
            )}
            {notis?.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => openNoti(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${
                    n.read ? "opacity-60" : "bg-indigo-50/50"
                  }`}
                >
                  <span className="text-lg">{TYPE_ICONS[n.type]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug">{n.message}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">{timeAgo(n)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
