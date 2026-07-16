"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/features/settings/components/settings-provider";
import { StockSettingsProvider } from "@/features/settings/components/stock-settings-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            gcTime: 5 * 60_000,
            retry: process.env.NODE_ENV === "test" ? false : 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <StockSettingsProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </StockSettingsProvider>
        </SettingsProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
