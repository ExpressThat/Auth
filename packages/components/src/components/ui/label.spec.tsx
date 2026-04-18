import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./label";

describe("Label", () => {
  it("renders children", () => {
    render(<Label>My Label</Label>);
    expect(screen.getByText("My Label")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<Label>Label</Label>);
    expect(screen.getByText("Label")).toHaveAttribute("data-slot", "label");
  });

  it("renders as a label element", () => {
    render(<Label htmlFor="my-input">Label</Label>);
    const label = screen.getByText("Label");
    expect(label.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", "my-input");
  });

  it("merges custom className", () => {
    render(<Label className="custom-class">Label</Label>);
    expect(screen.getByText("Label")).toHaveClass("custom-class");
  });
});
