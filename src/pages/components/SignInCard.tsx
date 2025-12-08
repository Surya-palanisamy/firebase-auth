// components/SignInCard.tsx
"use client";

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiCard from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import * as ReactHooks from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "../../firebase/client";
import ForgotPassword from "./ForgotPassword";
import { GoogleIcon, SitemarkIcon } from "./CustomIcons";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  boxShadow:
    "hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px",
  [theme.breakpoints.up("sm")]: {
    width: "450px",
  },
  ...theme.applyStyles?.("dark", {
    boxShadow:
      "hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px",
  }),
}));

export default function SignInCard() {
  const navigate = useNavigate();

  // form state
  const [email, setEmail] = ReactHooks.useState("");
  const [password, setPassword] = ReactHooks.useState("");
  const [rememberMe, setRememberMe] = ReactHooks.useState(false);

  // validation / UI state
  const [emailError, setEmailError] = ReactHooks.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = ReactHooks.useState("");
  const [passwordError, setPasswordError] = ReactHooks.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = ReactHooks.useState("");
  const [open, setOpen] = ReactHooks.useState(false);
  const [isLoading, setIsLoading] = ReactHooks.useState(false);
  const [formError, setFormError] = ReactHooks.useState("");

  ReactHooks.useEffect(() => {
    const saved = localStorage.getItem("floodSenseEmail");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const validateInputs = () => {
    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage("");
    }

    if (!password || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage("Password must be at least 6 characters long.");
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage("");
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem("floodSenseEmail", email);
      } else {
        localStorage.removeItem("floodSenseEmail");
      }

      // --- LOGIN: use Firebase Auth directly ---
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);

      // on success replace history so /login is removed from back-stack
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Login error", err);
      // friendlier handling for common errors & emulator unreachable
      if (err?.code === "auth/user-not-found") {
        setFormError("No account found with that email.");
      } else if (err?.code === "auth/wrong-password") {
        setFormError("Incorrect password. Try resetting your password.");
      } else if (/ECONNREFUSED|Connection refused/i.test(err?.message || "")) {
        setFormError("Cannot reach Auth emulator. Is `firebase emulators:start` running?");
      } else {
        setFormError(err?.message || "An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setFormError("");
    setIsLoading(true);
    try {
      // TODO: replace with your real Google login flow (example placeholder)
      // await loginWithGoogle();
      // on success:
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Google login error", err);
      setFormError("Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="outlined">
      <Box sx={{ display: { xs: "flex", md: "none" } }}>
        <SitemarkIcon />
      </Box>

      <Typography
        component="h1"
        variant="h4"
        sx={{ width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)" }}
      >
        Sign in
      </Typography>

      {formError && (
        <Box
          sx={{
            bgcolor: "#fff3f2",
            color: "#7f1d1d",
            px: 2,
            py: 1,
            borderRadius: 1,
          }}
        >
          {formError}
        </Box>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{ display: "flex", flexDirection: "column", width: "100%", gap: 2 }}
      >
        <FormControl>
          <FormLabel htmlFor="email">Email</FormLabel>
          <TextField
            error={emailError}
            helperText={emailErrorMessage}
            id="email"
            type="email"
            name="email"
            placeholder="your@email.com"
            autoComplete="email"
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={emailError ? "error" : "primary"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <FormLabel htmlFor="password">Password</FormLabel>
            <Link
              component="button"
              type="button"
              onClick={handleClickOpen}
              variant="body2"
              sx={{ alignSelf: "baseline" }}
            >
              Forgot your password?
            </Link>
          </Box>
          <TextField
            error={passwordError}
            helperText={passwordErrorMessage}
            name="password"
            placeholder="••••••"
            type="password"
            id="password"
            autoComplete="current-password"
            required
            fullWidth
            variant="outlined"
            color={passwordError ? "error" : "primary"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              value="remember"
              color="primary"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
          }
          label="Remember me"
        />

        <ForgotPassword open={open} handleClose={handleClose} />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={18} /> : undefined}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>

        <Typography sx={{ textAlign: "center" }}>
          Don&apos;t have an account?{" "}
          <span>
            <Link component="button" variant="body2" sx={{ alignSelf: "center" }} onClick={() => navigate("/signup")}>
              Sign up
            </Link>
          </span>
        </Typography>
      </Box>

      <Divider>or</Divider>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleGoogle}
          startIcon={<GoogleIcon />}
          disabled={isLoading}
        >
          {isLoading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <CircularProgress size={18} /> Continue
            </span>
          ) : (
            "Sign in with Google"
          )}
        </Button>
      </Box>
    </Card>
  );
}
