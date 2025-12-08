"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  useTheme,
} from "@mui/material";

import Tooltip, { tooltipClasses, TooltipProps } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import { LineChart } from "@mui/x-charts/LineChart";

import { AlertTriangle, ArrowDown, ArrowUp, RefreshCw } from "lucide-react";

import LoadingSpinnerModern from "../components/LoadingSpinner";

import {
  getWeatherIconUrl,
  fetchWeatherData,
  getCurrentLocation,
  type WeatherData,
} from "../services/weatherService";

import { fetchFloodLevels } from "../services/firestoreService";
import { useAppContext } from "../context/AppContext";

import {
  dateAxisFormatter,
  percentageFormatter,
  usUnemploymentRate,
} from "./UnemploymentRate";

/* ---------------------- CONSTANTS ---------------------- */

const LOCATION_OPTIONS = [
  "All Locations",
  "Downtown",
  "Riverside",
  "North District",
  "South Bay",
];

const SEVERITY_OPTIONS = ["All Severity Levels", "High", "Moderate", "Low"];

/* ---------------------- TOOLTIP STYLE ---------------------- */
const BootstrapTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.common.black,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.black,
  },
}));

/* ============================================================
   MAIN DASHBOARD
============================================================ */

export default function Dashboard() {
  const theme = useTheme();
  const {
    isLoading,
    refreshData,
    sendEmergencyBroadcast,
    user,
    alerts,
    shelters,
    coordinators,
    resources,
  } = useAppContext();

  /* ------------------- STATES ------------------- */

  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [selectedSeverity, setSelectedSeverity] = useState(
    "All Severity Levels"
  );

  const [refreshing, setRefreshing] = useState(false);

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const [floodLevels, setFloodLevels] = useState({
    current: 0,
    predicted: 0,
    timeToPeak: "N/A",
  });

  /* ------------------- FIRESTORE DERIVED DATA ------------------- */

  const riskData = useMemo(() => {
    const low = shelters.filter((s) => s.status === "Available").length;
    const moderate = shelters.filter((s) => s.status === "Near Full").length;
    const high = shelters.filter((s) => s.status === "Full").length;

    return {
      low: { count: low, colorToken: "success" as const },
      moderate: { count: moderate, colorToken: "warning" as const },
      high: { count: high, colorToken: "error" as const },
    };
  }, [shelters]);

  const stats = useMemo(() => {
    return {
      activeAlerts: { count: alerts.length, change: "+2" },
      evacuated: {
        count: resources.reduce((a, b) => a + b.percentage, 0),
        change: "+80",
      },
      rescueTeams: { count: coordinators.length, change: "+1" },
      openShelters: {
        count: shelters.filter((s) => s.status !== "Full").length,
        change: "+3",
      },
    };
  }, [alerts, resources, coordinators, shelters]);

  const statRows = useMemo(() => {
    const entries = Object.entries(stats);
    return [entries.slice(0, 2), entries.slice(2, 4)];
  }, [stats]);

  /* ------------------- WEATHER FETCH ------------------- */

  const loadWeatherData = useCallback(async () => {
    setWeatherLoading(true);

    try {
      const coords = await getCurrentLocation();
      const data = await fetchWeatherData(undefined, coords);
      setWeather(data);
    } catch {
      const fallback = await fetchWeatherData();
      setWeather(fallback);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]);

  /* ------------------- FLOOD LEVELS FETCH ------------------- */

  const loadFloodLevels = useCallback(async () => {
    const data = await fetchFloodLevels();
    if (data) {
      setFloodLevels(data);
    }
  }, []);

  useEffect(() => {
    loadFloodLevels();
    const id = setInterval(loadFloodLevels, 15000);
    return () => clearInterval(id);
  }, [loadFloodLevels]);

  /* ------------------- REFRESH ------------------- */

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshData(), loadWeatherData(), loadFloodLevels()]);
    setTimeout(() => setRefreshing(false), 600);
  }, [refreshData, loadWeatherData, loadFloodLevels]);

  /* ------------------- BROADCAST ------------------- */

  const handleSendBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setSendingBroadcast(true);
    await sendEmergencyBroadcast(broadcastMessage);
    setSendingBroadcast(false);
    setBroadcastMessage("");
    setShowBroadcastModal(false);
  };

  /* ------------------- LOADING GUARD ------------------- */

  if (isLoading) {
    return (
      <LoadingSpinnerModern variant="bar-wave" size="md" color="primary" />
    );
  }

  /* ============================================================
      RENDER
  ============================================================ */

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Header
        userName={user?.name|| user?.fullName || "User"}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onBroadcastClick={() => setShowBroadcastModal(true)}
      />

      <Filters
        selectedLocation={selectedLocation}
        setSelectedLocation={setSelectedLocation}
        selectedSeverity={selectedSeverity}
        setSelectedSeverity={setSelectedSeverity}
      />

      <RiskCards riskData={riskData} />

      <WeatherAndStats
        weather={weather}
        weatherLoading={weatherLoading}
        statRows={statRows}
        theme={theme}
      />

      <FloodPrediction floodLevels={floodLevels} theme={theme} />

      <Charts />

      <BroadcastDialog
        open={showBroadcastModal}
        message={broadcastMessage}
        loading={sendingBroadcast}
        onClose={() => setShowBroadcastModal(false)}
        onChange={(e) => setBroadcastMessage(e.target.value)}
        onSubmit={handleSendBroadcast}
      />
    </Box>
  );
}

