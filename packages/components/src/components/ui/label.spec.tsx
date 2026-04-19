import { fireEvent, render, screen } from "@testing-library/react";
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

describe("Label interactions", () => {
  it("clicking label does not throw", () => {
    render(
      <>
        <Label htmlFor="test-input">My Label</Label>
        <input id="test-input" />
      </>,
    );
    expect(() => fireEvent.click(screen.getByText("My Label"))).not.toThrow();
  });

  it("label has correct for attribute connecting to associated input", () => {
    render(
      <>
        <Label htmlFor="linked-input">My Label</Label>
        <input id="linked-input" />
      </>,
    );
    const label = screen.getByText("My Label");
    expect(label).toHaveAttribute("for", "linked-input");
  });
});
