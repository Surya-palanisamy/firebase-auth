import React, { useState } from "react";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

type User = {
  name?: string;
  email?: string;
  initials?: string;
};

export default function ProfileMenu({ userProp }: { userProp?: User }) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const onToggle = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl((prev) => (prev ? null : e.currentTarget));
  const closeMenu = () => setAnchorEl(null);

  const handleSelect = (route: string) => {
    closeMenu();
    if (route === "/logout") {
      // TODO: replace with your logout logic
      navigate("/login");
      return;
    }
    navigate(route);
  };

  const user: User = userProp ?? {
    name: "Admin User",
    email: "admin@floodwatch.com",
    initials: "DS",
  };

  // explicit accessible colors for dark mode; fall back to theme tokens in light mode
  const isDark = theme.palette.mode === "dark";

  const paperBg = isDark ? "#0b0e12" : theme.palette.background.paper;
  const headerNameColor = isDark
    ? "rgba(255,255,255,0.92)"
    : theme.palette.text.primary;
  const headerEmailColor = isDark
    ? "rgba(255,255,255,0.68)"
    : theme.palette.text.secondary;
  const itemTextColor = isDark
    ? "rgba(255,255,255,0.88)"
    : theme.palette.text.primary;
  const itemHoverBg = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";

  return (
    <>
      <IconButton
        onClick={onToggle}
        sx={{
          p: 0,
          borderRadius: 1,
          "&:hover": { background: "transparent" },
        }}
        aria-controls={open ? "profile-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            fontWeight: 700,

            bgcolor: isDark ? theme.palette.grey[800] : undefined,
          }}
        >
          {user.initials}
        </Avatar>
      </IconButton>

      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        PaperProps={{
          elevation: 10,
          sx: {
            width: 260,
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: paperBg,
            color: itemTextColor,
            boxShadow: theme.shadows[12],
            border: `1px solid ${
              isDark ? "rgba(255,255,255,0.04)" : theme.palette.divider
            }`,
          },
        }}
      >
        {/* header - keep pointerEvents normal so styles apply consistently */}
        <Box
          sx={{
            px: 2,
            py: 1.25,
            display: "flex",
            gap: 1.25,
            alignItems: "center",
          }}
        >
          <Avatar
            sx={{
              width: 44,
              height: 44,
              fontWeight: 700,
              border: `2px solid ${
                isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"
              }`,
              bgcolor: isDark ? theme.palette.grey[800] : undefined,
            }}
          >
            {user.initials}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 700,
                color: headerNameColor,
                lineHeight: 1,
              }}
            >
              {user.name}
            </Typography>

            <Typography
              sx={{
                fontSize: 12,
                color: headerEmailColor,
                maxWidth: 180,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.email}
            </Typography>
          </Box>
        </Box>

        <Divider
          sx={{
            borderColor: isDark
              ? "rgba(255,255,255,0.06)"
              : theme.palette.divider,
            opacity: isDark ? 0.06 : 1,
          }}
        />

        <MenuItem
          onClick={() => handleSelect("/profile")}
          sx={{
            px: 2,
            py: 1.1,
            bgcolor: "transparent",
            "&:hover": { background: itemHoverBg },
            color: itemTextColor,
          }}
        >
          <ListItemText
            primary="Profile"
            slotProps={{
              primary: {
                // use sx to style the inner Typography
                sx: { fontSize: 13, color: itemTextColor },
              },
            }}
          />
        </MenuItem>

        <MenuItem
          onClick={() => handleSelect("/settings")}
          sx={{
            px: 2,
            py: 1.1,
            bgcolor: "transparent",
            "&:hover": { background: itemHoverBg },
            color: itemTextColor,
          }}
        >
          <ListItemText
            primary="Settings"
            slotProps={{
              primary: {
                sx: { fontSize: 13, color: itemTextColor },
              },
            }}
          />
        </MenuItem>

        <MenuItem
          onClick={() => handleSelect("/logout")}
          sx={{
            px: 2,
            py: 1.1,
            bgcolor: "transparent",
            "&:hover": { background: itemHoverBg },
          }}
        >
          <ListItemText
            primary="Log out"
            slotProps={{
              primary: {
                sx: {
                  fontSize: 13,
                  color: theme.palette.error.main,
                  fontWeight: 700,
                },
              },
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}
