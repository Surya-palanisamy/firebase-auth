import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useState, type FormEvent } from "react";

import Tooltip, { tooltipClasses, TooltipProps } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";

import { LineChart } from "@mui/x-charts/LineChart";
import { XAxis } from "@mui/x-charts/models";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Droplets,
  MapPin,
  RefreshCw,
} from "lucide-react";

import axios from "axios";
import LoadingSpinnerModern from "../components/LoadingSpinner";
import { useAppContext } from "../context/AppContext";
import {
  fetchWeatherData,
  getCurrentLocation,
  getWeatherIconUrl,
  type WeatherData,
} from "../services/weatherService";
import {
  dateAxisFormatter,
  percentageFormatter,
  usUnemploymentRate,
} from "./UnemploymentRate";

const xAxis: XAxis<"time">[] = [
  {
    dataKey: "date",
    scaleType: "time",
    valueFormatter: dateAxisFormatter,
  },
];
const yAxis = [
  {
    valueFormatter: percentageFormatter,
  },
];
const series = [
  {
    dataKey: "rate",
    showMark: false,
    valueFormatter: percentageFormatter,
  },
];
const margin = { right: 24 };
const uData = [4000, 3000, 2000, 2780, 1890, 2390, 3490];
const pData = [2400, 1398, 9800, 3908, 4800, 3800, 4300];
const xLabels = [
  "Page A",
  "Page B",
  "Page C",
  "Page D",
  "Page E",
  "Page F",
  "Page G",
];