/* ============================================================
   SUB-COMPONENTS
============================================================ */

const Header = React.memo(function Header({
  userName,
  refreshing,
  onRefresh,
  onBroadcastClick,
}: any) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        mb: 3,
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        Welcome, {userName}!
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mt: { xs: 2, md: 0 } }}>
        <Button
          onClick={onRefresh}
          disabled={refreshing}
          startIcon={
            refreshing ? <CircularProgress size={18} /> : <RefreshCw />
          }
          variant="outlined"
          sx={{ textTransform: "capitalize", p: 2 }}
        >
          Refresh Data
        </Button>

        <Button
          onClick={onBroadcastClick}
          startIcon={<AlertTriangle />}
          color="error"
          variant="contained"
          sx={{ textTransform: "capitalize", p: 2 }}
        >
          Emergency Broadcast
        </Button>
      </Stack>
    </Box>
  );
});

const Filters = React.memo(function Filters({
  selectedLocation,
  setSelectedLocation,
  selectedSeverity,
  setSelectedSeverity,
}: any) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Location</InputLabel>
        <Select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          {LOCATION_OPTIONS.map((loc) => (
            <MenuItem key={loc} value={loc}>
              {loc}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Severity</InputLabel>
        <Select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
        >
          {SEVERITY_OPTIONS.map((sev) => (
            <MenuItem key={sev} value={sev}>
              {sev}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
});

const RiskCards = React.memo(function RiskCards({ riskData }: any) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
      {Object.entries(riskData).map(([level, info]: any) => (
        <Card key={level} sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ textTransform: "capitalize" }}>
              {level} Risk
            </Typography>

            <Typography
              variant="h4"
              sx={{
                mt: 1,
                fontWeight: 700,
                color: (t) => (t.palette as any)[info.colorToken].main,
              }}
            >
              {info.count}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Zones
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
});

const WeatherAndStats = React.memo(function WeatherAndStats({
  weather,
  weatherLoading,
  statRows,
  theme,
}: any) {
  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={3} sx={{ mb: 3 }}>
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Current Weather
          </Typography>

          {weatherLoading ? (
            <LoadingSpinnerModern variant="gradient-ring" size="md" />
          ) : weather ? (
            <WeatherDetails weather={weather} theme={theme} />
          ) : (
            <Typography color="text.secondary">
              Weather data unavailable
            </Typography>
          )}
        </CardContent>
      </Card>

      <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
        {statRows.map((row: any[], i: number) => (
          <Stack direction="row" spacing={2} key={i}>
            {row.map(([key, data]: any) => (
              <StatCard key={key} title={key} data={data} theme={theme} />
            ))}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
});

function WeatherDetails({ weather, theme }: any) {
  return (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="h3" sx={{ color: theme.palette.info.main }}>
          {weather.temp}°C
        </Typography>
        <img
          src={getWeatherIconUrl(weather.icon)}
          alt={weather.condition}
          width={60}
        />
      </Box>

      <Typography>{weather.condition}</Typography>
      <Typography>Humidity: {weather.humidity}%</Typography>
      <Typography>Rain: {weather.rainfall}mm</Typography>
      <Typography>Location: {weather.location}</Typography>
    </Stack>
  );
}

const StatCard = React.memo(function StatCard({ title, data, theme }: any) {
  const positive = data.change.startsWith("+");
  const deltaToken = positive ? "success" : "error";

  return (
    <Card sx={{ flex: 1 }}>
      <CardContent sx={{ textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          {title.replace(/([A-Z])/g, " $1")}
        </Typography>

        <Typography
          variant="h5"
          sx={{ color: theme.palette.primary.main, mt: 1 }}
        >
          {data.count}
        </Typography>

        <Box
          sx={{
            mt: 1,
            color: (t) => t.palette[deltaToken].main,
            display: "flex",
            justifyContent: "center",
            gap: 1,
          }}
        >
          {positive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          <Typography variant="caption">
            {data.change.replace(/^[+-]/, "")} from yesterday
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
});

const FloodPrediction = React.memo(function FloodPrediction({
  floodLevels,
  theme,
}: any) {
  const pct = (value: number) => `${Math.min(100, (value / 8) * 100)}%`;

  return (
    <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <iframe
            src="https://thingspeak.com/channels/2901817/charts/1?bgcolor=%23ffffff&color=%230072bd&dynamic=true&type=line&update=15"
            style={{
              width: "100%",
              height: 310,
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        </CardContent>
      </Card>

      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="h6">Flood Level Predictions</Typography>

          <Box sx={{ mt: 2 }}>
            <Typography>Current</Typography>
            <Box
              sx={{
                height: 10,
                bgcolor: theme.palette.success.main,
                width: pct(floodLevels.current),
              }}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography>Predicted</Typography>
            <Box
              sx={{
                height: 10,
                bgcolor: theme.palette.error.main,
                width: pct(floodLevels.predicted),
              }}
            />
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2">Time to Peak</Typography>
            <Typography
              variant="h6"
              sx={{
                color:
                  floodLevels.timeToPeak === "Rising"
                    ? theme.palette.error.main
                    : theme.palette.info.main,
              }}
            >
              {floodLevels.timeToPeak}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
});

const Charts = () => (
  <>
    <LineChart
      dataset={usUnemploymentRate}
      xAxis={[
        {
          dataKey: "date",
          scaleType: "time",
          valueFormatter: dateAxisFormatter,
        },
      ]}
      yAxis={[{ valueFormatter: percentageFormatter }]}
      series={[
        {
          dataKey: "rate",
          showMark: false,
          valueFormatter: percentageFormatter,
        },
      ]}
      height={300}
    />

    <hr style={{ margin: "16px 0" }} />

    <LineChart
      series={[
        { data: [4000, 3000, 2000, 2780, 1890, 2390, 3490], label: "pv" },
        { data: [2400, 1398, 9800, 3908, 4800, 3800, 4300], label: "uv" },
      ]}
      xAxis={[
        { scaleType: "point", data: ["A", "B", "C", "D", "E", "F", "G"] },
      ]}
      height={300}
    />
  </>
);

const BroadcastDialog = ({
  open,
  message,
  loading,
  onClose,
  onChange,
  onSubmit,
}: any) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle>Send Emergency Broadcast</DialogTitle>

    <DialogContent>
      <TextField
        fullWidth
        multiline
        rows={4}
        label="Broadcast Message"
        value={message}
        onChange={onChange}
      />
    </DialogContent>

    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>

      <Button
        onClick={onSubmit}
        disabled={!message.trim() || loading}
        variant="contained"
        color="error"
        startIcon={loading ? <CircularProgress size={18} /> : null}
      >
        {loading ? "Sending..." : "Send"}
      </Button>
    </DialogActions>
  </Dialog>
);
