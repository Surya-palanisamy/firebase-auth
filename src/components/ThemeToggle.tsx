"use client"

import { useTheme } from "@mui/material/styles"
import { Box, IconButton, Tooltip } from "@mui/material"
import { Moon, Sun } from "lucide-react"
import { useTheme as useThemeContext } from "../context/ThemeContext"

export const ThemeToggle = () => {
  const muiTheme = useTheme()
  const { mode, toggleTheme } = useThemeContext()

  const isDark = mode === "dark" || (mode === "system" && muiTheme.palette.mode === "dark")

  return (
    <Tooltip title={`Switch to ${isDark ? "light" : "dark"} mode`}>
      <IconButton
        onClick={toggleTheme}
        size="small"
        sx={{
          color: "text.primary",
          transition: "transform 0.2s ease",
          "&:hover": {
            transform: "rotate(180deg)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </Box>
      </IconButton>
    </Tooltip>
  )
}

export default ThemeToggle
