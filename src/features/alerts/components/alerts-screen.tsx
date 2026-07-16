"use client";

import * as React from "react";
import { Download, RotateCcw, Send, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlertHistory } from "@/features/alerts/hooks/use-alert-history";
import type { AlertHistoryItem, NotificationChannel } from "@/features/alerts/types";
import { formatDateTimeKo } from "@/lib/date/timezone";
import { formatCurrencyKrwRate, formatCurrencyPrice, formatKrw, formatPercent } from "@/lib/formatting/number";
import { directionLabel, levelLabel } from "@/lib/formatting/status";

function toCsv(items: AlertHistoryItem[]) {
  const header = ["발생 시각", "종목명", "DR 유형", "한국 주가", "DR 가격", "거래 통화", "환율", "DR 환산가", "괴리율", "단계", "방향", "채널", "성공", "실패 사유"];
  const rows = items.map((item) => [
    item.createdAt,
    item.stockNameKo,
    item.receiptType ?? "ADR",
    item.koreanPrice ?? "",
    item.receiptPrice ?? item.adrPriceUsd ?? "",
    item.receiptCurrency ?? "USD",
    item.currencyKrwRate ?? item.usdKrwRate ?? "",
    item.convertedReceiptPriceKrw ?? item.convertedAdrPriceKrw ?? "",
    item.premiumDiscountRate,
    item.level,
    item.direction,
    item.results.map((result) => result.channel).join("|"),
    item.results.every((result) => result.success) ? "Y" : "N",
    item.results.map((result) => result.reason ?? "").join("|"),
  ]);
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
}

async function resendAlert(item: AlertHistoryItem) {
  const channels = item.channels.filter((channel): channel is Exclude<NotificationChannel, "browser"> => channel !== "browser");
  if (!channels.length) return null;
  const response = await fetch("/api/notifications/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...item, channels }),
  });
  return response.json();
}

export function AlertsScreen() {
  const { alerts, clearAlerts, reload } = useAlertHistory();
  const [stock, setStock] = React.useState("");
  const [level, setLevel] = React.useState("all");
  const [channel, setChannel] = React.useState("all");
  const [success, setSuccess] = React.useState("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [lastResult, setLastResult] = React.useState<string | null>(null);

  const filtered = alerts.filter((item) => {
    if (stock && !item.stockNameKo.includes(stock)) return false;
    if (level !== "all" && item.level !== level) return false;
    if (channel !== "all" && !item.results.some((result) => result.channel === channel)) return false;
    if (success !== "all") {
      const itemSuccess = item.results.every((result) => result.success);
      if ((success === "success") !== itemSuccess) return false;
    }
    if (from && new Date(item.createdAt) < new Date(from)) return false;
    if (to && new Date(item.createdAt) > new Date(to)) return false;
    return true;
  });

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "dr-alert-history.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-semibold">알림 이력</h1>
            <p className="mt-1 text-sm text-muted-foreground">초기 버전에서는 브라우저 localStorage에 알림 이력을 저장합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={reload}><RotateCcw aria-hidden="true" />새로고침</Button>
            <Button type="button" variant="outline" onClick={exportCsv}><Download aria-hidden="true" />CSV 내보내기</Button>
            <Button type="button" variant="destructive" onClick={clearAlerts}><Trash2 aria-hidden="true" />알림 이력 삭제</Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Input placeholder="종목별 필터" value={stock} onChange={(event) => setStock(event.target.value)} />
          <Select value={level} onValueChange={setLevel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">전체 단계</SelectItem><SelectItem value="caution">주의</SelectItem><SelectItem value="warning">경고</SelectItem><SelectItem value="danger">위험</SelectItem></SelectContent></Select>
          <Select value={channel} onValueChange={setChannel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">전체 채널</SelectItem><SelectItem value="browser">브라우저</SelectItem><SelectItem value="telegram">텔레그램</SelectItem><SelectItem value="discord">디스코드</SelectItem><SelectItem value="slack">슬랙</SelectItem></SelectContent></Select>
          <Select value={success} onValueChange={setSuccess}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">성공/실패 전체</SelectItem><SelectItem value="success">성공</SelectItem><SelectItem value="failed">실패</SelectItem></SelectContent></Select>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="시작 날짜" />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="종료 날짜" />
        </div>

        {lastResult ? (
          <Alert>
            <AlertTitle>알림 재전송 결과</AlertTitle>
            <AlertDescription>{lastResult}</AlertDescription>
          </Alert>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>발생 시각</TableHead>
              <TableHead>종목명</TableHead>
              <TableHead>가격</TableHead>
              <TableHead>괴리율</TableHead>
              <TableHead>채널</TableHead>
              <TableHead>결과</TableHead>
              <TableHead>작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{formatDateTimeKo(item.createdAt)}</TableCell>
                <TableCell>{item.stockNameKo}</TableCell>
                <TableCell className="text-xs">
                  한국 {formatKrw(item.koreanPrice)}<br />
                  {item.receiptType ?? "ADR"} {formatCurrencyPrice(item.receiptPrice ?? item.adrPriceUsd, item.receiptCurrency ?? "USD")}<br />
                  환율 {formatCurrencyKrwRate(item.currencyKrwRate ?? item.usdKrwRate, item.receiptCurrency ?? "USD")}<br />
                  환산 {formatKrw(item.convertedReceiptPriceKrw ?? item.convertedAdrPriceKrw)}
                </TableCell>
                <TableCell>{formatPercent(item.premiumDiscountRate)}<br /><span className="text-xs text-muted-foreground">{levelLabel(item.level)} · {directionLabel(item.direction, item.receiptType ?? "ADR")}</span></TableCell>
                <TableCell>{item.results.map((result) => result.channel).join(", ")}</TableCell>
                <TableCell>{item.results.every((result) => result.success) ? "성공" : item.results.map((result) => result.reason ?? "실패").join(", ")}</TableCell>
                <TableCell>
                  <Button type="button" variant="outline" size="sm" onClick={async () => {
                    const result = await resendAlert(item);
                    setLastResult(result ? JSON.stringify(result) : "서버 채널이 없어 재전송하지 않았습니다.");
                  }}>
                    <Send aria-hidden="true" />
                    재전송
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filtered.length === 0 ? (
          <Alert>
            <AlertTitle>알림 이력 없음</AlertTitle>
            <AlertDescription>조건에 맞는 알림 이력이 없습니다. 알림 판정 로직은 계산 함수와 서버 전송 API로 분리되어 있습니다.</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </AppShell>
  );
}
