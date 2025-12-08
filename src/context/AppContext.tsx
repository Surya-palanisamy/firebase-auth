// src/context/AppContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "../firebase/client";
import { useAuth } from "../hooks/useAuth";
import { Droplet, Home, ShoppingBag } from "lucide-react";
import { floodProneAreas, generateMockAlerts, tamilNaduDistricts } from "../services/mapService";

/* --- types (kept minimal — expand as needed) --- */
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null; // prefer base64 stored in Firestore (photoBase64) — we'll expose as avatar here
  phone?: string | null;
}

/* --- other domain types omitted for brevity in this snippet; keep as in your project --- */
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

interface AppContextType {
  // ... add what you need. I'm exposing a subset here
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  alerts: Alert[];
  refreshData: () => Promise<void>;
  // other actions...
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null); // app-level user merged
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mapAlerts, setMapAlerts] = useState<any[]>([]);

  // load mock data (keep your previous mock generator)
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      // mock map alerts
      setMapAlerts(generateMockAlerts());
      // create alerts from mapAlerts
      const notificationAlerts: Alert[] = generateMockAlerts().map((a: any, i: number) => ({
        id: `A${String(i + 1).padStart(3, "0")}`,
        title: a.type,
        message: a.description,
        type: a.severity === "Critical" ? "error" : a.severity === "High" ? "warning" : "info",
        timestamp: new Date().toISOString(),
        read: false,
        location: a.location,
        district: a.district,
        severity: a.severity,
        coordinates: a.coordinates,
      }));
      setAlerts(notificationAlerts);
      setIsLoading(false);
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When authUser changes, merge Firestore profile (photoBase64, phone etc.) into app user
  useEffect(() => {
    const syncUser = async () => {
      setIsLoading(true);
      try {
        if (!authUser) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // If authUser already has photoBase64, it's already merged by useAuth - convert to app user
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
        console.error("AppContext syncUser error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    void syncUser();
  }, [authUser]);

  // helper: save new firebase-auth user into Firestore (on signup)
  const saveUserToFirestore = async (fbUser: FirebaseUser | null, extra: Partial<User> = {}) => {
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
        { merge: true },
      );
    } catch (err) {
      console.warn("saveUserToFirestore failed:", err);
    }
  };

  const refreshData = async () => {
    // your real data refresh logic
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
  };

  const value: AppContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || authLoading,
    alerts,
    refreshData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};
