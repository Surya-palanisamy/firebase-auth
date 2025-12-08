"use client";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../hooks/useAuth";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth, getFirebaseDb } from "../firebase/client";

import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export default function Signup() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); // ✅ NEW FIELD
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (user && !authLoading) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Avatar preview
  useEffect(() => {
    if (!avatarFile) return setPreview(null);
    const url = URL.createObjectURL(avatarFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  // Convert file → base64
  const convertToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const validateForm = () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError("Please fill all fields");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseDb();

      // Create account
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser: FirebaseUser = userCred.user;

      let base64Avatar: string | null = null;

      if (avatarFile) {
        base64Avatar = await convertToBase64(avatarFile);
      }

      // Update Firebase Auth profile (name + avatar only)
      await updateProfile(firebaseUser, {
        displayName: name,
        photoURL: base64Avatar ?? undefined,
      });

      // Store full profile in Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        fullName: name,
        email,
        phone, // ✅ STORE PHONE
        avatar: base64Avatar, // base64 image
        role: "User",
        createdAt: serverTimestamp(),
      });

      navigate("/", { replace: true });
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  };

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
      <Card
        sx={{
          width: "100%",
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: isDarkMode
            ? "background.paper"
            : "background.default",
        }}
      >
        <Typography variant="h4" fontWeight="bold" mb={1}>
          Create Account
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Join FloodSense to stay safe
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Avatar Picker */}
        <Typography variant="body2" fontWeight="600" mb={1}>
          Avatar (optional)
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Avatar src={preview ?? undefined} sx={{ width: 64, height: 64 }} />

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setAvatarFile(file);
              }}
            />
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarFile ? "Change Avatar" : "Choose Avatar"}
            </Button>
          </div>
        </Box>

        <Box
          component="form"
          onSubmit={handleSignup}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Typography fontWeight="600">Full Name</Typography>
          <TextField
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
          />
          <Typography fontWeight="600">Phone Number</Typography>{" "}
          {/* ✅ NEW FIELD */}
          <TextField
            placeholder="1234567890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            size="small"
          />
          <Typography fontWeight="600">Email</Typography>
          <TextField
            placeholder="your@email.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="small"
          />
          <Typography fontWeight="600">Password</Typography>
          <TextField
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            size="small"
          />
          <Typography fontWeight="600">Confirm Password</Typography>
          <TextField
            placeholder="••••••••"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            size="small"
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{ py: 1.5, fontWeight: "bold" }}
          >
            {loading ? <CircularProgress size={24} /> : "Create Account"}
          </Button>
        </Box>
      </Card>
    </Container>
  );
}
