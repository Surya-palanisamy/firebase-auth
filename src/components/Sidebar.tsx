import {
  Avatar,
  Box,
  Collapse,
  Divider,
  IconButton,
  Stack,
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
import type { LucideIcon } from "lucide-react";
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

const ACTIVE_COLOR = "#6E4CF9";

type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

function NavIcon({
  icon: Icon,
  active,
}: {
  icon: LucideIcon;
  active: boolean;
}) {
  const theme = useTheme();
  const color = active
    ? "#ffffff"
    : theme.palette.mode === "dark"
    ? "hsl(220, 10%, 70%)"
    : "hsl(222, 25%, 40%)";

  return <Icon size={18} strokeWidth={active ? 2.4 : 2} color={color} />;
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppContext();
  const [openGeneral, setOpenGeneral] = useState(true);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const profileMenuOpen = Boolean(anchorEl);

  const handleProfileMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuSelect = (route: string) => {
    handleProfileMenuClose();
    if (route === "/logout") {
      logout();
      navigate("/login");
      return;
    }
    navigate(route);
  };

  const dashboards: NavItem[] = [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    { label: "Flood Map", to: "/map", icon: MapIcon },
    { label: "Alerts", to: "/alerts", icon: Bell },
    { label: "Safe Routes", to: "/safe-routes", icon: RouteIcon },
    { label: "Shelters", to: "/shelters", icon: Building2 },
  ];

  const general: NavItem[] = [
    {
      label: "Emergency Help",
      to: "/emergency-help",
      icon: PhoneCall,
    },
  ];

  const getLabelColor = (active: boolean) =>
    active
      ? "#ffffff"
      : theme.palette.mode === "dark"
      ? "hsl(220, 10%, 78%)"
      : "hsl(222, 28%, 32%)";

  const isDark = theme.palette.mode === "dark";
  // ✔ Name & Avatar from Firebase Auth
  const displayName = user?.name || "Users";
  const avatarURL = user?.avatar || null;

  // ✔ Initials if no avatar
  const initials = displayName
    .split(" ")
    .map((segment: string) => segment[0])
    .join("")
    .toUpperCase();

  return (
    <Box
      sx={{
        width: 260,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
      className="app-sidebar"
    >
      {/* Profile Menu */}
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
            sx: {
              width: 220,
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: theme.shadows[12],
              mt: "-6px",
            },
          },
        }}
      >
        <MenuItem
          onClick={() => handleMenuSelect("/profile")}
          sx={{
            px: 2,
            py: 1.1,
            bgcolor: "transparent",
            "&:hover": {
              bgcolor: isDark ? "rgba(255,255,255)" : "rgba(0,0,0,0.02)",
            },
          }}
        >
          <User size={18} style={{ marginRight: 12 }} />
          <Typography sx={{ fontSize: 13 }}>Profile</Typography>
        </MenuItem>

        <MenuItem
          onClick={() => handleMenuSelect("/settings")}
          sx={{
            px: 2,
            py: 1.1,
            bgcolor: "transparent",
            "&:hover": {
              bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            },
          }}
        >
          <Settings size={18} style={{ marginRight: 12 }} />
          <Typography sx={{ fontSize: 13 }}>Settings</Typography>
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem
          onClick={() => handleMenuSelect("/logout")}
          sx={{
            px: 2,
            py: 1.1,
            bgcolor: "transparent",
            "&:hover": {
              bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            },
          }}
        >
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

      {/* Overview Items */}
      <List
        subheader={
          <ListSubheader
            disableSticky
            sx={{
              mb: 1,
              color:
                theme.palette.mode === "dark"
                  ? "hsl(220, 10%, 65%)"
                  : "hsl(222, 26%, 45%)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.7,
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
                <NavIcon icon={item.icon} active={active} />
              </ListItemIcon>

              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    fontSize: 14,
                    fontWeight: active ? 600 : 500,
                    sx: {
                      color: getLabelColor(active),
                      letterSpacing: 0.1,
                    },
                  } as any,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* General */}
      <List
        subheader={
          <ListSubheader
            disableSticky
            sx={{
              mb: 1,
              mt: 0.5,
              color:
                theme.palette.mode === "dark"
                  ? "hsl(220, 10%, 70%)"
                  : "hsl(220, 18%, 50%)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.7,
            }}
          >
            General
          </ListSubheader>
        }
      >
        <ListItemButton
          sx={{
            justifyContent: "space-between",
            px: 1.6,
            py: 1.1,
            borderRadius: 2,
            "&:hover": {
              bgcolor: theme.palette.action.hover,
            },
          }}
          onClick={() => setOpenGeneral((s) => !s)}
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
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(110, 76, 249, 0.18)"
                    : "rgba(99, 102, 241, 0.12)",
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
                  ...(active && {
                    backgroundImage:
                      theme.palette.mode === "dark"
                        ? "linear-gradient(135deg, #6E4CF9, #4F46E5)"
                        : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    boxShadow:
                      theme.palette.mode === "dark"
                        ? "0 8px 24px rgba(0,0,0,0.7)"
                        : "0 8px 24px rgba(15,23,42,0.16)",
                  }),
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
                  <NavIcon icon={item.icon} active={active} />
                </ListItemIcon>

                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      fontSize: 13,
                      fontWeight: active ? 600 : 500,
                      sx: {
                        color: getLabelColor(active),
                      },
                    } as any,
                  }}
                />
              </ListItemButton>
            );
          })}
        </Collapse>
        <Divider sx={{ my: 1 }} />

        {/* USER PANEL (Avatar + Name + Email) */}
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
            src={avatarURL || undefined}
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
                fontSize: 14,
                color: "green",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.email || "Unknown"}
            </Typography>
          </Box>
        </Box>
      </List>
    </Box>
  );
}
