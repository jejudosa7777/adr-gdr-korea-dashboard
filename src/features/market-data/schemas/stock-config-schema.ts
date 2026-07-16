import { z } from "zod";
import type { ProviderSymbols, StockConfig } from "@/features/market-data/types";

const providerSymbolsSchema = z.object({
  yahoo: z.string().optional(),
  alphaVantage: z.string().optional(),
  stooq: z.string().optional(),
  krx: z.string().optional(),
  custom: z.string().optional(),
});

const baseStockSchema = z.object({
  id: z.string().min(1).max(80),
  nameKo: z.string().min(1).max(100),
  nameEn: z.string().min(1).max(100),
  koreanSymbol: z.string().min(1).max(30),
  isActive: z.boolean(),
  isFavorite: z.boolean(),
  sortOrder: z.number().finite(),
  note: z.string().max(1000),
});

const receiptFieldsSchema = z.object({
  receiptType: z.enum(["ADR", "GDR", "CUSTOM"]),
  receiptSymbol: z.string().min(1).max(30),
  receiptRatio: z.number().positive().max(100000),
  receiptStatus: z.enum(["active", "suspended", "delisted", "unverified", "custom", "inactive"]),
  receiptExchange: z.string().max(80).optional(),
  receiptCurrency: z.enum(["USD", "EUR", "GBP"]),
  dataProviderSymbols: z.object({ korean: providerSymbolsSchema, receipt: providerSymbolsSchema }),
});

const legacyAdrFieldsSchema = z.object({
  adrSymbol: z.string().min(1),
  adrRatio: z.number().positive(),
  adrStatus: z.enum(["active", "suspended", "delisted", "unverified", "custom", "inactive"]),
  adrExchange: z.string().optional(),
  adrCurrency: z.literal("USD"),
  dataProviderSymbols: z.object({ korean: providerSymbolsSchema, adr: providerSymbolsSchema }),
});

export const stockConfigSchema = baseStockSchema.and(receiptFieldsSchema);

export function normalizeStockConfig(value: unknown): StockConfig | null {
  const current = stockConfigSchema.safeParse(value);
  if (current.success) return current.data;

  const legacy = baseStockSchema.and(legacyAdrFieldsSchema).safeParse(value);
  if (!legacy.success) return null;
  const stock = legacy.data;
  return {
    id: stock.id,
    nameKo: stock.nameKo,
    nameEn: stock.nameEn,
    koreanSymbol: stock.koreanSymbol,
    receiptType: "ADR",
    receiptSymbol: stock.adrSymbol,
    receiptRatio: stock.adrRatio,
    receiptStatus: stock.adrStatus,
    receiptExchange: stock.adrExchange,
    receiptCurrency: stock.adrCurrency,
    isActive: stock.isActive,
    isFavorite: stock.isFavorite,
    sortOrder: stock.sortOrder,
    note: stock.note,
    dataProviderSymbols: {
      korean: stock.dataProviderSymbols.korean as ProviderSymbols,
      receipt: stock.dataProviderSymbols.adr as ProviderSymbols,
    },
  };
}
