// services/firestoreService.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  Unsubscribe,
  DocumentData,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "../firebase/client"; // adjust path if needed
import type {
  Alert,
  Shelter,
  Coordinator,
  ResourceItem,
} from "../context/AppContext";

const db = getFirebaseDb();

/**
 * Helpers to convert Firestore DocumentData -> typed objects with id
 */
function mapDocs<T extends Record<string, any>>(
  snap: QuerySnapshot<DocumentData>
): (T & { id: string })[] {
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
}

/* -------------------------
   Subscriptions (Realtime)
   Each subscribeX returns an Unsubscribe function
   ------------------------- */

export const subscribeAlerts = (
  onUpdate: (alerts: Alert[]) => void
): Unsubscribe => {
  const q = query(collection(db, "alerts"), orderBy("timestamp", "desc"));
  const unsub = onSnapshot(q, (snap) => {
    const mapped = mapDocs<Partial<Alert>>(snap).map((d) => ({
      id: d.id,
      title: d.title ?? "Alert",
      message: d.message ?? "",
      type: (d.type as Alert["type"]) ?? "info",
      timestamp: d.timestamp ?? new Date().toISOString(),
      read: !!d.read,
    }));
    onUpdate(mapped);
  });
  return unsub;
};

export const subscribeShelters = (
  onUpdate: (shelters: Shelter[]) => void
): Unsubscribe => {
  const q = query(collection(db, "shelters"), orderBy("name"));
  const unsub = onSnapshot(q, (snap) => {
    const mapped = mapDocs<Partial<Shelter>>(snap).map((d) => ({
      id: d.id,
      name: d.name ?? "Unknown Shelter",
      location: d.location ?? "Unknown",
      capacity: d.capacity ?? "0/0",
      status: (d.status as Shelter["status"]) ?? "Available",
      resources: (d.resources as Shelter["resources"]) ?? "Adequate",
      contact: d.contact ?? "",
    }));
    onUpdate(mapped);
  });
  return unsub;
};

export const subscribeCoordinators = (
  onUpdate: (list: Coordinator[]) => void
): Unsubscribe => {
  const q = query(collection(db, "coordinators"), orderBy("name"));
  const unsub = onSnapshot(q, (snap) => {
    const mapped = mapDocs<Partial<Coordinator>>(snap).map((d) => ({
      id: d.id,
      name: d.name ?? "Coordinator",
      role: d.role ?? "Coordinator",
      shelter: d.shelter ?? "",
      phone: d.phone ?? "",
     
    }));
    onUpdate(mapped);
  });
  return unsub;
};

export const subscribeResources = (
  onUpdate: (list: ResourceItem[]) => void
): Unsubscribe => {
  const q = query(collection(db, "resources"), orderBy("name"));
  const unsub = onSnapshot(q, (snap) => {
    const mapped = mapDocs<Partial<ResourceItem>>(snap).map((d) => ({
      id: d.id,
      name: d.name ?? "Resource",
      percentage:
        typeof d.percentage === "number"
          ? d.percentage
          : Number(d.percentage ?? 0),
      icon: d.icon ?? undefined,
    }));
    onUpdate(mapped);
  });
  return unsub;
};

/* -------------------------
   One-time / non-realtime reads
   ------------------------- */

export const fetchShelters = async (): Promise<Shelter[]> => {
  const snap = await getDocs(
    query(collection(db, "shelters"), orderBy("name"))
  );
  return mapDocs<Partial<Shelter>>(snap).map((d) => ({
    id: d.id,
    name: d.name ?? "Unknown Shelter",
    location: d.location ?? "Unknown",
    capacity: d.capacity ?? "0/0",
    status: (d.status as Shelter["status"]) ?? "Available",
    resources: (d.resources as Shelter["resources"]) ?? "Adequate",
    contact: d.contact ?? "",
  }));
};

export const fetchCoordinators = async (): Promise<Coordinator[]> => {
  const snap = await getDocs(
    query(collection(db, "coordinators"), orderBy("name"))
  );
  return mapDocs<Partial<Coordinator>>(snap).map((d) => ({
    id: d.id,
    name: d.name ?? "Coordinator",
    role: d.role ?? "Coordinator",
    shelter: d.shelter ?? "",
    phone: d.phone ?? "",
  }));
};

export const fetchResources = async (): Promise<ResourceItem[]> => {
  const snap = await getDocs(
    query(collection(db, "resources"), orderBy("name"))
  );
  return mapDocs<Partial<ResourceItem>>(snap).map((d) => ({
    id: d.id,
    name: d.name ?? "Resource",
    percentage:
      typeof d.percentage === "number"
        ? d.percentage
        : Number(d.percentage ?? 0),
    icon: d.icon ?? undefined,
  }));
};

/**
 * Example: floodLevels could live in a single document
 * path: /system/floodLevels (document fields: current, predicted, updatedAt)
 */
export const fetchFloodLevels = async (): Promise<{
  current: number;
  predicted: number;
  timeToPeak: string;
} | null> => {
  try {
    const d = await getDoc(doc(db, "system", "floodLevels"));
    if (!d.exists()) return null;
    const data = d.data();
    return {
      current: Number(data.current ?? 0),
      predicted: Number(data.predicted ?? 0),
      timeToPeak: data.timeToPeak ?? "N/A",
    };
  } catch (err) {
    console.error("fetchFloodLevels error", err);
    return null;
  }
};
