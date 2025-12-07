"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react"
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material"
import type { PaletteMode } from "@mui/material"
import { colorSchemes, typography, shadows, shape } from "../shared-theme/themePrimitives"
import { inputsCustomizations } from "../shared-theme/customizations/inputs"
import { dataDisplayCustomizations } from "../shared-theme/customizations/dataDisplay"
import { feedbackCustomizations } from "../shared-theme/customizations/feedback"
import { navigationCustomizations } from "../shared-theme/customizations/navigation"
import { surfacesCustomizations } from "../shared-theme/customizations/surfaces"

type ThemeMode = PaletteMode | "system"

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
  isDarkMode: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // initialize mode: accept "light" | "dark" | "system"
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("theme-mode")
      if (savedMode && (savedMode === "light" || savedMode === "dark" || savedMode === "system")) {
        return savedMode as ThemeMode
      }
      // Default to system preference if nothing saved
      return "system"
    }
    return "light"
  })

  // Helper to resolve "system" -> "light" | "dark"
  const resolveColorScheme = (m: ThemeMode) => {
    if (m === "system" && typeof window !== "undefined") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return m === "system" ? "light" : m // fallback safe
  }

  // Create theme once (colorSchemes should contain both light/dark)
  const theme = useMemo(
    () =>
      createTheme({
        cssVariables: {
          colorSchemeSelector: "data-mui-color-scheme",
          cssVarPrefix: "template",
        },
        colorSchemes,
        typography,
        shadows,
        shape,
        components: {
          ...inputsCustomizations,
          ...dataDisplayCustomizations,
          ...feedbackCustomizations,
          ...navigationCustomizations,
          ...surfacesCustomizations,
        },
      }),
    [],
  )

  // Apply resolved color-scheme to document and store preference
  const applyModeToDocument = (m: ThemeMode) => {
    if (typeof window === "undefined") return
    const resolved = resolveColorScheme(m)
    document.documentElement.setAttribute("data-mui-color-scheme", resolved)
  }

  useEffect(() => {
    // initial apply
    applyModeToDocument(mode)

    // If mode is system, listen to OS preference changes and update attribute
    if (typeof window !== "undefined") {
      const media = window.matchMedia?.("(prefers-color-scheme: dark)")
      const handler = (e: MediaQueryListEvent | MediaQueryList) => {
        // Only update the attribute (don't override user's explicit light/dark)
        if (mode === "system") {
          const resolved = e.matches ? "dark" : "light"
          document.documentElement.setAttribute("data-mui-color-scheme", resolved)
        }
      }

      // Add listener (older and newer APIs)
      try {
        if (media?.addEventListener) {
          media.addEventListener("change", handler as EventListener)
        } else if (media?.addListener) {
          media.addListener(handler as any)
        }
      } catch {
        /* ignore - defensive */
      }

      // cleanup
      return () => {
        try {
          if (media?.removeEventListener) {
            media.removeEventListener("change", handler as EventListener)
          } else if (media?.removeListener) {
            media.removeListener(handler as any)
          }
        } catch {
          /* ignore - defensive */
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const toggleTheme = () => {
    setMode((prevMode) => {
      // toggling should flip between light/dark and store that explicit choice.
      // If currently system, resolve then toggle the resolved value.
      const currentResolved = resolveColorScheme(prevMode)
      const newResolved = currentResolved === "light" ? "dark" : "light"
      // persist explicit user choice (not "system")
      if (typeof window !== "undefined") {
        localStorage.setItem("theme-mode", newResolved)
        document.documentElement.setAttribute("data-mui-color-scheme", newResolved)
      }
      return newResolved
    })
  }

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode)
    if (typeof window !== "undefined") {
      localStorage.setItem("theme-mode", newMode)
      // store the chosen mode, but set attribute to resolved palette ("light" | "dark")
      const resolved = resolveColorScheme(newMode)
      document.documentElement.setAttribute("data-mui-color-scheme", resolved)
    }
  }

  const isDarkMode = resolveColorScheme(mode) === "dark"

  const value: ThemeContextType = {
    mode,
    toggleTheme,
    setTheme,
    isDarkMode,
  }

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeContextProvider")
  }
  return context
}
