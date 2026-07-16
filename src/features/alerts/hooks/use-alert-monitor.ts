"use client";

import * as React from "react";
import type { MarketComparison } from "@/features/market-data/types";
import type { AlertHistoryItem, LastAlertState, NotificationChannel, NotificationResult } from "@/features/alerts/types";
import { useAppSettings } from "@/features/settings/components/settings-provider";
import { localStorageAlertHistoryRepository } from "@/features/alerts/repositories/alert-history-repository";
import { safeGetLocalStorage, safeSetLocalStorage } from "@/lib/storage/safe-local-storage";
import { shouldTriggerAlert } from "@/lib/calculations/premium-discount";

const LAST_ALERT_KEY = "adr-dashboard:last-alert-state:v1";

function readLastAlertStates(): Record<string, LastAlertState> {
  const raw = safeGetLocalStorage(LAST_ALERT_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeLastAlertStates(states: Record<string, LastAlertState>) {
  safeSetLocalStorage(LAST_ALERT_KEY, JSON.stringify(states));
}

function formatBrowserBody(item: MarketComparison) {
  const direction = item.direction === "premium" ? `${item.receiptType} 프리미엄` : item.direction === "discount" ? `${item.receiptType} 디스카운트` : "중립";
  const rate = `${(item.premiumDiscountRate ?? 0) >= 0 ? "+" : ""}${(item.premiumDiscountRate ?? 0).toFixed(2)}%`;
  return `${item.nameKo} ${direction} ${rate}`;
}

async function sendServerNotification(item: MarketComparison, channels: Array<Exclude<NotificationChannel, "browser">>) {
  if (!channels.length || item.premiumDiscountRate === null) return [];
  const response = await fetch("/api/notifications/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      stockId: item.id,
      stockNameKo: item.nameKo,
      koreanPrice: item.koreanPrice,
      receiptType: item.receiptType,
      receiptCurrency: item.receiptCurrency,
      receiptPrice: item.receiptPrice,
      currencyKrwRate: item.currencyKrwRate,
      convertedReceiptPriceKrw: item.convertedReceiptPriceKrw,
      receiptRatio: item.receiptRatio,
      adrPriceUsd: item.adrPriceUsd,
      usdKrwRate: item.usdKrwRate,
      convertedAdrPriceKrw: item.convertedAdrPriceKrw,
      premiumDiscountRate: item.premiumDiscountRate,
      level: item.level,
      direction: item.direction,
      adrRatio: item.adrRatio,
      dataTimestamp: item.quotedAt,
      channels,
    }),
  });
  const payload = await response.json();
  return Array.isArray(payload.results) ? (payload.results as NotificationResult[]) : [];
}

export function useAlertMonitor(items: MarketComparison[]) {
  const { settings } = useAppSettings();
  const processedKeyRef = React.useRef<string>("");

  React.useEffect(() => {
    if (!items.length) return;
    const latestKey = items.map((item) => `${item.id}:${item.updatedAt}:${item.premiumDiscountRate}`).join("|");
    if (processedKeyRef.current === latestKey) return;
    processedKeyRef.current = latestKey;

    const run = async () => {
      const states = readLastAlertStates();
      for (const item of items) {
        if (!item.alertEnabled || item.premiumDiscountRate === null) continue;
        if (item.direction === "premium" && !settings.premiumAlertsEnabled) continue;
        if (item.direction === "discount" && !settings.discountAlertsEnabled) continue;

        const decision = shouldTriggerAlert({
          rate: item.premiumDiscountRate,
          previousAlert: states[item.id],
          thresholds: settings.alertThresholds,
          cooldowns: settings.alertCooldowns,
        });
        if (!decision.shouldSend || decision.level === "neutral") continue;

        const now = new Date().toISOString();
        const results: NotificationResult[] = [];
        const channels: NotificationChannel[] = [];

        if (settings.enabledChannels.browser) {
          channels.push("browser");
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification(`[${decision.level}] ${item.nameKo}`, { body: formatBrowserBody(item) });
            results.push({ channel: "browser", success: true, respondedAt: now });
          } else {
            results.push({ channel: "browser", success: false, respondedAt: now, reason: "브라우저 알림 권한이 없습니다." });
          }
        }

        const serverChannels = (["telegram", "discord", "slack"] as const).filter((channel) => settings.enabledChannels[channel]);
        channels.push(...serverChannels);
        const serverResults = await sendServerNotification(item, serverChannels).catch((error) =>
          serverChannels.map((channel) => ({
            channel,
            success: false,
            respondedAt: now,
            reason: error instanceof Error ? error.message : "서버 알림 실패",
          })),
        );
        results.push(...serverResults);

        const historyItem: AlertHistoryItem = {
          id: `${item.id}-${Date.now()}`,
          createdAt: now,
          stockId: item.id,
          stockNameKo: item.nameKo,
          koreanPrice: item.koreanPrice,
          receiptType: item.receiptType,
          receiptCurrency: item.receiptCurrency,
          receiptPrice: item.receiptPrice,
          currencyKrwRate: item.currencyKrwRate,
          convertedReceiptPriceKrw: item.convertedReceiptPriceKrw,
          receiptRatio: item.receiptRatio,
          adrPriceUsd: item.adrPriceUsd,
          usdKrwRate: item.usdKrwRate,
          convertedAdrPriceKrw: item.convertedAdrPriceKrw,
          premiumDiscountRate: item.premiumDiscountRate,
          level: decision.level,
          direction: decision.direction,
          adrRatio: item.adrRatio,
          dataTimestamp: item.quotedAt,
          channels,
          results,
        };
        await localStorageAlertHistoryRepository.saveAlert(historyItem);
        states[item.id] = {
          stockId: item.id,
          level: decision.level,
          direction: decision.direction,
          rate: item.premiumDiscountRate,
          sentAt: now,
        };
      }
      writeLastAlertStates(states);
    };

    run();
  }, [items, settings]);
}
