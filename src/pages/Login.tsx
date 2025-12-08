// pages/Login.tsx
"use client";

import Stack from "@mui/material/Stack";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggler from "../components/ThemeToggler";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../hooks/useAuth";
import AppTheme from "../shared-theme/AppTheme";
import Content from "./components/Content";
import SignInCard from "./components/SignInCard";

export default function Login(props: { disableCustomTheme?: boolean }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppContext();
  const { user: firebaseUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && (isAuthenticated || firebaseUser)) {
      navigate("/", { replace: true });
    }
  }, [loading, isAuthenticated, firebaseUser, navigate]);

  return (
    <AppTheme {...props}>
      <Stack sx={{ display: "flex", alignItems: "flex-end", pr: 10, pt: 2 }}>
        <ThemeToggler />
      </Stack>
      <Stack
        direction="column"
        component="main"
        sx={[
          {
            justifyContent: "center",
            height: "calc((1 - var(--template-frame-height, 0)) * 100%)",
            marginTop: "0px",
          },
          (theme) => ({
            "&::before": {
              content: '""',
              display: "block",
              position: "absolute",
              zIndex: -1,
              inset: 0,
              backgroundImage:
                "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
              backgroundRepeat: "no-repeat",
              ...theme.applyStyles("dark", {
                backgroundImage:
                  "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
              }),
            },
          }),
        ]}
      >
        <Stack
          direction={{ xs: "column-reverse", md: "row" }}
          sx={{
            justifyContent: "center",
            gap: { xs: 6, sm: 12 },
            p: 2,
            mx: "auto",
          }}
        >
          <Stack
            direction={{ xs: "column-reverse", md: "row" }}
            sx={{
              justifyContent: "center",
              gap: { xs: 6, sm: 12 },
              p: { xs: 2, sm: 4 },
              m: "auto",
            }}
          >
            <Content />
            <SignInCard />
          </Stack>
        </Stack>
      </Stack>
    </AppTheme>
  );
}
