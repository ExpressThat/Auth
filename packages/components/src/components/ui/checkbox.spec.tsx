import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Checkbox } from "./checkbox";

describe("Checkbox", () => {
  it("renders", () => {
    const { container } = render(<Checkbox />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Checkbox />);
    expect(container.firstChild).toHaveAttribute("data-slot", "checkbox");
  });

  it("merges custom className", () => {
    const { container } = render(<Checkbox className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders as a button element", () => {
    render(<Checkbox />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(<Checkbox disabled />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("data-disabled");
  });
});
