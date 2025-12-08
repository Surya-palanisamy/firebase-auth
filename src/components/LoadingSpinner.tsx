// LoadingSpinnerModern.tsx
import { keyframes } from "@emotion/react";
import { Backdrop, Box, Paper, Typography, useTheme } from "@mui/material";
import React from "react";

interface Props {
  size?: "sm" | "md" | "lg" | number;
  fullScreen?: boolean;
  color?: string; // any CSS color or theme key handled via theme.palette if 'primary'/'secondary'
  variant?: "gradient-ring" | "bar-wave" | "shimmer-skeleton" | "logo";
  message?: string | null;
  logo?: React.ReactNode; // for variant="logo"
}

const sizeMap = (s: Props["size"]) => {
  if (typeof s === "number") return s;
  switch (s) {
    case "sm":
      return 28;
    case "lg":
      return 72;
    case "md":
    default:
      return 44;
  }
};

/* Keyframes */
const rotate = keyframes`
  to { transform: rotate(360deg); }
`;

const bounce = keyframes`
  0%, 60%, 100% { transform: scaleY(0.4); }
  30% { transform: scaleY(1.0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export default function LoadingSpinnerModern({
  size = "md",
  fullScreen = false,
  color = "primary",
  variant = "gradient-ring",
  message = "Loading...",
  logo,
}: Props) {
  const theme = useTheme();
  const px = sizeMap(size);

  const resolvedColor =
    typeof color === "string" &&
    ["primary", "secondary", "error", "warning", "info", "success"].includes(
      color
    )
      ? (theme.palette as any)[color]?.main ?? theme.palette.primary.main
      : (color as string);

  /* Variant renderers */

  const GradientRing = () => {
    const ringSize = px;
    const stroke = Math.max(3, Math.round(ringSize / 10));
    // create a segmented ring by drawing arcs with stroke-dasharray trick (SVG)
    return (
      <Box
        sx={{
          width: ringSize,
          height: ringSize,
          display: "grid",
          placeItems: "center",
        }}
        aria-hidden
      >
        <Box
          component="svg"
          viewBox="0 0 100 100"
          sx={{
            width: "100%",
            height: "100%",
            transformOrigin: "50% 50%",
            animation: `${rotate} 1.6s linear infinite`,
          }}
        >
          {/* background faint circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke={theme.palette.grey[200]}
            strokeWidth={stroke}
            fill="none"
          />
          {/* colorful stroke using stroke-dasharray to make segments */}
          <defs>
            <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={resolvedColor} stopOpacity="1" />
              <stop offset="50%" stopColor="#6EE7B7" stopOpacity="1" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="1" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="url(#g1)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray="80 60"
            strokeDashoffset="0"
            fill="none"
            transform="rotate(-90 50 50)"
          />
        </Box>
      </Box>
    );
  };

  const BarWave = () => {
    const barCount = 3;
    const barWidth = Math.max(4, Math.round(px / 6));
    const barHeight = Math.round(px * 0.9);
    return (
      <Box
        sx={{
          display: "flex",
          gap: 1.2,
          alignItems: "flex-end",
          height: barHeight,
        }}
        role="status"
        aria-label="loading"
      >
        {Array.from({ length: barCount }).map((_, i) => (
          <Box
            key={i}
            sx={{
              width: barWidth,
              height: `${barHeight}px`,
              transformOrigin: "center bottom",
              background: resolvedColor,
              borderRadius: 2,
              animation: `${bounce} 1s ${i * 0.12}s infinite`,
            }}
          />
        ))}
      </Box>
    );
  };

  const ShimmerSkeleton = () => {
    // a sleek skeleton card with shimmer
    const cardW = Math.max(220, px * 4);
    return (
      <Box
        sx={{
          width: cardW,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: `0 6px 18px rgba(15,23,42,0.08)`,
          background: theme.palette.background.paper,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          px: 2,
          py: 2,
        }}
        role="status"
        aria-label="loading-content"
      >
        <Box
          sx={{
            height: px * 0.9,
            borderRadius: 1,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0.06) 100%)",
            backgroundSize: "200% 100%",
            animation: `${shimmer} 1.6s linear infinite`,
          }}
        />
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Box
            sx={{
              width: px * 0.9,
              height: px * 0.9,
              borderRadius: 1,
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0.06) 100%)",
              backgroundSize: "200% 100%",
              animation: `${shimmer} 1.6s linear infinite`,
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                height: 12,
                borderRadius: 1,
                mb: 0.5,
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0.06) 100%)",
                backgroundSize: "200% 100%",
                animation: `${shimmer} 1.6s linear infinite`,
              }}
            />
            <Box
              sx={{
                height: 10,
                width: "60%",
                borderRadius: 1,
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0.06) 100%)",
                backgroundSize: "200% 100%",
                animation: `${shimmer} 1.6s linear infinite`,
              }}
            />
          </Box>
        </Box>
      </Box>
    );
  };

  const LogoVariant = () => {
    // If no logo provided, fallback to gradient ring
    if (!logo) return <GradientRing />;
    return (
      <Box
        sx={{
          width: px * 1.6,
          height: px * 1.6,
          display: "grid",
          placeItems: "center",
          "& svg": {
            width: "70%",
            height: "70%",
            animation: `${rotate} 2.2s linear infinite`,
            transformOrigin: "50% 50%",
          },
        }}
      >
        {logo}
      </Box>
    );
  };

  const contentNode = (() => {
    switch (variant) {
      case "bar-wave":
        return <BarWave />;
      case "shimmer-skeleton":
        return <ShimmerSkeleton />;
      case "logo":
        return <LogoVariant />;
      case "gradient-ring":
      default:
        return <GradientRing />;
    }
  })();

  if (fullScreen) {
    return (
      <Backdrop
        open
        sx={{ zIndex: (t) => t.zIndex.modal + 1, backdropFilter: "blur(3px)" }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 3,
            minWidth: 260,
            maxWidth: 520,
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            borderRadius: 2,
          }}
        >
          {contentNode}
          {message ? (
            <Typography
              variant="body1"
              color="text.primary"
              sx={{ textAlign: "center" }}
            >
              {message}
            </Typography>
          ) : null}
        </Paper>
      </Backdrop>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 1,
        gap: 1,
      }}
    >
      {contentNode}
      {message ? (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
          {message}
        </Typography>
      ) : null}
    </Box>
  );
}
