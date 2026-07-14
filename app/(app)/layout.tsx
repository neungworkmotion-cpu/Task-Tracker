"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import Avatar from "@/components/Avatar";
import NotiBell from "@/components/noti/NotiBell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        กำลังโหลด…
      </div>
    );
  }

  const nav = [
    { href: "/", label: "โปรเจกต์", active: pathname === "/" },
    { href: "/team", label: "ทีม", active: pathname === "/team" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4">
          <Link href="/" className="mr-2 text-lg font-bold text-indigo-600">
            📋 Task Tracker
          </Link>
          <nav className="flex gap-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  n.active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <NotiBell />
            {profile && (
              <span className="hidden items-center gap-2 sm:flex">
                <Avatar user={profile} size="md" />
                <span className="text-sm">
                  <span className="block font-medium leading-tight">{profile.displayName}</span>
                  <span className="block text-xs leading-tight text-slate-400">{profile.role}</span>
                </span>
              </span>
            )}
            <button
              onClick={() => signOut(auth)}
              className="ml-1 rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              ออก
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4">{children}</main>
    </div>
  );
}
