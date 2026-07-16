import { NextResponse } from "next/server";
import { z } from "zod";
import type { AlertNotification, NotificationChannel } from "@/features/alerts/types";
import { createServerNotificationProviders } from "@/features/alerts/providers/notification-provider";
import { apiError } from "@/lib/api/responses";
import { createRateLimiter, getClientIdentifier } from "@/lib/api/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  channel: z.enum(["telegram", "discord", "slack"]),
});

const testRateLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

function testNotification(channel: NotificationChannel): AlertNotification {
  return {
    stockId: "sk-hynix",
    stockNameKo: "SK하이닉스",
    koreanPrice: 220000,
    receiptType: "GDR",
    receiptCurrency: "USD",
    receiptPrice: 161.2,
    currencyKrwRate: 1450,
    convertedReceiptPriceKrw: 233750,
    receiptRatio: 1,
    adrPriceUsd: 161.2,
    usdKrwRate: 1450,
    convertedAdrPriceKrw: 233750,
    premiumDiscountRate: 6.25,
    level: "warning",
    direction: "premium",
    adrRatio: 1,
    dataTimestamp: new Date().toISOString(),
    channels: [channel],
  };
}

export async function POST(request: Request) {
  try {
    const rateLimit = testRateLimiter.consume(getClientIdentifier(request));
    if (!rateLimit.allowed) {
      return apiError("RATE_LIMITED", "테스트 알림 요청이 너무 많습니다. 잠시 후 다시 시도하세요.", 429, {
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiError("VALIDATION_ERROR", "알림 채널이 올바르지 않습니다.", 422, parsed.error.flatten());
    const providers = createServerNotificationProviders();
    const result = await providers[parsed.data.channel].send(testNotification(parsed.data.channel));
    return NextResponse.json(result);
  } catch (error) {
    return apiError("NOTIFICATION_TEST_FAILED", error instanceof Error ? error.message : "테스트 알림 실패");
  }
}
