import { STOCKS } from "@/config/stocks";
import type {
  DepositaryReceiptQuote,
  ChartRange,
  ExchangeRateQuote,
  HistoricalExchangeRate,
  HistoricalPrice,
  KoreanStockQuote,
  MarketSessionStatus,
  ReceiptCurrency,
} from "@/features/market-data/types";
import type { DepositaryReceiptPriceProvider, ExchangeRateProvider, KoreanStockPriceProvider } from "@/features/market-data/providers/interfaces";
import { resolveOverseasMarketRegion } from "@/features/market-calendar/market-region";
import { MockMarketCalendarProvider } from "@/features/market-calendar/providers/mock-market-calendar-provider";
import { currentBucket, seededWave } from "@/features/market-data/providers/mock-seed";

const baseKoreanPrices: Record<string, number> = {
  "000660": 1913000,
  "005490": 286000,
  "034220": 10450,
  "030200": 45300,
  "017670": 57100,
  "015760": 31800,
  "105560": 92800,
  "055550": 61200,
  "316140": 18200,
  "005930": 186000,
};

const targetGaps: Record<string, number> = {
  "000660": 7.8,
  "005490": -3.4,
  "034220": 10.8,
  "030200": 1.2,
  "017670": -5.7,
  "015760": 0.4,
  "105560": -10.6,
  "055550": 4.8,
  "316140": 2.4,
  "005930": 4.2,
};

const receiptGapOffsets: Record<string, number> = {
  SKHY: 0.7,
  HYXS: -0.6,
};

function changeRate(current: number, previous: number) {
  return ((current - previous) / previous) * 100;
}

function historyLength(range: ChartRange) {
  return { "1d": 78, "5d": 120, "1m": 160, "3m": 180, "6m": 220, "1y": 260 }[range];
}

function stepMs(range: ChartRange) {
  return { "1d": 5 * 60_000, "5d": 60 * 60_000, "1m": 4 * 60 * 60_000, "3m": 12 * 60 * 60_000, "6m": 24 * 60 * 60_000, "1y": 36 * 60 * 60_000 }[range];
}

export class MockExchangeRateProvider implements ExchangeRateProvider {
  async getKrwRate(currency: ReceiptCurrency): Promise<ExchangeRateQuote> {
    const bucket = currentBucket();
    const base = { USD: 1450.32, EUR: 1685.4, GBP: 1948.7 }[currency];
    const amplitude = { USD: 7, EUR: 9, GBP: 11 }[currency];
    const rate = base + seededWave(`${currency.toLowerCase()}krw`, bucket, amplitude);
    const previousRate = base + seededWave(`${currency.toLowerCase()}krw-prev`, bucket - 96, amplitude * 0.7);
    const now = new Date();
    return {
      pair: `${currency}/KRW`,
      baseCurrency: currency,
      rate,
      previousRate,
      change: rate - previousRate,
      changeRate: changeRate(rate, previousRate),
      quotedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      provider: "MockExchangeRateProvider",
      isDelayed: false,
    };
  }

  async getUsdKrwRate() {
    return this.getKrwRate("USD");
  }

  async getHistoricalKrwRates(range: ChartRange, currency: ReceiptCurrency): Promise<HistoricalExchangeRate[]> {
    const length = historyLength(range);
    const step = stepMs(range);
    const now = Date.now();
    return Array.from({ length }, (_, index) => {
      const timestamp = new Date(now - (length - index - 1) * step).toISOString();
      return {
        timestamp,
        rate: { USD: 1450, EUR: 1685, GBP: 1948 }[currency] + seededWave(`${currency.toLowerCase()}krw-history-${range}`, index, 18),
      };
    });
  }

  async getHistoricalUsdKrwRates(range: ChartRange) {
    return this.getHistoricalKrwRates(range, "USD");
  }
}

export class MockKoreanStockPriceProvider implements KoreanStockPriceProvider {
  private readonly calendar = new MockMarketCalendarProvider();

  async getQuote(symbol: string): Promise<KoreanStockQuote> {
    const stock = STOCKS.find((item) => item.koreanSymbol === symbol || item.id === symbol);
    const koreanSymbol = stock?.koreanSymbol ?? symbol;
    const bucket = currentBucket();
    const base = baseKoreanPrices[koreanSymbol] ?? 50_000;
    const priceKrw = Math.round(base * (1 + seededWave(`kr-${koreanSymbol}`, bucket, 0.018)));
    const previousCloseKrw = Math.round(base * (1 + seededWave(`kr-prev-${koreanSymbol}`, bucket - 96, 0.012)));
    const status = (await this.calendar.getMarketStatus()).korean;
    const now = new Date();
    const isDelayed = koreanSymbol === "034220";
    const quotedAt = new Date(now.getTime() - (isDelayed ? 35 * 60_000 : 45_000)).toISOString();

    if (koreanSymbol === "316140" && bucket % 7 === 0) {
      return {
        symbol: koreanSymbol,
        priceKrw: null,
        previousCloseKrw,
        changeRate: null,
        quotedAt: null,
        updatedAt: now.toISOString(),
        marketStatus: "failed",
        isDelayed: false,
        provider: "MockKoreanStockPriceProvider",
        error: "Mock 가격 조회 실패",
      };
    }

    return {
      symbol: koreanSymbol,
      priceKrw,
      previousCloseKrw,
      changeRate: changeRate(priceKrw, previousCloseKrw),
      quotedAt,
      updatedAt: now.toISOString(),
      marketStatus: isDelayed ? "delayed" : status,
      isDelayed,
      provider: "MockKoreanStockPriceProvider",
    };
  }

