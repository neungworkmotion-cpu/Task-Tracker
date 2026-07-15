"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Comment,
  Module,
  Noti,
  NotiType,
  Project,
  Sprint,
  Task,
  TaskStatus,
  UserDoc,
} from "./types";

// ---------- generic snapshot hook ----------

function useCol<T>(
  path: string,
  constraints: Parameters<typeof query>[1][],
  sort: (a: T, b: T) => number,
  deps: unknown[],
  enabled = true,
) {
  // เก็บ items คู่กับ key ของ subscription — เปลี่ยน query แล้วคืน null ระหว่างรอ snapshot ใหม่โดยไม่ต้อง setState reset
  // constraints ต้อง derive จาก deps เท่านั้น (effect ปิด closure ตาม key)
  const key = JSON.stringify([path, deps]);
  const [state, setState] = useState<{ key: string; items: T[] } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const q = query(collection(db, path), ...(constraints as never[]));
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        rows.sort(sort);
        setState({ key, items: rows });
      },
      (err) => console.error(`snapshot ${path} failed`, err),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return enabled && state?.key === key ? state.items : null;
}

const byOrder = (a: Task, b: Task) => a.order - b.order;
const byCreatedDesc = <T extends { createdAt: { toMillis(): number } | null }>(
  a: T,
  b: T,
) => (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now());

// ---------- hooks ----------

export function useUsers() {
  return useCol<UserDoc>(
    "users",
    [],
    (a, b) => a.displayName.localeCompare(b.displayName),
    [],
  );
}

export function useProjects() {
  return useCol<Project>("projects", [], byCreatedDesc, []);
}

export function useTasks(projectId: string | null) {
  return useCol<Task>(
    "tasks",
    [where("projectId", "==", projectId)],
    byOrder,
    [projectId],
    !!projectId,
  );
}

/** ทุกการ์ดทุกโปรเจกต์ — ใช้คำนวณ % บนหน้ารายการโปรเจกต์ */
export function useAllTasks() {
  return useCol<Task>("tasks", [], byOrder, []);
}

export function useModules(projectId: string | null) {
  return useCol<Module>(
    "modules",
    [where("projectId", "==", projectId)],
    (a, b) => a.order - b.order,
    [projectId],
    !!projectId,
  );
}

export function useSprints(projectId: string | null) {
  return useCol<Sprint>(
    "sprints",
    [where("projectId", "==", projectId)],
    (a, b) => a.startDate.localeCompare(b.startDate),
    [projectId],
    !!projectId,
  );
}

export function useComments(taskId: string | null) {
  return useCol<Comment>(
    `tasks/${taskId}/comments`,
    [],
    (a, b) =>
      (a.createdAt?.toMillis() ?? Date.now()) -
      (b.createdAt?.toMillis() ?? Date.now()),
    [taskId],
    !!taskId,
  );
}

export function useNotis(uid: string | null) {
  return useCol<Noti>(
    "notifications",
    [where("toUid", "==", uid)],
    byCreatedDesc,
    [uid],
    !!uid,
  );
}

// ---------- notifications ----------

const NOTI_MESSAGES: Record<NotiType, (taskTitle: string, from: string) => string> = {
  moved_to_test: (t, f) => `${f} ส่งงาน "${t}" เข้ามารอ test`,
  approved: (t, f) => `${f} approve งาน "${t}" ผ่านแล้ว 🎉`,
  rejected: (t, f) => `${f} reject งาน "${t}" — ดูเหตุผลในคอมเมนต์`,
  assigned: (t, f) => `${f} มอบหมายงาน "${t}" ให้คุณ`,
  commented: (t, f) => `${f} คอมเมนต์ในงาน "${t}"`,
};

