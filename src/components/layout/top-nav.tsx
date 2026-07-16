"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, Moon, Settings, Sun, X, BarChart3 } from "lucide-react";
import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "대시보드", icon: BarChart3 },
  { href: "/alerts", label: "알림 이력", icon: Bell },
  { href: "/settings", label: "설정", icon: Settings },
];

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold" aria-label="DR 대시보드 홈">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="size-4" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">ADR·GDR 괴리율 대시보드</span>
          <span className="sm:hidden">DR</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="주요 메뉴">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Button key={item.href} asChild variant={active ? "secondary" : "ghost"} size="sm">
                <Link href={item.href} className={cn(active && "font-semibold")}>
                  <Icon aria-hidden="true" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="다크 모드 전환"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="size-4 dark:hidden" aria-hidden="true" />
            <Moon className="hidden size-4 dark:block" aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="md:hidden" aria-label="모바일 메뉴 열기" onClick={() => setOpen(true)}>
            <Menu className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t bg-background p-4 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">메뉴</span>
            <Button type="button" variant="ghost" size="icon" aria-label="모바일 메뉴 닫기" onClick={() => setOpen(false)}>
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <nav className="grid gap-2" aria-label="모바일 메뉴">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button key={item.href} asChild variant={pathname === item.href ? "secondary" : "ghost"} className="justify-start">
                  <Link href={item.href} onClick={() => setOpen(false)}>
                    <Icon aria-hidden="true" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
