"use client";

import { useAuth } from "@/lib/useAuth";
import { setUserRole, useUsers } from "@/lib/data";
import type { Role } from "@/lib/types";
import Avatar from "@/components/Avatar";

const ROLES: Role[] = ["admin", "dev", "tester"];
const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-purple-100 text-purple-700",
  dev: "bg-sky-100 text-sky-700",
  tester: "bg-amber-100 text-amber-700",
};

export default function TeamPage() {
  const { profile } = useAuth();
  const users = useUsers();
  const isAdmin = profile?.role === "admin";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold">ทีม</h1>
      <p className="mt-1 text-sm text-slate-500">
        สมาชิกทุกคนที่เคย login — {isAdmin ? "คุณเป็น admin เปลี่ยน role ได้" : "ให้ admin เป็นคนเปลี่ยน role"}
      </p>
      <ul className="mt-4 divide-y divide-slate-100 rounded-xl bg-white shadow-sm">
        {users === null && (
          <li className="px-4 py-8 text-center text-sm text-slate-400">กำลังโหลด…</li>
        )}
        {users?.map((u) => (
          <li key={u.uid} className="flex items-center gap-3 px-4 py-3">
            <Avatar user={u} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {u.displayName}
                {u.uid === profile?.uid && <span className="ml-1 text-xs text-slate-400">(คุณ)</span>}
              </p>
              <p className="truncate text-xs text-slate-400">{u.email}</p>
            </div>
            {isAdmin && u.uid !== profile?.uid ? (
              <select
                value={u.role}
                onChange={(e) => setUserRole(u.uid, e.target.value as Role)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            ) : (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[u.role]}`}>
                {u.role}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
