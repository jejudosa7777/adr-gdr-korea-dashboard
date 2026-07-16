import type {
  DepositaryReceiptQuote,
  ChartRange,
  ExchangeRateQuote,
  HistoricalExchangeRate,
  HistoricalPrice,
  KoreanStockQuote,
  ReceiptCurrency,
} from "@/features/market-data/types";

export interface KoreanStockPriceProvider {
  getQuote(symbol: string): Promise<KoreanStockQuote>;
  getHistoricalPrices(symbol: string, range: ChartRange): Promise<HistoricalPrice[]>;
}

export interface DepositaryReceiptPriceProvider {
  getQuote(symbol: string, currency: ReceiptCurrency, exchange?: string): Promise<DepositaryReceiptQuote>;
  getHistoricalPrices(symbol: string, range: ChartRange, currency: ReceiptCurrency, exchange?: string): Promise<HistoricalPrice[]>;
}

/** @deprecated DepositaryReceiptPriceProvider를 사용하세요. */
export type AdrPriceProvider = DepositaryReceiptPriceProvider;

export interface ExchangeRateProvider {
  getKrwRate(currency: ReceiptCurrency): Promise<ExchangeRateQuote>;
  getHistoricalKrwRates(range: ChartRange, currency: ReceiptCurrency): Promise<HistoricalExchangeRate[]>;
  getUsdKrwRate(): Promise<ExchangeRateQuote>;
  getHistoricalUsdKrwRates(range: ChartRange): Promise<HistoricalExchangeRate[]>;
}
