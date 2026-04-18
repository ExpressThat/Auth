import { vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light" }),
}));

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toaster } from "./sonner";

describe("Toaster", () => {
  it("renders without errors", () => {
    const { container } = render(<Toaster />);
    expect(container).toBeInTheDocument();
  });
});
