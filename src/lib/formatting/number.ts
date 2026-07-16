export function formatKrw(value: number | null | undefined, options?: { maximumFractionDigits?: number }) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(value)}원`;
}

export function formatUsd(value: number | null | undefined) {
  return formatCurrencyPrice(value, "USD");
}

export function formatCurrencyPrice(value: number | null | undefined, currency: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency}`;
}

export function formatRate(value: number | null | undefined) {
  return formatCurrencyKrwRate(value, "USD");
}

export function formatCurrencyKrwRate(value: number | null | undefined, currency: string) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${new Intl.NumberFormat("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} KRW/${currency}`;
}

export function formatPercent(value: number | null | undefined, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  const formatted = new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: "always",
  }).format(value);
  return `${formatted}%`;
}

export function formatPlainNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return new Intl.NumberFormat("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}
