import { render } from "@testing-library/react";
import { AppProviders } from "@/components/providers";

export function renderWithProviders(ui: React.ReactNode) {
  return render(<AppProviders>{ui}</AppProviders>);
}
