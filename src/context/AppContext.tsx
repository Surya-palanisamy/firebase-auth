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
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "../firebase/client";
import { useAuth } from "../hooks/useAuth";
import { generateMockAlerts } from "../services/mapService";

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

  /* Notifications API */
  addAlert: (alert: Omit<Alert, "id" | "timestamp" | "read">) => void;
  sendEmergencyBroadcast: (message: string, district?: string) => Promise<void>;
  markAlertAsRead: (id: string) => void;
  clearAllAlerts: () => void;
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

      const notificationList: Alert[] = generated.map((a: any, i: number) => ({
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

      setAlerts(notificationList);
      setIsLoading(false);
    };

    void load();
  }, []);

  /* ---------------- SYNC FIREBASE USER ---------------- */
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
          email: authUser.email ?? "",
          role: authUser.role ?? "User",
          avatar,
          phone: authUser.phone ?? null,
        });
      } catch (err) {
        console.error("User sync error:", err);
      }

      setIsLoading(false);
    };

    void sync();
  }, [authUser]);

  /* ---------------- LOGOUT ---------------- */
  const logout = async () => {
    try {
      await logOut();
    } catch (err) {
      console.warn("Logout error:", err);
    }
    setUser(null);
  };

  /* ---------------- ALERTS API ---------------- */

  const addAlert = (alert: Omit<Alert, "id" | "timestamp" | "read">) => {
    const newAlert: Alert = {
      ...alert,
      id: `A${String(alerts.length + 1).padStart(3, "0")}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setAlerts((prev) => [newAlert, ...prev]);
  };

  const markAlertAsRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const clearAllAlerts = () => setAlerts([]);

  const sendEmergencyBroadcast = async (message: string, district?: string) => {
    await new Promise((res) => setTimeout(res, 800));

    addAlert({
      title: "Emergency Broadcast",
      message: district ? `[${district}] ${message}` : message,
      type: "error",
    });
  };

  /* ---------------- REFRESH DATA ---------------- */
  const refreshData = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
  };

  /* ---------------- CONTEXT VALUE ---------------- */
  const value: AppContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || authLoading,
    alerts,

    refreshData,
    logout,

    addAlert,
    sendEmergencyBroadcast,
    markAlertAsRead,
    clearAllAlerts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/* ---------------- HOOK ---------------- */
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};
