"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { isDarkMode } = useTheme()

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/", { replace: true })
    }
  }, [user, authLoading, navigate])

  const validateForm = (): boolean => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields")
      return false
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return false
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { createUserWithEmailAndPassword } = await import("firebase/auth")
      const { getFirebaseAuth } = await import("../firebase/client")

      await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
      navigate("/", { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed"
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
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join FloodSense to stay safe
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
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            placeholder="••••••••"
          />

          <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.5, fontWeight: "bold" }}>
            {loading ? <CircularProgress size={24} /> : "Create Account"}
          </Button>
        </Box>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{" "}
            <MuiLink
              component="button"
              variant="body2"
              onClick={(e) => {
                e.preventDefault()
                navigate("/login")
              }}
              sx={{ cursor: "pointer", fontWeight: "bold" }}
            >
              Sign In
            </MuiLink>
          </Typography>
        </Box>
      </Card>
    </Container>
  )
}
