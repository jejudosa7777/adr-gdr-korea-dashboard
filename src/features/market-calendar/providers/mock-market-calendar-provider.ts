import type { MarketCalendarProvider, MarketRegion, MarketStatus } from "@/features/market-calendar/types";
import type { CombinedMarketStatus, MarketSessionStatus } from "@/features/market-data/types";
import { isWeekday, minutesSinceMidnight } from "@/lib/date/timezone";

const KOREA_TZ = "Asia/Seoul";
const US_TZ = "America/New_York";
const UK_TZ = "Europe/London";
const EU_TZ = "Europe/Berlin";

const MARKET_TIMEZONES: Record<MarketRegion, string> = {
  KR: KOREA_TZ,
  US: US_TZ,
  UK: UK_TZ,
  EU: EU_TZ,
};

function getKoreaStatus(now: Date): MarketSessionStatus {
  if (!isWeekday(now, KOREA_TZ)) return "holiday";
  const minutes = minutesSinceMidnight(now, KOREA_TZ);
  if (minutes < 9 * 60) return "pre_open";
  if (minutes <= 15 * 60 + 30) return "regular";
  return "post_close";
}

function getUsStatus(now: Date): MarketSessionStatus {
  if (!isWeekday(now, US_TZ)) return "holiday";
  const minutes = minutesSinceMidnight(now, US_TZ);
  if (minutes >= 4 * 60 && minutes < 9 * 60 + 30) return "pre_market";
  if (minutes >= 9 * 60 + 30 && minutes <= 16 * 60) return "regular";
  if (minutes > 16 * 60 && minutes <= 20 * 60) return "after_market";
  return "closed";
}

function getEuropeanStatus(now: Date, market: "UK" | "EU"): MarketSessionStatus {
  const timezone = MARKET_TIMEZONES[market];
  if (!isWeekday(now, timezone)) return "holiday";
  const minutes = minutesSinceMidnight(now, timezone);
  const regularOpen = market === "UK" ? 8 * 60 : 9 * 60;
  const regularClose = market === "UK" ? 16 * 60 + 30 : 17 * 60 + 30;
  if (minutes >= regularOpen - 60 && minutes < regularOpen) return "pre_market";
  if (minutes >= regularOpen && minutes <= regularClose) return "regular";
  if (minutes > regularClose && minutes <= 20 * 60) return "after_market";
  return "closed";
}

function getRegionalStatus(now: Date, market: MarketRegion): MarketSessionStatus {
  if (market === "KR") return getKoreaStatus(now);
  if (market === "US") return getUsStatus(now);
  return getEuropeanStatus(now, market);
}

function combine(korean: MarketSessionStatus, us: MarketSessionStatus): CombinedMarketStatus {
  if (korean === "failed" || us === "failed") return "failed";
  if (korean === "delayed" || us === "delayed") return "delayed";
  if (korean === "holiday" && us === "holiday") return "holiday";
  if (korean === "regular" && us === "regular") return "both_regular";
  if (korean === "regular") return "korea_only";
  if (us === "regular" || us === "pre_market" || us === "after_market") return "us_only";
  if (["closed", "post_close", "holiday"].includes(korean) && ["closed", "holiday"].includes(us)) return "both_closed";
  return "mixed";
}

export class MockMarketCalendarProvider implements MarketCalendarProvider {
  constructor(private readonly nowFactory: () => Date = () => new Date()) {}

  async getMarketStatus(overseasRegion: "US" | "UK" | "EU" = "US"): Promise<MarketStatus> {
    const now = this.nowFactory();
    const korean = getKoreaStatus(now);
    const overseas = getRegionalStatus(now, overseasRegion);
    const nextOverseasOpen = (await this.getNextMarketOpen(overseasRegion, now)).toISOString();
    return {
      korean,
      overseas,
      overseasRegion,
      us: overseas,
      combined: combine(korean, overseas),
      checkedAt: now.toISOString(),
      nextKoreaOpen: (await this.getNextMarketOpen("KR", now)).toISOString(),
      nextOverseasOpen,
      nextUsOpen: nextOverseasOpen,
    };
  }

  async isTradingDay(market: MarketRegion = "KR", date = this.nowFactory()) {
    return isWeekday(date, MARKET_TIMEZONES[market]);
  }

  async getNextMarketOpen(market: MarketRegion = "KR", date = this.nowFactory()) {
    const cursor = new Date(date.getTime());
    let previous = getRegionalStatus(cursor, market);
    for (let index = 0; index < 8 * 24 * 4; index += 1) {
      cursor.setTime(cursor.getTime() + 15 * 60_000);
      const current = getRegionalStatus(cursor, market);
      if (current === "regular" && previous !== "regular") return cursor;
      previous = current;
    }
    throw new Error(`${market} 시장의 다음 개장 시간을 계산하지 못했습니다.`);
  }
}
