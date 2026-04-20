import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Toggle, toggleVariants } from "./toggle";

describe("Toggle", () => {
  it("renders", () => {
    render(<Toggle>Bold</Toggle>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<Toggle>Toggle</Toggle>);
    expect(screen.getByRole("button")).toHaveAttribute("data-slot", "toggle");
  });

  it("merges custom className", () => {
    render(<Toggle className="custom-class">Toggle</Toggle>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Toggle disabled>Toggle</Toggle>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  describe("variants", () => {
    it("applies default variant", () => {
      render(<Toggle variant="default">Toggle</Toggle>);
      expect(screen.getByRole("button")).toHaveClass("bg-transparent");
    });

    it("applies outline variant", () => {
      render(<Toggle variant="outline">Toggle</Toggle>);
      expect(screen.getByRole("button")).toHaveClass("border");
    });
  });

  describe("sizes", () => {
    it("applies default size", () => {
      render(<Toggle size="default">Toggle</Toggle>);
      expect(screen.getByRole("button")).toHaveClass("h-8");
    });

    it("applies sm size", () => {
      render(<Toggle size="sm">Toggle</Toggle>);
      expect(screen.getByRole("button")).toHaveClass("h-7");
    });

    it("applies lg size", () => {
      render(<Toggle size="lg">Toggle</Toggle>);
      expect(screen.getByRole("button")).toHaveClass("h-9");
    });
  });
});

describe("toggleVariants", () => {
  it("is a function that returns a className string", () => {
    expect(typeof toggleVariants({ variant: "default", size: "default" })).toBe("string");
  });
});

describe("Toggle interactions", () => {
  it("becomes pressed on click", () => {
    render(<Toggle>Bold</Toggle>);
    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onPressedChange with true when clicked unpressed", () => {
    const onPressedChange = vi.fn();
    render(<Toggle onPressedChange={onPressedChange}>Bold</Toggle>);
    fireEvent.click(screen.getByRole("button"));
    expect(onPressedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("toggles back to unpressed on second click", () => {
    render(<Toggle>Bold</Toggle>);
    const toggle = screen.getByRole("button");
    fireEvent.click(toggle);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
