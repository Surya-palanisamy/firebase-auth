"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Droplet, Home, ShoppingBag } from "lucide-react";
import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getFirebaseDb } from "../firebase/client";
import { useAuth } from "../hooks/useAuth";
import { floodProneAreas, generateMockAlerts, tamilNaduDistricts } from "../services/mapService";

/** ---------- Types ---------- **/

export interface Volunteer {
  id: string;
  name: string;
  location: string;
  status: "Active" | "Inactive";
  skills: string[];
  avatar: string;
  coordinates?: { lat: number; lng: number };
}

export interface Team {
  id: string;
  name: string;
  location: string;
  status: "Active" | "On Call" | "Off Duty";
  members: string[];
  coordinates?: { lat: number; lng: number };
}

export interface EmergencyCase {
  id: string;
  location: string;
  type: string;
  priority: "High" | "Medium" | "Low";
  volunteersAssigned: number;
  description?: string;
  timestamp: string;
  coordinates?: { lat: number; lng: number };
}

export interface HelpRequest {
  id: string;
  location: string;
  status: "Pending" | "In Progress" | "Completed" | "Rejected";
  description?: string;
  timestamp: string;
  coordinates?: { lat: number; lng: number };
}

export interface Shelter {
  id: string;
  name: string;
  location: string;
  capacity: string;
  status: "Available" | "Near Full" | "Full";
  resources: "Adequate" | "Low" | "Critical";
  contact: string;
  contactId: string;
  coordinates?: { lat: number; lng: number };
}

export interface Coordinator {
  id: string;
  name: string;
  role: string;
  shelter: string;
  avatar: string;
  phone?: string;
  email?: string;
}

export interface Resource {
  id: string;
  name: string;
  percentage: number;
  icon: React.ReactNode;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null; // allow null when no avatar
}

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

export interface MapAlert {
  id: string;
  type: string;
  location: string;
  district: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  time: string;
  coordinates: [number, number];
  description: string;
}

interface AppContextType {
  volunteers: Volunteer[];
  teams: Team[];
  emergencyCases: EmergencyCase[];
  helpRequests: HelpRequest[];
  shelters: Shelter[];
  coordinators: Coordinator[];
  resources: Resource[];
  alerts: Alert[];
  mapAlerts: MapAlert[];
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loginWithGoogle: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  addEmergencyCase: (emergencyCase: Omit<EmergencyCase, "id" | "timestamp">) => Promise<void>;
  updateEmergencyCase: (id: string, updates: Partial<EmergencyCase>) => Promise<void>;
  deleteEmergencyCase: (id: string) => Promise<void>;
  updateHelpRequest: (id: string, status: HelpRequest["status"]) => Promise<void>;
  assignTeam: (emergencyCaseId: string, teamId: string) => Promise<void>;
  addAlert: (alert: Omit<Alert, "id" | "timestamp" | "read">) => void;
  markAlertAsRead: (id: string) => void;
  clearAllAlerts: () => void;
  sendEmergencyBroadcast: (message: string, district?: string) => Promise<void>;
  getUserLocation: () => Promise<void>;
}

/** ---------- Context ---------- **/

const AppContext = createContext<AppContextType | undefined>(undefined);

/** ---------- Helper: map Firebase user -> App User ---------- **/

const mapFirebaseUserToAppUser = (fbUser: FirebaseUser | null): User | null => {
  if (!fbUser) return null;
  return {
    id: fbUser.uid,
    name: fbUser.displayName ?? "User",
    email: fbUser.email ?? "unknown@example.com",
    role: "Admin", // default role; you can load a real role from Firestore if needed
    avatar: fbUser.photoURL ?? null,
  };
};

