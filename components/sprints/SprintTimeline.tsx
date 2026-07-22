"use client";

import type { Sprint } from "@/lib/types";

const COL = 44; // px ต่อวัน
const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const SPRINT_COLORS = ["#22c55e", "#6366f1", "#0ea5e9", "#f59e0b", "#ec4899", "#8b5cf6"];

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SprintTimeline({ sprints }: { sprints: Sprint[] }) {
  const valid = sprints.filter((s) => s.startDate && s.endDate);
  if (!valid.length) {
    return <p className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-8 text-center text-sm text-slate-400">ยังไม่มีสปรินต์ที่มีช่วงวัน</p>;
  }

  // ช่วงวัน = min start … max end (เผื่อหัวท้ายข้างละ 1 วันให้ดูโปร่ง)
  const min = parseISO(valid.reduce((a, s) => (s.startDate < a ? s.startDate : a), valid[0].startDate));
  const max = parseISO(valid.reduce((a, s) => (s.endDate > a ? s.endDate : a), valid[0].endDate));

  const days: { iso: string; dayNum: number; month: number; weekend: boolean }[] = [];
  for (let d = new Date(min); d <= max; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay();
    days.push({ iso: toISO(d), dayNum: d.getDate(), month: d.getMonth(), weekend: wd === 0 || wd === 6 });
  }
  const idx = (iso: string) => Math.max(0, days.findIndex((x) => x.iso === iso));

  // group เดือนต่อเนื่องเพื่อ header
  const months: { month: number; span: number }[] = [];
  for (const day of days) {
    const last = months[months.length - 1];
    if (last && last.month === day.month) last.span++;
    else months.push({ month: day.month, span: 1 });
  }

  const gridCols = `repeat(${days.length}, ${COL}px)`;

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div style={{ width: days.length * COL }}>
        {/* แถวเดือน */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols }}>
          {months.map((m, i) => (
            <div
              key={i}
              style={{ gridColumn: `span ${m.span}` }}
              className="border-b border-r border-white/20 bg-indigo-500 py-1 text-center text-xs font-semibold text-white"
            >
              {TH_MONTHS[m.month]}
            </div>
          ))}
        </div>
        {/* แถววันที่ */}
        <div style={{ display: "grid", gridTemplateColumns: gridCols }}>
          {days.map((d, i) => (
            <div
              key={i}
              className={`border-b border-r border-slate-200 dark:border-slate-700 py-1 text-center text-xs ${
                d.weekend ? "bg-red-300 text-red-900" : "bg-emerald-50 dark:bg-emerald-950/30 text-slate-600 dark:text-slate-300"
              }`}
            >
              {d.dayNum}
            </div>
          ))}
        </div>
        {/* แถบสปรินต์ (หนึ่งแถวต่อสปรินต์) — day cells กับ bar อยู่ grid-row เดียวกันให้ซ้อนทับ */}
        {valid.map((s, si) => {
          const start = idx(s.startDate);
          const end = idx(s.endDate);
          return (
            <div key={s.id} style={{ display: "grid", gridTemplateColumns: gridCols }}>
              {days.map((d, i) => (
                <div
                  key={i}
                  style={{ gridRow: 1, gridColumn: i + 1 }}
                  className={`h-9 border-r border-slate-100 dark:border-slate-800 ${d.weekend ? "bg-red-50 dark:bg-red-950/20" : ""}`}
                />
              ))}
              <div
                style={{ gridRow: 1, gridColumn: `${start + 1} / ${end + 2}`, background: SPRINT_COLORS[si % SPRINT_COLORS.length] }}
                className="z-10 m-1 flex items-center justify-center overflow-hidden rounded-md px-2 text-xs font-semibold text-white"
                title={`${s.name} (${s.startDate} → ${s.endDate})`}
              >
                <span className="truncate">{s.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
