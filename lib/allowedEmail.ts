import type { User } from "firebase/auth";

export const ALLOWED_EMAIL_HINT = "ชื่อ.workmotion@gmail.com";

const ALLOWED_EMAIL = /^[^@\s]+\.workmotion@gmail\.com$/i;

export function isAllowedEmail(email: string | null | undefined): boolean {
  return !!email && ALLOWED_EMAIL.test(email.trim());
}

export function isAllowedUser(user: User): boolean {
  return isAllowedEmail(user.email) && user.emailVerified;
}
