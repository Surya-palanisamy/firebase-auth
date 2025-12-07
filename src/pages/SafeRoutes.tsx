"use client"

import { useTheme as useMuiTheme } from "@mui/material/styles"
import L from "leaflet"
import "leaflet-routing-machine"
import "leaflet/dist/leaflet.css"
import { AlertCircle, AlertTriangle, CheckCircle2, Users, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { MapContainer, Polygon, Popup, TileLayer, useMap } from "react-leaflet"
import LoadingSpinner from "../components/LoadingSpinner"
import { useAppContext } from "../context/AppContext"
import { useTheme as useThemeContext } from "../context/ThemeContext"

// Fix for default marker icons in react-leaflet
import iconUrl from "leaflet/dist/images/marker-icon.png"
import iconShadowUrl from "leaflet/dist/images/marker-shadow.png"

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

/* ---------- Types ---------- */
interface Route {
  id: string
  name: string
  status: "Open" | "Warning" | "Closed"
  statusColor: string
  updated: string
  startPoint: [number, number]
  endPoint: [number, number]
  district: string
}

interface Update {
  id: string
  time: string
  title: string
  description: string
  severity: "High" | "Medium" | "Low"
}

interface Communication {
  id: string
  title: string
  time: string
  recipients: string
  status: "Delivered" | "Pending" | "Failed"
}

interface FloodZone {
  id: string
  name: string
  coordinates: [number, number][]
  riskLevel: "high" | "medium" | "low"
}

interface GraphNode {
  id: string
  coordinates: [number, number]
  connections: {
    nodeId: string
    distance: number
    riskLevel: "high" | "medium" | "low" | "safe"
  }[]
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

const tamilNaduDistricts: { name: string; coordinates: [number, number] }[] = [
  { name: "Chennai", coordinates: [13.0827, 80.2707] },
  { name: "Coimbatore", coordinates: [11.0168, 76.9558] },
  { name: "Madurai", coordinates: [9.9252, 78.1198] },
  { name: "Tiruchirappalli", coordinates: [10.7905, 78.7047] },
  { name: "Salem", coordinates: [11.6643, 78.146] },
  { name: "Tirunelveli", coordinates: [8.7139, 77.7567] },
  { name: "Tiruppur", coordinates: [11.1085, 77.3411] },
  { name: "Erode", coordinates: [11.341, 77.7172] },
  { name: "Vellore", coordinates: [12.9165, 79.1325] },
  { name: "Thoothukkudi", coordinates: [8.7642, 78.1348] },
  { name: "Dindigul", coordinates: [10.3624, 77.9695] },
  { name: "Thanjavur", coordinates: [10.787, 79.1378] },
  { name: "Ranipet", coordinates: [12.9277, 79.3193] },
  { name: "Sivaganga", coordinates: [9.8433, 78.4809] },
  { name: "Kanyakumari", coordinates: [8.0883, 77.5385] },
  { name: "Namakkal", coordinates: [11.2189, 78.1674] },
  { name: "Karur", coordinates: [10.9601, 78.0766] },
  { name: "Tiruvarur", coordinates: [10.7661, 79.6344] },
  { name: "Nagapattinam", coordinates: [10.7672, 79.8449] },
  { name: "Krishnagiri", coordinates: [12.5266, 78.2141] },
  { name: "Cuddalore", coordinates: [11.748, 79.7714] },
  { name: "Dharmapuri", coordinates: [12.121, 78.1582] },
  { name: "Kanchipuram", coordinates: [12.8185, 79.6947] },
  { name: "Tiruvannamalai", coordinates: [12.2253, 79.0747] },
  { name: "Pudukkottai", coordinates: [10.3833, 78.8001] },
  { name: "Nilgiris", coordinates: [11.4916, 76.7337] },
  { name: "Ramanathapuram", coordinates: [9.3639, 78.8395] },
  { name: "Virudhunagar", coordinates: [9.568, 77.9624] },
  { name: "Ariyalur", coordinates: [11.14, 79.0786] },
  { name: "Perambalur", coordinates: [11.2342, 78.8807] },
  { name: "Kallakurichi", coordinates: [11.7383, 78.9571] },
  { name: "Tenkasi", coordinates: [8.9598, 77.3161] },
  { name: "Chengalpattu", coordinates: [12.6819, 79.9888] },
  { name: "Mayiladuthurai", coordinates: [11.1014, 79.6583] },
  { name: "Tirupattur", coordinates: [12.495, 78.5686] },
  { name: "Villupuram", coordinates: [11.9401, 79.4861] },
  { name: "Theni", coordinates: [10.0104, 77.4768] },
  { name: "Chennai Central", coordinates: [13.0827, 80.2707] },
  { name: "T. Nagar", coordinates: [13.0418, 80.2341] },
  { name: "Adyar", coordinates: [13.0012, 80.2565] },
  { name: "Anna Nagar", coordinates: [13.085, 80.2101] },
  { name: "Velachery", coordinates: [12.9815, 80.2176] },
  { name: "Tambaram", coordinates: [12.9249, 80.1] },
  { name: "Porur", coordinates: [13.0359, 80.1567] },
  { name: "Sholinganallur", coordinates: [12.901, 80.2279] },
  { name: "Guindy", coordinates: [13.0067, 80.2206] },
  { name: "Mylapore", coordinates: [13.0368, 80.2676] },
]

export default function SafeRoutes() {
  const muiTheme = useMuiTheme()
  const { isDarkMode } = useThemeContext()
  const { refreshData, sendEmergencyBroadcast, isLoading, userLocation, addAlert } = useAppContext()

  const [selectedView, setSelectedView] = useState("Traffic")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationPriority, setNotificationPriority] = useState("High")
  const [notificationRecipients, setNotificationRecipients] = useState("All Recipients")
  const [refreshing, setRefreshing] = useState(false)
  const [routes, setRoutes] = useState<Route[]>([])
  const [updates, setUpdates] = useState<Update[]>([])
  const [communications, setCommunications] = useState<Communication[]>([])
  const [showRouteDetails, setShowRouteDetails] = useState<string | null>(null)
  const [sendingNotification, setSendingNotification] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.0827, 80.2707])
  const [mapZoom, setMapZoom] = useState(11)
  const [mapType, setMapType] = useState<"street" | "satellite">("street")
  const [showFloodZones, setShowFloodZones] = useState(true)
  const [showRoads, setShowRoads] = useState(true)
  const [fullScreenMap, setFullScreenMap] = useState(false)
  const [fromLocation, setFromLocation] = useState("Chennai")
  const [toLocation, setToLocation] = useState("Coimbatore")
  const [riskRoutes, setRiskRoutes] = useState<{
    high: L.Polyline | null
    medium: L.Polyline | null
    low: L.Polyline | null
  }>({ high: null, medium: null, low: null })
  const [floodZones, setFloodZones] = useState<FloodZone[]>([])
  const [roadNetwork, setRoadNetwork] = useState<GraphNode[]>([])
  const [shortestPath, setShortestPath] = useState<[number, number][] | null>(null)
  const [avoidFloodZones, setAvoidFloodZones] = useState(true)
  const [routingControl, setRoutingControl] = useState<L.Routing.Control | null>(null)

  const mapRef = useRef<L.Map | null>(null)

  const stats = [
    { title: "Active Evacuations", value: "3", icon: <AlertTriangle size={20} />, className: "border-red-100" },
    { title: "Blocked Roads", value: "12", icon: <AlertCircle size={20} />, className: "border-orange-100" },
    { title: "Safe Routes", value: "8", icon: <CheckCircle2 size={20} />, className: "border-green-100" },
    { title: "Active Users", value: "1,247", icon: <Users size={20} />, className: "border-blue-100" },
  ]

  useEffect(() => {
    loadMockData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng])
      setMapZoom(12)
    }
  }, [userLocation])

  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const R = 6371
    const dLat = ((point2[0] - point1[0]) * Math.PI) / 180
    const dLon = ((point2[1] - point1[1]) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1[0] * Math.PI) / 180) *
        Math.cos((point2[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const loadMockData = async () => {
    const tamilNaduRoutes: Route[] = tamilNaduDistricts.slice(0, 8).map((district, index) => ({
      id: `route${index + 1}`,
      name: `${district.name} Evacuation Route`,
      status: (["Open", "Warning", "Closed"] as const)[index % 3],
      statusColor: (["text-green-500", "text-orange-500", "text-red-500"] as const)[index % 3],
      updated: ["2 mins ago", "5 mins ago", "12 mins ago"][index % 3],
      startPoint: district.coordinates,
      endPoint: [
        district.coordinates[0] + (Math.random() * 0.1 - 0.05),
        district.coordinates[1] + (Math.random() * 0.1 - 0.05),
      ] as [number, number],
      district: district.name,
    }))

    setRoutes(tamilNaduRoutes)

    const generatedUpdates: Update[] = tamilNaduRoutes.slice(0, 3).map((route, index) => ({
      id: `update${index + 1}`,
      time: new Date(Date.now() - 1000 * 60 * 15 * (index + 1)).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      title: `${route.district} ${["Bridge", "Highway Exit", "Route"][index]}`,
      description: ["Road closure due to flooding", "Heavy traffic congestion", "Route cleared and reopened"][index],
      severity: (["High", "Medium", "Low"] as const)[index],
    }))
    setUpdates(generatedUpdates)

    const mockFloodZones: FloodZone[] = [
      {
        id: "flood1",
        name: "Chennai Coastal Flood Zone",
        coordinates: [
          [13.0827, 80.2707],
          [13.0927, 80.2807],
          [13.0727, 80.2907],
          [13.0627, 80.2807],
          [13.0827, 80.2707],
        ] as [number, number][],
        riskLevel: "high",
      },
    ]
    setFloodZones(mockFloodZones)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMockData()
    setTimeout(() => setRefreshing(false), 900)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  const primaryColor = muiTheme.palette.primary.main
  const textColor = muiTheme.palette.text.primary
  const bgColor = muiTheme.palette.background.paper
  const subtleBorder = muiTheme.palette.divider

  return (
    <div style={{ backgroundColor: muiTheme.palette.background.default, color: textColor, minHeight: "100vh" }}>
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-bold">{isDarkMode ? "🌙" : "☀️"} Safe Routes</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              backgroundColor: primaryColor,
              color: "white",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              style={{ backgroundColor: bgColor, border: `1px solid ${subtleBorder}` }}
              className="rounded-lg p-4 shadow-md"
            >
              <div className="flex items-center gap-2">
                {stat.icon}
                <div>
                  <p className="text-sm font-medium opacity-75">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div
              style={{ backgroundColor: bgColor, border: `1px solid ${subtleBorder}` }}
              className="overflow-hidden rounded-lg shadow-md"
            >
              <div className="h-96 lg:h-[600px]">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: "100%", width: "100%" }}
                  whenReady={(event) => {
                    mapRef.current = event.target
                  }}
                >
                  <ChangeView center={mapCenter} zoom={mapZoom} />
                  <TileLayer
                    url={
                      mapType === "satellite"
                        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    }
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {showFloodZones &&
                    floodZones.map((zone) => (
                      <Polygon
                        key={zone.id}
                        positions={zone.coordinates}
                        pathOptions={{ color: "red", fillOpacity: 0.3 }}
                      >
                        <Popup>{zone.name}</Popup>
                      </Polygon>
                    ))}
                </MapContainer>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div
              style={{ backgroundColor: bgColor, border: `1px solid ${subtleBorder}` }}
              className="rounded-lg p-4 shadow-md"
            >
              <h2 className="mb-4 text-lg font-semibold">Route Calculator</h2>
              <form className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">From</label>
                  <select
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    className="w-full rounded border p-2 text-sm"
                  >
                    {tamilNaduDistricts.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To</label>
                  <select
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="w-full rounded border p-2 text-sm"
                  >
                    {tamilNaduDistricts.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={avoidFloodZones}
                    onChange={(e) => setAvoidFloodZones(e.target.checked)}
                  />
                  <span className="text-sm">Avoid flood zones</span>
                </label>
                <button
                  type="submit"
                  style={{ backgroundColor: primaryColor, color: "white" }}
                  className="w-full rounded py-2 font-medium"
                >
                  Calculate Route
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {showRouteDetails && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            padding: 16,
          }}
        >
          <div
            style={{
              background: bgColor,
              borderRadius: 12,
              padding: 20,
              width: "min(900px, 95%)",
              boxShadow: muiTheme.shadows[12],
              border: `1px solid ${subtleBorder}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontWeight: 700, color: textColor }}>Route Details</h3>
              <button
                onClick={() => setShowRouteDetails(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: textColor }}
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
