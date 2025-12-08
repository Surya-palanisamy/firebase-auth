// src/context/AppContext.tsx
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { User as FirebaseUser } from "firebase/auth";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "../firebase/client";
import { useAuth } from "../hooks/useAuth";
import {
  floodProneAreas,
  generateMockAlerts,
  tamilNaduDistricts,
} from "../services/mapService";

/* ---------------- USER TYPE ---------------- */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
}

/* ---------------- ALERT TYPE ---------------- */
export interface Alert {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: string;
  read: boolean;
  location?: string;
  district?: string;
  severity?: "Low" | "Medium" | "High" | "Critical";
  coordinates?: [number, number];
}

/* ---------------- CONTEXT TYPE ---------------- */
interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  alerts: Alert[];
  refreshData: () => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* ==========================================================
                      PROVIDER
   ========================================================== */
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser, loading: authLoading, logOut } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /* ---------------- LOAD MOCK ALERTS ---------------- */
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      const generated = generateMockAlerts();

      const notifications: Alert[] = generated.map((a: any, i: number) => ({
        id: `A${String(i + 1).padStart(3, "0")}`,
        title: a.type,
        message: a.description,
        type:
          a.severity === "Critical"
            ? "error"
            : a.severity === "High"
            ? "warning"
            : "info",
        timestamp: new Date().toISOString(),
        read: false,
        location: a.location,
        district: a.district,
        severity: a.severity,
        coordinates: a.coordinates,
      }));

      setAlerts(notifications);
      setIsLoading(false);
    };

    void load();
  }, []);

  /* ---------------- SYNC FIREBASE AUTH USER INTO APP USER ---------------- */
  useEffect(() => {
    const sync = async () => {
      setIsLoading(true);

      try {
        if (!authUser) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        const avatar = authUser.photoBase64 ?? authUser.photoURL ?? null;

        setUser({
          id: authUser.uid,
          name: authUser.displayName ?? "User",
          email: authUser.email ?? "unknown@example.com",
          role: authUser.role ?? "User",
          avatar,
          phone: authUser.phone ?? null,
        });
      } catch (err) {
        console.error("AppContext sync user error:", err);
      }

      setIsLoading(false);
    };

    void sync();
  }, [authUser]);

  /* ---------------- SAVE USER IN FIRESTORE (USED ON SIGNUP) ---------------- */
  const saveUserToFirestore = async (
    fbUser: FirebaseUser | null,
    extra: Partial<User> = {}
  ) => {
    if (!fbUser) return;
    try {
      const db = getFirebaseDb();
      const ref = doc(db, "users", fbUser.uid);

      await setDoc(
        ref,
        {
          uid: fbUser.uid,
          fullName: fbUser.displayName ?? extra.name ?? "User",
          email: fbUser.email ?? extra.email ?? null,
          photoBase64: extra.avatar ?? null,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Failed to save user:", err);
    }
  };

  /* ---------------- DATA REFRESH ---------------- */
  const refreshData = async () => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 700));
    setIsLoading(false);
  };

  /* ---------------- LOGOUT FUNCTION ---------------- */
  const logout = async () => {
    try {
      await logOut(); // firebase logout
    } catch (err) {
      console.warn("Logout error:", err);
    }

    setUser(null); // clear user context
  };

  /* ---------------- CONTEXT VALUE ---------------- */
  const value: AppContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || authLoading,
    alerts,
    refreshData,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/* ---------------- HOOK ---------------- */
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};
