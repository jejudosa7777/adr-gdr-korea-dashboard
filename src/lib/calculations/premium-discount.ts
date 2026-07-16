import type { AlertCooldowns, LastAlertState } from "@/features/alerts/types";
import type { PremiumDiscountDirection, PremiumDiscountLevel } from "@/features/market-data/types";

export interface CalculationOptions {
  now?: Date;
  staleAfterMs?: number;
  maxTimestampSkewMs?: number;
  koreanQuotedAt?: string | null;
  adrQuotedAt?: string | null;
  exchangeRateQuotedAt?: string | null;
}

export interface CalculationResult {
  value: number | null;
  warnings: string[];
}

function isPositiveFinite(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function collectDataWarnings(options?: CalculationOptions) {
  const warnings: string[] = [];
  if (!options) return warnings;

  const now = options.now ?? new Date();
  const staleAfterMs = options.staleAfterMs ?? 20 * 60_000;
  const timestamps = [options.koreanQuotedAt, options.adrQuotedAt, options.exchangeRateQuotedAt]
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())
    .filter(Number.isFinite);

  if (timestamps.some((time) => now.getTime() - time > staleAfterMs)) {
    warnings.push("오래된 데이터로 계산됨");
  }

  if (options.exchangeRateQuotedAt && now.getTime() - new Date(options.exchangeRateQuotedAt).getTime() > staleAfterMs) {
    warnings.push("오래된 환율 데이터로 계산됨");
  }

  if (timestamps.length >= 2) {
    const skew = Math.max(...timestamps) - Math.min(...timestamps);
    if (skew > (options.maxTimestampSkewMs ?? 15 * 60_000)) {
      warnings.push("서로 다른 시점의 가격 데이터로 계산됨");
    }
  }

  return warnings;
}

export function calculateConvertedDepositaryReceiptPrice(input: {
  receiptPrice: number | null | undefined;
  currencyKrwRate: number | null | undefined;
  receiptRatio: number | null | undefined;
  options?: CalculationOptions;
}): CalculationResult {
  const warnings = collectDataWarnings(input.options);

  if (!isPositiveFinite(input.receiptPrice)) warnings.push("예탁증서 가격이 0 이하이거나 없습니다.");
  if (!isPositiveFinite(input.currencyKrwRate)) warnings.push("통화/KRW 환율이 0 이하이거나 없습니다.");
  if (!isPositiveFinite(input.receiptRatio)) warnings.push("예탁증서 비율이 0 이하이거나 없습니다.");

  if (warnings.some((warning) => warning.includes("0 이하") || warning.includes("없습니다"))) {
    return { value: null, warnings };
  }

  return {
    value: (input.receiptPrice as number) * (input.currencyKrwRate as number) / (input.receiptRatio as number),
    warnings,
  };
}

export function calculateConvertedAdrPrice(input: {
  adrPriceUsd: number | null | undefined;
  usdKrwRate: number | null | undefined;
  adrRatio: number | null | undefined;
  options?: CalculationOptions;
}): CalculationResult {
  return calculateConvertedDepositaryReceiptPrice({
    receiptPrice: input.adrPriceUsd,
    currencyKrwRate: input.usdKrwRate,
    receiptRatio: input.adrRatio,
    options: input.options,
  });
}

export function calculatePremiumDiscountRate(input: {
  convertedReceiptPriceKrw?: number | null;
  /** @deprecated convertedReceiptPriceKrw를 사용하세요. */
  convertedAdrPriceKrw?: number | null;
  koreanPriceKrw: number | null | undefined;
  options?: CalculationOptions;
}): CalculationResult {
  const warnings = collectDataWarnings(input.options);
  const convertedPriceKrw = input.convertedReceiptPriceKrw ?? input.convertedAdrPriceKrw;

  if (!isPositiveFinite(input.koreanPriceKrw)) warnings.push("한국 주가가 0 이하이거나 없습니다.");
  if (!isPositiveFinite(convertedPriceKrw)) warnings.push("예탁증서 환산가가 0 이하이거나 없습니다.");

  if (warnings.some((warning) => warning.includes("0 이하") || warning.includes("없습니다"))) {
    return { value: null, warnings };
  }

  return {
    value: (((convertedPriceKrw as number) - (input.koreanPriceKrw as number)) / (input.koreanPriceKrw as number)) * 100,
    warnings,
  };
}

