import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "@/features/market-data/components/dashboard";
import { StockCard } from "@/features/market-data/components/stock-card";
import { MultiReceiptStockCard } from "@/features/market-data/components/multi-receipt-stock-card";
import { renderWithProviders } from "@/test/render-with-providers";
import type { MarketComparison, MarketDataResponse } from "@/features/market-data/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

const item: MarketComparison = {
  id: "sk-hynix",
  nameKo: "SK하이닉스",
  nameEn: "SK hynix",
  koreanSymbol: "000660",
  receiptType: "GDR",
  receiptSymbol: "HY9H",
  receiptStatus: "active",
  receiptCurrency: "EUR",
  receiptPrice: 40,
  receiptChangeRate: 2.1,
  currencyKrwRate: 1750,
  currencyKrwChange: 6,
  currencyKrwChangeRate: 0.4,
  receiptRatio: 1,
  convertedReceiptPriceKrw: 70000,
  adrSymbol: "SKHY",
  adrStatus: "active",
  koreanPrice: 65000,
  koreanChangeRate: 1.2,
  adrPriceUsd: 100,
  adrChangeRate: 2.1,
  usdKrwRate: 1400,
  usdKrwChange: 5,
  usdKrwChangeRate: 0.3,
  adrRatio: 2,
  convertedAdrPriceKrw: 70000,
  premiumDiscountRate: 7.69,
  level: "warning",
  direction: "premium",
  koreanMarketStatus: "regular",
  overseasMarketStatus: "closed",
  usMarketStatus: "closed",
  combinedMarketStatus: "korea_only",
  quotedAt: "2026-07-15T01:30:00.000Z",
  updatedAt: "2026-07-15T01:30:30.000Z",
  isDelayed: false,
  isActive: true,
  isFavorite: true,
  alertEnabled: true,
  provider: "test",
  warnings: [],
};

const response: MarketDataResponse = {
  summary: {
    totalTracked: 1,
    totalComparisons: 1,
    activeCount: 1,
    cautionCount: 1,
    warningCount: 1,
    dangerCount: 0,
    largestGapStock: item,
    usdKrwRate: 1400,
    usdKrwChange: 5,
    usdKrwChangeRate: 0.3,
    lastUpdatedAt: "2026-07-15T01:30:30.000Z",
    koreanMarketStatus: "regular",
    usMarketStatus: "closed",
    apiStatus: "connected",
    isMockMode: true,
  },
  items: [item],
};

describe("Dashboard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(response), { status: 200 })));
  });

  it("대시보드를 렌더링한다", async () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByLabelText("대시보드 로딩 중")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("시장 요약")).toBeInTheDocument());
    expect(screen.getByText("SK하이닉스")).toBeInTheDocument();
  });

  it("오류 상태를 렌더링한다", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { message: "실패" } }), { status: 500 })));
    renderWithProviders(<Dashboard />);
    await waitFor(() => expect(screen.getByText("시장 데이터 조회 실패")).toBeInTheDocument());
  });
});

describe("StockCard", () => {
  it("종목 카드 기본 정보를 렌더링한다", () => {
    renderWithProviders(<StockCard item={item} />);
    expect(screen.getByText("SK하이닉스")).toBeInTheDocument();
    expect(screen.getByText("GDR 환산가")).toBeInTheDocument();
    expect(screen.getByText("40.00 EUR (+2.10%)")).toBeInTheDocument();
    expect(screen.getByText("경고 · GDR 프리미엄")).toBeInTheDocument();
  });
});

describe("MultiReceiptStockCard", () => {
  it("한국 주가와 ADR·GDR 비교를 한 카드에 렌더링한다", () => {
    const adrItem = { ...item, id: "sk-hynix", receiptType: "ADR" as const, receiptSymbol: "SKHY", receiptRatio: 0.1 };
    const gdrItem = { ...item, id: "sk-hynix-gdr", receiptType: "GDR" as const, receiptSymbol: "HYXS", receiptRatio: 1 };

    renderWithProviders(<MultiReceiptStockCard group={{ koreanSymbol: "000660", nameKo: "SK하이닉스", nameEn: "SK hynix", items: [adrItem, gdrItem] }} />);

    expect(screen.getByText("한국주 + DR 2개 비교")).toBeInTheDocument();
    expect(screen.getByText("ADR SKHY")).toBeInTheDocument();
    expect(screen.getByText("GDR HYXS")).toBeInTheDocument();
    expect(screen.getAllByText("한국주 대비 괴리율")).toHaveLength(2);
  });
});
