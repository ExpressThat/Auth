import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RadioGroup, RadioGroupItem } from "./radio-group";

describe("RadioGroup", () => {
  it("renders", () => {
    const { container } = render(<RadioGroup />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<RadioGroup />);
    expect(container.firstChild).toHaveAttribute("data-slot", "radio-group");
  });

  it("merges custom className", () => {
    const { container } = render(<RadioGroup className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders children", () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="a" aria-label="Option A" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radio")).toBeInTheDocument();
  });
});

describe("RadioGroupItem", () => {
  it("renders as a radio button", () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="x" aria-label="X" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radio", { name: "X" })).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="x" aria-label="X" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radio")).toHaveAttribute("data-slot", "radio-group-item");
  });

  it("merges custom className", () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="x" aria-label="X" className="custom-class" />
      </RadioGroup>,
    );
    expect(screen.getByRole("radio")).toHaveClass("custom-class");
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="x" aria-label="X" disabled />
      </RadioGroup>,
    );
    expect(screen.getByRole("radio")).toHaveAttribute("data-disabled");
  });
});
