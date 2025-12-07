import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  ClickAwayListener,
  IconButton,
  Paper,
  Popper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  Info,
  MapPin,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function Notifications() {
  const { alerts, markAlertAsRead, clearAllAlerts } = useAppContext();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popperRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  const unreadCount = alerts.filter((a) => !a.read).length;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const getAlertIcon = (type: string) => {
    const size = 20;
    switch (type) {
      case "error":
        return (
          <AlertTriangle
            size={size}
            style={{ color: theme.palette.error.main }}
          />
        );
      case "warning":
        return (
          <AlertTriangle
            size={size}
            style={{ color: theme.palette.warning.main }}
          />
        );
      case "success":
        return (
          <CheckCircle
            size={size}
            style={{ color: theme.palette.success.main }}
          />
        );
      default:
        return <Info size={size} style={{ color: theme.palette.info.main }} />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  };

  const handleNavigateToAlert = (alert: any) => {
    if (alert.coordinates) {
      navigate("/map");
      setOpen(false);
      markAlertAsRead(alert.id);
      localStorage.setItem(
        "mapNavigationTarget",
        JSON.stringify({
          coordinates: alert.coordinates,
          zoom: 15,
          title: alert.title,
          message: alert.message,
        })
      );
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-block",
        border: "none !important",
        bgcolor: "transparent !important",
      }}
    >
      <Button
        ref={buttonRef as any}
        aria-label="Notifications"
        onClick={() => setOpen((s) => !s)}
        disableRipple
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          minWidth: "auto",
          p: 0,
          color: "inherit",
          "&:hover": { backgroundColor: "transparent !important" },
          "&:focus": { outline: "none", boxShadow: "none" },
        }}
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <Box
            component="span"
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 18,
              height: 18,
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "common.white",
              bgcolor: "error.main",
              borderRadius: "50%",
              boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Box>
        )}
      </Button>

      <Popper
        open={open}
        anchorEl={buttonRef.current}
        placement={isDesktop ? "bottom-end" : "bottom"}
        style={{ zIndex: 1400 }}
        disablePortal={false}
        modifiers={[
          { name: "offset", options: { offset: [0, 8] } },
          {
            name: "preventOverflow",
            options: { padding: 8, boundary: "viewport" },
          },
          // keep computeStyles enabled so Popper positions correctly on mobile
        ]}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper
            ref={popperRef as any}
            elevation={8}
            sx={{
              mt: isDesktop ? 0 : 1,
              width: "auto", // allow popper to size itself
              minWidth: isDesktop ? 360 : 100, // ensure a usable minimum on small screens
              maxWidth: isDesktop ? 360 : "95vw", // never exceed viewport on small screens
              maxHeight: isDesktop ? 480 : "60vh",
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
              borderRadius: 1,
              overflow: "hidden",
              border: (t) => `1px solid ${t.palette.divider}`,
              // small visual nudge to keep popper away from edges on tiny screens:
              px: isDesktop ? 0 : 1,
            }}
          >
            {/* header */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 2,
                py: 1.25,
                borderBottom: (t) => `1px solid ${t.palette.divider}`,
                bgcolor: "background.paper",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>

              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button
                  size="small"
                  onClick={() => clearAllAlerts()}
                  disabled={alerts.length === 0}
                  sx={{
                    textTransform: "none",
                    color: "text.secondary",
                    minWidth: "auto",
                    p: 0.5,
                  }}
                >
                  Clear All
                </Button>

                <Button
                  size="small"
                  onClick={() => setOpen(false)}
                  sx={{ color: "text.secondary", minWidth: "auto", p: 0.5 }}
                >
                  <X size={16} />
                </Button>
              </Box>
            </Box>

            {/* list */}
            <Box sx={{ overflowY: "auto", flex: 1 }}>
              {alerts.length === 0 ? (
                <Box
                  sx={{ p: 3, textAlign: "center", color: "text.secondary" }}
                >
                  No notifications
                </Box>
              ) : (
                alerts.map((alert: any) => (
                  <Box
                    key={alert.id}
                    className="notification-row"
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderBottom: (t) => `1px solid ${t.palette.divider}`,
                      bgcolor: !alert.read
                        ? theme.palette.mode === "dark"
                          ? "rgba(99,102,241,0.06)"
                          : "rgba(59,130,246,0.06)"
                        : "transparent",
                      "&:hover": { bgcolor: "transparent !important" },
                      display: "flex",
                      gap: 2,
                      alignItems: "flex-start",
                    }}
                  >
                    <Box sx={{ mt: "4px" }}>{getAlertIcon(alert.type)}</Box>

                    <Box sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600, color: "text.primary" }}
                        >
                          {alert.title}
                        </Typography>

                        {!alert.read && (
                          <IconButton
                            size="small"
                            onClick={() => markAlertAsRead(alert.id)}
                            sx={{ color: "primary.main", p: 0.5 }}
                            aria-label="Mark as read"
                            disableRipple
                          >
                            <Check size={14} />
                          </IconButton>
                        )}
                      </Box>

                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mt: 0.5 }}
                      >
                        {alert.message}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mt: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "text.disabled" }}
                        >
                          {formatTime(alert.timestamp)}
                        </Typography>

                        {alert.coordinates && (
                          <Button
                            size="small"
                            onClick={() => handleNavigateToAlert(alert)}
                            sx={{
                              textTransform: "none",
                              color: "primary.main",
                              minWidth: "auto",
                              p: 0.5,
                            }}
                            disableRipple
                          >
                            <MapPin size={12} style={{ marginRight: 6 }} />
                            View on map
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
