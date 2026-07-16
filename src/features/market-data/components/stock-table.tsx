import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { MarketComparison } from "@/features/market-data/types";
import { PremiumDiscountBadge } from "@/features/market-data/components/status-badge";
import { formatDateTimeKo } from "@/lib/date/timezone";
import { formatCurrencyKrwRate, formatCurrencyPrice, formatKrw, formatPercent } from "@/lib/formatting/number";

export function StockTable({ items }: { items: MarketComparison[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>종목</TableHead>
          <TableHead>한국 주가</TableHead>
          <TableHead>DR 가격</TableHead>
          <TableHead>DR 환산가</TableHead>
          <TableHead>괴리율</TableHead>
          <TableHead>환율</TableHead>
          <TableHead>데이터</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <Link className="font-medium hover:underline" href={`/stocks/${item.id}`}>
                {item.nameKo}
              </Link>
              <div className="text-xs text-muted-foreground">{item.koreanSymbol} · {item.receiptType} {item.receiptSymbol}</div>
            </TableCell>
            <TableCell>{formatKrw(item.koreanPrice)} <span className="text-xs text-muted-foreground">{formatPercent(item.koreanChangeRate)}</span></TableCell>
            <TableCell>{formatCurrencyPrice(item.receiptPrice, item.receiptCurrency)} <span className="text-xs text-muted-foreground">{formatPercent(item.receiptChangeRate)}</span></TableCell>
            <TableCell>{formatKrw(item.convertedReceiptPriceKrw)}</TableCell>
            <TableCell><PremiumDiscountBadge level={item.level} direction={item.direction} rate={item.premiumDiscountRate} receiptType={item.receiptType} /></TableCell>
            <TableCell>{formatCurrencyKrwRate(item.currencyKrwRate, item.receiptCurrency)}</TableCell>
            <TableCell>
              <Badge variant={item.error ? "danger" : item.isDelayed ? "warning" : "success"}>{item.error ? "오류" : item.isDelayed ? "지연" : "정상"}</Badge>
              <div className="text-xs text-muted-foreground">{formatDateTimeKo(item.quotedAt)}</div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
