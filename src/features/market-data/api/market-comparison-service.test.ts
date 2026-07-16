import { describe, expect, it } from "vitest";
import { STOCKS } from "@/config/stocks";
import { getMarketComparisonForStock, getMarketData, summarizeHistory } from "@/features/market-data/api/market-comparison-service";
import type { HistoricalComparisonPoint } from "@/features/market-data/types";

describe("getMarketComparisonForStock", () => {
  it("GDR의 거래 통화 환율로 원화 환산가를 계산한다", async () => {
    const comparison = await getMarketComparisonForStock({
      ...STOCKS[0],
      receiptType: "GDR",
      receiptSymbol: "GDRTEST",
      receiptCurrency: "EUR",
      receiptExchange: "LSE",
      dataProviderSymbols: {
        ...STOCKS[0].dataProviderSymbols,
        receipt: { custom: "GDRTEST" },
      },
    });

    expect(comparison.receiptType).toBe("GDR");
    expect(comparison.receiptCurrency).toBe("EUR");
    expect(comparison.receiptPrice).toBeGreaterThan(0);
    expect(comparison.currencyKrwRate).toBeGreaterThan(0);
    expect(comparison.convertedReceiptPriceKrw).toBeGreaterThan(0);
    expect(comparison.adrPriceUsd).toBeNull();
    expect(comparison.usdKrwRate).toBeNull();
  });
});

describe("summarizeHistory", () => {
  it("짝수 개 괴리율의 중앙 두 값을 평균해 중앙값을 계산한다", () => {
    const point = (premiumDiscountRate: number): HistoricalComparisonPoint => ({
      timestamp: "2026-07-16T00:00:00.000Z",
      koreanPriceKrw: 100,
      receiptPrice: 1,
      receiptCurrency: "USD",
      currencyKrwRate: 1_000,
      convertedReceiptPriceKrw: 100,
      adrPriceUsd: 1,
      usdKrwRate: 1_000,
      convertedAdrPriceKrw: 100,
      premiumDiscountRate,
      koreanMarketStatus: "regular",
      overseasMarketStatus: "closed",
      usMarketStatus: "closed",
    });

    expect(summarizeHistory([point(1), point(3), point(7), point(9)]).median).toBe(5);
  });
});

describe("getMarketData", () => {
  it("한국 종목 수와 ADR·GDR 비교 수를 구분한다", async () => {
    const skHynixListings = STOCKS.filter((stock) => stock.koreanSymbol === "000660");
    const data = await getMarketData(skHynixListings);

    expect(data.summary.totalTracked).toBe(1);
    expect(data.summary.totalComparisons).toBe(2);
  });
});
