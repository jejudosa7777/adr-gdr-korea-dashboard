import { Activity, AlertTriangle, Clock, Database, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MarketSummary } from "@/features/market-data/types";
import { formatDateTimeKo } from "@/lib/date/timezone";
import { formatKrw, formatPercent, formatRate } from "@/lib/formatting/number";
import { marketStatusLabel } from "@/lib/formatting/status";

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-lg font-semibold">{value}</div>
    </div>
  );
}

export function MarketSummaryPanel({ summary }: { summary: MarketSummary }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4" aria-hidden="true" />
            시장 요약
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">최근 갱신 {formatDateTimeKo(summary.lastUpdatedAt)}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Badge variant={summary.apiStatus === "connected" ? "success" : summary.apiStatus === "degraded" ? "warning" : "danger"}>
            <Wifi aria-hidden="true" />
            API {summary.apiStatus}
          </Badge>
          {summary.isMockMode ? (
            <Badge variant="outline">
              <Database aria-hidden="true" />
              Mock 모드
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Metric label="한국 종목" value={`${summary.totalTracked}개`} />
        <Metric label="DR 비교" value={`${summary.totalComparisons}개`} />
        <Metric label="정상 종목" value={`${summary.activeCount}개`} />
        <Metric label="3% 이상" value={`${summary.cautionCount}개`} />
        <Metric label="5% 이상" value={`${summary.warningCount}개`} />
        <Metric label="10% 이상" value={`${summary.dangerCount}개`} />
        <Metric label="최대 괴리" value={summary.largestGapStock ? `${summary.largestGapStock.nameKo} ${summary.largestGapStock.receiptType} ${formatPercent(summary.largestGapStock.premiumDiscountRate)}` : "-"} />
        <Metric label="USD/KRW" value={formatRate(summary.usdKrwRate)} />
        <Metric label="환율 변화" value={`${formatKrw(summary.usdKrwChange, { maximumFractionDigits: 2 })} · ${formatPercent(summary.usdKrwChangeRate)}`} />
        <Metric label="한국 시장" value={marketStatusLabel(summary.koreanMarketStatus)} />
        <Metric label="미국 시장" value={marketStatusLabel(summary.usMarketStatus)} />
        <Metric label="데이터 시각" value={<span className="inline-flex items-center gap-1"><Clock className="size-4" aria-hidden="true" />{formatDateTimeKo(summary.lastUpdatedAt)}</span>} />
        <Metric label="주의" value={<span className="inline-flex items-center gap-1"><AlertTriangle className="size-4" aria-hidden="true" />거래시간 차이 반영 필요</span>} />
      </CardContent>
    </Card>
  );
}
