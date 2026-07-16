"use client";

import * as React from "react";
import { STOCKS } from "@/config/stocks";
import type { StockConfig } from "@/features/market-data/types";
import { localStorageStockSettingsRepository } from "@/features/settings/repositories/stock-settings-repository";

interface StockSettingsContextValue {
  stocks: StockConfig[];
  updateStock: (id: string, patch: Partial<StockConfig>) => Promise<void>;
  addStock: (stock: StockConfig) => Promise<void>;
  deleteStock: (id: string) => Promise<void>;
  resetStocks: () => Promise<void>;
}

const StockSettingsContext = React.createContext<StockSettingsContextValue | null>(null);

export function StockSettingsProvider({ children }: { children: React.ReactNode }) {
  const [stocks, setStocks] = React.useState<StockConfig[]>(STOCKS);
  const stocksRef = React.useRef<StockConfig[]>(STOCKS);

  React.useEffect(() => {
    localStorageStockSettingsRepository.getStocks().then((storedStocks) => {
      stocksRef.current = storedStocks;
      setStocks(storedStocks);
    });
  }, []);

  const persist = React.useCallback(async (next: StockConfig[]) => {
    stocksRef.current = next;
    setStocks(next);
    await localStorageStockSettingsRepository.saveStocks(next);
  }, []);

  const updateStock = React.useCallback(
    async (id: string, patch: Partial<StockConfig>) => {
      await persist(stocksRef.current.map((stock) => (stock.id === id ? { ...stock, ...patch } : stock)));
    },
    [persist],
  );

  const addStock = React.useCallback(
    async (stock: StockConfig) => {
      await persist([...stocksRef.current, stock]);
    },
    [persist],
  );

  const deleteStock = React.useCallback(
    async (id: string) => {
      await persist(stocksRef.current.filter((stock) => stock.id !== id));
    },
    [persist],
  );

  const resetStocks = React.useCallback(async () => {
    await persist(STOCKS);
  }, [persist]);

  const value = React.useMemo(() => ({ stocks, updateStock, addStock, deleteStock, resetStocks }), [stocks, updateStock, addStock, deleteStock, resetStocks]);
  return <StockSettingsContext.Provider value={value}>{children}</StockSettingsContext.Provider>;
}

export function useStockSettings() {
  const context = React.useContext(StockSettingsContext);
  if (!context) throw new Error("useStockSettings는 StockSettingsProvider 내부에서만 사용할 수 있습니다.");
  return context;
}