export function getPremiumDiscountLevel(rate: number | null | undefined): PremiumDiscountLevel {
  if (typeof rate !== "number" || !Number.isFinite(rate)) return "neutral";
  const absoluteRate = Math.abs(rate);
  if (absoluteRate >= 10) return "danger";
  if (absoluteRate >= 5) return "warning";
  if (absoluteRate >= 3) return "caution";
  return "neutral";
}

export function getPremiumDiscountDirection(rate: number | null | undefined): PremiumDiscountDirection {
  if (typeof rate !== "number" || !Number.isFinite(rate) || Math.abs(rate) < 0.0001) return "neutral";
  return rate > 0 ? "premium" : "discount";
}

function levelRank(level: PremiumDiscountLevel) {
  return { neutral: 0, caution: 1, warning: 2, danger: 3 }[level];
}

export function isAlertCooldownActive(input: {
  lastAlertAt: string | Date | null | undefined;
  cooldownMs: number;
  now?: Date;
}) {
  if (!input.lastAlertAt) return false;
  const last = input.lastAlertAt instanceof Date ? input.lastAlertAt : new Date(input.lastAlertAt);
  if (!Number.isFinite(last.getTime())) return false;
  return (input.now ?? new Date()).getTime() - last.getTime() < input.cooldownMs;
}

export function shouldTriggerAlert(input: {
  rate: number | null | undefined;
  previousAlert?: LastAlertState | null;
  thresholds?: { caution: number; warning: number; danger: number };
  cooldowns?: AlertCooldowns;
  manualReset?: boolean;
  now?: Date;
}) {
  const thresholds = input.thresholds ?? { caution: 3, warning: 5, danger: 10 };
  const cooldowns = input.cooldowns ?? { cautionMinutes: 30, warningMinutes: 15, dangerMinutes: 5 };
  const rate = input.rate;
  const direction = getPremiumDiscountDirection(rate);

  if (typeof rate !== "number" || !Number.isFinite(rate) || Math.abs(rate) < thresholds.caution) {
    return { shouldSend: false, reason: "below_threshold" as const, level: "neutral" as const, direction };
  }

  const effectiveLevel: PremiumDiscountLevel =
    Math.abs(rate) >= thresholds.danger ? "danger" : Math.abs(rate) >= thresholds.warning ? "warning" : "caution";

  if (input.manualReset) {
    return { shouldSend: true, reason: "manual_reset" as const, level: effectiveLevel, direction };
  }

  if (!input.previousAlert) {
    return { shouldSend: true, reason: "first_cross" as const, level: effectiveLevel, direction };
  }

  if (direction !== input.previousAlert.direction) {
    return { shouldSend: true, reason: "direction_changed" as const, level: effectiveLevel, direction };
  }

  if (levelRank(effectiveLevel) > levelRank(input.previousAlert.level)) {
    return { shouldSend: true, reason: "level_escalated" as const, level: effectiveLevel, direction };
  }

  const cooldownMinutes =
    effectiveLevel === "danger"
      ? cooldowns.dangerMinutes
      : effectiveLevel === "warning"
        ? cooldowns.warningMinutes
        : cooldowns.cautionMinutes;

  const cooldownActive = isAlertCooldownActive({
    lastAlertAt: input.previousAlert.sentAt,
    cooldownMs: cooldownMinutes * 60_000,
    now: input.now,
  });

  return {
    shouldSend: !cooldownActive,
    reason: cooldownActive ? ("cooldown_active" as const) : ("cooldown_expired" as const),
    level: effectiveLevel,
    direction,
  };
}
