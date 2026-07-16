import { describe, expect, it } from "vitest";
import { groupMarketComparisons } from "@/features/market-data/components/market-comparison-groups";
import type { MarketComparison } from "@/features/market-data/types";

function comparison(id: string, receiptType: "ADR" | "GDR"): MarketComparison {
  return {
    id,
    nameKo: "SK하이닉스",
    nameEn: "SK hynix",
    koreanSymbol: "000660",
    receiptType,
    receiptSymbol: receiptType === "ADR" ? "SKHY" : "HYXS",
    receiptStatus: "active",
    receiptCurrency: "USD",
    receiptPrice: 100,
    receiptChangeRate: 1,
    currencyKrwRate: 1_400,
    currencyKrwChange: 0,
    currencyKrwChangeRate: 0,
    receiptRatio: 1,
    convertedReceiptPriceKrw: 140_000,
    adrSymbol: receiptType === "ADR" ? "SKHY" : "HYXS",
    adrStatus: "active",
    koreanPrice: 130_000,
    koreanChangeRate: 1,
    adrPriceUsd: 100,
    adrChangeRate: 1,
    usdKrwRate: 1_400,
    usdKrwChange: 0,
    usdKrwChangeRate: 0,
    adrRatio: 1,
    convertedAdrPriceKrw: 140_000,
    premiumDiscountRate: 7.69,
    level: "warning",
    direction: "premium",
    koreanMarketStatus: "regular",
    overseasMarketStatus: "regular",
    usMarketStatus: "regular",
    combinedMarketStatus: "both_regular",
    quotedAt: "2026-07-17T00:00:00.000Z",
    updatedAt: "2026-07-17T00:00:00.000Z",
    isDelayed: false,
    isActive: true,
    isFavorite: true,
    alertEnabled: true,
    provider: "test",
    warnings: [],
  };
}

describe("groupMarketComparisons", () => {
  it("같은 한국 종목의 ADR과 GDR을 하나의 비교 그룹으로 묶는다", () => {
    const groups = groupMarketComparisons([comparison("sk-hynix", "ADR"), comparison("sk-hynix-gdr", "GDR")]);

    expect(groups).toHaveLength(1);
    expect(groups[0].koreanSymbol).toBe("000660");
    expect(groups[0].items.map((item) => item.receiptType)).toEqual(["ADR", "GDR"]);
  });
});
