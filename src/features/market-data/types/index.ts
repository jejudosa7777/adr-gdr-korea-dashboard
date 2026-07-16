export type ChartRange = "1d" | "5d" | "1m" | "3m" | "6m" | "1y";

export type DepositaryReceiptType = "ADR" | "GDR" | "CUSTOM";
export type ReceiptCurrency = "USD" | "EUR" | "GBP";

export type DepositaryReceiptTradingStatus =
  | "active"
  | "suspended"
  | "delisted"
  | "unverified"
  | "custom"
  | "inactive";

/** @deprecated DepositaryReceiptTradingStatus를 사용하세요. */
export type AdrTradingStatus = DepositaryReceiptTradingStatus;

export type MarketSessionStatus =
  | "pre_market"
  | "regular"
  | "after_market"
  | "closed"
  | "pre_open"
  | "post_close"
  | "holiday"
  | "delayed"
  | "failed";

export type CombinedMarketStatus =
  | "both_regular"
  | "both_closed"
  | "korea_only"
  | "us_only"
  | "holiday"
  | "delayed"
  | "failed"
  | "mixed";

export type DataMode = "mock" | "real";

export interface ProviderSymbols {
  yahoo?: string;
  alphaVantage?: string;
  stooq?: string;
  krx?: string;
  custom?: string;
}

export interface StockConfig {
  id: string;
  nameKo: string;
  nameEn: string;
  koreanSymbol: string;
  receiptType: DepositaryReceiptType;
  receiptSymbol: string;
  receiptRatio: number;
  receiptStatus: DepositaryReceiptTradingStatus;
  isActive: boolean;
  isFavorite: boolean;
  sortOrder: number;
  note: string;
  dataProviderSymbols: {
    korean: ProviderSymbols;
    receipt: ProviderSymbols;
  };
  receiptExchange?: string;
  receiptCurrency: ReceiptCurrency;
}

export type DepositaryReceiptStockConfig = StockConfig;

export interface KoreanStockQuote {
  symbol: string;
  priceKrw: number | null;
  previousCloseKrw: number | null;
  changeRate: number | null;
  quotedAt: string | null;
  updatedAt: string;
  marketStatus: MarketSessionStatus;
  isDelayed: boolean;
  provider: string;
  error?: string;
}

export interface DepositaryReceiptQuote {
  symbol: string;
  currency: ReceiptCurrency;
  price: number | null;
  previousClose: number | null;
  changeRate: number | null;
  quotedAt: string | null;
  updatedAt: string;
  marketStatus: MarketSessionStatus;
  isDelayed: boolean;
  provider: string;
  error?: string;
}

/** @deprecated DepositaryReceiptQuote를 사용하세요. */
export type AdrQuote = DepositaryReceiptQuote;

export interface ExchangeRateQuote {
  pair: `${ReceiptCurrency}/KRW`;
  baseCurrency: ReceiptCurrency;
  rate: number | null;
  previousRate: number | null;
  change: number | null;
  changeRate: number | null;
  quotedAt: string | null;
  updatedAt: string;
  provider: string;
  isDelayed: boolean;
  usedFallback?: boolean;
  error?: string;
}

export interface HistoricalPrice {
  timestamp: string;
  price: number | null;
  receiptPrice?: number | null;
  marketStatus: MarketSessionStatus;
}

export interface HistoricalExchangeRate {
  timestamp: string;
  rate: number | null;
}

export type PremiumDiscountLevel = "neutral" | "caution" | "warning" | "danger";
export type PremiumDiscountDirection = "premium" | "discount" | "neutral";

export interface MarketComparison {
  id: string;
  nameKo: string;
  nameEn: string;
  koreanSymbol: string;
  receiptType: DepositaryReceiptType;
  receiptSymbol: string;
  receiptStatus: DepositaryReceiptTradingStatus;
  receiptCurrency: ReceiptCurrency;
  receiptPrice: number | null;
  receiptChangeRate: number | null;
  currencyKrwRate: number | null;
  currencyKrwChange: number | null;
  currencyKrwChangeRate: number | null;
  receiptRatio: number;
  convertedReceiptPriceKrw: number | null;
  /** @deprecated receiptSymbol을 사용하세요. */
  adrSymbol: string;
  /** @deprecated receiptStatus를 사용하세요. */
  adrStatus: AdrTradingStatus;
  koreanPrice: number | null;
  koreanChangeRate: number | null;
  adrPriceUsd: number | null;
  adrChangeRate: number | null;
  usdKrwRate: number | null;
  usdKrwChange: number | null;
  usdKrwChangeRate: number | null;
  adrRatio: number;
  convertedAdrPriceKrw: number | null;
  premiumDiscountRate: number | null;
  level: PremiumDiscountLevel;
  direction: PremiumDiscountDirection;
  koreanMarketStatus: MarketSessionStatus;
  overseasMarketStatus: MarketSessionStatus;
  /** @deprecated overseasMarketStatus를 사용하세요. */
  usMarketStatus: MarketSessionStatus;
  combinedMarketStatus: CombinedMarketStatus;
  quotedAt: string | null;
  updatedAt: string;
  isDelayed: boolean;
  isActive: boolean;
  isFavorite: boolean;
  alertEnabled: boolean;
  provider: string;
  warnings: string[];
  error?: string;
  note?: string;
}

export interface MarketSummary {
  totalTracked: number;
  totalComparisons: number;
  activeCount: number;
  cautionCount: number;
  warningCount: number;
  dangerCount: number;
  largestGapStock: MarketComparison | null;
  usdKrwRate: number | null;
  usdKrwChange: number | null;
  usdKrwChangeRate: number | null;
  lastUpdatedAt: string;
  koreanMarketStatus: MarketSessionStatus;
  usMarketStatus: MarketSessionStatus;
  apiStatus: "connected" | "degraded" | "failed";
  isMockMode: boolean;
}

export interface MarketDataResponse {
  summary: MarketSummary;
  items: MarketComparison[];
}

export interface HistoricalComparisonPoint {
  timestamp: string;
  koreanPriceKrw: number | null;
  receiptPrice: number | null;
  receiptCurrency: ReceiptCurrency;
  currencyKrwRate: number | null;
  convertedReceiptPriceKrw: number | null;
  /** @deprecated receiptPrice를 사용하세요. */
  adrPriceUsd: number | null;
  usdKrwRate: number | null;
  convertedAdrPriceKrw: number | null;
  premiumDiscountRate: number | null;
  koreanMarketStatus: MarketSessionStatus;
  overseasMarketStatus: MarketSessionStatus;
  /** @deprecated overseasMarketStatus를 사용하세요. */
  usMarketStatus: MarketSessionStatus;
}

export interface HistoricalComparisonResponse {
  stock: StockConfig;
  range: ChartRange;
  points: HistoricalComparisonPoint[];
}
