import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
  it("renders", () => {
    render(<Switch />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<Switch />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-slot", "switch");
  });

  it("merges custom className", () => {
    render(<Switch className="custom-class" />);
    expect(screen.getByRole("switch")).toHaveClass("custom-class");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Switch disabled />);
    expect(screen.getByRole("switch")).toHaveAttribute("data-disabled");
  });

  describe("sizes", () => {
    it("applies default size", () => {
      render(<Switch size="default" />);
      expect(screen.getByRole("switch")).toHaveAttribute("data-size", "default");
    });

    it("applies sm size", () => {
      render(<Switch size="sm" />);
      expect(screen.getByRole("switch")).toHaveAttribute("data-size", "sm");
    });
  });
});

describe("Switch interactions", () => {
  it("becomes checked on click", () => {
    render(<Switch />);
    const sw = screen.getByRole("switch");
    fireEvent.click(sw);
    expect(sw).toHaveAttribute("data-checked");
  });

  it("calls onCheckedChange with true when clicked", () => {
    const onCheckedChange = vi.fn();
    render(<Switch onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("does not call onCheckedChange when disabled", () => {
    const onCheckedChange = vi.fn();
    render(<Switch disabled onCheckedChange={onCheckedChange} />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
