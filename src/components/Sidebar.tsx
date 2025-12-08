// src/components/Sidebar.tsx
"use client";

import {
  Avatar,
  Box,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MapIcon,
  PhoneCall,
  RouteIcon,
  Settings,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, logout } = useAppContext(); // <- include logout

  const [openGeneral, setOpenGeneral] = useState(true);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const profileMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  // Close menu first to avoid aria-hidden focus trap, then navigate/logout after a short delay
  const handleMenuSelect = (route: string) => {
    handleProfileMenuClose();

    // small delay so menu fully unmounts and focus moves safely
    setTimeout(() => {
      if (route === "/logout") {
        try {
          if (logout) logout();
        } catch (err) {
          console.warn("Logout failed:", err);
        }
        navigate("/login");
        return;
      }
      navigate(route);
    }, 150);
  };

  const dashboards = [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    { label: "Flood Map", to: "/map", icon: MapIcon },
    { label: "Alerts", to: "/alerts", icon: Bell },
    { label: "Safe Routes", to: "/safe-routes", icon: RouteIcon },
    { label: "Shelters", to: "/shelters", icon: Building2 },
  ];

  const general = [
    { label: "Emergency Help", to: "/emergency-help", icon: PhoneCall },
  ];

  const displayName = user?.name ?? "User";
  const initials =
    displayName
      .split(" ")
      .map((s) => (s && s[0]) || "")
      .join("")
      .toUpperCase() || "U";

  // PRIORITY: photoBase64 (from Firestore) -> auth photoURL -> fallback null
  const avatarURL = user?.avatar ?? null;

  return (
    <Box sx={{ width: 260, display: "flex", flexDirection: "column", gap: 2 }}>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={profileMenuOpen}
        onClose={handleProfileMenuClose}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        slotProps={{
          paper: {
            elevation: 10,
            sx: { width: 220, borderRadius: 2, overflow: "hidden", mt: "-6px" },
          },
        }}
      >
        <MenuItem onClick={() => handleMenuSelect("/profile")}>
          <User size={18} style={{ marginRight: 12 }} />
          <Typography sx={{ fontSize: 13 }}>Profile</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleMenuSelect("/settings")}>
          <Settings size={18} style={{ marginRight: 12 }} />
          <Typography sx={{ fontSize: 13 }}>Settings</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => handleMenuSelect("/logout")}>
          <LogOut
            size={18}
            style={{ marginRight: 12, color: theme.palette.error.main }}
          />
          <Typography
            sx={{
              fontSize: 13,
              color: theme.palette.error.main,
              fontWeight: 600,
            }}
          >
            Log out
          </Typography>
        </MenuItem>
      </Menu>

      <List
        subheader={
          <ListSubheader
            disableSticky
            sx={{
              mb: 1,
              color: theme.palette.text.secondary,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Overview
          </ListSubheader>
        }
      >
        {dashboards.map((item) => {
          const active = location.pathname === item.to;
          return (
            <ListItemButton
              key={item.to}
              component={RouterLink as any}
              to={item.to}
              onClick={onNavigate}
              disableRipple
              sx={{
                borderRadius: 2.5,
                mb: 0.5,
                height: 44,
                px: 1.6,
                alignItems: "center",
                transition: "all 0.18s ease-out",
                ...(active && {
                  backgroundImage:
                    theme.palette.mode === "dark"
                      ? "linear-gradient(135deg, #6E4CF9, #4F46E5)"
                      : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 10px 30px rgba(0,0,0,0.7)"
                      : "0 10px 30px rgba(15,23,42,0.18)",
                }),
                "&:hover": {
                  backgroundColor: active
                    ? "transparent"
                    : theme.palette.action.hover,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <item.icon size={18} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <List
        subheader={
          <ListSubheader
            disableSticky
            sx={{
              mb: 1,
              mt: 0.5,
              color: theme.palette.text.secondary,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            General
          </ListSubheader>
        }
      >
        <ListItemButton
          onClick={() => setOpenGeneral((s) => !s)}
          sx={{
            justifyContent: "space-between",
            px: 1.6,
            py: 1.1,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(99,102,241,0.12)",
              }}
            >
              <LifeBuoy size={16} />
            </Box>
            <Box sx={{ fontWeight: 600, fontSize: 13 }}>Support</Box>
          </Box>
          {openGeneral ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </ListItemButton>

        <Collapse in={openGeneral} timeout="auto" unmountOnExit>
          {general.map((item) => {
            const active = location.pathname === item.to;
            return (
              <ListItemButton
                key={item.to}
                component={RouterLink as any}
                to={item.to}
                onClick={onNavigate}
                disableRipple
                sx={{
                  borderRadius: 2,
                  ml: 1,
                  width: "calc(100% - 8px)",
                  mb: 0.5,
                  height: 40,
                  px: 1.6,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <item.icon size={16} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                  }}
                />
              </ListItemButton>
            );
          })}
        </Collapse>

        <Divider sx={{ my: 1 }} />

        {/* User panel */}
        <Box
          onClick={handleProfileMenuOpen}
          sx={{
            width: "100%",
            height: 56,
            p: 1,
            display: "flex",
            gap: 2,
            cursor: "pointer",
            alignItems: "center",
            borderRadius: 2,
          }}
        >
          <Avatar
            src={avatarURL ?? undefined}
            sx={{
              width: 40,
              height: 40,
              fontWeight: 700,
              fontSize: 14,
              bgcolor: !avatarURL
                ? theme.palette.mode === "dark"
                  ? theme.palette.grey[800]
                  : theme.palette.primary.dark
                : "transparent",
            }}
          >
            {!avatarURL && initials}
          </Avatar>

          <Box sx={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayName}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: "text.secondary",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.email ?? "Unknown"}
            </Typography>
          </Box>
        </Box>
      </List>
    </Box>
  );
}
