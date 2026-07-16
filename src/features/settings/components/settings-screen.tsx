"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STOCKS } from "@/config/stocks";
import { BrowserNotificationPanel } from "@/features/settings/components/browser-notification-panel";
import { useAppSettings } from "@/features/settings/components/settings-provider";
import { useStockSettings } from "@/features/settings/components/stock-settings-provider";
import { settingsSchema } from "@/features/settings/schemas/settings-schema";
import type { AppSettings } from "@/features/settings/types";
import type { DepositaryReceiptTradingStatus, DepositaryReceiptType, ReceiptCurrency, StockConfig } from "@/features/market-data/types";
import { useMarketData } from "@/features/market-data/hooks/use-market-data";
import { calculateConvertedDepositaryReceiptPrice, calculatePremiumDiscountRate } from "@/lib/calculations/premium-discount";
import { formatKrw, formatPercent } from "@/lib/formatting/number";
import { receiptStatusLabel } from "@/lib/formatting/status";

const receiptStatuses: DepositaryReceiptTradingStatus[] = ["active", "suspended", "delisted", "unverified", "custom", "inactive"];
const receiptTypes: DepositaryReceiptType[] = ["ADR", "GDR", "CUSTOM"];
const receiptCurrencies: ReceiptCurrency[] = ["USD", "EUR", "GBP"];

function Field({ label, children, help }: { label: string; children: React.ReactNode; help?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
    </div>
  );
}

