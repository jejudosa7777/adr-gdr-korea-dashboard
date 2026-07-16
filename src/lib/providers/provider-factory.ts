import { getServerEnv } from "@/config/env";
import { MockDepositaryReceiptPriceProvider, MockExchangeRateProvider, MockKoreanStockPriceProvider } from "@/features/market-data/providers/mock-market-data";
import { RealDepositaryReceiptPriceProvider, RealExchangeRateProvider, RealKoreanStockPriceProvider } from "@/features/market-data/providers/real-providers";
import { MockMarketCalendarProvider } from "@/features/market-calendar/providers/mock-market-calendar-provider";

export function createProviders() {
  const env = getServerEnv();
  const isMock = env.NEXT_PUBLIC_DATA_MODE !== "real";

  return {
    isMock,
    koreanStockProvider: isMock ? new MockKoreanStockPriceProvider() : new RealKoreanStockPriceProvider(),
    receiptProvider: isMock ? new MockDepositaryReceiptPriceProvider() : new RealDepositaryReceiptPriceProvider(),
    exchangeRateProvider: isMock ? new MockExchangeRateProvider() : new RealExchangeRateProvider(),
    marketCalendarProvider: new MockMarketCalendarProvider(),
  };
}
