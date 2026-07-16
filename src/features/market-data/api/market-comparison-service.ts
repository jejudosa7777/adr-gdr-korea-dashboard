import { STOCKS, getStockByIdOrSymbol } from "@/config/stocks";
import type {
  ChartRange,
  HistoricalComparisonPoint,
  HistoricalComparisonResponse,
  MarketComparison,
  MarketDataResponse,
  MarketSessionStatus,
  StockConfig,
} from "@/features/market-data/types";
import { createProviders } from "@/lib/providers/provider-factory";
import {
  calculateConvertedDepositaryReceiptPrice,
  calculatePremiumDiscountRate,
  getPremiumDiscountDirection,
  getPremiumDiscountLevel,
} from "@/lib/calculations/premium-discount";
import { resolveOverseasMarketRegion } from "@/features/market-calendar/market-region";

function mostRecent(...values: Array<string | null | undefined>) {
  const times = values.filter(Boolean).map((value) => new Date(value as string).getTime()).filter(Number.isFinite);
  if (!times.length) return null;
  return new Date(Math.max(...times)).toISOString();
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : "알 수 없는 오류";
}

function isTrading(status: MarketSessionStatus) {
  return status === "regular" || status === "pre_market" || status === "after_market";
}

export async function getMarketComparisonForStock(stock: StockConfig): Promise<MarketComparison> {
  const providers = createProviders();
  const now = new Date().toISOString();

  try {
    const [koreanQuote, receiptQuote, exchangeRate, marketStatus] = await Promise.all([
      providers.koreanStockProvider.getQuote(stock.koreanSymbol),
      providers.receiptProvider.getQuote(stock.receiptSymbol, stock.receiptCurrency, stock.receiptExchange),
      providers.exchangeRateProvider.getKrwRate(stock.receiptCurrency),
      providers.marketCalendarProvider.getMarketStatus(resolveOverseasMarketRegion(stock.receiptExchange, stock.receiptCurrency)),
    ]);

    const converted = calculateConvertedDepositaryReceiptPrice({
      receiptPrice: receiptQuote.price,
      currencyKrwRate: exchangeRate.rate,
      receiptRatio: stock.receiptRatio,
      options: {
        koreanQuotedAt: koreanQuote.quotedAt,
        adrQuotedAt: receiptQuote.quotedAt,
        exchangeRateQuotedAt: exchangeRate.quotedAt,
      },
    });
    const premiumDiscount = calculatePremiumDiscountRate({
      convertedReceiptPriceKrw: converted.value,
      koreanPriceKrw: koreanQuote.priceKrw,
      options: {
        koreanQuotedAt: koreanQuote.quotedAt,
        adrQuotedAt: receiptQuote.quotedAt,
        exchangeRateQuotedAt: exchangeRate.quotedAt,
      },
    });
    const warnings = [...new Set([...converted.warnings, ...premiumDiscount.warnings])];
    if (exchangeRate.usedFallback) warnings.push("환율 API 실패로 마지막 정상 환율을 사용 중입니다.");
    if (stock.receiptStatus !== "active") warnings.push(`${stock.receiptType} 상태: ${stock.receiptStatus}`);

    const error = [koreanQuote.error, receiptQuote.error, exchangeRate.error].filter(Boolean).join(" / ") || undefined;
    const koreanMarketStatus = koreanQuote.marketStatus;
    const usMarketStatus = receiptQuote.marketStatus;

    return {
      id: stock.id,
      nameKo: stock.nameKo,
      nameEn: stock.nameEn,
      koreanSymbol: stock.koreanSymbol,
      receiptType: stock.receiptType,
      receiptSymbol: stock.receiptSymbol,
      receiptStatus: stock.receiptStatus,
      receiptCurrency: stock.receiptCurrency,
      receiptPrice: receiptQuote.price,
      receiptChangeRate: receiptQuote.changeRate,
      currencyKrwRate: exchangeRate.rate,
      currencyKrwChange: exchangeRate.change,
      currencyKrwChangeRate: exchangeRate.changeRate,
      receiptRatio: stock.receiptRatio,
      convertedReceiptPriceKrw: converted.value,
      adrSymbol: stock.receiptSymbol,
      adrStatus: stock.receiptStatus,
      koreanPrice: koreanQuote.priceKrw,
      koreanChangeRate: koreanQuote.changeRate,
      adrPriceUsd: stock.receiptCurrency === "USD" ? receiptQuote.price : null,
      adrChangeRate: receiptQuote.changeRate,
      usdKrwRate: stock.receiptCurrency === "USD" ? exchangeRate.rate : null,
      usdKrwChange: stock.receiptCurrency === "USD" ? exchangeRate.change : null,
      usdKrwChangeRate: stock.receiptCurrency === "USD" ? exchangeRate.changeRate : null,
      adrRatio: stock.receiptRatio,
      convertedAdrPriceKrw: converted.value,
      premiumDiscountRate: premiumDiscount.value,
      level: getPremiumDiscountLevel(premiumDiscount.value),
      direction: getPremiumDiscountDirection(premiumDiscount.value),
      koreanMarketStatus,
      overseasMarketStatus: usMarketStatus,
      usMarketStatus,
      combinedMarketStatus: marketStatus.combined,
      quotedAt: mostRecent(koreanQuote.quotedAt, receiptQuote.quotedAt, exchangeRate.quotedAt),
      updatedAt: now,
      isDelayed: koreanQuote.isDelayed || receiptQuote.isDelayed || exchangeRate.isDelayed,
      isActive: stock.isActive,
      isFavorite: stock.isFavorite,
      alertEnabled: true,
      provider: `${koreanQuote.provider} / ${receiptQuote.provider} / ${exchangeRate.provider}`,
      warnings,
      error,
      note: stock.note,
    };
  } catch (error) {
    return {
      id: stock.id,
      nameKo: stock.nameKo,
      nameEn: stock.nameEn,
      koreanSymbol: stock.koreanSymbol,
      receiptType: stock.receiptType,
      receiptSymbol: stock.receiptSymbol,
      receiptStatus: stock.receiptStatus,
      receiptCurrency: stock.receiptCurrency,
      receiptPrice: null,
      receiptChangeRate: null,
      currencyKrwRate: null,
      currencyKrwChange: null,
      currencyKrwChangeRate: null,
      receiptRatio: stock.receiptRatio,
      convertedReceiptPriceKrw: null,
      adrSymbol: stock.receiptSymbol,
      adrStatus: stock.receiptStatus,
      koreanPrice: null,
      koreanChangeRate: null,
      adrPriceUsd: null,
      adrChangeRate: null,
      usdKrwRate: null,
      usdKrwChange: null,
      usdKrwChangeRate: null,
      adrRatio: stock.receiptRatio,
      convertedAdrPriceKrw: null,
      premiumDiscountRate: null,
      level: "neutral",
      direction: "neutral",
      koreanMarketStatus: "failed",
      overseasMarketStatus: "failed",
      usMarketStatus: "failed",
      combinedMarketStatus: "failed",
      quotedAt: null,
      updatedAt: now,
      isDelayed: false,
      isActive: stock.isActive,
      isFavorite: stock.isFavorite,
      alertEnabled: true,
      provider: "ProviderFactory",
      warnings: [],
      error: normalizeError(error),
      note: stock.note,
    };
  }
}

