import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge, badgeVariants } from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<Badge>Badge</Badge>);
    expect(screen.getByText("Badge")).toHaveAttribute("data-slot", "badge");
  });

  it("merges custom className", () => {
    render(<Badge className="custom-class">Badge</Badge>);
    expect(screen.getByText("Badge")).toHaveClass("custom-class");
  });

  describe("variants", () => {
    it("applies default variant", () => {
      render(<Badge variant="default">Badge</Badge>);
      expect(screen.getByText("Badge")).toHaveClass("bg-primary");
    });

    it("applies secondary variant", () => {
      render(<Badge variant="secondary">Badge</Badge>);
      expect(screen.getByText("Badge")).toHaveClass("bg-secondary");
    });

    it("applies destructive variant", () => {
      render(<Badge variant="destructive">Badge</Badge>);
      expect(screen.getByText("Badge")).toHaveClass("text-destructive");
    });

    it("applies outline variant", () => {
      render(<Badge variant="outline">Badge</Badge>);
      expect(screen.getByText("Badge")).toHaveClass("border-border");
    });
  });
});

describe("badgeVariants", () => {
  it("is a function that returns a className string", () => {
    expect(typeof badgeVariants({ variant: "default" })).toBe("string");
  });
});