async function notify(
  toUids: string[],
  type: NotiType,
  task: Pick<Task, "id" | "projectId" | "title" | "moduleId">,
  from: UserDoc,
) {
  const targets = [...new Set(toUids)].filter((uid) => uid && uid !== from.uid);
  if (!targets.length) return;
  const batch = writeBatch(db);
  for (const toUid of targets) {
    batch.set(doc(collection(db, "notifications")), {
      toUid,
      fromUid: from.uid,
      taskId: task.id,
      projectId: task.projectId,
      moduleId: task.moduleId ?? null,
      taskTitle: task.title,
      type,
      message: NOTI_MESSAGES[type](task.title, from.displayName),
      read: false,
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function markNotiRead(notiId: string) {
  await updateDoc(doc(db, "notifications", notiId), { read: true });
}

export async function markAllNotisRead(notis: Noti[]) {
  const unread = notis.filter((n) => !n.read);
  if (!unread.length) return;
  const batch = writeBatch(db);
  unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
  await batch.commit();
}

// ---------- projects ----------

export async function createProject(name: string, color: string, uid: string) {
  await addDoc(collection(db, "projects"), {
    name,
    color,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
}

export async function updateProject(id: string, data: Partial<Pick<Project, "name" | "color">>) {
  await updateDoc(doc(db, "projects", id), data);
}

export async function deleteProject(id: string) {
  // ลบ tasks + sprints + modules ของโปรเจกต์ด้วย
  const [tasks, sprints, modules] = await Promise.all([
    getDocs(query(collection(db, "tasks"), where("projectId", "==", id))),
    getDocs(query(collection(db, "sprints"), where("projectId", "==", id))),
    getDocs(query(collection(db, "modules"), where("projectId", "==", id))),
  ]);
  const batch = writeBatch(db);
  tasks.docs.forEach((d) => batch.delete(d.ref));
  sprints.docs.forEach((d) => batch.delete(d.ref));
  modules.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "projects", id));
  await batch.commit();
}

// ---------- tasks ----------

export function nextOrder(tasks: Task[], status: TaskStatus): number {
  const inCol = tasks.filter((t) => t.status === status);
  return inCol.length ? Math.max(...inCol.map((t) => t.order)) + 1 : 1;
}

export async function createTask(
  projectId: string,
  moduleId: string | null,
  title: string,
  status: TaskStatus,
  order: number,
  me: UserDoc,
) {
  await addDoc(collection(db, "tasks"), {
    projectId,
    moduleId,
    title,
    description: "",
    status,
    rejected: false,
    rejectedCount: 0,
    assigneeUid: null,
    sprintId: null,
    order,
    createdBy: me.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    commentCount: 0,
  });
}

export async function updateTask(id: string, data: Partial<Omit<Task, "id">>) {
  await updateDoc(doc(db, "tasks", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteTask(id: string) {
  const comments = await getDocs(collection(db, `tasks/${id}/comments`));
  const batch = writeBatch(db);
  comments.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, "tasks", id));
  await batch.commit();
}

export async function assignTask(task: Task, assigneeUid: string | null, me: UserDoc) {
  await updateTask(task.id, { assigneeUid });
  if (assigneeUid) await notify([assigneeUid], "assigned", task, me);
}

/** ย้ายสเตตัส (จากการลากหรือ dropdown) พร้อม side effects: ล้าง rejected + noti tester */
export async function moveTask(
  task: Task,
  status: TaskStatus,
  order: number,
  me: UserDoc,
  users: UserDoc[],
) {
  const data: Partial<Task> = { status, order };
  // เริ่มงานใหม่หลังโดน reject → ล้างป้าย
  if (task.rejected && task.status === "todo" && status !== "todo") data.rejected = false;
  await updateTask(task.id, data);
  if (status === "test" && task.status !== "test") {
    const testers = users.filter((u) => u.role === "tester").map((u) => u.uid);
    await notify(testers, "moved_to_test", task, me);
  }
}

export async function approveTask(task: Task, me: UserDoc, tasks: Task[]) {
  await updateTask(task.id, {
    status: "done",
    rejected: false,
    order: nextOrder(tasks, "done"),
  });
  if (task.assigneeUid) await notify([task.assigneeUid], "approved", task, me);
}

export async function rejectTask(
  task: Task,
  reason: string,
  images: string[],
  me: UserDoc,
  tasks: Task[],
) {
  await addComment(task, reason, images, me, "reject");
  await updateTask(task.id, {
    status: "todo",
    rejected: true,
    rejectedCount: (task.rejectedCount ?? 0) + 1,
    order: nextOrder(tasks, "todo"),
  });
  if (task.assigneeUid) await notify([task.assigneeUid], "rejected", task, me);
}

// ---------- comments ----------

export async function addComment(
  task: Task,
  text: string,
  images: string[],
  me: UserDoc,
  kind: Comment["kind"] = "comment",
) {
  await addDoc(collection(db, `tasks/${task.id}/comments`), {
    text,
    images,
    authorUid: me.uid,
    kind,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "tasks", task.id), { commentCount: increment(1) });
  if (kind === "comment" && task.assigneeUid) {
    await notify([task.assigneeUid], "commented", task, me);
  }
}

// ---------- modules ----------

export async function createModule(projectId: string, name: string, order: number) {
  await addDoc(collection(db, "modules"), {
    projectId,
    name,
    order,
    createdAt: serverTimestamp(),
  });
}

export async function updateModule(id: string, data: Partial<Pick<Module, "name" | "order">>) {
  await updateDoc(doc(db, "modules", id), data);
}

/** ลบ module — การ์ดข้างในย้ายไป bucket ทั่วไป (moduleId = null) */
export async function deleteModule(id: string, tasks: Task[]) {
  const batch = writeBatch(db);
  tasks
    .filter((t) => t.moduleId === id)
    .forEach((t) => batch.update(doc(db, "tasks", t.id), { moduleId: null }));
  batch.delete(doc(db, "modules", id));
  await batch.commit();
}

export async function setTaskModule(taskId: string, moduleId: string | null) {
  await updateTask(taskId, { moduleId });
}

// ---------- sprints ----------

export async function createSprint(
  projectId: string,
  name: string,
  startDate: string,
  endDate: string,
) {
  await addDoc(collection(db, "sprints"), {
    projectId,
    name,
    startDate,
    endDate,
    status: "planned",
    createdAt: serverTimestamp(),
  });
}

export async function updateSprint(id: string, data: Partial<Omit<Sprint, "id">>) {
  await updateDoc(doc(db, "sprints", id), data);
}

export async function deleteSprint(id: string, tasks: Task[]) {
  const batch = writeBatch(db);
  tasks
    .filter((t) => t.sprintId === id)
    .forEach((t) => batch.update(doc(db, "tasks", t.id), { sprintId: null }));
  batch.delete(doc(db, "sprints", id));
  await batch.commit();
}

export async function setTaskSprint(taskId: string, sprintId: string | null) {
  await updateTask(taskId, { sprintId });
}

// ---------- users ----------

export async function setUserRole(uid: string, role: UserDoc["role"]) {
  await updateDoc(doc(db, "users", uid), { role });
}
