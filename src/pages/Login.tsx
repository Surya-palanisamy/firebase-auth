"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Box,
  Button,
  Card,
  Container,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material"
import { useAuth } from "../hooks/useAuth"
import { useTheme } from "../context/ThemeContext"
import { signInWithEmailAndPassword } from "firebase/auth"
import { getFirebaseAuth } from "../firebase/client"

interface LocationState {
  from?: { pathname: string }
}

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { isDarkMode } = useTheme()
  const authModule = useAuth() // Moved useAuth hook call to top level

  useEffect(() => {
    if (user && !authLoading) {
      const state = location.state as LocationState | null
      const from = state?.from?.pathname || "/"
      navigate(from, { replace: true })
    }
  }, [user, authLoading, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const auth = (window as any).__useAuthInstance || authModule

      if (!email || !password) {
        setError("Please enter both email and password")
        setLoading(false)
        return
      }

      await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
      navigate("/", { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Card
        sx={{
          width: "100%",
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: isDarkMode ? "background.paper" : "background.default",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", mb: 1 }}>
            Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back to FloodSense
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="your@email.com"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="••••••••"
          />

          <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.5, fontWeight: "bold" }}>
            {loading ? <CircularProgress size={24} /> : "Sign In"}
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <MuiLink
              component="button"
              variant="body2"
              onClick={(e) => {
                e.preventDefault()
                navigate("/signup")
              }}
              sx={{ cursor: "pointer", fontWeight: "bold" }}
            >
              Sign Up
            </MuiLink>
          </Typography>
        </Box>
      </Card>
    </Container>
  )
}