  async getHistoricalPrices(symbol: string, range: ChartRange): Promise<HistoricalPrice[]> {
    const stock = STOCKS.find((item) => item.koreanSymbol === symbol || item.id === symbol);
    const koreanSymbol = stock?.koreanSymbol ?? symbol;
    const base = baseKoreanPrices[koreanSymbol] ?? 50_000;
    const length = historyLength(range);
    const step = stepMs(range);
    const now = Date.now();
    return Array.from({ length }, (_, index) => ({
      timestamp: new Date(now - (length - index - 1) * step).toISOString(),
      price: Math.round(base * (1 + seededWave(`kr-history-${koreanSymbol}-${range}`, index, 0.04))),
      marketStatus: "regular" as MarketSessionStatus,
    }));
  }
}

export class MockDepositaryReceiptPriceProvider implements DepositaryReceiptPriceProvider {
  private readonly calendar = new MockMarketCalendarProvider();

  async getQuote(symbol: string, currency: ReceiptCurrency = "USD", exchange?: string): Promise<DepositaryReceiptQuote> {
    const stock = STOCKS.find((item) => item.receiptSymbol === symbol || item.id === symbol);
    const receiptSymbol = stock?.receiptSymbol ?? symbol;
    const koreanSymbol = stock?.koreanSymbol ?? symbol;
    const receiptRatio = stock?.receiptRatio ?? 1;
    const bucket = currentBucket();
    const baseKrw = baseKoreanPrices[koreanSymbol] ?? 50_000;
    const gap = (targetGaps[koreanSymbol] ?? 0)
      + (receiptGapOffsets[receiptSymbol] ?? 0)
      + seededWave(`gap-${receiptSymbol}`, bucket, 1.5);
    const fx = { USD: 1450, EUR: 1685, GBP: 1948 }[currency] + seededWave(`${currency.toLowerCase()}krw`, bucket, 7);
    const receiptPrice = Number(((baseKrw * (1 + gap / 100) * receiptRatio) / fx).toFixed(2));
    const previousClose = Number((receiptPrice * (1 - seededWave(`receipt-prev-${receiptSymbol}`, bucket, 0.015))).toFixed(2));
    const status = (await this.calendar.getMarketStatus(resolveOverseasMarketRegion(exchange ?? stock?.receiptExchange, currency))).overseas;
    const now = new Date();
    const isDelayed = receiptSymbol === "LPL" || receiptSymbol === "WF";

    if (receiptSymbol === "WF" && bucket % 7 === 0) {
      return {
        symbol: receiptSymbol,
        currency,
        price: null,
        previousClose,
        changeRate: null,
        quotedAt: null,
        updatedAt: now.toISOString(),
        marketStatus: "failed",
        isDelayed: false,
        provider: "MockDepositaryReceiptPriceProvider",
        error: "Mock DR 조회 실패",
      };
    }

    return {
      symbol: receiptSymbol,
      currency,
      price: receiptPrice,
      previousClose,
      changeRate: changeRate(receiptPrice, previousClose),
      quotedAt: new Date(now.getTime() - (isDelayed ? 40 * 60_000 : 30_000)).toISOString(),
      updatedAt: now.toISOString(),
      marketStatus: isDelayed ? "delayed" : status,
      isDelayed,
      provider: "MockDepositaryReceiptPriceProvider",
    };
  }

  async getHistoricalPrices(symbol: string, range: ChartRange, currency: ReceiptCurrency = "USD", _exchange?: string): Promise<HistoricalPrice[]> {
    void _exchange;
    const stock = STOCKS.find((item) => item.receiptSymbol === symbol || item.id === symbol);
    const koreanSymbol = stock?.koreanSymbol ?? symbol;
    const receiptRatio = stock?.receiptRatio ?? 1;
    const base = baseKoreanPrices[koreanSymbol] ?? 50_000;
    const length = historyLength(range);
    const step = stepMs(range);
    const now = Date.now();
    return Array.from({ length }, (_, index) => {
      const fx = { USD: 1450, EUR: 1685, GBP: 1948 }[currency] + seededWave(`${currency.toLowerCase()}krw-history-${range}`, index, 18);
      const gap = (targetGaps[koreanSymbol] ?? 0)
        + (receiptGapOffsets[symbol] ?? 0)
        + seededWave(`gap-history-${symbol}-${range}`, index, 2.8);
      const price = Number(((base * (1 + gap / 100) * receiptRatio) / fx).toFixed(2));
      return {
        timestamp: new Date(now - (length - index - 1) * step).toISOString(),
        price,
        receiptPrice: price,
        marketStatus: "regular" as MarketSessionStatus,
      };
    });
  }
}

/** @deprecated MockDepositaryReceiptPriceProvider를 사용하세요. */
export const MockAdrPriceProvider = MockDepositaryReceiptPriceProvider;
