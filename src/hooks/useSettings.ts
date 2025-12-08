// src/hooks/useSettings.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  updateEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { getFirebaseAuth, getFirebaseDb } from "../firebase/client";

export interface SettingsData {
  fullName: string;
  email: string;
  phone: string;
  theme: "light" | "dark" | "system";
  twoFactorEnabled: boolean;
}

export const useSettings = () => {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const [settings, setSettings] = useState<SettingsData>({
    fullName: "",
    email: "",
    phone: "",
    theme: "system",
    twoFactorEnabled: false,
  });

  const [loading, setLoading] = useState(true);

  /* -------------------------------------------------
     Load user + firestore profile
  -------------------------------------------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (!firebaseUser) {
          setSettings({
            fullName: "",
            email: "",
            phone: "",
            theme: "system",
            twoFactorEnabled: false,
          });
          setLoading(false);
          return;
        }

        try {
          const ref = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(ref);
          const stored = snap.exists() ? snap.data() : {};

          setSettings({
            fullName: stored.fullName ?? firebaseUser.displayName ?? "",
            email: stored.email ?? firebaseUser.email ?? "",
            phone: stored.phone ?? "",
            theme: stored.theme ?? "system",
            twoFactorEnabled: stored.twoFactorEnabled ?? false,
          });
        } catch (err) {
          console.error("Failed to load user settings:", err);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsub();
  }, [auth, db]);

  /* -------------------------------------------------
     Save Profile (Full Name, Email, Phone, Avatar)
     - IMPORTANT: never write `undefined` to Firestore.
     - Only write photoBase64 when explicitly provided (string or null).
  -------------------------------------------------- */
  const saveProfile = useCallback(
    async (data: { fullName: string; email: string; phone: string }) => {
      try {
        const user = auth.currentUser;
        if (!user) return false;

        setLoading(true);

        // Update Firebase Auth displayName and optionally photoURL
        // update email in Firebase Auth if changed
        if (data.email !== user.email) {
          await updateEmail(user, data.email);
        }

        // Build Firestore payload WITHOUT undefined fields.
        const ref = doc(db, "users", user.uid);
        const payload: Record<string, any> = {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          updatedAt: serverTimestamp(),
        };
        // Perform the set/merge
        await setDoc(ref, payload, { merge: true });

        // Reload auth user so currentUser fields reflect changes
        try {
          // If updateEmail was called this may require reauth in some cases, but we'll attempt reload.
          // If reload fails for security reasons, UI will still reflect Firestore values next time on login.
          await (auth.currentUser as any)?.reload?.();
        } catch (reloadErr) {
          // ignore reload errors; we'll still update UI from known values
          console.warn("Auth reload failed (non-fatal):", reloadErr);
        }

        // Refresh currentUser reference after reload (may be same object)
        const refreshed = auth.currentUser;

        // Update UI state instantly.
        setSettings((prev) => ({
          ...prev,
          fullName: refreshed?.displayName ?? data.fullName,
          email: refreshed?.email ?? data.email,
          phone: data.phone,
        }));

        setLoading(false);
        return true;
      } catch (err) {
        console.error("Profile update error:", err);
        setLoading(false);
        return false;
      }
    },
    [auth, db]
  );

  /* -------------------------------------------------
     Save Preferences
  -------------------------------------------------- */
  const savePreferences = useCallback(
    async (data: { theme: string }) => {
      try {
        if (!auth.currentUser) return false;

        const ref = doc(db, "users", auth.currentUser.uid);
        await updateDoc(ref, { theme: data.theme });

        setSettings((prev) => ({ ...prev, theme: data.theme as any }));
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    [auth, db]
  );

  /* -------------------------------------------------
     Save Security
  -------------------------------------------------- */
  const saveSecurity = useCallback(
    async (data: any) => {
      try {
        if (!auth.currentUser) return false;

        const ref = doc(db, "users", auth.currentUser.uid);
        await updateDoc(ref, { twoFactorEnabled: data.twoFactorEnabled });

        setSettings((prev) => ({
          ...prev,
          twoFactorEnabled: data.twoFactorEnabled,
        }));

        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    [auth, db]
  );

  return {
    settings,
    loading,
    saveProfile,
    savePreferences,
    saveSecurity,
  };
};
