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
  photoBase64?: string | null;   // IMPORTANT FIX
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
    photoBase64: "",
  });

  const [loading, setLoading] = useState(true);

  // LOAD FIRESTORE USER
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
            photoBase64: "",
          });
          setLoading(false);
          return;
        }

        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : {};

        setSettings({
          fullName: data.fullName ?? firebaseUser.displayName ?? "",
          email: data.email ?? firebaseUser.email ?? "",
          phone: data.phone ?? "",
          theme: data.theme ?? "system",
          twoFactorEnabled: data.twoFactorEnabled ?? false,
          photoBase64: data.photoBase64 ?? null, // FIXED
        });

        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // SAVE PROFILE
  const saveProfile = useCallback(
    async (data: {
      fullName: string;
      email: string;
      phone: string;
      avatarBase64?: string | null;
    }) => {
      try {
        const user = auth.currentUser;
        if (!user) return false;

        setLoading(true);

        // Update Auth basic details
        await updateProfile(user, { displayName: data.fullName });

        if (data.email !== user.email) {
          await updateEmail(user, data.email);
        }

        const ref = doc(db, "users", user.uid);

        await setDoc(
          ref,
          {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            photoBase64: data.avatarBase64 ?? undefined, // FIXED
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Update UI instantly
        setSettings((prev) => ({
          ...prev,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          photoBase64: data.avatarBase64 ?? prev.photoBase64,
        }));

        setLoading(false);
        return true;
      } catch (err) {
        console.error("Profile update error:", err);
        setLoading(false);
        return false;
      }
    },
    []
  );

  const savePreferences = useCallback(async (data: { theme: string }) => {
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
  }, []);

  const saveSecurity = useCallback(async (data: any) => {
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
  }, []);

  return {
    settings,
    loading,
    saveProfile,
    savePreferences,
    saveSecurity,
  };
};
