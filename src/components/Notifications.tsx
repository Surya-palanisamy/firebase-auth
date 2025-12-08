import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Box,
  Button,
  ClickAwayListener,
  IconButton,
  InputAdornment,
  Paper,
  Popper,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  Info,
  MapPin,
  X,
  Search as SearchIcon,
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

  // UI state
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10); // initial items to show
  const [optimisticReads, setOptimisticReads] = useState<
    Record<string, boolean>
  >({});

  // derived
  const unreadCount = useMemo(
    () => alerts.filter((a) => !a.read && !optimisticReads[a.id]).length,
    [alerts, optimisticReads]
  );

  // when context alerts change, ensure pageSize isn't too small
  useEffect(() => {
    if (alerts.length > 0 && pageSize < 10) setPageSize(10);
  }, [alerts, pageSize]);

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
    if (!timestamp) return "";
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

  // Filter & search alerts
  const filteredAlerts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alerts
      .filter((a) => {
        if (showUnreadOnly && (a.read || optimisticReads[a.id])) return false;
        if (!q) return true;
        return (
          (a.title || "").toLowerCase().includes(q) ||
          (a.message || "").toLowerCase().includes(q) ||
          (a.type || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // newest first
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tb - ta;
      });
  }, [alerts, showUnreadOnly, search, optimisticReads]);

  // page slice
  const visibleAlerts = filteredAlerts.slice(0, pageSize);

  // mark as read (optimistic)
  const handleMarkAsRead = async (id: string) => {
    // optimistic local state so UI instantly reflects change
    setOptimisticReads((prev) => ({ ...prev, [id]: true }));
    try {
      await markAlertAsRead(id);
      // context will eventually reflect actual read state from firestore
    } catch (err) {
      // rollback on error
      setOptimisticReads((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      console.error("markAlertAsRead failed", err);
    }
  };

  const handleClearAll = async () => {
    await clearAllAlerts();
    setOpen(false);
  };

  const handleNavigateToAlert = (alert: any) => {
    if (alert.coordinates) {
      navigate("/map");
      setOpen(false);
      handleMarkAsRead(alert.id);
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

  // load more
  const loadMore = () => setPageSize((s) => s + 10);

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
        ]}
      >
        <ClickAwayListener onClickAway={() => setOpen(false)}>
          <Paper
            ref={popperRef as any}
            elevation={8}
            sx={{
              mt: isDesktop ? 0 : 1,
              width: "auto",
              minWidth: isDesktop ? 360 : 100,
              maxWidth: isDesktop ? 520 : "95vw",
              maxHeight: isDesktop ? 560 : "70vh",
              display: "flex",
              flexDirection: "column",
              bgcolor: "background.paper",
              borderRadius: 1,
              overflow: "hidden",
              border: (t) => `1px solid ${t.palette.divider}`,
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
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>

              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  size="small"
                  placeholder="Search notifications"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon size={14} />
                      </InputAdornment>
                    ),
                    sx: { height: 36 },
                  }}
                  sx={{ minWidth: 180 }}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={showUnreadOnly}
                      onChange={() => setShowUnreadOnly((s) => !s)}
                      size="small"
                    />
                  }
                  label="Unread"
                  sx={{ ml: 0 }}
                />

                <Button
                  size="small"
                  onClick={handleClearAll}
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

                <IconButton
                  size="small"
                  onClick={() => setOpen(false)}
                  sx={{ color: "text.secondary", minWidth: "auto", p: 0.5 }}
                >
                  <X size={16} />
                </IconButton>
              </Box>
            </Box>

            {/* list */}
            <Box sx={{ overflowY: "auto", flex: 1 }}>
              {visibleAlerts.length === 0 ? (
                <Box
                  sx={{ p: 3, textAlign: "center", color: "text.secondary" }}
                >
                  No notifications
                </Box>
              ) : (
                visibleAlerts.map((alert: any) => {
                  const isUnread = !alert.read && !optimisticReads[alert.id];
                  return (
                    <Box
                      key={alert.id}
                      className="notification-row"
                      sx={{
                        px: 2,
                        py: 1.25,
                        borderBottom: (t) => `1px solid ${t.palette.divider}`,
                        bgcolor: isUnread
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

                          {!alert.read && !optimisticReads[alert.id] && (
                            <IconButton
                              size="small"
                              onClick={() => handleMarkAsRead(alert.id)}
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
                  );
                })
              )}
            </Box>

            {/* footer / load more */}
            <Box
              sx={{
                p: 1.25,
                borderTop: (t) => `1px solid ${t.palette.divider}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Showing {Math.min(filteredAlerts.length, pageSize)} of{" "}
                {filteredAlerts.length}
              </Typography>

              {filteredAlerts.length > pageSize ? (
                <Button
                  size="small"
                  onClick={loadMore}
                  sx={{ textTransform: "none" }}
                >
                  Load more
                </Button>
              ) : (
                <Box sx={{ width: 84 }} />
              )}
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
}
