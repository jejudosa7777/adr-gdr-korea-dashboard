import type { MarketRegion } from "@/features/market-calendar/types";
import type { ReceiptCurrency } from "@/features/market-data/types";

export function resolveOverseasMarketRegion(
  exchange: string | undefined,
  currency: ReceiptCurrency,
): Exclude<MarketRegion, "KR"> {
  const normalized = exchange?.trim().toUpperCase() ?? "";

  if (["LSE", "LONDON"].some((value) => normalized.includes(value))) return "UK";
  if (["FRANKFURT", "XETRA", "DEUTSCHE", "EURONEXT"].some((value) => normalized.includes(value))) return "EU";
  if (["NYSE", "NASDAQ", "OTC", "AMEX"].some((value) => normalized.includes(value))) return "US";

  return currency === "GBP" ? "UK" : currency === "EUR" ? "EU" : "US";
}
