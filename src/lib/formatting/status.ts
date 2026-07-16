import type { DepositaryReceiptTradingStatus, DepositaryReceiptType, MarketSessionStatus, PremiumDiscountDirection, PremiumDiscountLevel } from "@/features/market-data/types";

export function levelLabel(level: PremiumDiscountLevel) {
  return { neutral: "정상", caution: "주의", warning: "경고", danger: "위험" }[level];
}

export function directionLabel(direction: PremiumDiscountDirection, receiptType: DepositaryReceiptType = "ADR") {
  return { premium: `${receiptType} 프리미엄`, discount: `${receiptType} 디스카운트`, neutral: "중립" }[direction];
}

export function marketStatusLabel(status: MarketSessionStatus) {
  return {
    pre_market: "프리마켓",
    regular: "거래 중",
    after_market: "애프터마켓",
    closed: "장 종료",
    pre_open: "거래 전",
    post_close: "거래 종료",
    holiday: "휴장일",
    delayed: "가격 데이터 지연",
    failed: "가격 조회 실패",
  }[status];
}

export function receiptStatusLabel(status: DepositaryReceiptTradingStatus, receiptType: DepositaryReceiptType = "ADR") {
  return {
    active: `정상 ${receiptType} 거래`,
    suspended: `${receiptType} 거래 중단`,
    delisted: `${receiptType} 상장 폐지`,
    unverified: `${receiptType} 정보 미확인`,
    custom: "사용자 정의 DR 또는 대체 해외 상장 주식",
    inactive: "비활성화",
  }[status];
}

/** @deprecated receiptStatusLabel을 사용하세요. */
export const adrStatusLabel = receiptStatusLabel;
