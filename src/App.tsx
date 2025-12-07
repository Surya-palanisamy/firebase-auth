"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Box, Button, useTheme } from "@mui/material"
import { Droplets, Menu, X } from "lucide-react"
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from "react-router-dom"
import LoadingSpinner from "./components/LoadingSpinner"
import Notifications from "./components/Notifications"
import Sidebar from "./components/Sidebar"
import ThemeToggler from "./components/ThemeToggler"
import { AppProvider, useAppContext } from "./context/AppContext"
import { useAuth } from "./hooks/useAuth"
import Alerts from "./pages/Alerts"
import Dashboard from "./pages/Dashboard"
import EmergencyHelp from "./pages/EmergencyHelp"
import Login from "./sign-in-side/SignInSide"
import MapView from "./pages/MapView"
import SafeRoutes from "./pages/SafeRoutes"
import SettingsPage from "./pages/SettingsPage"
import Shelters from "./pages/Shelters"
import Signup from "./pages/Signup"

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  const { isAuthenticated } = useAppContext()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user && !loading && !isAuthenticated) {
      navigate("/login", { state: { from: location }, replace: true })
    }
  }, [user, loading, isAuthenticated, location, navigate])

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

function AppContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isAuthenticated, user, logout, isLoading } = useAppContext()
  const { user: firebaseUser } = useAuth()
  const location = useLocation()
  const muiTheme = useTheme()

  useEffect(() => {
    ;(window as any).__setIsMobileMenuOpen = setIsMobileMenuOpen
    return () => {
      delete (window as any).__setIsMobileMenuOpen
    }
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const mobileMenu = document.querySelector('[data-mobile-menu="true"]')
      const hamburgerButton = document.querySelector('[data-hamburger="true"]')

      if (
        isMobileMenuOpen &&
        mobileMenu &&
        !mobileMenu.contains(event.target as Node) &&
        hamburgerButton &&
        !hamburgerButton.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (!isAuthenticated && !firebaseUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        transition: "background-color 0.3s ease",
      }}
    >
      {/* Topbar for mobile */}
      <Box
        sx={{
          display: { xs: "flex", lg: "none" },
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bgcolor: "background.paper",
          zIndex: 50,
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Droplets size={24} color={muiTheme.palette.primary.main} />
          <span style={{ fontSize: "1.25rem", fontWeight: "bold" }}>FloodSense</span>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ThemeToggler />
          <Notifications />
          <Button
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            data-hamburger="true"
            sx={{ minWidth: "auto", p: 0.5, color: "text.primary" }}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </Box>
      </Box>

      {/* Sidebar */}
      <Box
        data-mobile-menu="true"
        className="app-sidebar"
        sx={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100%",
          width: 256,
          bgcolor: "background.paper",
          boxShadow: 2,
          transform: {
            xs: isMobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
            lg: "translateX(0)",
          },
          transition: "transform 0.3s ease",
          zIndex: 40,
          borderRight: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Droplets size={24} color={muiTheme.palette.primary.main} />
            <Box component="span" sx={{ fontSize: "1.25rem", fontWeight: "bold" }}>
              FloodSense
            </Box>
          </Box>

          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              gap: 1,
              alignItems: "center",
            }}
          >
            <Notifications />
            <ThemeToggler />
          </Box>
        </Box>
        <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
      </Box>

      <Box
        sx={{
          marginLeft: { xs: 0, lg: "256px" },
          paddingTop: { xs: "64px", lg: 0 },
          minHeight: "100vh",
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/safe-routes"
            element={
              <ProtectedRoute>
                <SafeRoutes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shelters"
            element={
              <ProtectedRoute>
                <Shelters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-help"
            element={
              <ProtectedRoute>
                <EmergencyHelp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  )
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  )
}

export default App