function StockEditor({ stock }: { stock: StockConfig }) {
  const { updateStock, deleteStock } = useStockSettings();
  const listingLabel = `${stock.nameKo} ${stock.receiptType} ${stock.receiptSymbol}`;
  const marketData = useMarketData();
  const item = marketData.data?.items.find((candidate) => candidate.id === stock.id);
  const previewConverted = calculateConvertedDepositaryReceiptPrice({
    receiptPrice: item?.receiptPrice,
    currencyKrwRate: item?.currencyKrwRate,
    receiptRatio: stock.receiptRatio,
  });
  const previewRate = calculatePremiumDiscountRate({
    convertedReceiptPriceKrw: previewConverted.value,
    koreanPriceKrw: item?.koreanPrice,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span>{stock.nameKo} <span className="text-sm font-normal text-muted-foreground">· {stock.receiptType} {stock.receiptSymbol}</span></span>
          <Badge variant={stock.isActive ? "success" : "secondary"}>{stock.isActive ? "활성" : "비활성"}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Field label="한국어 종목명">
          <Input value={stock.nameKo} onChange={(event) => updateStock(stock.id, { nameKo: event.target.value })} />
        </Field>
        <Field label="영문 종목명">
          <Input value={stock.nameEn} onChange={(event) => updateStock(stock.id, { nameEn: event.target.value })} />
        </Field>
        <Field label="한국 종목코드">
          <Input value={stock.koreanSymbol} onChange={(event) => updateStock(stock.id, { koreanSymbol: event.target.value })} />
        </Field>
        <Field label="예탁증서 유형">
          <Select value={stock.receiptType} onValueChange={(value) => updateStock(stock.id, { receiptType: value as DepositaryReceiptType })}>
            <SelectTrigger aria-label={`${listingLabel} 예탁증서 유형`}><SelectValue /></SelectTrigger>
            <SelectContent>{receiptTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label={`${stock.receiptType} 티커`}>
          <Input aria-label={`${listingLabel} 티커`} value={stock.receiptSymbol} onChange={(event) => updateStock(stock.id, { receiptSymbol: event.target.value.toUpperCase() })} />
        </Field>
        <Field label={`${stock.receiptType} 비율`} help="DR 비율은 예탁증서 1주가 한국 보통주 몇 주에 해당하는지를 의미합니다. 예: DR 가격 100, 환율 1,400원, 비율 2이면 환산가는 70,000원입니다.">
          <Input
            aria-label={`${listingLabel} 비율`}
            type="number"
            min="0.0001"
            step="0.0001"
            value={stock.receiptRatio}
            onChange={(event) => updateStock(stock.id, { receiptRatio: Number(event.target.value) })}
          />
        </Field>
        <Field label={`${stock.receiptType} 상태`}>
          <Select value={stock.receiptStatus} onValueChange={(value) => updateStock(stock.id, { receiptStatus: value as DepositaryReceiptTradingStatus })}>
            <SelectTrigger aria-label={`${listingLabel} 상태`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {receiptStatuses.map((status) => (
                <SelectItem key={status} value={status}>{receiptStatusLabel(status, stock.receiptType)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="정렬 순서">
          <Input type="number" value={stock.sortOrder} onChange={(event) => updateStock(stock.id, { sortOrder: Number(event.target.value) })} />
        </Field>
        <Field label={`${stock.receiptType} 거래소`}>
          <Input aria-label={`${listingLabel} 거래소`} value={stock.receiptExchange ?? ""} onChange={(event) => updateStock(stock.id, { receiptExchange: event.target.value })} />
        </Field>
        <Field label="거래 통화">
          <Select value={stock.receiptCurrency} onValueChange={(value) => updateStock(stock.id, { receiptCurrency: value as ReceiptCurrency })}>
            <SelectTrigger aria-label={`${listingLabel} 거래 통화`}><SelectValue /></SelectTrigger>
            <SelectContent>{receiptCurrencies.map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div className="flex items-center gap-3">
          <Switch checked={stock.isActive} onCheckedChange={(checked) => updateStock(stock.id, { isActive: checked })} aria-label={`${listingLabel} 활성화`} />
          <span className="text-sm">활성화</span>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={stock.isFavorite} onCheckedChange={(checked) => updateStock(stock.id, { isFavorite: checked })} aria-label={`${listingLabel} 즐겨찾기`} />
          <span className="text-sm">즐겨찾기</span>
        </div>
        <div className="md:col-span-2 lg:col-span-4">
          <Label>메모</Label>
          <textarea
            className="mt-2 min-h-20 w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={stock.note}
            onChange={(event) => updateStock(stock.id, { note: event.target.value })}
          />
        </div>
        <Alert className="md:col-span-2 lg:col-span-3">
          <AlertTitle>비율 변경 미리보기</AlertTitle>
          <AlertDescription>
            예상 {stock.receiptType} 환산가 {formatKrw(previewConverted.value)} · 예상 괴리율 {formatPercent(previewRate.value)}
          </AlertDescription>
        </Alert>
        <Button type="button" variant="destructive" onClick={() => deleteStock(stock.id)} aria-label={`${listingLabel} 삭제`}>
          <Trash2 aria-hidden="true" />
          삭제
        </Button>
      </CardContent>
    </Card>
  );
}

export function SettingsScreen() {
  const { settings, replaceSettings } = useAppSettings();
  const { stocks, addStock, resetStocks } = useStockSettings();
  const form = useForm<AppSettings>({ resolver: zodResolver(settingsSchema) as unknown as Resolver<AppSettings>, values: settings });

  const onSubmit = form.handleSubmit(async (value) => {
    await replaceSettings(value);
  });

  const addCustomStock = async () => {
    const nextOrder = Math.max(...stocks.map((stock) => stock.sortOrder), 0) + 1;
    await addStock({
      ...STOCKS[0],
      id: `custom-${Date.now()}`,
      nameKo: "사용자 종목",
      nameEn: "Custom Stock",
      koreanSymbol: "000000",
      receiptType: "CUSTOM",
      receiptSymbol: "CUSTOM",
      receiptRatio: 1,
      receiptStatus: "custom",
      isActive: true,
      isFavorite: false,
      sortOrder: nextOrder,
      note: "사용자 추가 종목입니다.",
      dataProviderSymbols: { korean: { custom: "000000" }, receipt: { custom: "CUSTOM" } },
    });
  };

  return (
    <AppShell>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-2xl font-semibold">설정</h1>
            <p className="mt-1 text-sm text-muted-foreground">설정값은 초기 버전에서 브라우저 localStorage에 저장됩니다.</p>
          </div>
          <Button type="submit">
            <Save aria-hidden="true" />
            설정 저장
          </Button>
        </div>

        <Tabs defaultValue="stocks">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="stocks">종목 설정</TabsTrigger>
            <TabsTrigger value="adr">DR 설정</TabsTrigger>
            <TabsTrigger value="alerts">알림 설정</TabsTrigger>
            <TabsTrigger value="data">데이터 설정</TabsTrigger>
            <TabsTrigger value="fx">환율 설정</TabsTrigger>
            <TabsTrigger value="channels">알림 채널 설정</TabsTrigger>
            <TabsTrigger value="display">화면 설정</TabsTrigger>
            <TabsTrigger value="developer">개발자 설정</TabsTrigger>
          </TabsList>

          <TabsContent value="stocks" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={addCustomStock}>
                <Plus aria-hidden="true" />
                종목 추가
              </Button>
              <Button type="button" variant="outline" onClick={resetStocks}>
                <RotateCcw aria-hidden="true" />
                기본 종목 복원
              </Button>
            </div>
            {stocks.map((stock) => <StockEditor key={stock.id} stock={stock} />)}
          </TabsContent>

          <TabsContent value="adr" className="space-y-4">
            <Alert>
              <AlertTitle>ADR·GDR 비율 정의</AlertTitle>
              <AlertDescription>
                DR 비율은 ADR 또는 GDR 1주가 한국 보통주 몇 주에 해당하는지를 의미합니다. 유형·통화·비율 변경 시 Mock Provider와 괴리율이 다시 계산됩니다.
              </AlertDescription>
            </Alert>
            {stocks.map((stock) => <StockEditor key={`adr-${stock.id}`} stock={stock} />)}
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader><CardTitle>알림 기준</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <Field label="3% 기준값"><Input type="number" step="0.1" {...form.register("alertThresholds.caution", { valueAsNumber: true })} /></Field>
                <Field label="5% 기준값"><Input type="number" step="0.1" {...form.register("alertThresholds.warning", { valueAsNumber: true })} /></Field>
                <Field label="10% 기준값"><Input type="number" step="0.1" {...form.register("alertThresholds.danger", { valueAsNumber: true })} /></Field>
                <Field label="주의 쿨다운(분)"><Input type="number" {...form.register("alertCooldowns.cautionMinutes", { valueAsNumber: true })} /></Field>
                <Field label="경고 쿨다운(분)"><Input type="number" {...form.register("alertCooldowns.warningMinutes", { valueAsNumber: true })} /></Field>
                <Field label="위험 쿨다운(분)"><Input type="number" {...form.register("alertCooldowns.dangerMinutes", { valueAsNumber: true })} /></Field>
                {([
                  ["recoveryAlertsEnabled", "복귀 알림"],
                  ["premiumAlertsEnabled", "프리미엄 알림"],
                  ["discountAlertsEnabled", "디스카운트 알림"],
                  ["allowNightAlerts", "야간 알림 허용"],
                  ["allowOffHoursAlerts", "거래시간 외 알림 허용"],
                ] as const).map(([name, label]) => (
                  <label key={name} className="flex items-center gap-3 text-sm">
                    <Controller
                      control={form.control}
                      name={name}
                      render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                    />
                    {label}
                  </label>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card>
              <CardHeader><CardTitle>데이터 설정</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field label="자동 갱신 주기">
                  <Controller
                    control={form.control}
                    name="refreshIntervalMs"
                    render={({ field }) => (
                      <Select value={String(field.value)} onValueChange={(value) => field.onChange(Number(value))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10000">10초</SelectItem>
                          <SelectItem value="15000">15초</SelectItem>
                          <SelectItem value="30000">30초</SelectItem>
                          <SelectItem value="60000">1분</SelectItem>
                          <SelectItem value="300000">5분</SelectItem>
                          <SelectItem value="0">수동 갱신</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="데이터 모드">
                  <Controller
                    control={form.control}
                    name="dataMode"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mock">Mock 모드</SelectItem>
                          <SelectItem value="real">실제 API 모드</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="오래된 가격 허용 시간(분)"><Input type="number" {...form.register("stalePriceMinutes", { valueAsNumber: true })} /></Field>
                {([
                  ["usePreMarket", "프리마켓 가격 사용"],
                  ["useAfterMarket", "애프터마켓 가격 사용"],
                  ["keepLastGoodData", "API 실패 시 마지막 데이터 사용"],
                ] as const).map(([name, label]) => (
                  <label key={name} className="flex items-center gap-3 text-sm">
                    <Controller
                      control={form.control}
                      name={name}
                      render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                    />
                    {label}
                  </label>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fx">
            <Alert>
              <AlertTitle>환율 Provider</AlertTitle>
              <AlertDescription>
                Mock 모드에서는 seed 기반 USD·EUR·GBP/KRW 환율이 소폭 변동합니다. 실제 모드에서는 `RealExchangeRateProvider`가 선택 통화의 API 응답을 내부 타입으로 변환합니다.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            <BrowserNotificationPanel />
            <Card>
              <CardHeader><CardTitle>서버 알림 채널</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {([
                  ["enabledChannels.telegram", "텔레그램"],
                  ["enabledChannels.discord", "디스코드 웹훅"],
                  ["enabledChannels.slack", "슬랙 웹훅"],
                  ["enabledChannels.browser", "브라우저 알림"],
                ] as const).map(([name, label]) => (
                  <label key={name} className="flex items-center gap-3 text-sm">
                    <Controller
                      control={form.control}
                      name={name}
                      render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                    />
                    {label}
                  </label>
                ))}
                <Alert className="md:col-span-2" variant="warning">
                  <AlertDescription>텔레그램 토큰과 웹훅 URL은 브라우저 localStorage에 저장하지 않습니다. 개발용 값은 `.env.local`, 운영 비밀값은 배포 환경의 Secret Store에 저장하세요.</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="display">
            <Card>
              <CardHeader><CardTitle>화면 설정</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Field label="테마">
                  <Controller
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">라이트 모드</SelectItem>
                          <SelectItem value="dark">다크 모드</SelectItem>
                          <SelectItem value="system">시스템 설정</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="보기 방식">
                  <Controller
                    control={form.control}
                    name="viewMode"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">카드형 보기</SelectItem>
                          <SelectItem value="table">테이블형 보기</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="소수점 표시 자릿수"><Input type="number" {...form.register("decimalPlaces", { valueAsNumber: true })} /></Field>
                <label className="flex items-center gap-3 text-sm">
                  <Controller
                    control={form.control}
                    name="useKrwThousandsSeparator"
                    render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                  />
                  원화 천 단위 구분
                </label>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="developer">
            <Alert>
              <AlertTitle>개발자 설정</AlertTitle>
              <AlertDescription>
                `NEXT_PUBLIC_DATA_MODE=mock`이면 API 키 없이 실행됩니다. `real` 모드에서는 서버 Route Handler가 Provider를 호출하며 비밀값은 클라이언트 번들에 포함하지 않습니다.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        {form.formState.errors.root ? <p className="text-sm text-destructive">{form.formState.errors.root.message}</p> : null}
      </form>
    </AppShell>
  );
}
