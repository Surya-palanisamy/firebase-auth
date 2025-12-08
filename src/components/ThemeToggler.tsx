import { Moon, Sun } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "../context/ThemeContext";

interface ThemeTogglerProps extends React.ComponentPropsWithoutRef<"button"> {
  duration?: number;
}

export const ThemeToggler: React.FC<ThemeTogglerProps> = ({
  className = "",
  duration = 1500,
  ...props
}) => {
  const { mode, setTheme } = useTheme();
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Determine dark/light based on mode & system preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const resolve = () => {
      if (mode === "system") {
        setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
      } else {
        setIsDark(mode === "dark");
      }
    };

    resolve();

    if (mode === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => resolve();

      if (mql.addEventListener) mql.addEventListener("change", handler);
      else mql.addListener(handler as any);

      return () => {
        if (mql.removeEventListener) mql.removeEventListener("change", handler);
        else mql.removeListener(handler as any);
      };
    }
  }, [mode]);

  const toggleTheme = useCallback(async () => {
    const newIsDark = !isDark;

    const applyChange = () => {
      // toggle explicitly (leave "system" as only default)
      setTheme(newIsDark ? "dark" : "light");
    };

    if (typeof document === "undefined") {
      applyChange();
      return;
    }

    const docAny = document as any;

    if (typeof docAny.startViewTransition === "function") {
      try {
        await docAny.startViewTransition(() => {
          flushSync(applyChange);
        }).ready;
      } catch {
        applyChange();
      }

      if (!buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      try {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          } as KeyframeAnimationOptions
        );
      } catch {}
    } else {
      applyChange();
    }
  }, [isDark, setTheme, duration]);

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className={className}
      {...props}
      aria-label="Toggle theme"
      style={{ cursor: "pointer" }}
    >
      {isDark ? <Sun /> : <Moon />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeToggler;
