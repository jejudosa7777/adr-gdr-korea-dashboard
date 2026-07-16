import type {
  DepositaryReceiptQuote,
  ChartRange,
  ExchangeRateQuote,
  HistoricalExchangeRate,
  HistoricalPrice,
  KoreanStockQuote,
  ReceiptCurrency,
} from "@/features/market-data/types";
import type { DepositaryReceiptPriceProvider, ExchangeRateProvider, KoreanStockPriceProvider } from "@/features/market-data/providers/interfaces";

function unavailable(provider: string): never {
  throw new Error(`${provider}는 아직 API별 매핑이 필요합니다. Mock 모드로 실행하거나 README의 Provider 교체 지점을 참고하세요.`);
}

export class RealKoreanStockPriceProvider implements KoreanStockPriceProvider {
  async getQuote(): Promise<KoreanStockQuote> {
    unavailable("RealKoreanStockPriceProvider");
  }

  async getHistoricalPrices(): Promise<HistoricalPrice[]> {
    unavailable("RealKoreanStockPriceProvider");
  }
}

export class RealDepositaryReceiptPriceProvider implements DepositaryReceiptPriceProvider {
  async getQuote(_symbol: string, _currency: ReceiptCurrency, _exchange?: string): Promise<DepositaryReceiptQuote> {
    void [_symbol, _currency, _exchange];
    unavailable("RealDepositaryReceiptPriceProvider");
  }

  async getHistoricalPrices(_symbol: string, _range: ChartRange, _currency: ReceiptCurrency, _exchange?: string): Promise<HistoricalPrice[]> {
    void [_symbol, _range, _currency, _exchange];
    unavailable("RealDepositaryReceiptPriceProvider");
  }
}

/** @deprecated RealDepositaryReceiptPriceProvider를 사용하세요. */
export const RealAdrPriceProvider = RealDepositaryReceiptPriceProvider;

export class RealExchangeRateProvider implements ExchangeRateProvider {
  async getKrwRate(currency: ReceiptCurrency): Promise<ExchangeRateQuote> {
    const url = process.env.EXCHANGE_RATE_API_KEY
      ? `https://api.exchangerate.host/live?access_key=${encodeURIComponent(process.env.EXCHANGE_RATE_API_KEY)}&currencies=KRW&source=${currency}`
      : `https://api.exchangerate.host/convert?from=${currency}&to=KRW`;

    const response = await fetch(url, { next: { revalidate: 30 } });
    if (!response.ok) {
      throw new Error(`환율 API 호출 실패: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const quoteKey = `${currency}KRW`;
    const rateFromQuotes = typeof payload.quotes === "object" && payload.quotes && quoteKey in payload.quotes
      ? Number((payload.quotes as Record<string, unknown>)[quoteKey])
      : null;
    const rateFromResult = typeof payload.result === "number" ? payload.result : null;
    const rate = rateFromQuotes ?? rateFromResult;
    if (!rate || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(`환율 API 응답에서 유효한 ${currency}/KRW 환율을 찾지 못했습니다.`);
    }

    const now = new Date().toISOString();
    return {
      pair: `${currency}/KRW`,
      baseCurrency: currency,
      rate,
      previousRate: null,
      change: null,
      changeRate: null,
      quotedAt: now,
      updatedAt: now,
      provider: "RealExchangeRateProvider",
      isDelayed: false,
    };
  }

  async getUsdKrwRate() {
    return this.getKrwRate("USD");
  }

  async getHistoricalKrwRates(): Promise<HistoricalExchangeRate[]> {
    unavailable("RealExchangeRateProvider.getHistoricalKrwRates");
  }

  async getHistoricalUsdKrwRates(): Promise<HistoricalExchangeRate[]> {
    return this.getHistoricalKrwRates();
  }
}
