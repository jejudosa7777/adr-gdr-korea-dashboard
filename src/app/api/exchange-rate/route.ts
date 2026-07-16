import { NextResponse } from "next/server";
import { createProviders } from "@/lib/providers/provider-factory";
import { apiError } from "@/lib/api/responses";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({ currency: z.enum(["USD", "EUR", "GBP"]).default("USD") });

export async function GET(request: Request) {
  try {
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiError("VALIDATION_ERROR", "지원하지 않는 기준 통화입니다.", 422, parsed.error.flatten());
    const providers = createProviders();
    return NextResponse.json(await providers.exchangeRateProvider.getKrwRate(parsed.data.currency));
  } catch (error) {
    return apiError("EXCHANGE_RATE_FAILED", error instanceof Error ? error.message : "환율 조회 실패");
  }
}
