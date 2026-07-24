import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import { StatePanel } from "./fixtures/state-panel.js";

describe("React component harness", () => {
  it("renders loading and empty states", () => {
    const { rerender } = render(<StatePanel onRetry={vi.fn()} state={{ status: "loading" }} />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading accounts");
    rerender(<StatePanel onRetry={vi.fn()} state={{ status: "empty" }} />);
    expect(screen.getByText("No accounts found.")).toBeInTheDocument();
  });

  it("renders successful data", () => {
    render(
      <StatePanel onRetry={vi.fn()} state={{ items: ["Primary", "Sandbox"], status: "success" }} />,
    );

    expect(screen.getByRole("list", { name: "Accounts" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders errors and supports keyboard retry", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <StatePanel onRetry={onRetry} state={{ message: "Network unavailable", status: "error" }} />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Network unavailable");
    await user.tab();
    expect(screen.getByRole("button", { name: "Retry" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("has no automatically detectable accessibility violations", async () => {
    const { container } = render(
      <StatePanel onRetry={vi.fn()} state={{ message: "Network unavailable", status: "error" }} />,
    );
    const result = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });

    expect(result.violations).toEqual([]);
  });
});
