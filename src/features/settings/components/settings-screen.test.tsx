import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsScreen } from "@/features/settings/components/settings-screen";
import { renderWithProviders } from "@/test/render-with-providers";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
}));

describe("SettingsScreen", () => {
  it("설정 화면을 렌더링한다", () => {
    vi.stubGlobal("fetch", vi.fn());
    renderWithProviders(<SettingsScreen />);
    expect(screen.getByRole("heading", { name: "설정" })).toBeInTheDocument();
    expect(screen.getByText("종목 설정")).toBeInTheDocument();
  });

  it("종목의 예탁증서 유형을 GDR로 변경할 수 있다", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const user = userEvent.setup();
    renderWithProviders(<SettingsScreen />);

    const trigger = screen.getByLabelText("SK하이닉스 ADR SKHY 예탁증서 유형");
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "GDR" }));

    expect(trigger).toHaveTextContent("GDR");
  });
});
