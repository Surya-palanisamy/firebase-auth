// src/pages/SettingsPage.tsx
"use client";

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

// ---------------- Tab Panel ----------------
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

const a11yProps = (index: number) => ({
  id: `settings-tab-${index}`,
  "aria-controls": `settings-tabpanel-${index}`,
});

// ---------------- Error Boundary ----------------
class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 6, textAlign: "center" }}>
          <Typography variant="h6">Something went wrong.</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default function SettingsPageModern() {
  return (
    <ErrorBoundary>
      <SettingsPageModernInner />
    </ErrorBoundary>
  );
}

function SettingsPageModernInner() {
  const theme = useTheme();
  const { settings, loading, saveProfile, savePreferences, saveSecurity } =
    useSettings();

  const [tabValue, setTabValue] = useState(0);

  // ---------------- Account Form ----------------
  const [accountForm, setAccountForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  // ---------------- Avatar ----------------
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);
  const [savedSecurity, setSavedSecurity] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Load settings from Firestore
  useEffect(() => {
    if (!settings) return;

    setAccountForm({
      fullName: settings.fullName || "",
      email: settings.email || "",
      phone: settings.phone || "",
    });

    // ---------------- Avatar Upload ----------------
  }, [settings]);

  // ---------------- Save Profile ----------------
  const handleSaveProfile = async () => {
    setProfileError(null);

    if (!accountForm.fullName.trim())
      return setProfileError("Full name required");
    if (!accountForm.email.trim()) return setProfileError("Email required");

    setSavingProfile(true);

    const ok = await saveProfile({
      fullName: accountForm.fullName,
      email: accountForm.email,
      phone: accountForm.phone,
    });

    if (ok) {
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 2000);
    } else {
      setProfileError("Failed to update profile.");
    }
    setSavingProfile(false);
  };

  // ---------------- Save Preferences ----------------
  const [preferenceForm, setPreferenceForm] = useState({
    theme: "system",
  });

  useEffect(() => {
    setPreferenceForm({ theme: settings.theme });
  }, [settings]);

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    const ok = await savePreferences({ theme: preferenceForm.theme });

    if (ok) {
      setSavedPrefs(true);
      setTimeout(() => setSavedPrefs(false), 2000);
    }

    setSavingPrefs(false);
  };

  // ---------------- Save Security ----------------
  const [securityForm, setSecurityForm] = useState({
    twoFactorEnabled: false,
  });

  useEffect(() => {
    setSecurityForm({
      twoFactorEnabled: settings.twoFactorEnabled,
    });
  }, [settings]);

  const handleSaveSecurity = async () => {
    setSavingSecurity(true);

    const ok = await saveSecurity(securityForm);

    if (ok) {
      setSavedSecurity(true);
      setTimeout(() => setSavedSecurity(false), 2000);
    }

    setSavingSecurity(false);
  };

  // ---------------- UI ----------------
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 6 }}>
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Manage your profile, preferences & security.
        </Typography>

        <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Box sx={{ px: 3, pt: 2 }}>
            <Tabs
              value={tabValue}
              onChange={(_, v) => setTabValue(v)}
              TabIndicatorProps={{ sx: { height: 3, borderRadius: 3 } }}
              sx={{ "& .MuiTabs-flexContainer": { gap: 3 } }}
            >
              <Tab label="Account" {...a11yProps(0)} />
              <Tab label="Preferences" {...a11yProps(1)} />
              <Tab label="Security" {...a11yProps(2)} />
            </Tabs>
          </Box>

          <Divider />

          <Box sx={{ p: 3 }}>
            {/* ACCOUNT */}
            <TabPanel value={tabValue} index={0}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={4}
                alignItems="flex-start"
              >
                {/* Profile */}
                <Paper sx={{ p: 3, flexGrow: 1, borderRadius: 2 }}>
                  {profileError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {profileError}
                    </Alert>
                  )}

                  {savedProfile && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Profile Updated
                    </Alert>
                  )}

                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Full name"
                      size="small"
                      value={accountForm.fullName}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          fullName: e.target.value,
                        })
                      }
                    />

                    <TextField
                      fullWidth
                      label="Email"
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
                      size="small"
                      value={accountForm.phone}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          phone: e.target.value,
                        })
                      }
                    />

                    <Box textAlign="right">
                      <Button
                        variant="contained"
                        onClick={handleSaveProfile}
                        disabled={savingProfile || loading}
                        sx={{ textTransform: "none", px: 3 }}
                      >
                        {savingProfile ? (
                          <CircularProgress size={18} sx={{ mr: 1 }} />
                        ) : null}
                        Save Profile
                      </Button>
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
            </TabPanel>

            {/* PREFERENCES */}
            <TabPanel value={tabValue} index={1}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <Select
                      value={preferenceForm.theme}
                      onChange={(e) =>
                        setPreferenceForm({ theme: e.target.value as any })
                      }
                    >
                      <MenuItem value="light">Light</MenuItem>
                      <MenuItem value="dark">Dark</MenuItem>
                      <MenuItem value="system">System</MenuItem>
                    </Select>
                  </FormControl>

                  <Box textAlign="right">
                    <Button
                      variant="contained"
                      onClick={handleSavePreferences}
                      disabled={savingPrefs || loading}
                      sx={{ textTransform: "none" }}
                    >
                      {savingPrefs ? (
                        <CircularProgress size={18} sx={{ mr: 1 }} />
                      ) : null}
                      Save Preferences
                    </Button>
                  </Box>

                  {savedPrefs && (
                    <Alert severity="success">Preferences Saved</Alert>
                  )}
                </Stack>
              </Paper>
            </TabPanel>

            {/* SECURITY */}
            <TabPanel value={tabValue} index={2}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Stack spacing={3}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Two-Factor Authentication
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Add an extra layer of protection to your account
                      </Typography>
                    </Box>

                    <FormControlLabel
                      control={
                        <Switch
                          checked={securityForm.twoFactorEnabled}
                          onChange={(e) =>
                            setSecurityForm({
                              twoFactorEnabled: e.target.checked,
                            })
                          }
                        />
                      }
                      label=""
                    />
                  </Stack>

                  <Box textAlign="right">
                    <Button
                      variant="contained"
                      onClick={handleSaveSecurity}
                      disabled={savingSecurity || loading}
                      sx={{ textTransform: "none" }}
                    >
                      {savingSecurity ? (
                        <CircularProgress size={18} sx={{ mr: 1 }} />
                      ) : null}
                      Save Security
                    </Button>
                  </Box>

                  {savedSecurity && (
                    <Alert severity="success">Security Settings Saved</Alert>
                  )}
                </Stack>
              </Paper>
            </TabPanel>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
