import type { Timestamp } from "firebase/firestore";

export type Role = "admin" | "dev" | "tester" | "pm" | "uxui" | "ba";
export type TaskStatus = "todo" | "doing" | "test" | "done" | "deploy";
export type SprintStatus = "planned" | "active" | "done";
export type NotiType =
  | "moved_to_test"
  | "approved"
  | "rejected"
  | "assigned"
  | "commented";

export const TASK_STATUSES: TaskStatus[] = ["todo", "doing", "test", "done", "deploy"];
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  doing: "Doing",
  test: "Test",
  done: "Done - waiting deploy",
  deploy: "Deploy",
};

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/** "12 ก.ค." จาก YYYY-MM-DD (คืน "" ถ้าพัง) */
export function fmtDate(d?: string | null): string {
  if (!d) return "";
  const [, m, day] = d.split("-").map(Number);
  if (!m || !day) return "";
  return `${day} ${TH_MONTHS[m - 1]}`;
}

/** "12 ก.ค. → 20 ก.ค." หรือ "" ถ้าไม่มีวันเลย */
export function fmtDateRange(start?: string | null, end?: string | null): string {
  const s = fmtDate(start);
  const e = fmtDate(end);
  if (s && e) return `${s} → ${e}`;
  return s || e;
}

/** ความคืบหน้า: เสร็จ = done (รอ deploy) หรือ deploy แล้ว */
export function progressOf(tasks: { status: TaskStatus }[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done" || t.status === "deploy").length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  dev: "Dev",
  tester: "Tester",
  pm: "Project Manager",
  uxui: "UX/UI",
  ba: "BA",
};

export interface UserDoc {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  role: Role;
  lastLoginAt: Timestamp | null;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdBy: string;
  createdAt: Timestamp | null;
}

export interface Module {
  id: string;
  projectId: string;
  name: string;
  order: number;
  createdAt: Timestamp | null;
}

/** id เสมือนของ bucket "ทั่วไป" (การ์ดที่ไม่มี module) ใช้ใน URL */
export const GENERAL_MODULE = "general";

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  status: SprintStatus;
  createdAt: Timestamp | null;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64 data URL
  size: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  rejected: boolean;
  rejectedCount: number;
  assigneeUid: string | null;
  sprintId: string | null;
  moduleId?: string | null;
  startDate?: string | null; // YYYY-MM-DD
  endDate?: string | null;
  attachments?: Attachment[];
  order: number;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  commentCount: number;
}

export interface Comment {
  id: string;
  text: string;
  images: string[]; // base64 data URLs
  authorUid: string;
  kind: "comment" | "reject" | "system";
  createdAt: Timestamp | null;
}

export interface Noti {
  id: string;
  toUid: string;
  fromUid: string;
  taskId: string;
  projectId: string;
  moduleId?: string | null;
  taskTitle: string;
  type: NotiType;
  message: string;
  read: boolean;
  createdAt: Timestamp | null;
}
