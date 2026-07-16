"use client";

import * as React from "react";
import type { AlertHistoryItem } from "@/features/alerts/types";
import { localStorageAlertHistoryRepository } from "@/features/alerts/repositories/alert-history-repository";
import { safeGetLocalStorage } from "@/lib/storage/safe-local-storage";

export function useAlertHistory() {
  const [alerts, setAlerts] = React.useState<AlertHistoryItem[]>(() => {
    const raw = safeGetLocalStorage("adr-dashboard:alerts:v1");
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const reload = React.useCallback(async () => {
    setAlerts(await localStorageAlertHistoryRepository.getAlerts());
  }, []);

  const saveAlert = React.useCallback(async (alert: AlertHistoryItem) => {
    await localStorageAlertHistoryRepository.saveAlert(alert);
    await reload();
  }, [reload]);

  const clearAlerts = React.useCallback(async () => {
    await localStorageAlertHistoryRepository.clearAlerts();
    await reload();
  }, [reload]);

  return { alerts, reload, saveAlert, clearAlerts };
}
