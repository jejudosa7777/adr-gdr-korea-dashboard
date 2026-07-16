import { DEFAULT_SETTINGS } from "@/config/defaults";
import { settingsSchema } from "@/features/settings/schemas/settings-schema";
import type { AppSettings } from "@/features/settings/types";
import { safeGetLocalStorage, safeSetLocalStorage } from "@/lib/storage/safe-local-storage";

export interface SettingsRepository {
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
}

const STORAGE_KEY = "adr-dashboard:settings:v1";

export class LocalStorageSettingsRepository implements SettingsRepository {
  async getSettings(): Promise<AppSettings> {
    const raw = safeGetLocalStorage(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    try {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      const merged = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        alertThresholds: { ...DEFAULT_SETTINGS.alertThresholds, ...parsed.alertThresholds },
        alertCooldowns: { ...DEFAULT_SETTINGS.alertCooldowns, ...parsed.alertCooldowns },
        enabledChannels: { ...DEFAULT_SETTINGS.enabledChannels, ...parsed.enabledChannels },
        stockAlertEnabled: { ...DEFAULT_SETTINGS.stockAlertEnabled, ...parsed.stockAlertEnabled },
      };
      return settingsSchema.parse(merged);
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const parsed = settingsSchema.parse(settings);
    safeSetLocalStorage(STORAGE_KEY, JSON.stringify(parsed));
  }
}

export const localStorageSettingsRepository = new LocalStorageSettingsRepository();
