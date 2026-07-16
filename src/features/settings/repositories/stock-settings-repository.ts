import { STOCKS } from "@/config/stocks";
import type { StockConfig } from "@/features/market-data/types";
import { normalizeStockConfig } from "@/features/market-data/schemas/stock-config-schema";
import { safeGetLocalStorage, safeSetLocalStorage } from "@/lib/storage/safe-local-storage";

export const normalizeStoredStock = normalizeStockConfig;

export interface StockSettingsRepository {
  getStocks(): Promise<StockConfig[]>;
  saveStocks(stocks: StockConfig[]): Promise<void>;
}

const STORAGE_KEY = "dr-dashboard:stocks:v4";
const PREVIOUS_STORAGE_KEY = "dr-dashboard:stocks:v3";
const V2_STORAGE_KEY = "dr-dashboard:stocks:v2";
const LEGACY_STORAGE_KEY = "adr-dashboard:stocks:v1";
const V4_ADDED_STOCK_IDS = new Set(["samsung-electronics", "sk-hynix-gdr"]);

export function mergeDefaultStocks(storedStocks: StockConfig[], defaultStocks: StockConfig[] = STOCKS) {
  const storedIds = new Set(storedStocks.map((stock) => stock.id));
  return [...storedStocks, ...defaultStocks.filter((stock) => !storedIds.has(stock.id))];
}

function restoreKnownDemoSettings(stocks: StockConfig[]) {
  const officialSkHynixAdr = STOCKS.find((stock) => stock.id === "sk-hynix");
  if (!officialSkHynixAdr) return stocks;

  return stocks.map((stock) => {
    if (stock.id !== "sk-hynix" || stock.receiptSymbol !== "GDR-MOCK") return stock;
    return {
      ...officialSkHynixAdr,
      isActive: stock.isActive,
      isFavorite: stock.isFavorite,
      sortOrder: stock.sortOrder,
    };
  });
}

export class LocalStorageStockSettingsRepository implements StockSettingsRepository {
  async getStocks(): Promise<StockConfig[]> {
    const currentRaw = safeGetLocalStorage(STORAGE_KEY);
    const raw = currentRaw
      ?? safeGetLocalStorage(PREVIOUS_STORAGE_KEY)
      ?? safeGetLocalStorage(V2_STORAGE_KEY)
      ?? safeGetLocalStorage(LEGACY_STORAGE_KEY);
    if (!raw) return STOCKS;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return STOCKS;
      const normalizedStocks = parsed.map(normalizeStoredStock).filter((stock): stock is StockConfig => stock !== null);
      if (!normalizedStocks.length) return STOCKS;
      const migratedStocks = currentRaw ? normalizedStocks : restoreKnownDemoSettings(normalizedStocks);
      const newlyAddedDefaults = STOCKS.filter((stock) => V4_ADDED_STOCK_IDS.has(stock.id));
      const stocks = currentRaw ? migratedStocks : mergeDefaultStocks(migratedStocks, newlyAddedDefaults);
      safeSetLocalStorage(STORAGE_KEY, JSON.stringify(stocks));
      return stocks;
    } catch {
      return STOCKS;
    }
  }

  async saveStocks(stocks: StockConfig[]): Promise<void> {
    safeSetLocalStorage(STORAGE_KEY, JSON.stringify(stocks));
  }
}

export const localStorageStockSettingsRepository = new LocalStorageStockSettingsRepository();