export async function getMarketData(stocks: StockConfig[] = STOCKS): Promise<MarketDataResponse> {
  const providers = createProviders();
  const items = await Promise.all(stocks.map(getMarketComparisonForStock));
  const activeItems = items.filter((item) => item.isActive);
  const largestGapStock = activeItems
    .filter((item) => typeof item.premiumDiscountRate === "number")
    .sort((a, b) => Math.abs(b.premiumDiscountRate ?? 0) - Math.abs(a.premiumDiscountRate ?? 0))[0] ?? null;
  const firstRate = items.find((item) => item.usdKrwRate !== null);
  const marketStatus = await providers.marketCalendarProvider.getMarketStatus();
  const apiStatus = items.every((item) => item.error) ? "failed" : items.some((item) => item.error) ? "degraded" : "connected";
  const trackedSymbols = new Set(items.map((item) => item.koreanSymbol));
  const activeSymbols = new Set(activeItems.map((item) => item.koreanSymbol));

  return {
    summary: {
      totalTracked: trackedSymbols.size,
      totalComparisons: items.length,
      activeCount: activeSymbols.size,
      cautionCount: activeItems.filter((item) => Math.abs(item.premiumDiscountRate ?? 0) >= 3).length,
      warningCount: activeItems.filter((item) => Math.abs(item.premiumDiscountRate ?? 0) >= 5).length,
      dangerCount: activeItems.filter((item) => Math.abs(item.premiumDiscountRate ?? 0) >= 10).length,
      largestGapStock,
      usdKrwRate: firstRate?.usdKrwRate ?? null,
      usdKrwChange: firstRate?.usdKrwChange ?? null,
      usdKrwChangeRate: firstRate?.usdKrwChangeRate ?? null,
      lastUpdatedAt: new Date().toISOString(),
      koreanMarketStatus: marketStatus.korean,
      usMarketStatus: marketStatus.overseas,
      apiStatus,
      isMockMode: providers.isMock,
    },
    items,
  };
}

