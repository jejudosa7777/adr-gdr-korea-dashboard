"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { DEFAULT_SETTINGS } from "@/config/defaults";
import { localStorageSettingsRepository } from "@/features/settings/repositories/settings-repository";
import type { AppSettings } from "@/features/settings/types";

interface SettingsContextValue {
  settings: AppSettings;
  isLoaded: boolean;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  replaceSettings: (settings: AppSettings) => Promise<void>;
}

const SettingsContext = React.createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const { setTheme } = useTheme();

  React.useEffect(() => {
    let mounted = true;
    localStorageSettingsRepository.getSettings().then((stored) => {
      if (!mounted) return;
      setSettings(stored);
      setTheme(stored.theme);
      setIsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, [setTheme]);

  const replaceSettings = React.useCallback(
    async (next: AppSettings) => {
      setSettings(next);
      setTheme(next.theme);
      await localStorageSettingsRepository.saveSettings(next);
    },
    [setTheme],
  );

  const updateSettings = React.useCallback(
    async (patch: Partial<AppSettings>) => {
      const next = { ...settings, ...patch };
      await replaceSettings(next);
    },
    [replaceSettings, settings],
  );

  const value = React.useMemo(
    () => ({ settings, isLoaded, updateSettings, replaceSettings }),
    [settings, isLoaded, updateSettings, replaceSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error("useAppSettings는 SettingsProvider 내부에서만 사용할 수 있습니다.");
  }
  return context;
}
