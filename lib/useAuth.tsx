"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { UserDoc } from "./types";

interface AuthState {
  user: User | null;
  profile: UserDoc | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
});

async function upsertUserDoc(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // คนแรกของระบบเป็น admin ที่เหลือ default เป็น dev
    const anyUser = await getDocs(query(collection(db, "users"), limit(1)));
    const role = anyUser.empty ? "admin" : "dev";
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || user.email?.split("@")[0] || "user",
      email: user.email || "",
      photoURL: user.photoURL || null,
      role,
      lastLoginAt: serverTimestamp(),
    });
  } else {
    await setDoc(
      ref,
      {
        displayName: user.displayName || snap.data().displayName,
        photoURL: user.photoURL || snap.data().photoURL || null,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;
    const unsub = onAuthStateChanged(auth, async (u) => {
      unsubProfile?.();
      unsubProfile = undefined;
      setUser(u);
      if (u) {
        try {
          await upsertUserDoc(u);
        } catch (e) {
          console.error("upsert user failed", e);
        }
        unsubProfile = onSnapshot(doc(db, "users", u.uid), (snap) => {
          setProfile(snap.exists() ? (snap.data() as UserDoc) : null);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => {
      unsub();
      unsubProfile?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
