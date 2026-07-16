"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CardFilter, SortKey, ViewMode } from "@/features/settings/types";

export function DashboardControls({
  search,
  setSearch,
  sortKey,
  setSortKey,
  filter,
  setFilter,
  viewMode,
  setViewMode,
}: {
  search: string;
  setSearch: (value: string) => void;
  sortKey: SortKey;
  setSortKey: (value: SortKey) => void;
  filter: CardFilter;
  setFilter: (value: CardFilter) => void;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[1fr_190px_150px_130px]">
      <label className="relative block">
        <span className="sr-only">종목 검색</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="종목명, 코드, DR 티커 검색" />
      </label>
      <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
        <SelectTrigger aria-label="정렬 기준">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="absoluteGapDesc">괴리율 절댓값 큰 순</SelectItem>
          <SelectItem value="gapDesc">괴리율 높은 순</SelectItem>
          <SelectItem value="gapAsc">괴리율 낮은 순</SelectItem>
          <SelectItem value="nameAsc">종목명 순</SelectItem>
          <SelectItem value="koreanChangeDesc">한국 등락률 순</SelectItem>
          <SelectItem value="adrChangeDesc">DR 등락률 순</SelectItem>
          <SelectItem value="customOrder">사용자 지정 순서</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filter} onValueChange={(value) => setFilter(value as CardFilter)}>
        <SelectTrigger aria-label="필터">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="normal">정상</SelectItem>
          <SelectItem value="caution">3% 이상</SelectItem>
          <SelectItem value="warning">5% 이상</SelectItem>
          <SelectItem value="danger">10% 이상</SelectItem>
          <SelectItem value="premium">DR 프리미엄</SelectItem>
          <SelectItem value="discount">DR 디스카운트</SelectItem>
          <SelectItem value="dataError">데이터 오류</SelectItem>
          <SelectItem value="trading">거래 중</SelectItem>
          <SelectItem value="closed">장 종료</SelectItem>
          <SelectItem value="favorite">즐겨찾기</SelectItem>
        </SelectContent>
      </Select>
      <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
        <SelectTrigger aria-label="보기 방식">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="card">카드형 보기</SelectItem>
          <SelectItem value="table">테이블형 보기</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
