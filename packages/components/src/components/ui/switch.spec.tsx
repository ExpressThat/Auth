import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
