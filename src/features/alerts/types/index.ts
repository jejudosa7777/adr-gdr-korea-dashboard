import type { DepositaryReceiptType, PremiumDiscountDirection, PremiumDiscountLevel, ReceiptCurrency } from "@/features/market-data/types";

export type NotificationChannel = "browser" | "telegram" | "discord" | "slack";

export interface AlertThresholds {
  caution: number;
  warning: number;
  danger: number;
}

export interface AlertCooldowns {
  cautionMinutes: number;
  warningMinutes: number;
  dangerMinutes: number;
}

export interface AlertNotification {
  stockId: string;
  stockNameKo: string;
  koreanPrice: number | null;
  receiptType: DepositaryReceiptType;
  receiptCurrency: ReceiptCurrency;
  receiptPrice: number | null;
  currencyKrwRate: number | null;
  convertedReceiptPriceKrw: number | null;
  receiptRatio: number;
  /** @deprecated receiptPrice를 사용하세요. */
  adrPriceUsd?: number | null;
  /** @deprecated currencyKrwRate를 사용하세요. */
  usdKrwRate?: number | null;
  /** @deprecated convertedReceiptPriceKrw를 사용하세요. */
  convertedAdrPriceKrw?: number | null;
  premiumDiscountRate: number;
  level: PremiumDiscountLevel;
  direction: PremiumDiscountDirection;
  /** @deprecated receiptRatio를 사용하세요. */
  adrRatio?: number;
  dataTimestamp: string | null;
  channels: NotificationChannel[];
  message?: string;
}

export interface NotificationResult {
  channel: NotificationChannel;
  success: boolean;
  respondedAt: string;
  httpStatus?: number;
  reason?: string;
}

export interface AlertHistoryItem extends AlertNotification {
  id: string;
  createdAt: string;
  results: NotificationResult[];
}

export interface LastAlertState {
  stockId: string;
  level: PremiumDiscountLevel;
  direction: PremiumDiscountDirection;
  rate: number;
  sentAt: string;
}

export interface AlertDecision {
  shouldSend: boolean;
  reason:
    | "below_threshold"
    | "first_cross"
    | "level_escalated"
    | "direction_changed"
    | "cooldown_expired"
    | "cooldown_active"
    | "manual_reset"
    | "returned_to_normal";
  level: PremiumDiscountLevel;
  direction: PremiumDiscountDirection;
}
