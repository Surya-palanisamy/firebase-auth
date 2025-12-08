"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User as FirebaseUser } from "firebase/auth";
import { useAuth } from "../hooks/useAuth";
import { generateMockAlerts } from "../services/mapService";

/* --------------------------------------------
   TYPES
--------------------------------------------- */

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

/* --------------------------------------------
   CONTEXT SETUP
--------------------------------------------- */

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser, loading: authLoading, logOut } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const [user, setUser] = useState<User | null>(null);

  /* --------------------------------------------
     USER LOCATION (GPS)
  --------------------------------------------- */
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation({ lat: 13.0827, lng: 80.2707 }); // fallback
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setUserLocation({ lat: 13.0827, lng: 80.2707 }); // fallback
      }
    );
  }, []);

  /* --------------------------------------------
     STATIC DATA (Shelters / Coordinators)
  --------------------------------------------- */

  const [shelters, setShelters] = useState<Shelter[]>([
    {
      id: "SH1",
      name: "Govt High School",
      location: "Chennai",
      capacity: "40/250",
      status: "Available",
      resources: "Adequate",
      contact: "9876543210",
    },
    {
      id: "SH2",
      name: "Community Hall",
      location: "Vellore",
      capacity: "180/200",
      status: "Near Full",
      resources: "Low",
      contact: "9000000000",
    },
    {
      id: "SH3",
      name: "Town Shelter",
      location: "Madurai",
      capacity: "200/200",
      status: "Full",
      resources: "None",
      contact: "9123456780",
    },
  ]);

  const [coordinators, setCoordinators] = useState<Coordinator[]>([
    {
      id: "C1",
      name: "Rahul Kumar",
      role: "Coordinator",
      shelter: "Govt High School",
      phone: "9876543210",
      avatar: null,
    },
    {
      id: "C2",
      name: "Anitha Devi",
      role: "Lead Coordinator",
      shelter: "Community Hall",
      phone: "9000000001",
      avatar: null,
    },
  ]);

  const [resources, setResources] = useState<ResourceItem[]>([
    { id: "R1", name: "Food Supplies", percentage: 75 },
    { id: "R2", name: "Water Stock", percentage: 45 },
    { id: "R3", name: "Medical Kits", percentage: 20 },
  ]);

  /* --------------------------------------------
     ALERT SYSTEM
  --------------------------------------------- */

  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const raw = generateMockAlerts();
    const formatted = raw.map((a, i) => {
      const alertType: Alert["type"] =
        a.severity === "Critical"
          ? "error"
          : a.severity === "High"
          ? "warning"
          : "info";
      return {
        id: `A${i + 1}`,
        title: a.type,
        message: a.description,
        timestamp: new Date().toISOString(),
        read: false,
        type: alertType,
      };
    });
    setAlerts(formatted);
  }, []);

  const addAlert = (alert: Omit<Alert, "id" | "timestamp" | "read">) => {
    setAlerts((prev) => [
      {
        id: `A${prev.length + 1}`,
        timestamp: new Date().toISOString(),
        read: false,
        ...alert,
      },
      ...prev,
    ]);
  };

  const markAlertAsRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const clearAllAlerts = () => setAlerts([]);

  /* --------------------------------------------
     EMERGENCY BROADCAST FUNCTION
  --------------------------------------------- */

  const sendEmergencyBroadcast = async (message: string, district?: string) => {
    console.log("Broadcast:", message, "District:", district);

    await new Promise((res) => setTimeout(res, 700));

    addAlert({
      title: "Broadcast Sent",
      message: district
        ? `Message sent to ${district}: ${message}`
        : `Message sent to all regions: ${message}`,
      type: "success",
    });
  };

  /* --------------------------------------------
     USER SYNC
  --------------------------------------------- */

  useEffect(() => {
    if (!authUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setUser({
      id: authUser.uid,
      name: authUser.displayName ?? "User",
      email: authUser.email!,
      role: "User",
      avatar: (authUser as any).photoBase64 ?? authUser.photoURL ?? null,
      phone: (authUser as any).phone ?? null,
    });

    setIsLoading(false);
  }, [authUser]);

  /* --------------------------------------------
     BASIC REFRESH
  --------------------------------------------- */

  const refreshData = async () => {
    await new Promise((r) => setTimeout(r, 800));
  };

  const logout = async () => {
    await logOut();
    setUser(null);
  };

  /* --------------------------------------------
     CONTEXT VALUE
  --------------------------------------------- */

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