export default function Dashboard() {
  const theme = useTheme();
  const { isLoading, refreshData, sendEmergencyBroadcast, user } =
    useAppContext();

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

  // Use palette tokens (strings) instead of resolved color strings so they adapt cleanly
  const riskData = {
    low: { count: 3, colorToken: "success" as const },
    moderate: { count: 5, colorToken: "warning" as const },
    high: { count: 2, colorToken: "error" as const },
  };

  const stats = {
    activeAlerts: { count: 12, change: "+2" },
    evacuated: { count: 1234, change: "+89" },
    rescueTeams: { count: 8, change: "-1" },
    openShelters: { count: 15, change: "+3" },
  };

  const threshold = 3.5;
  const waterLevelData = Array.from({ length: 8 }, (_, i) => {
    const currentLevel = +(Math.random() * 2 + 1).toFixed(2);
    const predictedLevel = +(currentLevel + (Math.random() * 1 + 0.5)).toFixed(
      2
    );
    if (predictedLevel > threshold) {
    }
    return {
      time: `${String(i * 3).padStart(2, "0")}:00`,
      currentLevel,
      predictedLevel,
    };
  });

  const lastEntry = waterLevelData[waterLevelData.length - 1];
  const predictedPeak = Math.max(
    ...waterLevelData.map((e) => e.predictedLevel)
  );
  const timeToPeak =
    waterLevelData.find((entry) => entry.predictedLevel === predictedPeak)
      ?.time ?? "Unknown";

  const [floodLevels, setFloodLevels] = useState({
    current: 0,
    predicted: 0,
    timeToPeak: "N/A",
  });

  useEffect(() => {
    const fetchWaterLevel = async () => {
      try {
        // placeholder, keep your actual API
        const response = await axios.get(
          "https://jsonplaceholder.typicode.com/todos/1"
        );
        // adapt to your real feed parsing — here we'll mock:
        const level = Number((Math.random() * 2 + 0.5).toFixed(2));
        setFloodLevels({
          current: level,
          predicted: +(level + Math.random() * 1).toFixed(2),
          timeToPeak,
        });
      } catch (error) {
        console.error("Error fetching ThingSpeak data:", error);
      }
    };

    fetchWaterLevel();
    const interval = setInterval(fetchWaterLevel, 15000);
    return () => clearInterval(interval);
  }, [timeToPeak]);

  useEffect(() => {
    loadWeatherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWeatherData = async () => {
    setWeatherLoading(true);
    try {
      const coords = await getCurrentLocation();
      const data = await fetchWeatherData(undefined, coords);
      setWeather(data);
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      const data = await fetchWeatherData();
      setWeather(data);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadWeatherData();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleSendBroadcast = async (e: FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setSendingBroadcast(true);
    try {
      await sendEmergencyBroadcast(broadcastMessage);
      setBroadcastMessage("");
      setShowBroadcastModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingSpinnerModern variant="bar-wave" size="md" color="primary" />
    );
  }

  // Styled tooltip (keeps as you had)
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

  // chunk stats for 2x2 layout
  const statEntries = Object.entries(stats);
  const statRows: Array<Array<[string, { count: number; change: string }]>> =
    [];
  for (let i = 0; i < Math.min(4, statEntries.length); i += 2) {
    statRows.push(statEntries.slice(i, i + 2));
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Welcome, {user?.name || "User"}!
        </Typography>

        <Stack
          direction="row"
          spacing={2}
          sx={{ width: { xs: "100%", md: "auto" }, m: 2 }}
        >
          <BootstrapTooltip title="Click to refresh">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              startIcon={
                refreshing ? (
                  <CircularProgress size={18} />
                ) : (
                  <RefreshCw size={18} />
                )
              }
              variant="outlined"
              sx={{
                textTransform: "capitalize",
                width: { xs: "90%", sm: "auto" },
                p: 2,
              }}
            >
              Refresh Data
            </Button>
          </BootstrapTooltip>

          <BootstrapTooltip title="Send a emergency broadcast to all users">
            <Button
              onClick={() => setShowBroadcastModal(true)}
              startIcon={<AlertTriangle size={17} />}
              variant="contained"
              color="error"
              sx={{
                textTransform: "capitalize",
                width: { xs: "100%", sm: "auto" },
                p: 2,
              }}
            >
              Emergency Broadcast
            </Button>
          </BootstrapTooltip>
        </Stack>
      </Box>

      {/* Filters */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200, p: 1 }}>
          <InputLabel>Location</InputLabel>
          <Select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            label="Location"
          >
            <MenuItem value="All Locations">All Locations</MenuItem>
            <MenuItem value="Downtown">Downtown</MenuItem>
            <MenuItem value="Riverside">Riverside</MenuItem>
            <MenuItem value="North District">North District</MenuItem>
            <MenuItem value="South Bay">South Bay</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200, p: 1 }}>
          <InputLabel>Severity</InputLabel>
          <Select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            label="Severity"
          >
            <MenuItem value="All Severity Levels">All Severity Levels</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Moderate">Moderate</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Risk Data Cards */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        {Object.entries(riskData).map(([level, data]) => {
          const colorToken = (data as any).colorToken as
            | "success"
            | "warning"
            | "error";
          return (
            <Card key={level} sx={{ flex: 1 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ textTransform: "capitalize" }}
                    >
                      {level} Risk
                    </Typography>

                    {/* explicit palette token for number */}
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        mt: 1,
                        color: (t) => (t.palette as any)[colorToken].main,
                      }}
                    >
                      {(data as any).count}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Zones
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      bgcolor: (t) =>
                        alpha((t.palette as any)[colorToken].main, 0.12),
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Main Content Grid */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={3} sx={{ mb: 3 }}>
        {/* Weather Card */}
        <Card sx={{ flex: { lg: 1 } }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Current Weather
            </Typography>

            {weatherLoading ? (
              <LoadingSpinnerModern
                variant="gradient-ring"
                size="md"
                color="#7c3aed"
              />
            ) : weather ? (
              <Stack spacing={2}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 700,
                        color: (t) => t.palette.info.main,
                      }}
                    >
                      {weather.temp}°C
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {weather.condition}
                    </Typography>
                  </Box>

                  <img
                    src={getWeatherIconUrl(weather.icon) || "/placeholder.svg"}
                    alt={weather.condition}
                    style={{ width: 64, height: 64 }}
                  />
                </Box>

                <Stack spacing={1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Droplets size={20} color={theme.palette.info.main} />
                    <Typography variant="body2" color="info.main">
                      Humidity: {weather.humidity}%
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Droplets size={20} color={theme.palette.info.main} />
                    <Typography variant="body2" color="info.main">
                      Rainfall: {weather.rainfall}mm
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <MapPin size={20} color={theme.palette.info.main} />
                    <Typography variant="body2" color="info.main">
                      Location: {weather.location}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Weather data unavailable
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Stats area: exact 2 + 2 layout using explicit rows */}
        <Box sx={{ flex: { lg: 1 }, width: "100%" }}>
          <Stack direction="column" spacing={2} sx={{ width: "100%" }}>
            {statRows.map((row, rowIndex) => (
              <Stack
                key={rowIndex}
                direction="row"
                spacing={2}
                sx={{ width: "100%" }}
                justifyContent="center"
              >
                {row.map(([key, data]) => (
                  <StatCard key={key} title={key} data={data} theme={theme} />
                ))}
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>

      {/* Flood Predictions */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
        <Card sx={{ flex: { lg: 1 } }}>
          <CardContent>
            <Box
              sx={{
                height: 310,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <iframe
                src="https://thingspeak.com/channels/2901817/charts/1?bgcolor=%23ffffff&color=%230072bd&dynamic=true&type=line&update=15&width=2000&height=310"
                style={{
                  width: "100%",
                  height: "100%",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
                allowFullScreen
                title="Real-Time Water Level"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Flood Level Predictions */}
        <Card sx={{ flex: { lg: 1 } }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Flood Level Predictions
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Current Level
                </Typography>
                <Box
                  sx={{
                    height: 12,
                    bgcolor: theme.palette.success.main,
                    borderRadius: 1,
                    width: `${Math.min(100, (floodLevels.current / 8) * 100)}%`,
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                  {floodLevels.current}m
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Predicted Peak
                </Typography>
                <Box
                  sx={{
                    height: 12,
                    bgcolor: theme.palette.error.main,
                    borderRadius: 1,
                    width: `${Math.min(
                      100,
                      (floodLevels.predicted / 8) * 100
                    )}%`,
                  }}
                />
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
                  {floodLevels.predicted}m
                </Typography>
              </Box>

              <Box
                sx={{ pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}
              >
                <Typography variant="body2" color="text.secondary">
                  Time to Peak
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    mt: 1,
                    fontWeight: 700,
                    color:
                      floodLevels.timeToPeak === "Receding"
                        ? theme.palette.error.main
                        : floodLevels.timeToPeak === "Stable"
                        ? theme.palette.success.main
                        : theme.palette.info.main,
                  }}
                >
                  {floodLevels.timeToPeak}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Stack sx={{ mt: 3 }}>
        <LineChart
          dataset={usUnemploymentRate}
          xAxis={xAxis}
          yAxis={yAxis}
          series={series}
          height={300}
          grid={{ vertical: true, horizontal: true }}
        />
      </Stack>

      <hr style={{ margin: "12px" }} />

      <Stack>
        <LineChart
          series={[
            { data: pData, label: "pv" },
            { data: uData, label: "uv" },
          ]}
          xAxis={[{ scaleType: "point", data: xLabels }]}
          yAxis={[{ width: 50 }]}
          margin={margin}
        />
      </Stack>

      {/* Emergency Broadcast Dialog */}
      <Dialog
        open={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Emergency Broadcast</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Broadcast Message"
            multiline
            rows={4}
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Enter emergency broadcast message..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowBroadcastModal(false)}>Cancel</Button>
          <Button
            onClick={handleSendBroadcast}
            disabled={!broadcastMessage.trim() || sendingBroadcast}
            variant="contained"
            color="error"
            startIcon={
              sendingBroadcast ? <CircularProgress size={20} /> : undefined
            }
          >
            {sendingBroadcast ? "Sending..." : "Send Broadcast"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* Reusable small stat card used in the 2x2 layout */
function StatCard({
  title,
  data,
  theme,
}: {
  title: string;
  data: { count: number; change: string };
  theme: any;
}) {
  const positive = data.change.startsWith("+");
  const deltaToken = positive ? "success" : "error";

  return (
    <Card
      sx={{
        width: { xs: "100%", sm: "48%" },
        maxWidth: { xs: "100%", sm: "48%" },
        display: "flex",
        flexDirection: "column",
        minHeight: 140,
        boxSizing: "border-box",
      }}
    >
      <CardContent
        sx={{
          textAlign: "center",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textTransform: "capitalize" }}
        >
          {title.replace(/([A-Z])/g, " $1").trim()}
        </Typography>

        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mt: 1, color: (t) => t.palette.primary.main }}
        >
          {data.count}
        </Typography>

        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            mt: 1.5,
            color: (t) => (t.palette as any)[deltaToken].main,
            alignSelf: "center",
          }}
        >
          {positive ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          <Typography variant="caption" sx={{ fontWeight: 500 }}>
            {data.change.replace(/^[+-]/, "")} from yesterday
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
