import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
  AlertTriangle,
  Bell,
  Bot,
  Edit,
  Info,
  MessageSquare,
  RefreshCw,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAppContext } from "../context/AppContext";

export default function Alerts() {
  const { isLoading, refreshData, sendEmergencyBroadcast, addAlert } =
    useAppContext();
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [notificationType, setNotificationType] = useState("SMS");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNewAlertModal, setShowNewAlertModal] = useState(false);
  const [newAlertTitle, setNewAlertTitle] = useState("");
  const [newAlertMessage, setNewAlertMessage] = useState("");
  const [newAlertType, setNewAlertType] = useState("warning");
  const [sendingAlert, setSendingAlert] = useState(false);
  const theme = useTheme();

  const alertStats = [
    {
      title: "Total Active Alerts",
      value: "12",
      icon: <Bell size={20} />,
      color: "info" as const,
    },
    {
      title: "High Risk Alerts",
      value: "3",
      icon: <AlertTriangle size={20} />,
      color: "error" as const,
    },
    {
      title: "Pending Acknowledgments",
      value: "245",
      icon: <MessageSquare size={20} />,
      color: "warning" as const,
    },
    {
      title: "Average Response Time",
      value: "4.2m",
      icon: <Info size={20} />,
      color: "success" as const,
    },
  ];

  const activeAlerts = [
    {
      id: "A001",
      status: "high",
      title: "Severe Weather Warning",
      riskLevel: "High",
      timeIssued: "10:45 AM",
      responseRate: "78%",
    },
    {
      id: "A002",
      status: "medium",
      title: "Road Closure Alert",
      riskLevel: "Moderate",
      timeIssued: "09:30 AM",
      responseRate: "92%",
    },
    {
      id: "A003",
      status: "low",
      title: "Public Transport Delay",
      riskLevel: "Low",
      timeIssued: "08:15 AM",
      responseRate: "65%",
    },
  ];

  const aiSuggestions = [
    {
      id: "S001",
      severity: "Moderate",
      confidence: "89%",
      message:
        "Heavy rainfall expected in the next 24 hours. Consider issuing a flood warning for low-lying areas.",
    },
    {
      id: "S002",
      severity: "Low",
      confidence: "95%",
      message:
        "Traffic congestion detected on Main Street due to road work. Suggest alternate routes.",
    },
  ];

  const responseData = [
    {
      id: "R001",
      title: "Severe Weather Warning",
      time: "10:45 AM",
      delivered: "12,458",
      responded: "9,468",
    },
    {
      id: "R002",
      title: "Road Closure Alert",
      time: "09:30 AM",
      delivered: "12,458",
      responded: "11,442",
    },
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSendAlert = async (e: FormEvent) => {
    e.preventDefault();
    if (messageTitle && messageContent) {
      setSendingAlert(true);
      try {
        await sendEmergencyBroadcast(`${messageTitle}: ${messageContent}`);
        setMessageTitle("");
        setMessageContent("");
      } catch (error) {
        console.error("Error sending alert:", error);
      } finally {
        setSendingAlert(false);
      }
    }
  };

  const handleDeleteAlert = (id: string) => {
    setSelectedAlert(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteAlert = () => {
    console.log(`Deleting alert ${selectedAlert}`);
    setShowDeleteModal(false);
    setSelectedAlert(null);
  };

  const handleUseAiSuggestion = (suggestion: any) => {
    setMessageTitle(`AI Suggested: ${suggestion.severity} Alert`);
    setMessageContent(suggestion.message);
  };

  const handleCreateNewAlert = async (e: FormEvent) => {
    e.preventDefault();
    if (newAlertTitle && newAlertMessage) {
      setSendingAlert(true);
      try {
        await addAlert({
          title: newAlertTitle,
          message: newAlertMessage,
          type: newAlertType as any,
        });
        setNewAlertTitle("");
        setNewAlertMessage("");
        setShowNewAlertModal(false);
      } catch (error) {
        console.error("Error creating alert:", error);
      } finally {
        setSendingAlert(false);
      }
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return theme.palette.error.main;
      case "medium":
        return theme.palette.warning.main;
      case "low":
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Stats Grid */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        {alertStats.map((stat, index) => (
          <Card key={index} sx={{ flex: 1 }}>
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
                    variant="body2"
                    color="textSecondary"
                    sx={{ mb: 1 }}
                  >
                    {stat.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: theme.palette[stat.color].main,
                  }}
                >
                  {stat.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
        {/* Left Column */}
        <Stack sx={{ flex: 1 }} spacing={3}>
          {/* Active Alerts Table */}
          <Card>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Active Alerts
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton
                  onClick={handleRefresh}
                  disabled={refreshing}
                  size="small"
                  sx={{
                    animation: refreshing ? "spin 1s linear infinite" : "none",
                  }}
                >
                  <RefreshCw size={20} />
                </IconButton>
                <Button
                  onClick={() => setShowNewAlertModal(true)}
                  startIcon={<Bell size={18} />}
                  variant="contained"
                  color="info"
                  size="small"
                >
                  New Alert
                </Button>
              </Stack>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ color: "red" }}>
                    <TableCell>Status</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>Time Issued</TableCell>
                    <TableCell>Response Rate</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeAlerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: getStatusColor(alert.status),
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {alert.title}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={alert.riskLevel}
                          color={
                            alert.riskLevel === "High"
                              ? "error"
                              : alert.riskLevel === "Moderate"
                              ? "warning"
                              : "info"
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{alert.timeIssued}</TableCell>
                      <TableCell>{alert.responseRate}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" color="inherit">
                            <Edit size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="inherit"
                            onClick={() => handleDeleteAlert(alert.id)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Send Emergency Notification */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Send Emergency Notification
              </Typography>
              <Box
                component="form"
                onSubmit={handleSendAlert}
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Notification Type
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    {["SMS", "App Notification", "Website Banner"].map(
                      (type) => (
                        <Button
                          key={type}
                          onClick={() => setNotificationType(type)}
                          variant={"outlined"}
                          sx={{ flex: 1 }}
                        >
                          {type}
                        </Button>
                      )
                    )}
                  </Stack>
                </Box>

                <TextField
                  label="Message Title"
                  value={messageTitle}
                  onChange={(e) => setMessageTitle(e.target.value)}
                  fullWidth
                  required
                />

                <TextField
                  label="Message Content"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  rows={4}
                  fullWidth
                  required
                />

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Users size={20} />
                  <Typography variant="body2">
                    All Residents (12,458)
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  disabled={!messageTitle || !messageContent || sendingAlert}
                  variant="contained"
                  color="error"
                  startIcon={
                    sendingAlert ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Send size={20} />
                    )
                  }
                  fullWidth
                >
                  {sendingAlert ? "Sending..." : "Send Emergency Alert"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Stack>

        {/* Right Column */}
        <Stack sx={{ flex: 1 }} spacing={3}>
          {/* Response Monitoring */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Response Monitoring
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <Box sx={{ position: "relative", width: 120, height: 120 }}>
                  <svg style={{ width: "100%", height: "100%" }}>
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={theme.palette.divider}
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={theme.palette.success.main}
                      strokeWidth="8"
                      strokeDasharray={`${76 * 3.14}`}
                      strokeDashoffset={`${((100 - 76) / 100) * 3.14 * 50}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      76%
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Response Rate
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Stack spacing={2}>
                {responseData.map((data) => (
                  <Box
                    key={data.id}
                    sx={{
                      pt: 2,
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {data.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {data.time}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          bgcolor: theme.palette.success.main,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      Delivered: {data.delivered} • Responded: {data.responded}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* AI-Suggested Alerts */}
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Bot size={20} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  AI-Suggested Alerts
                </Typography>
              </Box>
              <Stack spacing={2}>
                {aiSuggestions.map((suggestion) => (
                  <Box
                    key={suggestion.id}
                    sx={{
                      p: 2,
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[800]
                          : theme.palette.info[50],
                      borderRadius: 1,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Chip
                        label={suggestion.severity}
                        size="small"
                        color={
                          suggestion.severity === "Moderate"
                            ? "warning"
                            : "info"
                        }
                        variant="outlined"
                      />
                      <Typography variant="caption" color="textSecondary">
                        Confidence: {suggestion.confidence}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {suggestion.message}
                    </Typography>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleUseAiSuggestion(suggestion)}
                    >
                      Use This
                    </Button>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this alert? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteAlert}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Alert Modal */}
      <Dialog
        open={showNewAlertModal}
        onClose={() => setShowNewAlertModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Alert</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Alert Title"
              value={newAlertTitle}
              onChange={(e) => setNewAlertTitle(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Alert Message"
              value={newAlertMessage}
              onChange={(e) => setNewAlertMessage(e.target.value)}
              multiline
              rows={4}
              fullWidth
              required
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Alert Type
              </Typography>
              <Stack direction="row" spacing={1}>
                {["info", "warning", "error"].map((type) => (
                  <Button
                    key={type}
                    onClick={() => setNewAlertType(type)}
                    variant={newAlertType === type ? "contained" : "outlined"}
                    color={type as any}
                    size="small"
                    sx={{ flex: 1 }}
                  >
                    {type}
                  </Button>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewAlertModal(false)}>Cancel</Button>
          <Button
            onClick={handleCreateNewAlert}
            variant="contained"
            disabled={!newAlertTitle || !newAlertMessage || sendingAlert}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