/** ---------- Provider ---------- **/

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [emergencyCases, setEmergencyCases] = useState<EmergencyCase[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [mapAlerts, setMapAlerts] = useState<MapAlert[]>([]);
  const [localUser, setLocalUser] = useState<User | null>(null); // used for mock logins
  const [isAuthenticatedLocal, setIsAuthenticatedLocal] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Hook from your firebase auth wrapper
  const { user: fbUser, loading: fbLoading, signIn, signUp, logOut } = useAuth();

  // When fbUser exists, prefer it. Otherwise fall back to localUser.
  const user = fbUser ? mapFirebaseUserToAppUser((fbUser as unknown) as FirebaseUser) : localUser;
  const isAuthenticated = !!fbUser || isAuthenticatedLocal;
  const isLoading = fbLoading || localLoading;

  /** ---------- Load mock data (same as before) ---------- **/
  useEffect(() => {
    loadMockData();
    getUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUserLocation = async () => {
    if (navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            resolve();
          },
          (error) => {
            console.error("Error getting location:", error);
            setUserLocation({ lat: 13.0827, lng: 80.2707 });
            resolve();
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
      setUserLocation({ lat: 13.0827, lng: 80.2707 });
    }
  };

  const loadMockData = async () => {
    setLocalLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Volunteers
    const tamilNaduVolunteers: Volunteer[] = tamilNaduDistricts.slice(0, 5).map((district, index) => {
      return {
        id: `V00${index + 1}`,
        name: ["Rajesh Kumar", "Priya Sharma", "Anand Singh", "Lakshmi Devi", "Karthik Rajan"][index],
        location: district.name,
        status: "Active",
        skills: ["Medical", "Rescue", "First Aid", "Communication", "Search"][index % 5].split(" "),
        avatar: "/placeholder.svg?height=40&width=40",
        coordinates: { lat: district.coordinates[0], lng: district.coordinates[1] },
      };
    });
    setVolunteers(tamilNaduVolunteers);

    // Teams
    const tamilNaduTeams: Team[] = tamilNaduDistricts.slice(0, 4).map((district, index) => {
      return {
        id: `T-${1234 + index}`,
        name: ["Alpha Response", "Beta Search", "Delta Medical", "Gamma Rescue"][index],
        location: district.name,
        status: ["Active", "On Call", "Active", "Off Duty"][index] as "Active" | "On Call" | "Off Duty",
        members: Array.from({ length: index + 3 }, (_, i) => `V00${i + 1}`),
        coordinates: { lat: district.coordinates[0], lng: district.coordinates[1] },
      };
    });
    setTeams(tamilNaduTeams);

    // Emergency Cases
    const tamilNaduEmergencyCases: EmergencyCase[] = floodProneAreas.slice(0, 3).map((area, index) => {
      return {
        id: `EC00${index + 1}`,
        location: area.name,
        type: ["Medical", "Flood", "Search"][index % 3],
        priority:
          area.riskLevel === "Critical"
            ? "High"
            : area.riskLevel === "High"
            ? "Medium"
            : ("Low" as "High" | "Medium" | "Low"),
        volunteersAssigned: Math.floor(Math.random() * 6) + 2,
        description: `Emergency in ${area.name}, ${area.district} district requiring immediate assistance`,
        timestamp: new Date(Date.now() - 1000 * 60 * Math.floor(Math.random() * 60)).toISOString(),
        coordinates: { lat: area.coordinates[0], lng: area.coordinates[1] },
      };
    });
    setEmergencyCases(tamilNaduEmergencyCases);

    // Help Requests
    const tamilNaduHelpRequests: HelpRequest[] = floodProneAreas.slice(0, 4).map((area, index) => {
      return {
        id: `REQ00${index + 1}`,
        location: area.name,
        status: ["Pending", "In Progress", "Pending", "Pending"][index] as
          | "Pending"
          | "In Progress"
          | "Completed"
          | "Rejected",
        description: `Need assistance with ${["evacuation", "water damage", "supplies", "medical assistance"][index]} in ${
          area.name
        }`,
        timestamp: new Date(Date.now() - 1000 * 60 * Math.floor(Math.random() * 60)).toISOString(),
        coordinates: { lat: area.coordinates[0], lng: area.coordinates[1] },
      };
    });
    setHelpRequests(tamilNaduHelpRequests);

    // Shelters
    const tamilNaduShelters: Shelter[] = tamilNaduDistricts.slice(0, 3).map((district, index) => {
      return {
        id: `S00${index + 1}`,
        name: [`${district.name} Community Center`, `${district.name} School`, `${district.name} Stadium`][index],
        location: district.name,
        capacity: [`${150 + index * 50}/${200 + index * 100}`, `${180}/${200}`, `${300}/${300}`][index],
        status: ["Available", "Near Full", "Full"][index] as "Available" | "Near Full" | "Full",
        resources: ["Adequate", "Low", "Critical"][index] as "Adequate" | "Low" | "Critical",
        contact: ["Sarah Johnson", "Mike Chen", "Lisa Wong"][index],
        contactId: ["sarah-johnson", "mike-chen", "lisa-wong"][index],
        coordinates: { lat: district.coordinates[0], lng: district.coordinates[1] },
      };
    });
    setShelters(tamilNaduShelters);

    // Coordinators
    setCoordinators([
      {
        id: "sarah-johnson",
        name: "Sarah Johnson",
        role: "Lead Coordinator",
        shelter: "Chennai Community Center",
        avatar: "/placeholder.svg?height=80&width=80",
        phone: "(555) 123-4567",
        email: "sarah.johnson@example.com",
      },
      {
        id: "mike-chen",
        name: "Mike Chen",
        role: "Assistant Coordinator",
        shelter: "Coimbatore School",
        avatar: "/placeholder.svg?height=80&width=80",
        phone: "(555) 234-5678",
        email: "mike.chen@example.com",
      },
      {
        id: "lisa-wong",
        name: "Lisa Wong",
        role: "Resource Manager",
        shelter: "Madurai Stadium",
        avatar: "/placeholder.svg?height=80&width=80",
        phone: "(555) 345-6789",
        email: "lisa.wong@example.com",
      },
    ]);

    // Resources
    setResources([
      {
        id: "R001",
        name: "Food Supplies",
        percentage: 70,
        icon: <ShoppingBag className="text-blue-500" size={24} />,
      },
      {
        id: "R002",
        name: "Water Resources",
        percentage: 85,
        icon: <Droplet className="text-blue-500" size={24} />,
      },
      {
        id: "R003",
        name: "Medical Supplies",
        percentage: 45,
        icon: <Home className="text-blue-500" size={24} />,
      },
      {
        id: "R004",
        name: "Basic Amenities",
        percentage: 60,
        icon: <Home className="text-blue-500" size={24} />,
      },
    ]);

    // Map alerts
    const generatedMapAlerts = generateMockAlerts();
    setMapAlerts(generatedMapAlerts);

    const notificationAlerts: Alert[] = generatedMapAlerts.map((alert, index) => ({
      id: `A00${index + 1}`,
      title: alert.type,
      message: alert.description,
      type: alert.severity === "Critical" ? "error" : alert.severity === "High" ? "warning" : alert.severity === "Medium" ? "warning" : "info",
      timestamp: new Date(Date.now() - 1000 * 60 * Number.parseInt(alert.time.split(" ")[0])).toISOString(),
      read: index > 1,
      location: alert.location,
      district: alert.district,
      severity: alert.severity,
      coordinates: alert.coordinates,
    }));
    setAlerts(notificationAlerts);

    setLocalLoading(false);
  };

  /** ---------- Actions ---------- **/

  const refreshData = async () => {
    await loadMockData();
  };

  // Prefer Firebase sign-in when available; otherwise set a mock user (helpful for demo mode)
  const login = async (email: string, password: string): Promise<boolean> => {
    setLocalLoading(true);

    if (signIn) {
      try {
        await signIn(email, password);
        setLocalLoading(false);
        return true;
      } catch (err) {
        console.error("Firebase signIn failed:", err);
        setLocalLoading(false);
        return false;
      }
    }

    // fallback mock login
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLocalUser({
      id: "user1",
      name: "Admin User",
      email: "admin@floodwatch.com",
      role: "Admin",
      avatar: "/placeholder.svg?height=40&width=40",
    });
    setIsAuthenticatedLocal(true);
    setLocalLoading(false);
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setLocalLoading(true);

    // If your useAuth exposes a google login function, use it; otherwise fallback to mock
    if ((signIn as any)?.loginWithGoogle) {
      try {
        await (signIn as any).loginWithGoogle();
        setLocalLoading(false);
        return true;
      } catch (err) {
        console.error("Google sign-in failed:", err);
        setLocalLoading(false);
        return false;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLocalUser({
      id: "user1",
      name: "Admin User",
      email: "admin@floodwatch.com",
      role: "Admin",
      avatar: "/placeholder.svg?height=40&width=40",
    });
    setIsAuthenticatedLocal(true);
    setLocalLoading(false);
    return true;
  };

  const logout = () => {
    // Prefer firebase logout if available
    if (logOut) {
      try {
        void logOut();
      } catch (err) {
        console.warn("Firebase logout failed:", err);
      }
    }
    setLocalUser(null);
    setIsAuthenticatedLocal(false);
  };

  const addEmergencyCase = async (emergencyCase: Omit<EmergencyCase, "id" | "timestamp">) => {
    setLocalLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newCase: EmergencyCase = {
      ...emergencyCase,
      id: `EC${String(emergencyCases.length + 1).padStart(3, "0")}`,
      timestamp: new Date().toISOString(),
    };

    setEmergencyCases((prev) => [newCase, ...prev]);

    addAlert({
      title: "New Emergency Case",
      message: `A ${emergencyCase.priority.toLowerCase()} priority ${emergencyCase.type.toLowerCase()} emergency has been reported in ${emergencyCase.location}.`,
      type: emergencyCase.priority === "High" ? "error" : emergencyCase.priority === "Medium" ? "warning" : "info",
    });

    setLocalLoading(false);
  };

  const updateEmergencyCase = async (id: string, updates: Partial<EmergencyCase>) => {
    setLocalLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setEmergencyCases((prev) => prev.map((ec) => (ec.id === id ? { ...ec, ...updates } : ec)));
    setLocalLoading(false);
  };

  const deleteEmergencyCase = async (id: string) => {
    setLocalLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setEmergencyCases((prev) => prev.filter((ec) => ec.id !== id));
    setLocalLoading(false);
  };

  const updateHelpRequest = async (id: string, status: HelpRequest["status"]) => {
    setLocalLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setHelpRequests((prev) => prev.map((hr) => (hr.id === id ? { ...hr, status } : hr)));

    const request = helpRequests.find((hr) => hr.id === id);
    if (request) {
      addAlert({
        title: "Help Request Updated",
        message: `Request ${id} in ${request.location} has been marked as ${status}.`,
        type: status === "Completed" ? "success" : status === "Rejected" ? "error" : "info",
      });
    }

    setLocalLoading(false);
  };

  const assignTeam = async (emergencyCaseId: string, teamId: string) => {
    setLocalLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    setEmergencyCases((prev) =>
      prev.map((ec) => {
        if (ec.id === emergencyCaseId) {
          const team = teams.find((t) => t.id === teamId);
          return {
            ...ec,
            volunteersAssigned: team ? team.members.length : ec.volunteersAssigned,
          };
        }
        return ec;
      }),
    );

    const emergencyCase = emergencyCases.find((ec) => ec.id === emergencyCaseId);
    const team = teams.find((t) => t.id === teamId);

    if (emergencyCase && team) {
      addAlert({
        title: "Team Assigned",
        message: `${team.name} has been assigned to the ${emergencyCase.type.toLowerCase()} emergency in ${emergencyCase.location}.`,
        type: "success",
      });
    }

    setLocalLoading(false);
  };

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
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, read: true } : alert)));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const sendEmergencyBroadcast = async (message: string, district?: string) => {
    setLocalLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    addAlert({
      title: "Emergency Broadcast Sent",
      message: `Broadcast message${district ? ` to ${district}` : ""}: ${message}`,
      type: "error",
    });
    setLocalLoading(false);
  };

  const saveUserToFirestore = async (fbUser: FirebaseUser | null, extra: Partial<User> = {}) => {
    if (!fbUser) return;
    try {
      const db = getFirebaseDb();
      await setDoc(
        doc(db, "users", fbUser.uid),
        {
          uid: fbUser.uid,
          displayName: fbUser.displayName ?? extra.name ?? "User",
          email: fbUser.email ?? null,
          photoURL: fbUser.photoURL ?? extra.avatar ?? null,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      console.warn("Failed to save user to Firestore:", err);
    }
  };

  useEffect(() => {
    // if a firebase user authenticates, you may want to sync it into Firestore automatically
    if (fbUser) {
      void saveUserToFirestore((fbUser as unknown) as FirebaseUser);
    }
    // we intentionally don't depend on saveUserToFirestore to avoid re-creating it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbUser]);

  useEffect(() => {
   
    return () => {
     
    };
  }, []);

  /** ---------- Provide context ---------- **/
  return (
    <AppContext.Provider
      value={{
        volunteers,
        teams,
        emergencyCases,
        helpRequests,
        shelters,
        coordinators,
        resources,
        alerts,
        mapAlerts,
        user,
        isAuthenticated,
        isLoading,
        userLocation,
        login,
        logout,
        loginWithGoogle,
        refreshData,
        addEmergencyCase,
        updateEmergencyCase,
        deleteEmergencyCase,
        updateHelpRequest,
        assignTeam,
        addAlert,
        markAlertAsRead,
        clearAllAlerts,
        sendEmergencyBroadcast,
        getUserLocation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
