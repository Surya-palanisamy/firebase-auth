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
  photoURL?: string | null;
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
    photoURL: "",
  });

  const [loading, setLoading] = useState(true);

  // -------------------------------
  // Fetch User + Firestore Profile
  // -------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setSettings({
          fullName: "",
          email: "",
          phone: "",
          theme: "system",
          twoFactorEnabled: false,
          photoURL: "",
        });
        setLoading(false);
        return;
      }

      // Load Firestore profile
      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);

      const stored = snap.exists() ? snap.data() : {};

      setSettings({
        fullName: firebaseUser.displayName || stored.fullName || "",
        email: firebaseUser.email || stored.email || "",
        phone: stored.phone || "",
        theme: stored.theme || "system",
        twoFactorEnabled: stored.twoFactorEnabled || false,
        photoURL: firebaseUser.photoURL || stored.photoURL || "",
      });

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // -------------------------------
  // Save Account Settings
  // -------------------------------
  const saveAccountSettings = useCallback(
    async (data: { fullName: string; email: string; phone: string; avatarBase64?: string | null }) => {
      try {
        setLoading(true);

        if (!auth.currentUser) return false;

        const user = auth.currentUser;
        const userRef = doc(db, "users", user.uid);

        // update Firebase Auth name + avatar
        await updateProfile(user, {
          displayName: data.fullName,
          photoURL: data.avatarBase64 || user.photoURL || null,
        });

        // update email in Firebase Auth
        if (data.email !== user.email) await updateEmail(user, data.email);

        // update Firestore profile
        await setDoc(
          userRef,
          {
            uid: user.uid,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            photoURL: data.avatarBase64 || user.photoURL || null,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );

        // update UI instantly
        setSettings((prev) => ({
          ...prev,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          photoURL: data.avatarBase64 || prev.photoURL,
        }));

        setLoading(false);
        return true;
      } catch (err) {
        console.error("Error saving account:", err);
        setLoading(false);
        return false;
      }
    },
    [],
  );

  // -------------------------------
  // Save Preferences (Theme)
  // -------------------------------
  const savePreferences = useCallback(async (data: { theme: string }) => {
    try {
      if (!auth.currentUser) return false;
      const user = auth.currentUser;
      const ref = doc(db, "users", user.uid);

      await updateDoc(ref, { theme: data.theme });

      setSettings((prev) => ({ ...prev, theme: data.theme as any }));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, []);

  // -------------------------------
  // Save Security Settings
  // -------------------------------
  const saveSecuritySettings = useCallback(async (data: any) => {
    try {
      if (!auth.currentUser) return false;

      const user = auth.currentUser;
      const ref = doc(db, "users", user.uid);

      await updateDoc(ref, {
        twoFactorEnabled: data.twoFactorEnabled,
      });

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
    saveAccountSettings,
    savePreferences,
    saveSecuritySettings,
  };
};
