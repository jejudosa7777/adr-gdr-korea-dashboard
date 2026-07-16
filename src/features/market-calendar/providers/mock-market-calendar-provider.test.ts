import { describe, expect, it } from "vitest";
import { resolveOverseasMarketRegion } from "@/features/market-calendar/market-region";
import { MockMarketCalendarProvider } from "@/features/market-calendar/providers/mock-market-calendar-provider";

describe("MockMarketCalendarProvider", () => {
  it("거래소 코드로 해외 시장 지역을 구분한다", () => {
    expect(resolveOverseasMarketRegion("NASDAQ", "USD")).toBe("US");
    expect(resolveOverseasMarketRegion("LSE", "USD")).toBe("UK");
    expect(resolveOverseasMarketRegion("Frankfurt", "EUR")).toBe("EU");
  });

  it("영국 시장 시간을 Europe/London 시간대로 판정한다", async () => {
    const provider = new MockMarketCalendarProvider(() => new Date("2026-07-16T08:00:00.000Z"));
    const status = await provider.getMarketStatus("UK");

    expect(status.overseasRegion).toBe("UK");
    expect(status.overseas).toBe("regular");
  });
});
