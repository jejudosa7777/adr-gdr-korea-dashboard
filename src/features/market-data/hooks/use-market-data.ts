"use client";

import { useQuery } from "@tanstack/react-query";
import type { ChartRange, HistoricalComparisonResponse, MarketComparison, MarketDataResponse } from "@/features/market-data/types";
import { useAppSettings } from "@/features/settings/components/settings-provider";
import { useStockSettings } from "@/features/settings/components/stock-settings-provider";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function useMarketData() {
  const { settings } = useAppSettings();
  const { stocks } = useStockSettings();
  return useQuery({
    queryKey: ["market-data", stocks],
    queryFn: () => fetchJson<MarketDataResponse>("/api/market-data", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stocks }),
    }),
    refetchInterval: settings.refreshIntervalMs === 0 ? false : settings.refreshIntervalMs,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
  });
}

export function useMarketDataItem(symbol: string) {
  const { settings } = useAppSettings();
  const { stocks } = useStockSettings();
  const stock = stocks.find((item) => [item.id, item.koreanSymbol, item.receiptSymbol].some((value) => value.toLowerCase() === symbol.toLowerCase()));
  return useQuery({
    queryKey: ["market-data", symbol, stock],
    queryFn: () => fetchJson<MarketComparison>(`/api/market-data/${encodeURIComponent(symbol)}`, stock ? {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(stock),
    } : undefined),
    refetchInterval: settings.refreshIntervalMs === 0 ? false : settings.refreshIntervalMs,
    refetchIntervalInBackground: false,
    enabled: Boolean(symbol),
    placeholderData: (previous) => previous,
  });
}

export function useHistoricalComparison(symbol: string, range: ChartRange) {
  const { stocks } = useStockSettings();
  const stock = stocks.find((item) => [item.id, item.koreanSymbol, item.receiptSymbol].some((value) => value.toLowerCase() === symbol.toLowerCase()));
  return useQuery({
    queryKey: ["market-data", symbol, "history", range, stock],
    queryFn: () => fetchJson<HistoricalComparisonResponse & { statistics: Record<string, number | null> }>(`/api/market-data/${encodeURIComponent(symbol)}/history?range=${range}`, stock ? {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(stock),
    } : undefined),
    enabled: Boolean(symbol),
    staleTime: 30_000,
  });
}
