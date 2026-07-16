import type { ChartRange, DataMode } from "@/features/market-data/types";
import type { AlertCooldowns, AlertThresholds, NotificationChannel } from "@/features/alerts/types";

export type RefreshInterval = 10_000 | 15_000 | 30_000 | 60_000 | 300_000 | 0;
export type SortKey =
  | "absoluteGapDesc"
  | "gapDesc"
  | "gapAsc"
  | "nameAsc"
  | "koreanChangeDesc"
  | "adrChangeDesc"
  | "customOrder";
export type CardFilter =
  | "all"
  | "normal"
  | "caution"
  | "warning"
  | "danger"
  | "premium"
  | "discount"
  | "dataError"
  | "trading"
  | "closed"
  | "favorite";

export type ThemePreference = "light" | "dark" | "system";
export type ViewMode = "card" | "table";

export interface AppSettings {
  refreshIntervalMs: RefreshInterval;
  dataMode: DataMode;
  preferredChartRange: ChartRange;
  usePreMarket: boolean;
  useAfterMarket: boolean;
  stalePriceMinutes: number;
  keepLastGoodData: boolean;
  alertThresholds: AlertThresholds;
  alertCooldowns: AlertCooldowns;
  recoveryAlertsEnabled: boolean;
  premiumAlertsEnabled: boolean;
  discountAlertsEnabled: boolean;
  allowNightAlerts: boolean;
  allowOffHoursAlerts: boolean;
  enabledChannels: Record<NotificationChannel, boolean>;
  stockAlertEnabled: Record<string, boolean>;
  theme: ThemePreference;
  viewMode: ViewMode;
  decimalPlaces: number;
  useKrwThousandsSeparator: boolean;
  sortKey: SortKey;
  filter: CardFilter;
  mockModeVisible: boolean;
}
