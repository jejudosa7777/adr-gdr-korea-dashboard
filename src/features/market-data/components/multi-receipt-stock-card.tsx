"use client";

import Link from "next/link";
import { Bell, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumDiscountBadge } from "@/features/market-data/components/status-badge";
import type { MarketComparisonGroup } from "@/features/market-data/components/market-comparison-groups";
import { formatDateTimeKo } from "@/lib/date/timezone";
import { formatCurrencyKrwRate, formatCurrencyPrice, formatKrw, formatPercent } from "@/lib/formatting/number";
import { marketStatusLabel } from "@/lib/formatting/status";
import { cn } from "@/lib/utils";

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

export function MultiReceiptStockCard({ group, onRefresh }: { group: MarketComparisonGroup; onRefresh?: () => void }) {
  const korean = group.items[0];
  const emphasized = group.items.some((item) => item.level === "warning" || item.level === "danger");

  return (
    <Card className={cn("md:col-span-2 xl:col-span-2", emphasized && "border-orange-300 bg-orange-50/40 dark:border-orange-800 dark:bg-orange-950/20")}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{group.nameKo}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{group.nameEn} · {group.koreanSymbol}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label={`${group.nameKo} 전체 재조회`} onClick={onRefresh}>
            <RefreshCw className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">한국주 + DR {group.items.length}개 비교</Badge>
          <Badge variant={korean.isFavorite ? "success" : "secondary"}>
            <Bell aria-hidden="true" />
            알림 {korean.alertEnabled ? "ON" : "OFF"}
          </Badge>
          <Badge variant={korean.koreanMarketStatus === "regular" ? "success" : "outline"}>한국 시장 {marketStatusLabel(korean.koreanMarketStatus)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-3">
          <Metric label="한국 주가" value={`${formatKrw(korean.koreanPrice)} (${formatPercent(korean.koreanChangeRate)})`} />
          <Metric label="한국 종목코드" value={group.koreanSymbol} />
          <Metric label="가격 기준" value={<span className="inline-flex items-center gap-1"><Clock className="size-3" aria-hidden="true" />{formatDateTimeKo(korean.quotedAt)}</span>} />
        </div>

        <div className="divide-y rounded-md border bg-background">
          {group.items.map((item) => (
            <section key={item.id} className="space-y-3 p-3" aria-label={`${item.receiptType} ${item.receiptSymbol} 비교`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">{item.receiptType} {item.receiptSymbol}</strong>
                  <Badge variant="outline">{item.receiptCurrency} · 비율 {item.receiptRatio}</Badge>
                  <Badge variant={item.isDelayed ? "warning" : "success"}>{item.isDelayed ? "지연" : marketStatusLabel(item.overseasMarketStatus)}</Badge>
                </div>
                <PremiumDiscountBadge level={item.level} direction={item.direction} rate={item.premiumDiscountRate} receiptType={item.receiptType} />
              </div>

              {item.error ? <Alert variant="destructive"><AlertDescription>{item.error}</AlertDescription></Alert> : null}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Metric label={`${item.receiptType} 가격`} value={`${formatCurrencyPrice(item.receiptPrice, item.receiptCurrency)} (${formatPercent(item.receiptChangeRate)})`} />
                <Metric label={`${item.receiptType} 환산가`} value={formatKrw(item.convertedReceiptPriceKrw)} />
                <Metric label="한국주 대비 괴리율" value={<span className={item.direction === "premium" ? "text-red-700 dark:text-red-300" : item.direction === "discount" ? "text-blue-700 dark:text-blue-300" : ""}>{formatPercent(item.premiumDiscountRate)}</span>} />
                <Metric label={`${item.receiptCurrency}/KRW`} value={formatCurrencyKrwRate(item.currencyKrwRate, item.receiptCurrency)} />
                <Button asChild variant="outline" size="sm" className="self-center">
                  <Link href={`/stocks/${item.id}`}>상세 <ExternalLink aria-hidden="true" /></Link>
                </Button>
              </div>
              {item.warnings.length ? <div className="text-xs text-muted-foreground">{item.warnings.join(" · ")}</div> : null}
            </section>
          ))}
        </div>

        <span className="sr-only">
          {group.nameKo} 한국 주가와 {group.items.map((item) => `${item.receiptType} 환산가 ${formatKrw(item.convertedReceiptPriceKrw)}, 괴리율 ${formatPercent(item.premiumDiscountRate)}`).join(", ")}를 비교합니다.
        </span>
      </CardContent>
    </Card>
  );
}
