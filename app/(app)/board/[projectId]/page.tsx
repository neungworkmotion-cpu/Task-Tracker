"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** route เดิมก่อนมีชั้น module — redirect ไปหน้ารายการ module */
export default function LegacyBoardRedirect() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/project/${projectId}`);
  }, [projectId, router]);
  return null;
}
