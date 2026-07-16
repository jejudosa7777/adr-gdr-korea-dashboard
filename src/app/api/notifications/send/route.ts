import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerNotificationProviders } from "@/features/alerts/providers/notification-provider";
import { apiError } from "@/lib/api/responses";
import { createRateLimiter, getClientIdentifier } from "@/lib/api/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  stockId: z.string().min(1).max(100),
  stockNameKo: z.string().min(1).max(100),
  koreanPrice: z.number().nullable(),
  receiptType: z.enum(["ADR", "GDR", "CUSTOM"]),
  receiptCurrency: z.enum(["USD", "EUR", "GBP"]),
  receiptPrice: z.number().nullable(),
  currencyKrwRate: z.number().nullable(),
  convertedReceiptPriceKrw: z.number().nullable(),
  receiptRatio: z.number().positive(),
  adrPriceUsd: z.number().nullable().optional(),
  usdKrwRate: z.number().nullable().optional(),
  convertedAdrPriceKrw: z.number().nullable().optional(),
  premiumDiscountRate: z.number(),
  level: z.enum(["neutral", "caution", "warning", "danger"]),
  direction: z.enum(["premium", "discount", "neutral"]),
  adrRatio: z.number().positive().optional(),
  dataTimestamp: z.string().nullable(),
  channels: z.array(z.enum(["telegram", "discord", "slack"])).min(1).max(3)
    .refine((channels) => new Set(channels).size === channels.length, "중복 알림 채널은 허용되지 않습니다."),
  message: z.string().max(2_000).optional(),
});

const sendRateLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export async function POST(request: Request) {
  try {
    const rateLimit = sendRateLimiter.consume(getClientIdentifier(request));
    if (!rateLimit.allowed) {
      return apiError("RATE_LIMITED", "알림 전송 요청이 너무 많습니다. 잠시 후 다시 시도하세요.", 429, {
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      });
    }
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiError("VALIDATION_ERROR", "알림 요청 형식이 올바르지 않습니다.", 422, parsed.error.flatten());
    const providers = createServerNotificationProviders();
    const results = await Promise.all(parsed.data.channels.map((channel) => providers[channel].send(parsed.data)));
    return NextResponse.json({ success: results.every((result) => result.success), respondedAt: new Date().toISOString(), results });
  } catch (error) {
    return apiError("NOTIFICATION_SEND_FAILED", error instanceof Error ? error.message : "알림 전송 실패");
  }
}
