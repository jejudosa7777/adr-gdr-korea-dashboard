"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumDiscountBadge } from "@/features/market-data/components/status-badge";
import { useHistoricalComparison, useMarketDataItem } from "@/features/market-data/hooks/use-market-data";
import type { ChartRange } from "@/features/market-data/types";
import { formatDateTimeKo } from "@/lib/date/timezone";
import { formatCurrencyKrwRate, formatCurrencyPrice, formatKrw, formatPercent, formatPlainNumber } from "@/lib/formatting/number";
import { marketStatusLabel, receiptStatusLabel } from "@/lib/formatting/status";

const chartRanges: Array<{ value: ChartRange; label: string; enabled: boolean }> = [
  { value: "1d", label: "1일", enabled: true },
  { value: "5d", label: "5일", enabled: true },
  { value: "1m", label: "1개월", enabled: true },
  { value: "3m", label: "3개월", enabled: false },
  { value: "6m", label: "6개월", enabled: false },
  { value: "1y", label: "1년", enabled: false },
];

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, currency = "USD" }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string; currency?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover p-3 text-xs text-popover-foreground shadow">
      <div className="mb-2 font-medium">{formatDateTimeKo(label)}</div>
      {payload.map((item) => (
        <div key={item.name} className="flex justify-between gap-4">
          <span>{item.name}</span>
          <span>{item.name.includes("괴리율") ? formatPercent(item.value) : item.name.includes("환율") ? formatCurrencyKrwRate(item.value, currency) : formatKrw(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function StockDetail() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol;
  const [range, setRange] = React.useState<ChartRange>("1d");
  const quote = useMarketDataItem(symbol);
  const history = useHistoricalComparison(symbol, range);

  const points = history.data?.points ?? [];
  const statistics = history.data?.statistics ?? {};

  return (
    <AppShell>
      <div className="space-y-5">
        {quote.isLoading ? (
          <Skeleton className="h-56" />
        ) : quote.error ? (
          <Alert variant="destructive">
            <AlertTitle>상세 데이터 조회 실패</AlertTitle>
            <AlertDescription>{quote.error.message}</AlertDescription>
          </Alert>
        ) : quote.data ? (
          <Card>
            <CardHeader className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <CardTitle className="text-2xl">{quote.data.nameKo}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {quote.data.nameEn} · {quote.data.koreanSymbol} · {quote.data.receiptType} {quote.data.receiptSymbol}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PremiumDiscountBadge level={quote.data.level} direction={quote.data.direction} rate={quote.data.premiumDiscountRate} receiptType={quote.data.receiptType} />
                <Badge variant="outline">{quote.data.receiptType} · {quote.data.receiptCurrency}</Badge>
                <Badge variant={quote.data.isDelayed ? "warning" : "success"}>{quote.data.isDelayed ? "데이터 지연" : "정상 데이터"}</Badge>
                <Button type="button" onClick={() => quote.refetch()} disabled={quote.isFetching}>
                  <RefreshCw className={quote.isFetching ? "animate-spin" : ""} aria-hidden="true" />
                  재조회
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="한국 주식 현재가" value={formatKrw(quote.data.koreanPrice)} />
              <Metric label={`${quote.data.receiptType} 현재가`} value={formatCurrencyPrice(quote.data.receiptPrice, quote.data.receiptCurrency)} />
              <Metric label={`${quote.data.receiptType} 환산가`} value={formatKrw(quote.data.convertedReceiptPriceKrw)} />
              <Metric label="현재 괴리율" value={formatPercent(quote.data.premiumDiscountRate)} />
              <Metric label="현재 환율" value={formatCurrencyKrwRate(quote.data.currencyKrwRate, quote.data.receiptCurrency)} />
              <Metric label={`${quote.data.receiptType} 비율`} value={quote.data.receiptRatio} />
              <Metric label="거래소 상태" value={`${marketStatusLabel(quote.data.koreanMarketStatus)} / ${marketStatusLabel(quote.data.overseasMarketStatus)}`} />
              <Metric label="가격 기준 시각" value={formatDateTimeKo(quote.data.quotedAt)} />
              <Metric label="데이터 제공자" value={<span className="text-sm">{quote.data.provider}</span>} />
              <Metric label="마지막 정상 데이터" value={formatDateTimeKo(quote.data.updatedAt)} />
              <Metric label={`${quote.data.receiptType} 상태`} value={receiptStatusLabel(quote.data.receiptStatus, quote.data.receiptType)} />
              <Metric label="메모" value={<span className="text-sm">{quote.data.note ?? "-"}</span>} />
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h2 className="text-xl font-semibold">기간 차트</h2>
          <Tabs value={range} onValueChange={(value) => setRange(value as ChartRange)}>
            <TabsList className="flex-wrap">
              {chartRanges.map((item) => (
                <TabsTrigger key={item.value} value={item.value} disabled={!item.enabled} title={item.enabled ? undefined : "타입은 준비되어 있으며 Mock 차트 확장 지점입니다."}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {history.isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        ) : history.error ? (
          <Alert variant="destructive">
            <AlertTitle>차트 데이터 조회 실패</AlertTitle>
            <AlertDescription>{history.error.message}</AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>가격 비교</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={points}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => formatDateTimeKo(value).slice(6, 16)} minTickGap={32} />
                    <YAxis tickFormatter={(value) => formatPlainNumber(value, 0)} width={72} />
                    <RechartsTooltip content={<ChartTooltip currency={quote.data?.receiptCurrency} />} />
                    <Line type="monotone" dataKey="koreanPriceKrw" name="한국 주가" stroke="#2563eb" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="convertedReceiptPriceKrw" name={`${quote.data?.receiptType ?? "DR"} 환산가`} stroke="#dc2626" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>괴리율</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={points}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => formatDateTimeKo(value).slice(6, 16)} minTickGap={32} />
                    <YAxis tickFormatter={(value) => `${value}%`} width={48} />
                    <RechartsTooltip content={<ChartTooltip currency={quote.data?.receiptCurrency} />} />
                    {[0, 3, -3, 5, -5, 10, -10].map((line) => (
                      <ReferenceLine key={line} y={line} stroke={line === 0 ? "#64748b" : Math.abs(line) >= 10 ? "#dc2626" : Math.abs(line) >= 5 ? "#ea580c" : "#d97706"} strokeDasharray="4 4" />
                    ))}
                    <Area type="monotone" dataKey="premiumDiscountRate" name="괴리율" stroke="#0f766e" fill="#0f766e33" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{quote.data?.receiptCurrency ?? "USD"}/KRW 환율</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={points}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(value) => formatDateTimeKo(value).slice(6, 16)} minTickGap={32} />
                    <YAxis tickFormatter={(value) => formatPlainNumber(value, 0)} width={72} domain={["dataMin - 10", "dataMax + 10"]} />
                    <RechartsTooltip content={<ChartTooltip currency={quote.data?.receiptCurrency} />} />
                    <Line type="monotone" dataKey="currencyKrwRate" name="환율" stroke="#7c3aed" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>기간 통계</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="괴리율 최고" value={formatPercent(statistics.max)} />
            <Metric label="괴리율 최저" value={formatPercent(statistics.min)} />
            <Metric label="괴리율 평균" value={formatPercent(statistics.average)} />
            <Metric label="괴리율 중앙값" value={formatPercent(statistics.median)} />
            <Metric label="표준편차" value={formatPlainNumber(statistics.stdDev)} />
            <Metric label="프리미엄 시간 비율" value={formatPercent(statistics.premiumRatio)} />
            <Metric label="디스카운트 시간 비율" value={formatPercent(statistics.discountRatio)} />
            <Metric label="3% 이상 초과 횟수" value={`${statistics.cautionCrossCount ?? 0}회`} />
            <Metric label="5% 이상 초과 횟수" value={`${statistics.warningCrossCount ?? 0}회`} />
            <Metric label="10% 이상 초과 횟수" value={`${statistics.dangerCrossCount ?? 0}회`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 알림 이력</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">알림 이력은 `/alerts` 화면에 저장되며, 상세 화면에서는 추후 종목별 이력 필터로 확장할 수 있습니다.</CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
