import { describe, expect, it } from "vitest";
import { MockDepositaryReceiptPriceProvider, MockExchangeRateProvider, MockKoreanStockPriceProvider } from "@/features/market-data/providers/mock-market-data";

describe("Mock providers", () => {
  it("한국 주식 Mock 견적을 반환한다", async () => {
    const quote = await new MockKoreanStockPriceProvider().getQuote("000660");
    expect(quote.symbol).toBe("000660");
    expect(quote.provider).toBe("MockKoreanStockPriceProvider");
  });

  it("GDR Mock 견적을 선택 통화로 반환한다", async () => {
    const quote = await new MockDepositaryReceiptPriceProvider().getQuote("SKHY", "EUR");
    expect(quote.symbol).toBe("SKHY");
    expect(quote.currency).toBe("EUR");
    expect(quote.provider).toBe("MockDepositaryReceiptPriceProvider");
  });

  it("같은 한국 종목의 ADR과 GDR 가격을 티커별로 독립 변동시킨다", async () => {
    const provider = new MockDepositaryReceiptPriceProvider();
    const [adr, gdr] = await Promise.all([
      provider.getQuote("SKHY", "USD", "NASDAQ"),
      provider.getQuote("HYXS", "USD", "LUX"),
    ]);

    expect((adr.price ?? 0) / 0.1).not.toBe((gdr.price ?? 0) / 1);
  });

  it("환율 Mock 데이터를 반환한다", async () => {
    const quote = await new MockExchangeRateProvider().getUsdKrwRate();
    expect(quote.pair).toBe("USD/KRW");
    expect(quote.rate).toBeGreaterThan(0);
  });

  it("EUR/KRW Mock 환율을 반환한다", async () => {
    const quote = await new MockExchangeRateProvider().getKrwRate("EUR");
    expect(quote.pair).toBe("EUR/KRW");
    expect(quote.baseCurrency).toBe("EUR");
  });
});
