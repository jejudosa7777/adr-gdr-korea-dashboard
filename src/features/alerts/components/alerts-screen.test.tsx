import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AlertsScreen } from "@/features/alerts/components/alerts-screen";
import { renderWithProviders } from "@/test/render-with-providers";

vi.mock("next/navigation", () => ({
  usePathname: () => "/alerts",
}));

describe("AlertsScreen", () => {
  it("알림 이력 화면을 렌더링한다", () => {
    renderWithProviders(<AlertsScreen />);
    expect(screen.getByRole("heading", { name: "알림 이력" })).toBeInTheDocument();
    expect(screen.getByText("알림 이력 없음")).toBeInTheDocument();
  });
});
