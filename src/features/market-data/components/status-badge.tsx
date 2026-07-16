import { AlertTriangle, ArrowDown, ArrowRight, ArrowUp, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DepositaryReceiptType, PremiumDiscountDirection, PremiumDiscountLevel } from "@/features/market-data/types";
import { directionLabel, levelLabel } from "@/lib/formatting/status";

export function PremiumDiscountBadge({
  level,
  direction,
  rate,
  receiptType = "ADR",
}: {
  level: PremiumDiscountLevel;
  direction: PremiumDiscountDirection;
  rate: number | null;
  receiptType?: DepositaryReceiptType;
}) {
  const DirectionIcon = direction === "premium" ? ArrowUp : direction === "discount" ? ArrowDown : ArrowRight;
  const LevelIcon = level === "neutral" ? ShieldCheck : AlertTriangle;
  const text = `${levelLabel(level)} · ${directionLabel(direction, receiptType)}`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={level} aria-label={`${text}. 괴리율 ${rate === null ? "데이터 없음" : `${rate.toFixed(2)}%`}`}>
          <LevelIcon aria-hidden="true" />
          <DirectionIcon aria-hidden="true" />
          {text}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        절댓값 3% 이상 주의, 5% 이상 경고, 10% 이상 위험입니다. 양수는 DR 프리미엄, 음수는 DR 디스카운트입니다.
      </TooltipContent>
    </Tooltip>
  );
}
