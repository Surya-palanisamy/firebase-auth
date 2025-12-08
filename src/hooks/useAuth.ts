// src/hooks/useAuth.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
  updateProfile,
  updateEmail,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "../firebase/client";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null; // firebase auth name (or firestore fullName)
  photoURL: string | null; // firebase auth photoURL (usually small or null)
  photoBase64?: string | null; // Firestore base64 avatar (preferred)
  phone?: string | null; // Firestore phone
  role?: string | null; // Firestore role
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();

    const unsub = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setLoading(true);
      try {
        if (!fbUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // try load Firestore profile
        const userRef = doc(db, "users", fbUser.uid);
        const snap = await getDoc(userRef);
        const profile = snap.exists() ? (snap.data() as any) : {};

        setUser({
          uid: fbUser.uid,
          email: fbUser.email ?? null,
          displayName: profile.fullName ?? fbUser.displayName ?? null,
          photoURL: fbUser.photoURL ?? null,
          photoBase64: profile.photoBase64 ?? null,
          phone: profile.phone ?? null,
          role: profile.role ?? (profile.role ? profile.role : "User"),
        });
      } catch (err) {
        console.error("useAuth onAuthStateChanged error:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const auth = getFirebaseAuth();
    return signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    const auth = getFirebaseAuth();
    return createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const logOut = useCallback(async () => {
    setError(null);
    const auth = getFirebaseAuth();
    await signOut(auth);
  }, []);

  return { user, loading, error, signIn, signUp, logOut };
};