export async function getMarketDataForSymbol(symbol: string) {
  const stock = getStockByIdOrSymbol(symbol);
  if (!stock) return null;
  return getMarketComparisonForStock(stock);
}

export async function getHistoricalComparison(symbol: string, range: ChartRange): Promise<HistoricalComparisonResponse | null> {
  const stock = getStockByIdOrSymbol(symbol);
  if (!stock) return null;
  return getHistoricalComparisonForStock(stock, range);
}

export async function getHistoricalComparisonForStock(stock: StockConfig, range: ChartRange): Promise<HistoricalComparisonResponse> {
  const providers = createProviders();
  const [koreanPrices, receiptPrices, fxRates] = await Promise.all([
    providers.koreanStockProvider.getHistoricalPrices(stock.koreanSymbol, range),
    providers.receiptProvider.getHistoricalPrices(stock.receiptSymbol, range, stock.receiptCurrency, stock.receiptExchange),
    providers.exchangeRateProvider.getHistoricalKrwRates(range, stock.receiptCurrency),
  ]);

  const points: HistoricalComparisonPoint[] = koreanPrices.map((korean, index) => {
    const receipt = receiptPrices[index];
    const fx = fxRates[index];
    const converted = calculateConvertedDepositaryReceiptPrice({
      receiptPrice: receipt?.price ?? null,
      currencyKrwRate: fx?.rate ?? null,
      receiptRatio: stock.receiptRatio,
    });
    const premiumDiscount = calculatePremiumDiscountRate({
      convertedReceiptPriceKrw: converted.value,
      koreanPriceKrw: korean.price,
    });

    return {
      timestamp: korean.timestamp,
      receiptPrice: receipt?.price ?? null,
      receiptCurrency: stock.receiptCurrency,
      currencyKrwRate: fx?.rate ?? null,
      convertedReceiptPriceKrw: converted.value,
      koreanPriceKrw: korean.price,
      adrPriceUsd: stock.receiptCurrency === "USD" ? receipt?.price ?? null : null,
      usdKrwRate: stock.receiptCurrency === "USD" ? fx?.rate ?? null : null,
      convertedAdrPriceKrw: converted.value,
      premiumDiscountRate: premiumDiscount.value,
      koreanMarketStatus: korean.marketStatus,
      overseasMarketStatus: receipt?.marketStatus ?? "closed",
      usMarketStatus: receipt?.marketStatus ?? "closed",
    };
  });

  return { stock, range, points };
}

export function summarizeHistory(points: HistoricalComparisonPoint[]) {
  const rates = points.map((point) => point.premiumDiscountRate).filter((rate): rate is number => typeof rate === "number" && Number.isFinite(rate));
  const sorted = [...rates].sort((a, b) => a - b);
  const average = rates.length ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : null;
  const middle = Math.floor(sorted.length / 2);
  const median = !sorted.length
    ? null
    : sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
  const stdDev =
    average === null || !rates.length
      ? null
      : Math.sqrt(rates.reduce((sum, rate) => sum + (rate - average) ** 2, 0) / rates.length);

  return {
    max: rates.length ? Math.max(...rates) : null,
    min: rates.length ? Math.min(...rates) : null,
    average,
    median,
    stdDev,
    premiumRatio: rates.length ? (rates.filter((rate) => rate > 0).length / rates.length) * 100 : null,
    discountRatio: rates.length ? (rates.filter((rate) => rate < 0).length / rates.length) * 100 : null,
    cautionCrossCount: rates.filter((rate) => Math.abs(rate) >= 3).length,
    warningCrossCount: rates.filter((rate) => Math.abs(rate) >= 5).length,
    dangerCrossCount: rates.filter((rate) => Math.abs(rate) >= 10).length,
    tradingPointCount: points.filter((point) => isTrading(point.koreanMarketStatus) || isTrading(point.usMarketStatus)).length,
  };
}
