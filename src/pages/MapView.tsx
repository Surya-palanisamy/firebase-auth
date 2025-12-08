"use client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  Check,
  Droplets,
  Home,
  Info,
  Layers,
  MapIcon,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation2,
  RefreshCw,
  Route,
  Search,
  TowerControlIcon as Tower,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAppContext } from "../context/AppContext";
import * as MapService from "../services/mapService";
import {
  findSafeRoute,
  formatDistance,
  formatDuration,
  type RouteInstructions,
} from "../services/routingservice";

// Fix for default marker icons in react-leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
/* Replace these imports with your actual images or keep them as placeholders */
import newRoad from "../images/new-road.png";
import blockedRoad from "../images/p-2.png";
import shelter from "../images/shelter.png";
import sjf from "../images/sjf.png";
import tower from "../images/tower.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const blockedRoadIcon = new L.Icon({
  iconUrl: blockedRoad,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const shelterIcon = new L.Icon({
  iconUrl: shelter,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface AlertItem {
  id: string;
  type: string;
  location: string;
  district: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  time: string;
  coordinates: [number, number];
  description: string;
}

interface FloodData {
  area: string;
  currentWaterLevel: number;
  predictedWaterLevel: number;
  rainfall: number;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  safeRoutes: string[];
  nearbyShelters: {
    name: string;
    distance: string;
    capacity: string;
    coordinates: [number, number];
    isOutsideFloodZone: boolean;
  }[];
  lastUpdated: string;
}

function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapView() {
  const { isLoading, refreshData, addAlert, userLocation } = useAppContext();

  // ---------- Sidebar resizing state ----------
  const [sidebarWidth, setSidebarWidth] = useState<number>(360);
  const [isResizing, setIsResizing] = useState(false);
  const resizerRef = useRef<HTMLDivElement | null>(null);

  // ---------- Map & UI state ----------
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedLocality, setSelectedLocality] = useState("All Localities");
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([
    "High",
    "Critical",
  ]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAlertDetails, setShowAlertDetails] = useState<string | null>(null);
  const [fullScreenMap, setFullScreenMap] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    13.0827, 80.2707,
  ]);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapType, setMapType] = useState<"street" | "satellite">("street");
  const [showLayers, setShowLayers] = useState(false);
  const [showFloodZones, setShowFloodZones] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [floodZones, setFloodZones] = useState<
    { coordinates: [number, number][]; severity: string; name: string }[]
  >([]);
  const [blockedRoads, setBlockedRoads] = useState<
    {
      coordinates: [number, number][];
      status: "blocked" | "damaged" | "demolished";
    }[]
  >([]);
  const [sensorLocations, setSensorLocations] = useState<
    {
      id: string;
      coordinates: [number, number];
      status: "active" | "warning" | "offline";
    }[]
  >([]);
  const [showSensors, setShowSensors] = useState(true);
  const [showBlockedRoads, setShowBlockedRoads] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<FloodData | null>(
    null
  );
  const [floodData, setFloodData] = useState<FloodData[]>([]);
  const [activeRoute, setActiveRoute] = useState<RouteInstructions | null>(
    null
  );
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [showNavigationPanel, setShowNavigationPanel] = useState(false);
  const [navigationDestination, setNavigationDestination] = useState<
    string | null
  >(null);
  const mapRef = useRef<L.Map | null>(null);
  const [multipleRouteOptions, setMultipleRouteOptions] = useState<{
    routes: RouteInstructions[];
    destination: string;
    destinationCoords: [number, number];
  } | null>(null);

  // ---------- Dummy data population ----------
  useEffect(() => {
    // flood zones (simple circles/polygons)
    setFloodZones([
      {
        name: "Chennai Central",
        coordinates: [
          [13.0827, 80.2707],
          [13.0927, 80.2807],
          [13.0727, 80.2607],
          [13.0827, 80.2507],
        ],
        severity: "Critical",
      },
      {
        name: "T. Nagar",
        coordinates: [
          [13.0385, 80.2337],
          [13.0425, 80.2437],
          [13.0315, 80.2377],
        ],
        severity: "High",
      },
      {
        name: "Velachery",
        coordinates: [
          [12.9787, 80.218],
          [12.9827, 80.228],
        ],
        severity: "Medium",
      },
    ]);

    // blocked roads
    setBlockedRoads([
      {
        coordinates: [
          [13.0875, 80.2102],
          [13.0915, 80.2202],
        ],
        status: "damaged",
      },
      {
        coordinates: [
          [13.0335, 80.2697],
          [13.0375, 80.2797],
        ],
        status: "blocked",
      },
    ]);

    // sensors
    setSensorLocations([
      { id: "sensor-1", coordinates: [13.0827, 80.2707], status: "active" },
      { id: "sensor-2", coordinates: [13.0385, 80.2337], status: "warning" },
    ]);

    // flood data
    setFloodData([
      {
        area: "Chennai Central",
        currentWaterLevel: 2.8,
        predictedWaterLevel: 3.2,
        rainfall: 15.7,
        riskLevel: "Critical",
        safeRoutes: ["Via Poonamallee High Road", "Via Egmore Station Road"],
        nearbyShelters: [
          {
            name: "Government Higher Secondary School",
            distance: "1.2 km",
            capacity: "250 people",
            coordinates: [13.0604, 80.276],
            isOutsideFloodZone: true,
          },
          {
            name: "Chennai Central Shelter",
            distance: "0.5 km",
            capacity: "500 people",
            coordinates: [13.063363, 80.281713],
            isOutsideFloodZone: false,
          },
        ],
        lastUpdated: "10 minutes ago",
      },
      {
        area: "T. Nagar",
        currentWaterLevel: 1.9,
        predictedWaterLevel: 2.5,
        rainfall: 12.3,
        riskLevel: "High",
        safeRoutes: ["Via North Usman Road"],
        nearbyShelters: [
          {
            name: "T. Nagar Bus Terminus",
            distance: "0.7 km",
            capacity: "200 people",
            coordinates: [13.04, 80.2387],
            isOutsideFloodZone: false,
          },
        ],
        lastUpdated: "15 minutes ago",
      },
    ]);

    // alerts
    setAlerts([
      {
        id: "alert-1",
        type: "Flood",
        location: "Chennai Central",
        district: "Chennai",
        severity: "Critical",
        time: "10 minutes ago",
        coordinates: [13.0827, 80.2707],
        description: "Rapid water rise near station.",
      },
      {
        id: "alert-2",
        type: "Road Block",
        location: "T. Nagar",
        district: "Chennai",
        severity: "High",
        time: "15 minutes ago",
        coordinates: [13.0385, 80.2337],
        description: "Road blocked due to debris.",
      },
    ]);
  }, []);

  // center on user when set
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(12);
    }
  }, [userLocation]);

  // ---------- Resizer behavior ----------
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const next = Math.max(240, Math.min(720, e.clientX));
      setSidebarWidth(next);
    };
    const onUp = () => {
      if (isResizing) setIsResizing(false);
      if (resizerRef.current) resizerRef.current.classList.remove("dragging");
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  const startResize = (e: React.MouseEvent) => {
    setIsResizing(true);
    if (resizerRef.current) resizerRef.current.classList.add("dragging");
    e.preventDefault();
  };

  // ---------- Filters & helpers ----------
  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      searchQuery === "" ||
      alert.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDistrict =
      selectedDistrict === "All Districts" ||
      alert.district === selectedDistrict;

    const matchesSeverity = selectedSeverity.includes(alert.severity);

    return matchesSearch && matchesDistrict && matchesSeverity;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setTimeout(() => setRefreshing(false), 700);
  };

  const handleSeverityFilter = (severity: string) => {
    if (selectedSeverity.includes(severity)) {
      setSelectedSeverity(selectedSeverity.filter((s) => s !== severity));
    } else {
      setSelectedSeverity([...selectedSeverity, severity]);
    }
  };

  const handleViewAlertDetails = (alertId: string) => {
    setShowAlertDetails(alertId);
    const a = alerts.find((x) => x.id === alertId);
    if (a) {
      setMapCenter(a.coordinates);
      setMapZoom(15);
    }
  };

  const handleNavigateToAlert = (alertId: string) => {
    const a = alerts.find((x) => x.id === alertId);
    if (!a) return;
    setMapCenter(a.coordinates);
    setMapZoom(16);
    if (userLocation) {
      calculateRoute(
        { lat: userLocation.lat, lng: userLocation.lng },
        { lat: a.coordinates[0], lng: a.coordinates[1] }
      );
      setNavigationDestination(a.location);
    } else {
      addAlert({
        title: "Navigation Error",
        message: "Enable location",
        type: "error",
      } as any);
    }
  };

  const handleLocationClick = (areaName: string) => {
    const data = floodData.find((d) => d.area === areaName);
    if (!data) return;
    setSelectedLocation(data);
    const zone = floodZones.find((z) => z.name === areaName);
    if (zone && zone.coordinates.length > 0) {
      const lat =
        zone.coordinates.reduce((s, c) => s + c[0], 0) /
        zone.coordinates.length;
      const lng =
        zone.coordinates.reduce((s, c) => s + c[1], 0) /
        zone.coordinates.length;
      setMapCenter([lat, lng]);
      setMapZoom(15);
    }
  };

  // ---------- Routing helpers (uses findSafeRoute from your service) ----------
  const calculateRoute = async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ) => {
    if (!userLocation) {
      addAlert({
        title: "Navigation Error",
        message: "Enable location",
        type: "error",
      } as any);
      return;
    }
    setIsCalculatingRoute(true);
    setActiveRoute(null);
    setShowNavigationPanel(false);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const route = await findSafeRoute(start, end, floodZones, blockedRoads);
      if (route) {
        setActiveRoute(route);
        setTimeout(() => {
          setShowNavigationPanel(true);
          // fit bounds if possible
          if (mapRef.current) {
            try {
              const pts = route.coordinates.map(
                (c) => [c[1], c[0]] as L.LatLngTuple
              );
              const b = L.latLngBounds(pts);
              mapRef.current.fitBounds(b, { padding: [40, 40] });
            } catch (e) {
              // fallback center on dest
              setMapCenter([end.lat, end.lng]);
              setMapZoom(14);
            }
          }
          addAlert({
            title: "Route",
            message: `Distance: ${formatDistance(route.distance)}`,
            type: "success",
          } as any);
        }, 350);
      } else {
        addAlert({
          title: "Navigation",
          message: "No safe route found",
          type: "warning",
        } as any);
        // fallback simple polyline route
        const fallback = {
          distance: calculateDistance(start.lat, start.lng, end.lat, end.lng),
          duration:
            (calculateDistance(start.lat, start.lng, end.lat, end.lng) /
              30000) *
            3600,
          steps: [
            {
              instruction: "Direct to destination",
              distance: calculateDistance(
                start.lat,
                start.lng,
                end.lat,
                end.lng
              ),
              duration: 0,
              coordinates: [end.lng, end.lat],
            },
          ],
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat],
          ],
        } as RouteInstructions;
        setActiveRoute(fallback);
        setShowNavigationPanel(true);
      }
    } catch (error) {
      console.error(error);
      addAlert({
        title: "Routing Error",
        message: "Could not calculate route",
        type: "error",
      } as any);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const calculateMultipleRoutes = async (start: {
    lat: number;
    lng: number;
  }) => {
    if (!userLocation) {
      addAlert({
        title: "Navigation Error",
        message: "Enable location",
        type: "error",
      } as any);
      return;
    }
    setIsCalculatingRoute(true);
    setActiveRoute(null);
    setShowNavigationPanel(false);
    setMultipleRouteOptions(null);

    try {
      // gather shelters
      const allShelters = floodData.flatMap((d) =>
        d.nearbyShelters.map((s) => ({ ...s, areaName: d.area }))
      );
      const closest = allShelters.slice(0, 3);
      const routePromises = closest.map((shelter) =>
        findSafeRoute(
          start,
          { lat: shelter.coordinates[0], lng: shelter.coordinates[1] },
          floodZones,
          blockedRoads
        ).then((r) => ({ r, shelter }))
      );
      const results = await Promise.all(routePromises);
      const valid = results.filter((r) => !!r.r);
      if (valid.length === 0) {
        addAlert({
          title: "Navigation",
          message: "No shelter routes found",
          type: "warning",
        } as any);
      } else {
        setMultipleRouteOptions({
          routes: valid.map((v) => v.r as RouteInstructions),
          destination: valid[0].shelter.name,
          destinationCoords: valid[0].shelter.coordinates,
        });
        setActiveRoute(valid[0].r as RouteInstructions);
        setShowNavigationPanel(true);
        setNavigationDestination(valid[0].shelter.name);
      }
    } catch (err) {
      console.error(err);
      addAlert({
        title: "Navigation Error",
        message: "Could not calculate multiple routes",
        type: "error",
      } as any);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const findSafeExitPoint = (
    floodZoneCoordinates: [number, number][],
    userLocation: { lat: number; lng: number }
  ): [number, number] => {
    const centerLat =
      floodZoneCoordinates.reduce((s, c) => s + c[0], 0) /
      floodZoneCoordinates.length;
    const centerLng =
      floodZoneCoordinates.reduce((s, c) => s + c[1], 0) /
      floodZoneCoordinates.length;

    let closest: [number, number] | null = null;
    let min = Number.MAX_VALUE;
    for (let i = 0; i < floodZoneCoordinates.length; i++) {
      const p = floodZoneCoordinates[i];
      const d = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        p[0],
        p[1]
      );
      if (d < min) {
        min = d;
        closest = p;
      }
    }
    if (!closest) {
      const ang = Math.random() * Math.PI * 2;
      return [
        userLocation.lat + Math.sin(ang) * 0.01,
        userLocation.lng + Math.cos(ang) * 0.01,
      ];
    }
    const vx = closest[0] - centerLat;
    const vy = closest[1] - centerLng;
    const mag = Math.sqrt(vx * vx + vy * vy) || 1;
    return [closest[0] + (vx / mag) * 0.005, closest[1] + (vy / mag) * 0.005];
  };

  const handleNavigateToShelter = (shelter: {
    name: string;
    coordinates: [number, number];
    isOutsideFloodZone?: boolean;
  }) => {
    if (!userLocation) {
      addAlert({
        title: "Navigation Error",
        message: "Enable location",
        type: "error",
      } as any);
      return;
    }
    setMapCenter(shelter.coordinates);
    setMapZoom(15);
    if (shelter.isOutsideFloodZone) {
      calculateMultipleRoutes({ lat: userLocation.lat, lng: userLocation.lng });
      setNavigationDestination(shelter.name);
    } else {
      calculateRoute(
        { lat: userLocation.lat, lng: userLocation.lng },
        { lat: shelter.coordinates[0], lng: shelter.coordinates[1] }
      );
      setNavigationDestination(shelter.name);
    }
  };

  // ---------- Utilities ----------
  function getSeverityColor(sev: string) {
    switch (sev) {
      case "Critical":
        return "red";
      case "High":
        return "orange";
      case "Medium":
        return "yellow";
      case "Low":
        return "blue";
      default:
        return "blue";
    }
  }
  function getSeverityRadius(sev: string) {
    switch (sev) {
      case "Critical":
        return 2000;
      case "High":
        return 1500;
      case "Medium":
        return 1000;
      case "Low":
        return 1000;
      default:
        return 1000;
    }
  }
  function getFloodZoneColor(sev: string) {
    switch (sev) {
      case "Critical":
        return "#ff0000";
      case "High":
        return "#ff6600";
      case "Medium":
        return "#ffcc00";
      default:
        return "#0066ff";
    }
  }
  function getRiskBadgeColor(riskLevel: string) {
    switch (riskLevel) {
      case "Critical":
        return "bg-red-100 text-red-600";
      case "High":
        return "bg-orange-100 text-orange-600";
      case "Medium":
        return "bg-yellow-100 text-yellow-600";
      case "Low":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div
      className={`flex ${
        fullScreenMap ? "h-screen fixed inset-0 z-50" : "h-screen"
      }`}
    >
      {/* Sidebar */}
      {!fullScreenMap && (
        <div
          className="map-sidebar border-r overflow-y-auto flex flex-col bg-slate-900 text-slate-100"
          style={{ width: sidebarWidth }}
        >
          {/* Content */}
          {selectedLocation ? (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {selectedLocation.area}
                </h2>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="p-1 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-lg">Flood Status</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getRiskBadgeColor(
                      selectedLocation.riskLevel
                    )}`}
                  >
                    {selectedLocation.riskLevel} Risk
                  </span>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Droplets className="icon-no-pointer" size={20} />
                    <div>
                      <p className="text-sm text-slate-300">
                        Current Water Level
                      </p>
                      <p className="font-medium">
                        {selectedLocation.currentWaterLevel} meters
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ArrowUp className="icon-no-pointer" size={20} />
                    <div>
                      <p className="text-sm text-slate-300">
                        AI Predicted Level (Next 6 hrs)
                      </p>
                      <p className="font-medium">
                        {selectedLocation.predictedWaterLevel} meters
                      </p>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-red-500 h-1.5 rounded-full"
                          style={{
                            width: `${
                              (selectedLocation.predictedWaterLevel / 4) * 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <BarChart3 className="icon-no-pointer" size={20} />
                    <div>
                      <p className="text-sm text-slate-300">Rainfall</p>
                      <p className="font-medium">
                        {selectedLocation.rainfall} cm
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-lg mb-2">Safe Routes</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <ul className="space-y-2">
                    {selectedLocation.safeRoutes.map((route, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Route className="icon-no-pointer mt-0.5" size={16} />
                        <div className="flex flex-col w-full">
                          <span className="text-sm">{route}</span>
                          <button
                            className="text-blue-400 text-xs mt-1"
                            onClick={() =>
                              handleNavigateViaSafeRoute(
                                route,
                                selectedLocation.area
                              )
                            }
                            disabled={isCalculatingRoute}
                          >
                            {isCalculatingRoute
                              ? "Calculating route..."
                              : "Navigate from current location"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-lg mb-2">Nearby Shelters</h3>
                <div className="space-y-3">
                  {selectedLocation.nearbyShelters.map((s, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-3 ${
                        s.isOutsideFloodZone
                          ? "bg-emerald-900/30 border border-emerald-800"
                          : "bg-gray-800"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Home className="icon-no-pointer mt-0.5" size={16} />
                        <div className="w-full">
                          <div className="flex justify-between">
                            <p className="font-medium">{s.name}</p>
                            {s.isOutsideFloodZone && (
                              <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                                Safe Zone
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                            <span>{s.distance}</span>
                            <span>{s.capacity}</span>
                          </div>
                          <button
                            className="text-blue-400 text-xs mt-2"
                            onClick={() => handleNavigateToShelter(s)}
                            disabled={isCalculatingRoute}
                          >
                            {isCalculatingRoute
                              ? "Calculating route..."
                              : "Navigate to this shelter"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs mt-4 text-slate-400">
                Last updated: {selectedLocation.lastUpdated}
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Chennai Flood Map</h2>
                <button
                  onClick={handleRefresh}
                  className={`p-2 rounded-full ${
                    refreshing ? "animate-spin" : ""
                  }`}
                  disabled={refreshing}
                  title="Refresh"
                >
                  <RefreshCw size={20} />
                </button>
              </div>

              <div className="relative mb-4">
                <input
                  type="text"
                  placeholder="Search areas..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search
                  className="absolute left-3 top-2.5 text-slate-400 icon-no-pointer"
                  size={18}
                />
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Filters</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">District</label>
                    <div className="relative">
                      <select
                        className="w-full mt-1 border rounded-lg p-2 bg-slate-800 text-slate-200 custom-select"
                        value={selectedDistrict}
                        onChange={(e) => {
                          setSelectedDistrict(e.target.value);
                          if (e.target.value !== "All Districts") {
                            const district = MapService.tamilNaduDistricts.find(
                              (d) => d.name === e.target.value
                            );
                            if (district) {
                              setMapCenter(
                                district.coordinates as [number, number]
                              );
                              setMapZoom(11);
                            }
                          } else {
                            setMapCenter([11.1271, 78.6569]);
                            setMapZoom(7);
                          }
                        }}
                      >
                        <option>All Districts</option>
                        {MapService.tamilNaduDistricts.map((d) => (
                          <option key={d.name}>{d.name}</option>
                        ))}
                      </select>

                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 icon-no-pointer">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400">Locality</label>
                    <div className="relative">
                      <select
                        className="w-full mt-1 border rounded-lg p-2 bg-slate-800 text-slate-200 custom-select"
                        value={selectedLocality}
                        onChange={(e) => setSelectedLocality(e.target.value)}
                      >
                        <option>All Localities</option>
                        {selectedDistrict !== "All Districts" &&
                          MapService.tamilNaduLocalities[
                            selectedDistrict as keyof typeof MapService.tamilNaduLocalities
                          ]?.map((loc) => <option key={loc}>{loc}</option>)}
                        {selectedDistrict === "All Districts" &&
                          MapService.getAllLocalities().map((loc) => (
                            <option key={loc}>{loc}</option>
                          ))}
                      </select>

                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 icon-no-pointer">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M6 9l6 6 6-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400">
                      Severity Level
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {["Low", "Medium", "High", "Critical"].map((level) => (
                        <button
                          key={level}
                          onClick={() => handleSeverityFilter(level)}
                          className={`severity-btn px-3 py-1 rounded-full text-sm ${
                            selectedSeverity.includes(level)
                              ? level === "Critical"
                                ? "bg-red-500 text-white"
                                : level === "High"
                                ? "bg-orange-500 text-white"
                                : level === "Medium"
                                ? "bg-yellow-400 text-black"
                                : "bg-blue-500 text-white"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Affected Areas */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Affected Areas</h3>
                <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto">
                  {floodData.length > 0 ? (
                    floodData
                      .filter((d) => selectedSeverity.includes(d.riskLevel))
                      .map((d) => (
                        <div
                          key={d.area}
                          className="area-card border rounded-lg p-3 bg-slate-800"
                          onClick={() => handleLocationClick(d.area)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{d.area}</h4>
                              <p className="text-sm text-slate-400">
                                Water Level: {d.currentWaterLevel}m
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${getRiskBadgeColor(
                                d.riskLevel
                              )}`}
                            >
                              {d.riskLevel}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2 text-sm text-slate-400">
                            <span>Updated: {d.lastUpdated}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLocationClick(d.area);
                                }}
                                title="View Details"
                                className="p-1"
                              >
                                <Info size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLocationClick(d.area);
                                }}
                                title="Navigate"
                                className="p-1"
                              >
                                <Navigation2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center text-slate-400 py-4">
                      No flood data available
                    </div>
                  )}
                </div>
              </div>

              {/* Active Alerts */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Active Alerts</h3>
                <div className="space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto">
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map((a) => (
                      <div
                        key={a.id}
                        className="border rounded-lg p-3 bg-slate-800"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{a.type}</h4>
                            <p className="text-sm text-slate-400">
                              {a.location}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              a.severity === "Critical"
                                ? "bg-red-100 text-red-600"
                                : a.severity === "High"
                                ? "bg-orange-100 text-orange-600"
                                : a.severity === "Medium"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {a.severity}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 text-sm text-slate-400">
                          <span>{a.time}</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewAlertDetails(a.id)}
                              title="View Details"
                              className="p-1"
                            >
                              <Info size={16} />
                            </button>
                            <button
                              onClick={() => handleNavigateToAlert(a.id)}
                              title="Navigate"
                              className="p-1"
                            >
                              <Navigation2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-4">
                      No alerts match your filters
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Resizer bar at the right edge of sidebar */}
          <div
            ref={resizerRef}
            onMouseDown={startResize}
            className="sidebar-resizer absolute top-0 right-0 bottom-0"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
          />
        </div>
      )}

      {/* Map area */}
      <div className={`flex-1 relative ${fullScreenMap ? "w-full" : ""}`}>
        <div className="absolute inset-0 z-0">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            ref={(map) => {
              if (map) mapRef.current = map;
            }}
          >
            <ChangeView center={mapCenter} zoom={mapZoom} />

            {mapType === "street" ? (
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            ) : (
              <TileLayer
                attribution="&copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            )}

            {/* alert markers */}
            {filteredAlerts.map((a) => (
              <div key={a.id}>
                <Marker position={a.coordinates}>
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <h3 className="font-medium text-lg">{a.type}</h3>
                      <p className="text-sm text-slate-600 mb-1">
                        {a.location}, {a.district}
                      </p>
                      <p className="text-sm mb-2">{a.description}</p>
                      <p className="text-xs text-slate-500">
                        Updated: {a.time}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleViewAlertDetails(a.id)}
                          className="text-blue-500 text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {showFloodZones && (
                  <Circle
                    center={a.coordinates}
                    radius={getSeverityRadius(a.severity)}
                    pathOptions={{
                      color: getSeverityColor(a.severity),
                      fillColor: getSeverityColor(a.severity),
                      fillOpacity: 0.2,
                    }}
                  />
                )}
              </div>
            ))}

            {/* flood zones as circles */}
            {showFloodZones &&
              floodZones.map((z, i) => (
                <Circle
                  key={i}
                  center={z.coordinates[0]}
                  radius={getSeverityRadius(z.severity)}
                  pathOptions={{
                    color: getFloodZoneColor(z.severity),
                    fillColor: getFloodZoneColor(z.severity),
                    fillOpacity: 0.28,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => {
                      const data = floodData.find((d) => d.area === z.name);
                      if (data) setSelectedLocation(data);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <h3 className="font-medium text-lg">
                        Flood Zone: {z.name}
                      </h3>
                      <p className="text-sm mb-1">
                        Severity:{" "}
                        <span className="font-medium">{z.severity}</span>
                      </p>
                      <p className="text-sm">This area may be dangerous.</p>
                      <button
                        onClick={() => {
                          const data = floodData.find((d) => d.area === z.name);
                          if (data) setSelectedLocation(data);
                        }}
                        className="mt-2 text-blue-500 text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Circle>
              ))}

            {/* blocked roads as markers */}
            {showBlockedRoads &&
              blockedRoads.map((road, idx) => (
                <Marker
                  key={idx}
                  position={[
                    (road.coordinates[0][0] + road.coordinates[1][0]) / 2,
                    (road.coordinates[0][1] + road.coordinates[1][1]) / 2,
                  ]}
                  icon={
                    new L.Icon({
                      iconUrl: newRoad,
                      iconSize: [48, 48],
                      iconAnchor: [24, 24],
                    })
                  }
                >
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <h3 className="font-medium text-lg">Road Status</h3>
                      <p className="text-sm mb-1">
                        Condition:{" "}
                        <span className="font-medium capitalize">
                          {road.status}
                        </span>
                      </p>
                      <p className="text-sm">
                        {road.status === "blocked"
                          ? "Blocked"
                          : road.status === "damaged"
                          ? "Damaged"
                          : "Demolished"}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* sensors */}
            {showSensors &&
              sensorLocations.map((s) => (
                <Marker
                  key={s.id}
                  position={s.coordinates}
                  icon={
                    new L.Icon({
                      iconUrl: tower,
                      iconSize: [36, 36],
                      iconAnchor: [18, 18],
                    })
                  }
                >
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <h3 className="font-medium text-lg">Sensor {s.id}</h3>
                      <p className="text-sm mb-1">
                        Status:{" "}
                        <span className="font-medium capitalize">
                          {s.status}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Tower size={16} />
                        <span className="text-sm">Flood monitoring sensor</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* user location */}
            {userLocation && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={
                  new L.Icon({
                    iconUrl:
                      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
                    shadowUrl:
                      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                  })
                }
              >
                <Popup>
                  <div className="p-1">
                    <p className="font-medium">Your Location</p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* active route polyline */}
            {activeRoute && (
              <Polyline
                positions={activeRoute.coordinates.map((c) => [c[1], c[0]])}
                pathOptions={{ color: "#3388ff", weight: 6, opacity: 0.85 }}
              />
            )}

            {/* shelters */}
            {showShelters &&
              floodData.flatMap((d) =>
                d.nearbyShelters.map((shel, idx) => (
                  <Marker
                    key={`shel-${d.area}-${idx}`}
                    position={shel.coordinates}
                    icon={
                      new L.Icon({
                        iconUrl: sjf,
                        iconSize: [28, 28],
                        iconAnchor: [14, 28],
                      })
                    }
                  >
                    <Popup>
                      <div className="p-2 max-w-xs">
                        <h3 className="font-medium text-lg">{shel.name}</h3>
                        <p className="text-sm mb-1">
                          Capacity:{" "}
                          <span className="font-medium">{shel.capacity}</span>
                        </p>
                        <p className="text-sm mb-1">
                          Distance: {shel.distance}
                        </p>
                        <p className="text-sm mb-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              shel.isOutsideFloodZone
                                ? "bg-green-100 text-green-600"
                                : "bg-yellow-100 text-yellow-600"
                            }`}
                          >
                            {shel.isOutsideFloodZone
                              ? "Outside Flood Zone"
                              : "Inside Flood Zone"}
                          </span>
                        </p>
                        <button
                          onClick={() => handleNavigateToShelter(shel)}
                          className="mt-2 text-blue-500 text-sm"
                        >
                          Navigate to this shelter
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))
              )}
          </MapContainer>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={() => setFullScreenMap(!fullScreenMap)}
            className="p-2 rounded-lg shadow-md bg-white/5"
            title={fullScreenMap ? "Exit Full Screen" : "Full Screen"}
          >
            {fullScreenMap ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          <button
            onClick={() =>
              setMapType(mapType === "street" ? "satellite" : "street")
            }
            className="p-2 rounded-lg shadow-md bg-white/5"
            title={`Switch to ${
              mapType === "street" ? "Satellite" : "Street"
            } View`}
          >
            <MapIcon size={20} />
          </button>

          <button
            onClick={() => setShowLayers(!showLayers)}
            className="p-2 rounded-lg shadow-md bg-white/5"
            title="Map Layers"
          >
            <Layers size={20} />
          </button>

          {userLocation && (
            <button
              onClick={() => {
                setMapCenter([userLocation.lat, userLocation.lng]);
                setMapZoom(15);
              }}
              className="p-2 rounded-lg shadow-md bg-white/5"
              title="Go to My Location"
            >
              <MapPin size={20} />
            </button>
          )}

          {userLocation && (
            <button
              onClick={() =>
                calculateMultipleRoutes({
                  lat: userLocation.lat,
                  lng: userLocation.lng,
                })
              }
              className="p-2 rounded-lg shadow-md bg-white/5"
              title="Find Safe Shelters"
              disabled={isCalculatingRoute}
            >
              <Home size={20} className="text-emerald-400" />
            </button>
          )}
        </div>

        {/* Layers panel */}
        {showLayers && (
          <div className="absolute top-4 left-4 z-10 p-3 rounded-lg shadow-md bg-white/5 text-slate-100">
            <h3 className="font-medium mb-2">Map Layers</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFloodZones}
                  onChange={() => setShowFloodZones(!showFloodZones)}
                />
                <span>Flood Zones</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showShelters}
                  onChange={() => setShowShelters(!showShelters)}
                />
                <span>Shelters</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSensors}
                  onChange={() => setShowSensors(!showSensors)}
                />
                <span>Sensors</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBlockedRoads}
                  onChange={() => setShowBlockedRoads(!showBlockedRoads)}
                />
                <span>Blocked Roads</span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Panel */}
        {showNavigationPanel && activeRoute && (
          <div className="absolute bottom-4 left-4 z-10 w-80 max-h-[70vh] overflow-hidden">
            <div className="rounded-lg shadow-lg bg-white">
              <div className="flex justify-between items-center p-3 border-b">
                <h3 className="text-lg font-semibold flex items-center">
                  <Navigation2 className="mr-2" size={20} />
                  {navigationDestination
                    ? `To: ${navigationDestination}`
                    : "Navigation"}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNavigationPanel(false)}
                    className="p-1 rounded-full"
                    title="Minimize"
                  >
                    <Minimize2 size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setShowNavigationPanel(false);
                      setActiveRoute(null);
                      setNavigationDestination(null);
                    }}
                    className="p-1 rounded-full"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Distance</p>
                    <p className="font-medium">
                      {formatDistance(activeRoute.distance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Time</p>
                    <p className="font-medium">
                      {formatDuration(activeRoute.duration)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-h-[40vh] overflow-y-auto">
                <div className="space-y-1 p-2">
                  {activeRoute.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start p-2 border-b last:border-b-0"
                    >
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        {step.instruction.includes("right") ? (
                          <ArrowRight size={18} />
                        ) : step.instruction.includes("left") ? (
                          <ArrowLeft size={18} />
                        ) : (
                          <ArrowUp size={18} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.instruction}</p>
                        <div className="flex justify-between text-sm text-gray-600 mt-1">
                          <span>{formatDistance(step.distance)}</span>
                          <span>{formatDuration(step.duration)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multiple routes */}
        {multipleRouteOptions && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 p-4 rounded-lg shadow-md max-w-md bg-white">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Multiple Safe Routes Available</h3>
              <button
                onClick={() => setMultipleRouteOptions(null)}
                className="p-1 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {multipleRouteOptions.routes.map((route, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg cursor-pointer ${
                    activeRoute === route
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    setActiveRoute(route);
                    setShowNavigationPanel(true);
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Route Option {i + 1}</p>
                      <div className="flex gap-3 text-sm text-gray-600">
                        <span>{formatDistance(route.distance)}</span>
                        <span>{formatDuration(route.duration)}</span>
                      </div>
                    </div>
                    {activeRoute === route && (
                      <div className="bg-blue-500 p-1 rounded-full text-white">
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
              Select a route to view detailed navigation instructions.
            </div>
          </div>
        )}

        {/* small floating status */}
        {isCalculatingRoute && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 rounded-full shadow-md flex items-center gap-2 bg-white/90">
            <RefreshCw size={16} className="animate-spin" />
            <span>Calculating safe route...</span>
          </div>
        )}

        {/* fullscreen close button */}
        {fullScreenMap && (
          <button
            onClick={() => setFullScreenMap(false)}
            className="absolute bottom-4 right-4 z-10 bg-blue-500 p-3 rounded-full shadow-md text-white"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Alert Details Modal */}
      {showAlertDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg p-6 w-full max-w-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Alert Details</h3>
              <button
                onClick={() => setShowAlertDetails(null)}
                className="p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {alerts.find((a) => a.id === showAlertDetails) && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Alert Type
                  </h4>
                  <p className="font-medium">
                    {alerts.find((a) => a.id === showAlertDetails)?.type}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Location
                  </h4>
                  <p>
                    {alerts.find((a) => a.id === showAlertDetails)?.location},{" "}
                    {alerts.find((a) => a.id === showAlertDetails)?.district}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Severity
                  </h4>
                  <p>
                    {alerts.find((a) => a.id === showAlertDetails)?.severity}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Description
                  </h4>
                  <p>
                    {alerts.find((a) => a.id === showAlertDetails)?.description}
                  </p>
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      const a = alerts.find((x) => x.id === showAlertDetails);
                      if (a)
                        addAlert({
                          title: "Alert Shared",
                          message: `Shared ${a.type} at ${a.location}`,
                          type: "info",
                        } as any);
                      setShowAlertDetails(null);
                    }}
                    className="px-4 py-2 border rounded-lg"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => {
                      handleNavigateToAlert(showAlertDetails as string);
                      setShowAlertDetails(null);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"
                  >
                    <Navigation2 size={16} />
                    <span>Navigate</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // helper used inside selectedLocation safeRoutes
  function handleNavigateViaSafeRoute(routeName: string, areaName: string) {
    if (!userLocation) {
      addAlert({
        title: "Navigation Error",
        message: "Enable location",
        type: "error",
      } as any);
      return;
    }
    const data = floodData.find((d) => d.area === areaName);
    if (!data) return;
    const shelter =
      data.nearbyShelters.find((s) => s.isOutsideFloodZone) ||
      data.nearbyShelters[0];
    if (!shelter) return;
    calculateRoute(
      { lat: userLocation.lat, lng: userLocation.lng },
      { lat: shelter.coordinates[0], lng: shelter.coordinates[1] }
    );
    setNavigationDestination(`${shelter.name} via ${routeName}`);
  }
}
