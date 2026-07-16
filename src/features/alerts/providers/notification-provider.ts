import type { AlertNotification, NotificationChannel, NotificationResult } from "@/features/alerts/types";

export interface NotificationProvider {
  send(notification: AlertNotification): Promise<NotificationResult>;
}

function sanitizeError(error: unknown) {
  const message = error instanceof Error ? error.message : "알 수 없는 오류";
  return message.replace(/(token|webhook|chat_id)=?[^&\s]+/gi, "$1=***");
}

function formatMessage(notification: AlertNotification) {
  const direction = notification.direction === "premium" ? `${notification.receiptType} 프리미엄` : notification.direction === "discount" ? `${notification.receiptType} 디스카운트` : "중립";
  const level = { caution: "주의", warning: "경고", danger: "위험", neutral: "정상" }[notification.level];
  const rate = `${notification.premiumDiscountRate >= 0 ? "+" : ""}${notification.premiumDiscountRate.toFixed(2)}%`;
  return [
    `[${level}] ${notification.stockNameKo} ${direction} ${rate}`,
    "",
    `한국 주가: ${notification.koreanPrice ?? "-"}원`,
    `${notification.receiptType} 가격: ${notification.receiptPrice ?? "-"} ${notification.receiptCurrency}`,
    `${notification.receiptType} 환산가: ${notification.convertedReceiptPriceKrw ?? "-"}원`,
    `${notification.receiptCurrency}/KRW: ${notification.currencyKrwRate ?? "-"}원`,
    `${notification.receiptType} 비율: ${notification.receiptRatio}`,
    `괴리율: ${rate}`,
    `데이터 시각: ${notification.dataTimestamp ?? "-"}`,
  ].join("\n");
}

export class TelegramNotificationProvider implements NotificationProvider {
  constructor(private readonly token?: string, private readonly chatId?: string) {}

  async send(notification: AlertNotification): Promise<NotificationResult> {
    const respondedAt = new Date().toISOString();
    if (!this.token || !this.chatId) return { channel: "telegram", success: false, respondedAt, reason: "TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID가 없습니다." };
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: this.chatId, text: notification.message ?? formatMessage(notification) }),
      });
      return { channel: "telegram", success: response.ok, respondedAt: new Date().toISOString(), httpStatus: response.status, reason: response.ok ? undefined : "텔레그램 전송 실패" };
    } catch (error) {
      return { channel: "telegram", success: false, respondedAt: new Date().toISOString(), reason: sanitizeError(error) };
    }
  }
}

export class WebhookNotificationProvider implements NotificationProvider {
  constructor(private readonly channel: Extract<NotificationChannel, "discord" | "slack">, private readonly webhookUrl?: string) {}

  async send(notification: AlertNotification): Promise<NotificationResult> {
    const respondedAt = new Date().toISOString();
    if (!this.webhookUrl) return { channel: this.channel, success: false, respondedAt, reason: `${this.channel.toUpperCase()}_WEBHOOK_URL이 없습니다.` };
    try {
      const body = this.channel === "discord"
        ? { content: notification.message ?? formatMessage(notification) }
        : { text: notification.message ?? formatMessage(notification) };
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        redirect: "error",
      });
      return { channel: this.channel, success: response.ok, respondedAt: new Date().toISOString(), httpStatus: response.status, reason: response.ok ? undefined : "웹훅 전송 실패" };
    } catch (error) {
      return { channel: this.channel, success: false, respondedAt: new Date().toISOString(), reason: sanitizeError(error) };
    }
  }
}

export function createServerNotificationProviders() {
  return {
    telegram: new TelegramNotificationProvider(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID),
    discord: new WebhookNotificationProvider("discord", process.env.DISCORD_WEBHOOK_URL),
    slack: new WebhookNotificationProvider("slack", process.env.SLACK_WEBHOOK_URL),
  };
}
