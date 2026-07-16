"use client";

import * as React from "react";
import type { MarketComparison } from "@/features/market-data/types";
import { useStockSettings } from "@/features/settings/components/stock-settings-provider";
import { calculateConvertedDepositaryReceiptPrice, calculatePremiumDiscountRate, getPremiumDiscountDirection, getPremiumDiscountLevel } from "@/lib/calculations/premium-discount";

export function useLocalizedMarketItems(items: MarketComparison[] | undefined) {
  const { stocks } = useStockSettings();
  return React.useMemo(() => {
    if (!items) return [];
    return items.map((item) => {
      const stock = stocks.find((candidate) => candidate.id === item.id);
      if (!stock) return item;
      const quoteMatchesSettings = stock.receiptSymbol === item.receiptSymbol && stock.receiptCurrency === item.receiptCurrency;
      if (!quoteMatchesSettings) {
        return {
          ...item,
          isActive: stock.isActive,
          isFavorite: stock.isFavorite,
          note: stock.note,
          warnings: [...new Set([...item.warnings, "변경된 DR 설정 데이터를 조회 중입니다."])],
        };
      }
      const converted = calculateConvertedDepositaryReceiptPrice({
        receiptPrice: item.receiptPrice,
        currencyKrwRate: item.currencyKrwRate,
        receiptRatio: stock.receiptRatio,
      });
      const premiumDiscount = calculatePremiumDiscountRate({
        convertedReceiptPriceKrw: converted.value,
        koreanPriceKrw: item.koreanPrice,
      });
      return {
        ...item,
        nameKo: stock.nameKo,
        nameEn: stock.nameEn,
        koreanSymbol: stock.koreanSymbol,
        receiptType: stock.receiptType,
        receiptSymbol: stock.receiptSymbol,
        receiptRatio: stock.receiptRatio,
        receiptStatus: stock.receiptStatus,
        receiptCurrency: stock.receiptCurrency,
        convertedReceiptPriceKrw: converted.value,
        adrSymbol: stock.receiptSymbol,
        adrRatio: stock.receiptRatio,
        adrStatus: stock.receiptStatus,
        isActive: stock.isActive,
        isFavorite: stock.isFavorite,
        note: stock.note,
        convertedAdrPriceKrw: converted.value,
        premiumDiscountRate: premiumDiscount.value,
        level: getPremiumDiscountLevel(premiumDiscount.value),
        direction: getPremiumDiscountDirection(premiumDiscount.value),
        warnings: [...new Set([...item.warnings, ...converted.warnings, ...premiumDiscount.warnings])],
      };
    });
  }, [items, stocks]);
}
