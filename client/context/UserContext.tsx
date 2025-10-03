import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { friendlyAuthError } from "@/lib/auth";

export type User = {
  uid: string;
  name: string;
  email?: string;
  photoURL?: string | null;
} | null;

type Ctx = {
  user: User;
  setUser: (u: User) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const UserContext = createContext<Ctx>({
  user: null,
  setUser: () => {},
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
});

function mapUser(u: FirebaseUser | null): User {
  if (!u) return null;
  return {
    uid: u.uid,
    name: u.displayName || u.email?.split("@")[0] || "Member",
    email: u.email ?? undefined,
    photoURL: u.photoURL ?? null,
  };
}

function withTimeout<T>(p: Promise<T>, ms = 20000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Network timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsub = onAuthStateChanged(auth, async (u) => {
      const mapped = mapUser(u);
      setUser(mapped);
      if (mapped?.uid) {
        try {
          await setDoc(
            doc(db, "users", mapped.uid),
            {
              uid: mapped.uid,
              name: mapped.name,
              email: mapped.email || null,
              updatedAt: Date.now(),
            },
            { merge: true },
          );
        } catch {}
      }
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await withTimeout(
        signInWithEmailAndPassword(auth, email.trim(), password),
        20000,
      );
    } catch (e: any) {
      throw new Error(friendlyAuthError(e));
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      const cred = await withTimeout(
        createUserWithEmailAndPassword(auth, email.trim(), password),
        20000,
      );
      if (auth.currentUser && name) {
        await updateProfile(auth.currentUser, { displayName: name });
      }
      const mapped = mapUser(cred.user);
      setUser(mapped);
      if (mapped?.uid) {
        try {
          await setDoc(
            doc(db, "users", mapped.uid),
            {
              uid: mapped.uid,
              name: mapped.name,
              email: mapped.email || null,
              createdAt: Date.now(),
            },
            { merge: true },
          );
        } catch {}
      }
    } catch (e: any) {
      throw new Error(friendlyAuthError(e));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = useMemo(
    () => ({ user, setUser, login, signup, logout, resetPassword }),
    [user],
  );
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
