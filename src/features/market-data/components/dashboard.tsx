"use client";

import * as React from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardControls } from "@/features/market-data/components/dashboard-controls";
import { MarketSummaryPanel } from "@/features/market-data/components/market-summary";
import { StockCard } from "@/features/market-data/components/stock-card";
import { StockTable } from "@/features/market-data/components/stock-table";
import { groupMarketComparisons } from "@/features/market-data/components/market-comparison-groups";
import { MultiReceiptStockCard } from "@/features/market-data/components/multi-receipt-stock-card";
import { useMarketData } from "@/features/market-data/hooks/use-market-data";
import { useLocalizedMarketItems } from "@/features/market-data/hooks/use-localized-market-data";
import { useAppSettings } from "@/features/settings/components/settings-provider";
import { useAlertMonitor } from "@/features/alerts/hooks/use-alert-monitor";
import type { MarketComparison } from "@/features/market-data/types";
import type { CardFilter, SortKey } from "@/features/settings/types";

function matchesFilter(item: MarketComparison, filter: CardFilter) {
  if (filter === "all") return true;
  if (filter === "normal") return item.level === "neutral";
  if (filter === "caution") return Math.abs(item.premiumDiscountRate ?? 0) >= 3;
  if (filter === "warning") return Math.abs(item.premiumDiscountRate ?? 0) >= 5;
  if (filter === "danger") return Math.abs(item.premiumDiscountRate ?? 0) >= 10;
  if (filter === "premium") return item.direction === "premium";
  if (filter === "discount") return item.direction === "discount";
  if (filter === "dataError") return Boolean(item.error);
  if (filter === "trading") return item.koreanMarketStatus === "regular" || item.overseasMarketStatus === "regular";
  if (filter === "closed") return item.koreanMarketStatus !== "regular" && item.overseasMarketStatus !== "regular";
  if (filter === "favorite") return item.isFavorite;
  return true;
}

function sortItems(items: MarketComparison[], sortKey: SortKey) {
  return [...items].sort((a, b) => {
    if (sortKey === "absoluteGapDesc") return Math.abs(b.premiumDiscountRate ?? 0) - Math.abs(a.premiumDiscountRate ?? 0);
    if (sortKey === "gapDesc") return (b.premiumDiscountRate ?? -Infinity) - (a.premiumDiscountRate ?? -Infinity);
    if (sortKey === "gapAsc") return (a.premiumDiscountRate ?? Infinity) - (b.premiumDiscountRate ?? Infinity);
    if (sortKey === "nameAsc") return a.nameKo.localeCompare(b.nameKo, "ko-KR");
    if (sortKey === "koreanChangeDesc") return (b.koreanChangeRate ?? -Infinity) - (a.koreanChangeRate ?? -Infinity);
    if (sortKey === "adrChangeDesc") return (b.receiptChangeRate ?? -Infinity) - (a.receiptChangeRate ?? -Infinity);
    return a.id.localeCompare(b.id);
  });
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="대시보드 로딩 중">
      <Skeleton className="h-48" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-80" />
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { settings, updateSettings } = useAppSettings();
  const [search, setSearch] = React.useState("");
  const marketData = useMarketData();
  const localizedItems = useLocalizedMarketItems(marketData.data?.items);
  useAlertMonitor(localizedItems);
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  const filteredItems = React.useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const items = localizedItems;
    return sortItems(
      items.filter((item) => {
        const matchesSearch =
          !normalized ||
          item.nameKo.toLowerCase().includes(normalized) ||
          item.nameEn.toLowerCase().includes(normalized) ||
          item.koreanSymbol.includes(normalized) ||
          item.receiptSymbol.toLowerCase().includes(normalized);
        return matchesSearch && matchesFilter(item, settings.filter);
      }),
      settings.sortKey,
    );
  }, [localizedItems, search, settings.filter, settings.sortKey]);
  const comparisonGroups = React.useMemo(() => groupMarketComparisons(filteredItems), [filteredItems]);

  if (marketData.isLoading && !marketData.data) return <DashboardSkeleton />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">ADR·GDR vs 한국주 괴리율</h1>
          <p className="mt-1 text-sm text-muted-foreground">해외 예탁증서 가격을 원화 기준 한국 보통주 가격으로 환산해 실시간 모의 비교합니다.</p>
        </div>
        <Button type="button" onClick={() => marketData.refetch()} disabled={marketData.isFetching}>
          <RefreshCw className={marketData.isFetching ? "animate-spin" : ""} aria-hidden="true" />
          전체 재조회
        </Button>
      </div>

      {isOffline ? (
        <Alert variant="warning">
          <WifiOff className="size-4" aria-hidden="true" />
          <AlertTitle>네트워크 오프라인</AlertTitle>
          <AlertDescription>온라인 상태가 되면 자동 갱신이 재개됩니다. 마지막 정상 데이터를 유지합니다.</AlertDescription>
        </Alert>
      ) : null}

      {marketData.error ? (
        <Alert variant="destructive">
          <AlertTitle>시장 데이터 조회 실패</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{marketData.error.message}</span>
            <Button type="button" variant="outline" onClick={() => marketData.refetch()}>다시 시도</Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {marketData.data ? <MarketSummaryPanel summary={marketData.data.summary} /> : null}

      <DashboardControls
        search={search}
        setSearch={setSearch}
        sortKey={settings.sortKey}
        setSortKey={(sortKey) => updateSettings({ sortKey })}
        filter={settings.filter}
        setFilter={(filter) => updateSettings({ filter })}
        viewMode={settings.viewMode}
        setViewMode={(viewMode) => updateSettings({ viewMode })}
      />

      <Alert>
        <AlertTitle>데이터 정확성 안내</AlertTitle>
        <AlertDescription>
          이 대시보드의 정보는 참고용이며 투자 권유가 아닙니다. 표시된 괴리율은 한국장과 해외시장의 거래시간·휴장일 차이, 환율, 장외 시간 가격, 데이터 지연, DR 전환 수수료, 세금, 거래 수수료, 유동성, 매수·매도 호가 차이, 실제 전환 제한, 결제 시차, 환전 비용에 따라 달라질 수 있습니다.
        </AlertDescription>
      </Alert>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">조건에 맞는 종목이 없습니다.</CardContent>
        </Card>
      ) : settings.viewMode === "table" ? (
        <StockTable items={filteredItems} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {comparisonGroups.map((group) => (
            group.items.length > 1
              ? <MultiReceiptStockCard key={group.koreanSymbol} group={group} onRefresh={() => marketData.refetch()} />
              : <StockCard key={group.items[0].id} item={group.items[0]} onRefresh={() => marketData.refetch()} />
          ))}
        </div>
      )}
    </div>
  );
}
