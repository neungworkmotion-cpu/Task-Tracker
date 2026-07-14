# Task Tracker

เว็บ track งานแบบ Kanban + Sprint — Next.js + Firebase (Auth + Firestore) ไม่มี backend แยก

## ฟีเจอร์

- **Kanban board** 4 คอลัมน์: Todo / Doing / Test / Done — ลากการ์ดเปลี่ยนสเตตัส, real-time sync
- **Assignee** — เลือกคนรับงาน + filter ตามคน
- **Sprint planning** — สร้างสปรินต์กำหนดช่วงวัน แล้วลากการ์ดจาก backlog เข้าสปรินต์
- **Comment + วางรูป** — แคปจอแล้ว Ctrl+V ในช่องคอมเมนต์ได้เลย (ย่อรูปอัตโนมัติ เก็บใน Firestore)
- **Approve / Reject** — การ์ดในคอลัมน์ Test กดผ่าน/ไม่ผ่านได้ ถ้า reject ต้องใส่เหตุผล การ์ดเด้งกลับ Todo พร้อมป้ายแดง
- **Notification** — ลากเข้า Test แจ้งเตือน tester ทุกคน, approve/reject แจ้งเตือนคนทำ, real-time
- **Role** — admin / dev / tester (คนแรกที่ login เป็น admin, เปลี่ยน role ที่หน้า Team)

## Setup

1. `cp .env.example .env.local` แล้วเติมค่าจาก Firebase Console → Project settings → Your apps → Web
2. ใน Firebase Console:
   - Authentication → Sign-in method → เปิด **Google** และ **Email/Password**
   - เปิดใช้ **Firestore Database**
   - deploy rules: `firebase deploy --only firestore:rules` หรือ copy เนื้อหา `firestore.rules` ไปวางใน Console → Firestore → Rules
3. ต้องใช้ **Node 20+** (`nvm use`)
4. `npm install && npm run dev` → http://localhost:3000

## Deploy (Netlify)

1. push repo ขึ้น GitHub → Netlify "Import from Git" (ตรวจเจอ Next.js อัตโนมัติ)
2. ตั้ง env vars `NEXT_PUBLIC_FIREBASE_*` ใน Netlify → Site settings → Environment variables
3. Firebase Console → Authentication → Settings → **Authorized domains** → เพิ่ม `<site>.netlify.app`
