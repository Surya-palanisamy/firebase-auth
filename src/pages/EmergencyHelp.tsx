import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  MapPin,
  RefreshCw,
  Send,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAppContext } from "../context/AppContext";

export default function EmergencyHelp() {
  const { refreshData, sendEmergencyBroadcast, isLoading } = useAppContext();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showAssignTeamModal, setShowAssignTeamModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const theme = useTheme();

  // Mock data
  const stats = [
    {
      title: "Active Emergencies",
      value: "12",
      icon: <AlertTriangle size={24} />,
      bgColor: theme.palette.error.main + "20",
    },
    {
      title: "Active Volunteers",
      value: "247",
      icon: <Users size={24} />,
      bgColor: theme.palette.info.main + "20",
    },
    {
      title: "Teams Deployed",
      value: "8",
      icon: <Activity size={24} />,
      bgColor: theme.palette.success.main + "20",
    },
    {
      title: "Response Time Avg",
      value: "4.2 min",
      icon: <RefreshCw size={24} />,
      bgColor: theme.palette.warning.main + "20",
    },
  ];

  const emergencyCases = [
    {
      id: "E001",
      priority: "High",
      location: "Anna Nagar, Chennai",
      type: "Flood Emergency",
      description: "Multiple families need evacuation",
      volunteersAssigned: 5,
    },
    {
      id: "E002",
      priority: "Medium",
      location: "T. Nagar, Chennai",
      type: "Medical Help",
      description: "First aid required",
      volunteersAssigned: 3,
    },
  ];

  const helpRequests = [
    { id: "HR001", location: "Downtown Area", status: "Pending" },
    { id: "HR002", location: "Riverside District", status: "In Progress" },
    { id: "HR003", location: "North Bay", status: "Completed" },
  ];

  const teams = [
    {
      id: "T001",
      name: "Alpha Team",
      location: "Central HQ",
      status: "Active",
      members: 5,
    },
    {
      id: "T002",
      name: "Beta Team",
      location: "North District",
      status: "Deployed",
      members: 6,
    },
    {
      id: "T003",
      name: "Gamma Team",
      location: "South Wing",
      status: "On Standby",
      members: 4,
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSendBroadcast = async () => {
    if (broadcastMessage.trim()) {
      try {
        await sendEmergencyBroadcast(broadcastMessage);
        setBroadcastMessage("");
        setShowBroadcastModal(false);
      } catch (error) {
        console.error("Error sending broadcast:", error);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "error";
      case "Medium":
        return "warning";
      case "Low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "In Progress":
        return "info";
      case "Completed":
        return "success";
      case "Rejected":
        return "error";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          RescueOps
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            size="medium"
          >
            <RefreshCw
              size={20}
              style={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
              }}
            />
          </IconButton>
          <Button
            onClick={() => setShowBroadcastModal(true)}
            startIcon={<Send size={20} />}
            variant="contained"
            color="error"
          >
            Emergency Broadcast
          </Button>
        </Stack>
      </Box>

      {/* Stats Grid */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Card key={index} sx={{ flex: 1 }}>
            <CardContent>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: stat.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stat.title}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
        {/* Active Emergency Cases */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Active Emergency Cases
            </Typography>
            <Stack spacing={2}>
              {emergencyCases.map((emergency) => (
                <Card key={emergency.id} variant="outlined">
                  <CardContent sx={{ pb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 1,
                      }}
                    >
                      <Chip
                        label={emergency.priority}
                        color={getPriorityColor(emergency.priority)}
                        size="small"
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, mb: 0.5 }}
                    >
                      {emergency.location}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      {emergency.type}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mb: 2 }}
                    >
                      {emergency.description}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" color="textSecondary">
                        {emergency.volunteersAssigned} volunteers assigned
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setShowAssignTeamModal(true)}
                      >
                        Assign Team
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Recent Help Requests */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Help Requests
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[800]
                          : theme.palette.grey[50],
                    }}
                  >
                    <TableCell>ID</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {helpRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell sx={{ fontSize: "0.875rem" }}>
                        {request.id}
                      </TableCell>
                      <TableCell sx={{ fontSize: "0.875rem" }}>
                        {request.location}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" color="success">
                            <CheckCircle size={16} />
                          </IconButton>
                          <IconButton size="small" color="error">
                            <XCircle size={16} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Stack>

      {/* Active Teams */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Active Teams
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{}}>
                  <TableCell>Team IDs</TableCell>
                  <TableCell>Team Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Members</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell sx={{ fontSize: "0.875rem" }}>
                      {team.id}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{team.name}</TableCell>
                    <TableCell sx={{ fontSize: "0.875rem" }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <MapPin size={14} />
                        {team.location}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={team.status}
                        color={
                          team.status === "Active"
                            ? "success"
                            : team.status === "Deployed"
                            ? "info"
                            : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{team.members}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Broadcast Modal */}
      <Dialog
        open={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Emergency Broadcast</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Broadcast Message"
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            multiline
            rows={4}
            fullWidth
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBroadcastModal(false)}>Cancel</Button>
          <Button
            onClick={handleSendBroadcast}
            disabled={!broadcastMessage.trim()}
            variant="contained"
            color="error"
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Team Modal */}
      <Dialog
        open={showAssignTeamModal}
        onClose={() => setShowAssignTeamModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Team</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Select Team</InputLabel>
            <Select
              value={selectedTeamId || ""}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              label="Select Team"
            >
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name} ({team.status})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignTeamModal(false)}>Cancel</Button>
          <Button
            onClick={() => setShowAssignTeamModal(false)}
            disabled={!selectedTeamId}
            variant="contained"
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
