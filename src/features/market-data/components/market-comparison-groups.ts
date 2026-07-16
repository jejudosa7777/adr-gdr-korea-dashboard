import type { MarketComparison } from "@/features/market-data/types";

export interface MarketComparisonGroup {
  koreanSymbol: string;
  nameKo: string;
  nameEn: string;
  items: MarketComparison[];
}

export function groupMarketComparisons(items: MarketComparison[]): MarketComparisonGroup[] {
  const groups = new Map<string, MarketComparisonGroup>();

  for (const item of items) {
    const group = groups.get(item.koreanSymbol);
    if (group) {
      group.items.push(item);
      continue;
    }
    groups.set(item.koreanSymbol, {
      koreanSymbol: item.koreanSymbol,
      nameKo: item.nameKo,
      nameEn: item.nameEn,
      items: [item],
    });
  }

  return [...groups.values()];
}
