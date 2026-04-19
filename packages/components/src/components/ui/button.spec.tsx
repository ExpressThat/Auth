import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("sets data-slot attribute", () => {
    render(<Button>Slot</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-slot", "button");
  });

  describe("variants", () => {
    it("applies default variant classes", () => {
      render(<Button variant="default">Default</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-primary");
    });

    it("applies outline variant classes", () => {
      render(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole("button")).toHaveClass("border-border");
    });

    it("applies secondary variant classes", () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole("button")).toHaveClass("bg-secondary");
    });

    it("applies ghost variant classes", () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole("button")).toHaveClass("hover:bg-muted");
    });

    it("applies destructive variant classes", () => {
      render(<Button variant="destructive">Destructive</Button>);
      expect(screen.getByRole("button")).toHaveClass("text-destructive");
    });

    it("applies link variant classes", () => {
      render(<Button variant="link">Link</Button>);
      expect(screen.getByRole("button")).toHaveClass("underline-offset-4");
    });
  });

  describe("sizes", () => {
    it("applies default size classes", () => {
      render(<Button size="default">Default</Button>);
      expect(screen.getByRole("button")).toHaveClass("h-8");
    });

    it("applies xs size classes", () => {
      render(<Button size="xs">XS</Button>);
      expect(screen.getByRole("button")).toHaveClass("h-6");
    });

    it("applies sm size classes", () => {
      render(<Button size="sm">SM</Button>);
      expect(screen.getByRole("button")).toHaveClass("h-7");
    });

    it("applies lg size classes", () => {
      render(<Button size="lg">LG</Button>);
      expect(screen.getByRole("button")).toHaveClass("h-9");
    });

    it("applies icon size classes", () => {
      render(<Button size="icon">Icon</Button>);
      expect(screen.getByRole("button")).toHaveClass("size-8");
    });

    it("applies icon-xs size classes", () => {
      render(<Button size="icon-xs">Icon XS</Button>);
      expect(screen.getByRole("button")).toHaveClass("size-6");
    });

    it("applies icon-sm size classes", () => {
      render(<Button size="icon-sm">Icon SM</Button>);
      expect(screen.getByRole("button")).toHaveClass("size-7");
    });

    it("applies icon-lg size classes", () => {
      render(<Button size="icon-lg">Icon LG</Button>);
      expect(screen.getByRole("button")).toHaveClass("size-9");
    });
  });

  it("merges custom className", () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole("button")).toHaveClass("custom-class");
  });
});
