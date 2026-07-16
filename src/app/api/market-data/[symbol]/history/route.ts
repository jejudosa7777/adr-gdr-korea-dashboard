import { NextResponse } from "next/server";
import { z } from "zod";
import { getHistoricalComparison, getHistoricalComparisonForStock, summarizeHistory } from "@/features/market-data/api/market-comparison-service";
import { apiError } from "@/lib/api/responses";
import { stockConfigSchema } from "@/features/market-data/schemas/stock-config-schema";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  range: z.enum(["1d", "5d", "1m", "3m", "6m", "1y"]).default("1d"),
});

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiError("VALIDATION_ERROR", "잘못된 차트 기간입니다.", 422, parsed.error.flatten());

    const history = await getHistoricalComparison(symbol, parsed.data.range);
    if (!history) return apiError("NOT_FOUND", "종목을 찾을 수 없습니다.", 404);
    return NextResponse.json({ ...history, statistics: summarizeHistory(history.points) });
  } catch (error) {
    return apiError("MARKET_DATA_HISTORY_FAILED", error instanceof Error ? error.message : "과거 데이터 조회 실패");
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) return apiError("VALIDATION_ERROR", "잘못된 차트 기간입니다.", 422, query.error.flatten());
    const parsed = stockConfigSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("VALIDATION_ERROR", "종목 설정 형식이 올바르지 않습니다.", 422, parsed.error.flatten());
    const stock = parsed.data;
    const matchesSymbol = [stock.id, stock.koreanSymbol, stock.receiptSymbol].some((value) => value.toLowerCase() === symbol.toLowerCase());
    if (!matchesSymbol) return apiError("SYMBOL_MISMATCH", "요청 경로와 종목 설정이 일치하지 않습니다.", 422);
    const history = await getHistoricalComparisonForStock(stock, query.data.range);
    return NextResponse.json({ ...history, statistics: summarizeHistory(history.points) });
  } catch (error) {
    return apiError("MARKET_DATA_HISTORY_FAILED", error instanceof Error ? error.message : "과거 데이터 조회 실패");
  }
}
