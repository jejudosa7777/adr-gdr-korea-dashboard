import { AppShell } from "@/components/layout/app-shell";
import { Dashboard } from "@/features/market-data/components/dashboard";

export default function Home() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
