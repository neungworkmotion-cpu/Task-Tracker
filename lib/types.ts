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

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  status: SprintStatus;
  createdAt: Timestamp | null;
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
  taskTitle: string;
  type: NotiType;
  message: string;
  read: boolean;
  createdAt: Timestamp | null;
}
