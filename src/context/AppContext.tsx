// context/AppContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../hooks/useAuth";
import type { Unsubscribe } from "firebase/firestore";

import {
  subscribeAlerts,
  subscribeShelters,
  subscribeCoordinators,
  subscribeResources,
  fetchFloodLevels,
} from "../services/firestoreService";

import { getFirebaseDb } from "../firebase/client";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";

/* ---------------- TYPES ------------------ */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: string;
  read: boolean;
}

export interface Shelter {
  id: string;
  name: string;
  location: string;
  capacity: string;
  status: "Available" | "Near Full" | "Full";
  resources: "Adequate" | "Low" | "None";
  contact: string;
}

export interface Coordinator {
  id: string;
  name: string;
  avatar?: string | null;
  role: string;
  shelter: string;
  phone: string;
}

export interface ResourceItem {
  id: string;
  name: string;
  percentage: number;
  icon?: React.ReactNode;
}

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  userLocation: { lat: number; lng: number } | null;

  alerts: Alert[];
  shelters: Shelter[];
  coordinators: Coordinator[];
  resources: ResourceItem[];

  refreshData: () => Promise<void>;
  logout: () => Promise<void>;

  addAlert: (alert: Omit<Alert, "id" | "timestamp" | "read">) => void;
  markAlertAsRead: (id: string) => void;
  clearAllAlerts: () => void;

  sendEmergencyBroadcast: (message: string, district?: string) => Promise<void>;
}

/* ---------------- CONTEXT ------------------ */

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser, loading: authLoading, logOut } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  /* ---------------- USER LOCATION ---------------- */
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 13.0827, lng: 80.2707 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setUserLocation({ lat: 13.0827, lng: 80.2707 })
    );
  }, []);

  /* ---------------- APP DATA (Realtime) ---------------- */
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);

  /* ---------------- Realtime Subscriptions ---------------- */
  useEffect(() => {
    let unsubAlerts: Unsubscribe | null = null;
    let unsubShelters: Unsubscribe | null = null;
    let unsubCoordinators: Unsubscribe | null = null;
    let unsubResources: Unsubscribe | null = null;

    try {
      unsubAlerts = subscribeAlerts((items) => setAlerts(items));
      unsubShelters = subscribeShelters((items) => setShelters(items));
      unsubCoordinators = subscribeCoordinators((items) =>
        setCoordinators(items)
      );
      unsubResources = subscribeResources((items) => setResources(items));
    } catch (err) {
      console.error("Realtime subscribe error", err);
    }

    return () => {
      unsubAlerts && unsubAlerts();
      unsubShelters && unsubShelters();
      unsubCoordinators && unsubCoordinators();
      unsubResources && unsubResources();
    };
  }, []);

  /* ---------------- FIRESTORE WRITE HELPERS ---------------- */
  const db = getFirebaseDb();

  /** Add new alert */
  const addAlert = async (alert: Omit<Alert, "id" | "timestamp" | "read">) => {
    try {
      await addDoc(collection(db, "alerts"), {
        ...alert,
        read: false,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("addAlert error", err);
    }
  };

  /** Mark alert as read */
  const markAlertAsRead = async (id: string) => {
    // Optimistic UI update
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );

    try {
      await updateDoc(doc(db, "alerts", id), { read: true });
    } catch (err) {
      console.error("markAlertAsRead error:", err);

      // rollback optimistic update
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, read: false } : a))
      );
    }
  };

  /** Clear all alerts */
  const clearAllAlerts = async () => {
    try {
      const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);

      if (snap.empty) {
        setAlerts([]);
        return;
      }

      const chunkSize = 450;
      const docs = snap.docs;

      for (let i = 0; i < docs.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + chunkSize);

        chunk.forEach((d) => {
          batch.delete(doc(db, "alerts", d.id));
        });

        await batch.commit();
      }

      setAlerts([]);
    } catch (err) {
      console.error("clearAllAlerts error:", err);
    }
  };

  /* ---------------- EMERGENCY BROADCAST ---------------- */
  const sendEmergencyBroadcast = async (message: string, district?: string) => {
    try {
      const payload = {
        title: "Emergency Broadcast",
        message: district
          ? `To ${district}: ${message}`
          : `All regions: ${message}`,
        type: "warning" as Alert["type"],
        read: false,
        timestamp: new Date().toISOString(),
        meta: { broadcast: true, district: district ?? null },
      };

      await addDoc(collection(db, "alerts"), payload);
    } catch (err) {
      console.error("sendEmergencyBroadcast error", err);
    }
  };

  /* ---------------- USER SYNC ---------------- */
  useEffect(() => {
    if (!authUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setUser({
      id: authUser.uid,
      name: authUser.displayName ?? "User",
      email: authUser.email ?? "",
      role: "User",
      phone: (authUser as any).phone ?? null,
    });

    setIsLoading(false);
  }, [authUser]);

  /* ---------------- REFRESH ---------------- */
  const refreshData = async () => {
    await new Promise((r) => setTimeout(r, 700));

    try {
      const levels = await fetchFloodLevels();
      console.log("floodLevels:", levels);
    } catch (err) {
      console.error("refreshData error", err);
    }
  };

  const logout = async () => {
    await logOut();
    setUser(null);
  };

  /* ---------------- CONTEXT VALUE ---------------- */

  const value: AppContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || authLoading,

    userLocation,

    alerts,
    shelters,
    coordinators,
    resources,

    refreshData,
    logout,

    addAlert,
    markAlertAsRead,
    clearAllAlerts,
    sendEmergencyBroadcast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};
