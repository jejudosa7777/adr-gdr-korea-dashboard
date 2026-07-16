import { NextResponse } from "next/server";
import { getMarketComparisonForStock, getMarketDataForSymbol } from "@/features/market-data/api/market-comparison-service";
import { apiError } from "@/lib/api/responses";
import { stockConfigSchema } from "@/features/market-data/schemas/stock-config-schema";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const item = await getMarketDataForSymbol(symbol);
    if (!item) return apiError("NOT_FOUND", "종목을 찾을 수 없습니다.", 404);
    return NextResponse.json(item);
  } catch (error) {
    return apiError("MARKET_DATA_SYMBOL_FAILED", error instanceof Error ? error.message : "종목 데이터 조회 실패");
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  try {
    const { symbol } = await params;
    const parsed = stockConfigSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("VALIDATION_ERROR", "종목 설정 형식이 올바르지 않습니다.", 422, parsed.error.flatten());
    const stock = parsed.data;
    const matchesSymbol = [stock.id, stock.koreanSymbol, stock.receiptSymbol].some((value) => value.toLowerCase() === symbol.toLowerCase());
    if (!matchesSymbol) return apiError("SYMBOL_MISMATCH", "요청 경로와 종목 설정이 일치하지 않습니다.", 422);
    return NextResponse.json(await getMarketComparisonForStock(stock));
  } catch (error) {
    return apiError("MARKET_DATA_SYMBOL_FAILED", error instanceof Error ? error.message : "종목 데이터 조회 실패");
  }
}
