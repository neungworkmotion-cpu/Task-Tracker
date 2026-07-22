"use client";

const MAX_DIM = 1280;
const QUALITY = 0.7;
// Firestore จำกัด 1MB/doc — กันที่ 700KB รวมต่อคอมเมนต์/ต่อไฟล์แนบ
export const MAX_COMMENT_IMAGE_BYTES = 700 * 1024;
export const MAX_ATTACHMENT_BYTES = 700 * 1024;

/** อ่านไฟล์ใดๆ เป็น base64 data URL (สำหรับไฟล์ที่ไม่ใช่รูป) */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** ย่อรูปด้วย canvas แล้วคืน base64 data URL (JPEG) */
export async function compressImage(file: File | Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", QUALITY);
}

export function dataUrlBytes(dataUrl: string): number {
  return Math.ceil((dataUrl.length * 3) / 4);
}

/** ดึงรูปจาก clipboard paste event → base64 (คืน [] ถ้าไม่มีรูป) */
export async function imagesFromPaste(e: ClipboardEvent): Promise<string[]> {
  const files = Array.from(e.clipboardData?.items ?? [])
    .filter((it) => it.type.startsWith("image/"))
    .map((it) => it.getAsFile())
    .filter((f): f is File => !!f);
  return Promise.all(files.map(compressImage));
}
