import type { CombinedMarketStatus, MarketSessionStatus } from "@/features/market-data/types";

export type MarketRegion = "KR" | "US" | "UK" | "EU";

export interface MarketStatus {
  korean: MarketSessionStatus;
  overseas: MarketSessionStatus;
  overseasRegion: Exclude<MarketRegion, "KR">;
  /** @deprecated overseas를 사용하세요. */
  us: MarketSessionStatus;
  combined: CombinedMarketStatus;
  checkedAt: string;
  nextKoreaOpen: string;
  nextOverseasOpen: string;
  /** @deprecated nextOverseasOpen을 사용하세요. */
  nextUsOpen: string;
}

export interface MarketCalendarProvider {
  getMarketStatus(overseasRegion?: Exclude<MarketRegion, "KR">): Promise<MarketStatus>;
  isTradingDay(market?: MarketRegion, date?: Date): Promise<boolean>;
  getNextMarketOpen(market?: MarketRegion, date?: Date): Promise<Date>;
}
