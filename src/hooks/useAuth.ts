"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { getFirebaseAuth, getFirebaseDb } from "../firebase/client";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;    // Firestore fullName
  photoURL: string | null;       // Firestore avatar
  phone: string | null;          // NEW
  role: string | null;           // NEW
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch Firestore user profile
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);

        let profile = null;

        if (snap.exists()) {
          profile = snap.data();
        }

        // Merge Firebase Auth + Firestore data
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: profile?.fullName ?? firebaseUser.displayName ?? null,
          photoURL: profile?.avatar ?? firebaseUser.photoURL ?? null,
          phone: profile?.phone ?? null,
          role: profile?.role ?? "User",
        });
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null);
    const auth = getFirebaseAuth();
    await createUserWithEmailAndPassword(auth, email, password);
  }, []);

  const logOut = useCallback(async () => {
    setError(null);
    const auth = getFirebaseAuth();
    await signOut(auth);
  }, []);

  return { user, loading, error, signIn, signUp, logOut };
};
