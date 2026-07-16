import type { AlertHistoryItem } from "@/features/alerts/types";
import { safeGetLocalStorage, safeRemoveLocalStorage, safeSetLocalStorage } from "@/lib/storage/safe-local-storage";

export interface AlertHistoryRepository {
  getAlerts(): Promise<AlertHistoryItem[]>;
  saveAlert(alert: AlertHistoryItem): Promise<void>;
  clearAlerts(): Promise<void>;
}

const STORAGE_KEY = "adr-dashboard:alerts:v1";

export class LocalStorageAlertHistoryRepository implements AlertHistoryRepository {
  async getAlerts(): Promise<AlertHistoryItem[]> {
    const raw = safeGetLocalStorage(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async saveAlert(alert: AlertHistoryItem): Promise<void> {
    const current = await this.getAlerts();
    safeSetLocalStorage(STORAGE_KEY, JSON.stringify([alert, ...current].slice(0, 500)));
  }

  async clearAlerts(): Promise<void> {
    safeRemoveLocalStorage(STORAGE_KEY);
  }
}

export const localStorageAlertHistoryRepository = new LocalStorageAlertHistoryRepository();
