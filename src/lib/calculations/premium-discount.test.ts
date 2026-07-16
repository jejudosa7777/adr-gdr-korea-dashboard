import { describe, expect, it } from "vitest";
import {
  calculateConvertedAdrPrice,
  calculateConvertedDepositaryReceiptPrice,
  calculatePremiumDiscountRate,
  getPremiumDiscountLevel,
  isAlertCooldownActive,
  shouldTriggerAlert,
} from "@/lib/calculations/premium-discount";

describe("premium-discount calculations", () => {
  it("ADR 환산가를 계산한다", () => {
    expect(calculateConvertedAdrPrice({ adrPriceUsd: 100, usdKrwRate: 1400, adrRatio: 2 }).value).toBe(70000);
  });

  it("통화와 DR 유형에 관계없이 예탁증서 환산가를 계산한다", () => {
    expect(
      calculateConvertedDepositaryReceiptPrice({
        receiptPrice: 80,
        currencyKrwRate: 1750,
        receiptRatio: 2,
      }).value,
    ).toBe(70000);
  });

  it("잘못된 예탁증서 가격과 통화 환율을 방어한다", () => {
    expect(calculateConvertedDepositaryReceiptPrice({ receiptPrice: 0, currencyKrwRate: 1750, receiptRatio: 1 }).value).toBeNull();
    expect(calculateConvertedDepositaryReceiptPrice({ receiptPrice: 80, currencyKrwRate: null, receiptRatio: 1 }).value).toBeNull();
  });

  it("괴리율을 계산한다", () => {
    const result = calculatePremiumDiscountRate({ convertedAdrPriceKrw: 70000, koreanPriceKrw: 65000 });
    expect(result.value).toBeCloseTo(7.6923, 4);
  });

  it("양수 괴리율은 프리미엄 값을 만든다", () => {
    expect(calculatePremiumDiscountRate({ convertedAdrPriceKrw: 110, koreanPriceKrw: 100 }).value).toBe(10);
  });

  it("음수 괴리율은 디스카운트 값을 만든다", () => {
    expect(calculatePremiumDiscountRate({ convertedAdrPriceKrw: 90, koreanPriceKrw: 100 }).value).toBe(-10);
  });

  it("0% 괴리율을 계산한다", () => {
    expect(calculatePremiumDiscountRate({ convertedAdrPriceKrw: 100, koreanPriceKrw: 100 }).value).toBe(0);
  });

  it("3%, 5%, 10% 경계값을 단계로 분류한다", () => {
    expect(getPremiumDiscountLevel(2.99)).toBe("neutral");
    expect(getPremiumDiscountLevel(3)).toBe("caution");
    expect(getPremiumDiscountLevel(5)).toBe("warning");
    expect(getPremiumDiscountLevel(10)).toBe("danger");
    expect(getPremiumDiscountLevel(-10)).toBe("danger");
  });

  it("잘못된 ADR 비율과 환율을 방어한다", () => {
    expect(calculateConvertedAdrPrice({ adrPriceUsd: 100, usdKrwRate: 1400, adrRatio: 0 }).value).toBeNull();
    expect(calculateConvertedAdrPrice({ adrPriceUsd: 100, usdKrwRate: -1, adrRatio: 1 }).value).toBeNull();
  });

  it("한국 주가가 0이면 괴리율을 계산하지 않는다", () => {
    expect(calculatePremiumDiscountRate({ convertedAdrPriceKrw: 100, koreanPriceKrw: 0 }).value).toBeNull();
  });

  it("오래된 데이터와 시점 차이를 경고한다", () => {
    const result = calculateConvertedAdrPrice({
      adrPriceUsd: 100,
      usdKrwRate: 1400,
      adrRatio: 1,
      options: {
        now: new Date("2026-07-15T10:30:00.000Z"),
        staleAfterMs: 60_000,
        maxTimestampSkewMs: 60_000,
        adrQuotedAt: "2026-07-15T10:00:00.000Z",
        koreanQuotedAt: "2026-07-15T10:29:30.000Z",
        exchangeRateQuotedAt: "2026-07-15T10:29:30.000Z",
      },
    });
    expect(result.warnings).toContain("오래된 데이터로 계산됨");
    expect(result.warnings).toContain("서로 다른 시점의 가격 데이터로 계산됨");
  });

  it("쿨다운 활성 상태를 판정한다", () => {
    expect(
      isAlertCooldownActive({
        lastAlertAt: "2026-07-15T10:00:00.000Z",
        cooldownMs: 30 * 60_000,
        now: new Date("2026-07-15T10:10:00.000Z"),
      }),
    ).toBe(true);
  });

  it("알림 단계 상승을 새 알림으로 허용한다", () => {
    const decision = shouldTriggerAlert({
      rate: 6,
      previousAlert: { stockId: "a", level: "caution", direction: "premium", rate: 3.5, sentAt: "2026-07-15T10:00:00.000Z" },
      now: new Date("2026-07-15T10:01:00.000Z"),
    });
    expect(decision.shouldSend).toBe(true);
    expect(decision.reason).toBe("level_escalated");
  });

  it("프리미엄과 디스카운트 방향 전환을 새 알림으로 허용한다", () => {
    const decision = shouldTriggerAlert({
      rate: -4,
      previousAlert: { stockId: "a", level: "caution", direction: "premium", rate: 4, sentAt: "2026-07-15T10:00:00.000Z" },
      now: new Date("2026-07-15T10:01:00.000Z"),
    });
    expect(decision.shouldSend).toBe(true);
    expect(decision.reason).toBe("direction_changed");
  });
});
