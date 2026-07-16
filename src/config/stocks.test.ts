import { describe, expect, it } from "vitest";
import { getStockByIdOrSymbol, STOCKS } from "@/config/stocks";

describe("기본 DR 종목 설정", () => {
  it("ADR이 없는 삼성전자 보통주를 런던 GDR로 추적한다", () => {
    const samsung = getStockByIdOrSymbol("005930");

    expect(samsung).toMatchObject({
      id: "samsung-electronics",
      receiptType: "GDR",
      receiptSymbol: "SMSN",
      receiptRatio: 25,
      receiptExchange: "LSE",
      receiptCurrency: "USD",
      receiptStatus: "active",
    });
    expect(STOCKS).toHaveLength(11);
  });

  it("SK하이닉스 ADR과 GDR을 각각 독립된 비교 대상으로 관리한다", () => {
    const skHynixReceipts = STOCKS.filter((stock) => stock.koreanSymbol === "000660");

    expect(skHynixReceipts).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "sk-hynix", receiptType: "ADR", receiptSymbol: "SKHY", receiptRatio: 0.1, receiptExchange: "NASDAQ" }),
      expect.objectContaining({ id: "sk-hynix-gdr", receiptType: "GDR", receiptSymbol: "HYXS", receiptRatio: 1, receiptExchange: "LUX" }),
    ]));
  });
});
