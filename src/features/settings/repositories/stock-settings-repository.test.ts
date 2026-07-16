import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageStockSettingsRepository, mergeDefaultStocks, normalizeStoredStock } from "@/features/settings/repositories/stock-settings-repository";
import { STOCKS } from "@/config/stocks";

describe("normalizeStoredStock", () => {
  it("기존 ADR 설정을 새 DR 설정으로 마이그레이션한다", () => {
    const migrated = normalizeStoredStock({
      id: "legacy",
      nameKo: "기존 종목",
      nameEn: "Legacy",
      koreanSymbol: "000000",
      adrSymbol: "OLD",
      adrRatio: 2,
      adrStatus: "active",
      adrExchange: "NYSE",
      adrCurrency: "USD",
      isActive: true,
      isFavorite: false,
      sortOrder: 1,
      note: "기존 설정",
      dataProviderSymbols: {
        korean: { krx: "000000" },
        adr: { yahoo: "OLD" },
      },
    });

    expect(migrated).toMatchObject({
      receiptType: "ADR",
      receiptSymbol: "OLD",
      receiptRatio: 2,
      receiptStatus: "active",
      receiptExchange: "NYSE",
      receiptCurrency: "USD",
    });
    expect(migrated?.dataProviderSymbols.receipt.yahoo).toBe("OLD");
  });

  it("새 GDR 설정을 그대로 검증한다", () => {
    const normalized = normalizeStoredStock({
      id: "gdr-stock",
      nameKo: "GDR 종목",
      nameEn: "GDR Stock",
      koreanSymbol: "000001",
      receiptType: "GDR",
      receiptSymbol: "GDR1",
      receiptRatio: 0.5,
      receiptStatus: "active",
      receiptExchange: "LSE",
      receiptCurrency: "GBP",
      isActive: true,
      isFavorite: true,
      sortOrder: 2,
      note: "GDR 설정",
      dataProviderSymbols: {
        korean: { krx: "000001" },
        receipt: { custom: "GDR1" },
      },
    });

    expect(normalized?.receiptType).toBe("GDR");
    expect(normalized?.receiptCurrency).toBe("GBP");
  });

  it("잘못된 비율의 저장값은 거부한다", () => {
    expect(normalizeStoredStock({ id: "invalid", receiptRatio: 0 })).toBeNull();
  });
});

describe("mergeDefaultStocks", () => {
  it("기존 사용자 설정을 유지하면서 새 기본 종목만 뒤에 추가한다", () => {
    const customized = { ...STOCKS[0], nameKo: "사용자 수정 종목" };
    const merged = mergeDefaultStocks([customized], [STOCKS[0], STOCKS[1]]);

    expect(merged).toHaveLength(2);
    expect(merged[0].nameKo).toBe("사용자 수정 종목");
    expect(merged[1].id).toBe(STOCKS[1].id);
  });
});

describe("LocalStorageStockSettingsRepository", () => {
  beforeEach(() => localStorage.clear());

  it("v2 설정을 보존하고 신규 삼성전자와 SK하이닉스 GDR만 추가한다", async () => {
    localStorage.setItem("dr-dashboard:stocks:v2", JSON.stringify([STOCKS[0]]));

    const stocks = await new LocalStorageStockSettingsRepository().getStocks();

    expect(stocks.map((stock) => stock.id)).toEqual(["sk-hynix", "sk-hynix-gdr", "samsung-electronics"]);
    expect(JSON.parse(localStorage.getItem("dr-dashboard:stocks:v4") ?? "[]")).toHaveLength(3);
  });

  it("확인용 GDR-MOCK 설정을 공식 SK하이닉스 ADR 설정으로 복구한다", async () => {
    localStorage.setItem("dr-dashboard:stocks:v3", JSON.stringify([{
      ...STOCKS[0],
      receiptType: "GDR",
      receiptSymbol: "GDR-MOCK",
      receiptRatio: 0.1,
      receiptExchange: "LSE",
      receiptCurrency: "EUR",
    }]));

    const stocks = await new LocalStorageStockSettingsRepository().getStocks();

    expect(stocks.find((stock) => stock.id === "sk-hynix")).toMatchObject({
      receiptType: "ADR",
      receiptSymbol: "SKHY",
      receiptRatio: 0.1,
      receiptExchange: "NASDAQ",
      receiptCurrency: "USD",
    });
    expect(stocks.find((stock) => stock.id === "sk-hynix-gdr")).toMatchObject({ receiptType: "GDR", receiptSymbol: "HYXS", receiptRatio: 1 });
  });
});
