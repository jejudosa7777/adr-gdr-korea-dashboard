import { z } from "zod";

export const alertThresholdSchema = z
  .object({
    caution: z.coerce.number().min(0.1).max(50),
    warning: z.coerce.number().min(0.1).max(50),
    danger: z.coerce.number().min(0.1).max(100),
  })
  .refine((value) => value.caution < value.warning && value.warning < value.danger, {
    message: "알림 기준은 주의 < 경고 < 위험 순서여야 합니다.",
    path: ["danger"],
  });

export const settingsSchema = z.object({
  refreshIntervalMs: z.union([
    z.literal(10_000),
    z.literal(15_000),
    z.literal(30_000),
    z.literal(60_000),
    z.literal(300_000),
    z.literal(0),
  ]),
  dataMode: z.enum(["mock", "real"]),
  preferredChartRange: z.enum(["1d", "5d", "1m", "3m", "6m", "1y"]),
  usePreMarket: z.boolean(),
  useAfterMarket: z.boolean(),
  stalePriceMinutes: z.coerce.number().min(1).max(1440),
  keepLastGoodData: z.boolean(),
  alertThresholds: alertThresholdSchema,
  alertCooldowns: z.object({
    cautionMinutes: z.coerce.number().min(1).max(1440),
    warningMinutes: z.coerce.number().min(1).max(1440),
    dangerMinutes: z.coerce.number().min(1).max(1440),
  }),
  recoveryAlertsEnabled: z.boolean(),
  premiumAlertsEnabled: z.boolean(),
  discountAlertsEnabled: z.boolean(),
  allowNightAlerts: z.boolean(),
  allowOffHoursAlerts: z.boolean(),
  enabledChannels: z.object({
    browser: z.boolean(),
    telegram: z.boolean(),
    discord: z.boolean(),
    slack: z.boolean(),
  }),
  stockAlertEnabled: z.record(z.string(), z.boolean()),
  theme: z.enum(["light", "dark", "system"]),
  viewMode: z.enum(["card", "table"]),
  decimalPlaces: z.coerce.number().int().min(0).max(4),
  useKrwThousandsSeparator: z.boolean(),
  sortKey: z.enum(["absoluteGapDesc", "gapDesc", "gapAsc", "nameAsc", "koreanChangeDesc", "adrChangeDesc", "customOrder"]),
  filter: z.enum(["all", "normal", "caution", "warning", "danger", "premium", "discount", "dataError", "trading", "closed", "favorite"]),
  mockModeVisible: z.boolean(),
});
