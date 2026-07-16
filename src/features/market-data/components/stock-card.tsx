"use client";

import Link from "next/link";
import { Bell, BellOff, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { MarketComparison } from "@/features/market-data/types";
import { PremiumDiscountBadge } from "@/features/market-data/components/status-badge";
import { formatDateTimeKo } from "@/lib/date/timezone";
import { formatCurrencyKrwRate, formatCurrencyPrice, formatKrw, formatPercent } from "@/lib/formatting/number";
import { marketStatusLabel, receiptStatusLabel } from "@/lib/formatting/status";
import { cn } from "@/lib/utils";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium">{value}</span>
    </div>
  );
}

export function StockCard({ item, onRefresh }: { item: MarketComparison; onRefresh?: () => void }) {
  const emphasized = item.level === "warning" || item.level === "danger";
  return (
    <Card className={cn("transition-colors", emphasized && "border-orange-300 bg-orange-50/40 dark:border-orange-800 dark:bg-orange-950/20")}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{item.nameKo}</CardTitle>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {item.nameEn} · {item.koreanSymbol} · {item.receiptType} {item.receiptSymbol}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label={`${item.nameKo} 재조회`} onClick={onRefresh}>
            <RefreshCw className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <PremiumDiscountBadge level={item.level} direction={item.direction} rate={item.premiumDiscountRate} receiptType={item.receiptType} />
          <Badge variant="outline">{item.receiptType} · {item.receiptCurrency}</Badge>
          <Badge variant={item.alertEnabled ? "success" : "secondary"}>
            {item.alertEnabled ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />}
            알림 {item.alertEnabled ? "ON" : "OFF"}
          </Badge>
          <Badge variant={item.isDelayed ? "warning" : "outline"}>{item.isDelayed ? "지연 데이터" : "실시간 모의"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {item.error ? (
          <Alert variant="destructive">
            <AlertDescription>{item.error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-2">
          <InfoRow label="한국 주가" value={`${formatKrw(item.koreanPrice)} (${formatPercent(item.koreanChangeRate)})`} />
          <InfoRow label={`${item.receiptType} 가격`} value={`${formatCurrencyPrice(item.receiptPrice, item.receiptCurrency)} (${formatPercent(item.receiptChangeRate)})`} />
          <InfoRow label={`${item.receiptType} 환산가`} value={formatKrw(item.convertedReceiptPriceKrw)} />
          <InfoRow label="괴리율" value={<span className={item.direction === "premium" ? "text-red-700 dark:text-red-300" : item.direction === "discount" ? "text-blue-700 dark:text-blue-300" : ""}>{formatPercent(item.premiumDiscountRate)}</span>} />
          <InfoRow label={`${item.receiptCurrency}/KRW`} value={formatCurrencyKrwRate(item.currencyKrwRate, item.receiptCurrency)} />
          <InfoRow label={`${item.receiptType} 비율`} value={item.receiptRatio} />
          <InfoRow label="한국 시장" value={marketStatusLabel(item.koreanMarketStatus)} />
          <InfoRow label="해외 시장" value={marketStatusLabel(item.overseasMarketStatus)} />
          <InfoRow label={`${item.receiptType} 상태`} value={receiptStatusLabel(item.receiptStatus, item.receiptType)} />
          <InfoRow label="가격 기준" value={<span className="inline-flex items-center gap-1"><Clock className="size-3" aria-hidden="true" />{formatDateTimeKo(item.quotedAt)}</span>} />
          <InfoRow label="마지막 업데이트" value={formatDateTimeKo(item.updatedAt)} />
        </div>
        {item.warnings.length ? (
          <div className="rounded-md bg-muted p-2 text-xs text-muted-foreground">{item.warnings.join(" · ")}</div>
        ) : null}
        <Button asChild variant="outline" className="w-full">
          <Link href={`/stocks/${item.id}`}>
            상세 보기
            <ExternalLink aria-hidden="true" />
          </Link>
        </Button>
        <span className="sr-only">
          {item.nameKo} 괴리율은 {formatPercent(item.premiumDiscountRate)}이며 {item.direction === "premium" ? `${item.receiptType}이 한국주보다 비싼 상태` : item.direction === "discount" ? `${item.receiptType}이 한국주보다 싼 상태` : "중립 상태"}입니다.
        </span>
      </CardContent>
    </Card>
  );
}
