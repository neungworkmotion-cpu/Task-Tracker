"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/lib/useAuth";
import { ALLOWED_EMAIL_HINT, isAllowedEmail } from "@/lib/allowedEmail";

const NOT_ALLOWED_MESSAGE = `อนุญาตเฉพาะอีเมล ${ALLOWED_EMAIL_HINT} เท่านั้น`;

async function sendVerificationAndSignOut(user: User) {
  try {
    await sendEmailVerification(user);
  } finally {
    await signOut(auth);
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function run(fn: () => Promise<string | void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const message = await fn();
      if (message) {
        setNotice(message);
        return;
      }
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    run(async () => {
      if (!isAllowedEmail(email)) throw new Error(NOT_ALLOWED_MESSAGE);
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
        await sendVerificationAndSignOut(cred.user);
        setMode("signin");
        return `ส่งลิงก์ยืนยันไปที่ ${cred.user.email} แล้ว กดยืนยันในอีเมลก่อนแล้วค่อยเข้าสู่ระบบ`;
      }
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!cred.user.emailVerified) {
        await sendVerificationAndSignOut(cred.user);
        return `อีเมลนี้ยังไม่ได้ยืนยัน ส่งลิงก์ยืนยันไปที่ ${cred.user.email} อีกครั้งแล้ว`;
      }
    });
  }

  function signInWithGoogle() {
    run(async () => {
      const cred = await signInWithPopup(auth, googleProvider);
      if (!isAllowedEmail(cred.user.email)) {
        if (getAdditionalUserInfo(cred)?.isNewUser) await cred.user.delete().catch(() => {});
        await signOut(auth);
        throw new Error(NOT_ALLOWED_MESSAGE);
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-lg">
        <h1 className="text-2xl font-bold">Task Tracker</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "signin" ? "เข้าสู่ระบบเพื่อเริ่มใช้งาน" : "สมัครสมาชิกใหม่"}
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-2.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.2-2 3.7-5 3.7-8.6z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.8-5.1L1.3 17C3.3 21.2 7.3 24 12 24z" />
            <path fill="#FBBC05" d="M5.2 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.3 6.7C.5 8.3 0 10.1 0 12s.5 3.7 1.3 5.3l3.9-3z" />
            <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.8 1.3 6.7l3.9 3c.9-2.9 3.6-5 6.8-5z" />
          </svg>
          เข้าด้วย Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          หรือ
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={submitEmail} className="space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อที่แสดง"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={ALLOWED_EMAIL_HINT}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="รหัสผ่าน (6 ตัวขึ้นไป)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          {notice && <p className="text-xs text-emerald-600">{notice}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {mode === "signin" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-xs text-indigo-600 hover:underline"
        >
          {mode === "signin" ? "ยังไม่มีบัญชี? สมัครสมาชิก" : "มีบัญชีแล้ว? เข้าสู่ระบบ"}
        </button>
      </div>
    </main>
  );
}
