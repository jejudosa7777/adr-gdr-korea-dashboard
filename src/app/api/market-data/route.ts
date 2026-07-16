import { NextResponse } from "next/server";
import { getMarketData } from "@/features/market-data/api/market-comparison-service";
import { apiError } from "@/lib/api/responses";
import { z } from "zod";
import { stockConfigSchema } from "@/features/market-data/schemas/stock-config-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getMarketData());
  } catch (error) {
    return apiError("MARKET_DATA_FAILED", error instanceof Error ? error.message : "시장 데이터 조회 실패");
  }
}

const requestSchema = z.object({ stocks: z.array(stockConfigSchema).min(1).max(50) });

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("VALIDATION_ERROR", "종목 설정 형식이 올바르지 않습니다.", 422, parsed.error.flatten());
    return NextResponse.json(await getMarketData(parsed.data.stocks));
  } catch (error) {
    return apiError("MARKET_DATA_FAILED", error instanceof Error ? error.message : "시장 데이터 조회 실패");
  }
}
