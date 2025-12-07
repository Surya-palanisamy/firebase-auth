import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Camera, Check } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSettings } from "../hooks/useSettings";

/* --- Helpers --- */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}
const a11yProps = (index: number) => ({
  id: `settings-tab-${index}`,
  "aria-controls": `settings-tabpanel-${index}`,
});

/* --- Minimal Error Boundary --- */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Something went wrong.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Try reloading the page. If the problem persists, contact support.
          </Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

/* --- Main component --- */
function SettingsPageModernInner() {
  const theme = useTheme();
  const {
    settings = {
      fullName: "",
      email: "",
      phone: "",
      theme: "system",
      twoFactorEnabled: false,
    },
    loading,
    saveAccountSettings,
    savePreferences,
    saveSecuritySettings,
  } = useSettings();

  const [tabValue, setTabValue] = useState(0);

  const [accountForm, setAccountForm] = useState({
    fullName: settings.fullName || "",
    email: settings.email || "",
    phone: settings.phone || "",
  });
  useEffect(() => {
    setAccountForm({
      fullName: settings.fullName || "",
      email: settings.email || "",
      phone: settings.phone || "",
    });
  }, [settings]);

  const [accountSaved, setAccountSaved] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const [preferenceForm, setPreferenceForm] = useState({
    theme: (settings as any).theme || "system",
  });
  useEffect(() => {
    setPreferenceForm({ theme: (settings as any).theme || "system" });
  }, [settings]);

  const [prefSaved, setPrefSaved] = useState(false);

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: (settings as any).twoFactorEnabled || false,
  });
  useEffect(() => {
    setSecurityForm((s) => ({
      ...s,
      twoFactorEnabled: (settings as any).twoFactorEnabled || false,
    }));
  }, [settings]);

  const [securitySaved, setSecuritySaved] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // avatar preview state
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>(undefined);

  const handleTabChange = (_e: any, v: number) => {
    setTabValue(v);
    setAccountSaved(false);
    setPrefSaved(false);
    setSecuritySaved(false);
  };

  const handleAccountSave = async () => {
    setAccountError(null);
    setAccountSaved(false);
    if (!accountForm.fullName.trim())
      return setAccountError("Full name required");
    if (!accountForm.email.trim()) return setAccountError("Email required");
    // You may want to include avatar data here if backend accepts it.
    const success = await saveAccountSettings?.(accountForm);
    if (success) {
      setAccountSaved(true);
      setTimeout(() => setAccountSaved(false), 3000);
    } else {
      setAccountError("Could not save account settings");
    }
  };

  const handlePreferencesSave = async () => {
    const success = await savePreferences?.(preferenceForm);
    if (success) {
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 2500);
    }
  };

  const handleSecuritySave = async () => {
    setSecurityError(null);
    if (
      securityForm.newPassword &&
      securityForm.newPassword !== securityForm.confirmPassword
    ) {
      return setSecurityError("New password and confirm do not match");
    }
    const success = await saveSecuritySettings?.(securityForm);
    if (success) {
      setSecuritySaved(true);
      setSecurityForm((s) => ({
        ...s,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setTimeout(() => setSecuritySaved(false), 3000);
    } else setSecurityError("Failed to update security settings");
  };

  // handle avatar file selection and preview
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 6 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Settings
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Keep your profile and account secure.
          </Typography>
        </Box>

        <Paper
          elevation={2}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            p: 0,
            boxShadow: theme.shadows[8],
          }}
        >
          {/* Header with Tabs: indicator blue; text keeps same color; no border/hover/outline */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 3,
              py: 1.5,
              bgcolor: "background.paper",
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="settings tabs"
              TabIndicatorProps={{
                sx: {
                  height: 3,
                  borderRadius: 3,
                  bgcolor: "primary.main", // blue underline
                },
              }}
              sx={{
                "& .MuiTabs-flexContainer": { gap: 4 },
                minHeight: 48,
                // remove any default outline/shadow on the container
                "&.MuiTabs-root": { boxShadow: "none", border: "none" },
              }}
            >
              <Tab
                label="Account"
                {...a11yProps(0)}
                disableRipple
                sx={{
                  textTransform: "none",

                  fontSize: 18,
                  minHeight: 48,
                  padding: "6px 8px",
                  color: (t) => t.palette.text.secondary,
                  "&.Mui-selected": { color: (t) => t.palette.text.secondary },
                  // remove hover/background/border/focus visuals completely
                  "&:hover": {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    border: "none",
                  },
                  "&:focus": {
                    outline: "none",
                    boxShadow: "none",
                    border: "none",
                  },
                  "&.Mui-focusVisible": {
                    outline: "none",
                    boxShadow: "none",
                    border: "none",
                  },
                }}
              />
              <Tab
                label="Preferences"
                {...a11yProps(1)}
                disableRipple
                sx={{
                  fontSize: 16,

                  minHeight: 48,
                  padding: "6px 8px",
                  color: (t) => t.palette.text.secondary,
                  "&.Mui-selected": { color: (t) => t.palette.text.secondary },
                  "&:hover": {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    border: "none",
                  },
                  "&:focus": {
                    outline: "none",
                    boxShadow: "none",
                    border: "none",
                  },
                  "&.Mui-focusVisible": {
                    outline: "none",
                    boxShadow: "none",
                    border: "none",
                  },
                }}
              />
              <Tab
                label="Security"
                {...a11yProps(2)}
                disableRipple
                sx={{
                  textTransform: "none",
                  fontSize: 16,
                  minHeight: 48,
                  padding: "6px 8px",
                  color: (t) => t.palette.text.secondary,
                  "&.Mui-selected": { color: (t) => t.palette.text.secondary },
                  "&:hover": {
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    border: "none",
                  },
                  "&:focus": {
                    outline: "none",
                    boxShadow: "none",
                    border: "none",
                  },
                  "&.Mui-focusVisible": {
                    outline: "none",
                    boxShadow: "none",
                    border: "none",
                  },
                }}
              />
            </Tabs>
            <Box />
          </Box>

          <Divider />

          <Box sx={{ p: 4 }}>
            {/* Account tab — timezone removed */}
            <TabPanel value={tabValue} index={0}>
              <Box
                sx={{
                  display: "grid",
                  gap: 4,
                  gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
                  alignItems: "start",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Avatar
                      src={avatarSrc}
                      sx={{
                        width: 96,
                        height: 96,
                        fontSize: 32,
                        fontWeight: 800,
                        bgcolor: avatarSrc ? "transparent" : undefined,
                      }}
                    >
                      {!avatarSrc &&
                        accountForm.fullName
                          .split(" ")
                          .map((n) => (n ? n[0] : ""))
                          .join("")
                          .toUpperCase()}
                    </Avatar>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <label htmlFor="avatar-upload">
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleAvatarChange}
                      />
                      <Button
                        component="span"
                        variant="contained"
                        startIcon={<Camera size={14} />}
                        sx={{ textTransform: "none" }}
                      >
                        Upload
                      </Button>
                    </label>
                  </Stack>

                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    JPG, PNG, GIF — max 5MB
                  </Typography>
                </Box>

                <Box>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                    {accountError && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {accountError}
                      </Alert>
                    )}
                    {accountSaved && (
                      <Alert
                        icon={<Check size={18} />}
                        severity="success"
                        sx={{ mb: 2 }}
                      >
                        Saved
                      </Alert>
                    )}

                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ gridColumn: "1 / -1" }}>
                        <TextField
                          fullWidth
                          label="Full name"
                          variant="outlined"
                          size="small"
                          value={accountForm.fullName}
                          onChange={(e) =>
                            setAccountForm({
                              ...accountForm,
                              fullName: e.target.value,
                            })
                          }
                        />
                      </Box>

                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        variant="outlined"
                        size="small"
                        value={accountForm.email}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            email: e.target.value,
                          })
                        }
                      />

                      <TextField
                        fullWidth
                        label="Phone"
                        variant="outlined"
                        size="small"
                        value={accountForm.phone}
                        onChange={(e) =>
                          setAccountForm({
                            ...accountForm,
                            phone: e.target.value,
                          })
                        }
                      />

                      <Box
                        sx={{
                          display: "flex",
                          gap: 2,
                          alignItems: "center",
                          gridColumn: "1 / -1",
                          mt: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            width: { xs: "100%", sm: "auto" },
                          }}
                        >
                          <Button
                            variant="contained"
                            onClick={handleAccountSave}
                            disabled={loading}
                            sx={{ px: 3, textTransform: "none" }}
                          >
                            {loading ? (
                              <CircularProgress size={18} sx={{ mr: 1 }} />
                            ) : null}
                            Save
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              </Box>
            </TabPanel>

            {/* Preferences */}
            <TabPanel value={tabValue} index={1}>
              <Box
                sx={{
                  display: "grid",
                  gap: 3,
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                }}
              >
                <Box>
                  {prefSaved && (
                    <Alert
                      icon={<Check size={18} />}
                      severity="success"
                      sx={{ mb: 1 }}
                    >
                      Preferences saved
                    </Alert>
                  )}

                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mt: 1 }}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={preferenceForm.theme}
                        onChange={(e) =>
                          setPreferenceForm({
                            ...preferenceForm,
                            theme: e.target.value,
                          })
                        }
                        displayEmpty
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="system">System</MenuItem>
                      </Select>
                    </FormControl>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mt: 3,
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={handlePreferencesSave}
                        disabled={loading}
                        sx={{ textTransform: "none" }}
                      >
                        Save
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              </Box>
            </TabPanel>

            {/* Security */}
            <TabPanel value={tabValue} index={2}>
              <Box
                sx={{
                  display: "grid",
                  gap: 3,
                  gridTemplateColumns: { xs: "1fr", md: "1fr 360px" },
                }}
              >
                <Box>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                    {securityError && (
                      <Alert severity="error">{securityError}</Alert>
                    )}
                    {securitySaved && (
                      <Alert
                        icon={<Check size={18} />}
                        severity="success"
                        sx={{ mb: 1 }}
                      >
                        Security updated
                      </Alert>
                    )}

                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        mt: 0.5,
                      }}
                    >
                      <Box sx={{ gridColumn: "1 / -1" }}>
                        <TextField
                          fullWidth
                          label="Current password"
                          type="password"
                          size="small"
                          value={securityForm.currentPassword}
                          onChange={(e) =>
                            setSecurityForm({
                              ...securityForm,
                              currentPassword: e.target.value,
                            })
                          }
                        />
                      </Box>

                      <TextField
                        fullWidth
                        label="New password"
                        type="password"
                        size="small"
                        value={securityForm.newPassword}
                        onChange={(e) =>
                          setSecurityForm({
                            ...securityForm,
                            newPassword: e.target.value,
                          })
                        }
                      />

                      <TextField
                        fullWidth
                        label="Confirm password"
                        type="password"
                        size="small"
                        value={securityForm.confirmPassword}
                        onChange={(e) =>
                          setSecurityForm({
                            ...securityForm,
                            confirmPassword: e.target.value,
                          })
                        }
                      />

                      <Box
                        sx={{
                          gridColumn: "1 / -1",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 700 }}
                          >
                            Two-Factor Authentication
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                          >
                            Add an extra layer of security to your account
                          </Typography>
                        </Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={securityForm.twoFactorEnabled}
                              onChange={(e) =>
                                setSecurityForm({
                                  ...securityForm,
                                  twoFactorEnabled: e.target.checked,
                                })
                              }
                            />
                          }
                          label=""
                        />
                      </Box>

                      <Box
                        sx={{
                          gridColumn: "1 / -1",
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Button
                          variant="contained"
                          onClick={handleSecuritySave}
                          disabled={loading}
                          sx={{ textTransform: "none" }}
                        >
                          {loading ? (
                            <CircularProgress size={18} sx={{ mr: 1 }} />
                          ) : null}
                          Save
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
                <Box />
              </Box>
            </TabPanel>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

/* --- Export --- */
export default function SettingsPageModern() {
  return (
    <ErrorBoundary>
      <SettingsPageModernInner />
    </ErrorBoundary>
  );
}
