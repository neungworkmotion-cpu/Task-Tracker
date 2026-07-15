"use client";

import { useState } from "react";

export default function ThemeToggle() {
  // อ่านค่าจริงจาก <html> ตอน mount (SSR ไม่รู้ธีม — suppressHydrationWarning ที่ปุ่มจัดการ mismatch)
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      suppressHydrationWarning
      onClick={toggle}
      className="rounded-lg p-2 text-lg hover:bg-slate-100 dark:hover:bg-slate-800"
      title={dark ? "โหมดสว่าง" : "โหมดมืด"}
      aria-label="สลับธีม"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
