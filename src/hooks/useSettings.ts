import { useCallback, useState } from "react";

export interface SettingsState {
  // Account
  fullName: string;
  email: string;
  phone: string;
  avatar: string | null;

  // Preferences
  theme: "light" | "dark" | "system";

  // Security
  twoFactorEnabled: boolean;
}

export function useSettings() {
  const [settings, setSettings] = useState<SettingsState>({
    fullName: "Admin User",
    email: "admin@floodwatch.com",
    phone: "(+91) 1234567890",
    avatar: null,
    theme: "system",
    twoFactorEnabled: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAccountSettings = useCallback(
    async (data: {
      fullName: string;
      email: string;
      phone: string;
      avatar?: string | null;
    }) => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        setSettings((prev) => ({
          ...prev,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          avatar: data.avatar ?? prev.avatar,
        }));

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save account settings"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const savePreferences = useCallback(
    async (data: { theme: "light" | "dark" | "system" }) => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 600));

        setSettings((prev) => ({
          ...prev,
          theme: data.theme,
        }));

        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save preferences"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const saveSecuritySettings = useCallback(
    async (data: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
      twoFactorEnabled: boolean;
    }) => {
      setLoading(true);
      setError(null);

      try {
        // Validate passwords if provided
        if (data.newPassword) {
          if (data.newPassword !== data.confirmPassword) {
            throw new Error("Passwords do not match");
          }
          if (data.newPassword.length < 8) {
            throw new Error("Password must be at least 8 characters");
          }
        }

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setSettings((prev) => ({
          ...prev,
          twoFactorEnabled: data.twoFactorEnabled,
        }));

        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to save security settings"
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    settings,
    loading,
    error,
    saveAccountSettings,
    savePreferences,
    saveSecuritySettings,
  };
}
