import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ButtonGroup, ButtonGroupSeparator } from "./button-group";

describe("ButtonGroup", () => {
  it("renders", () => {
    render(<ButtonGroup aria-label="actions" />);
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<ButtonGroup aria-label="actions" />);
    expect(screen.getByRole("group")).toHaveAttribute("data-slot", "button-group");
  });

  it("merges custom className", () => {
    render(<ButtonGroup aria-label="actions" className="custom-class" />);
    expect(screen.getByRole("group")).toHaveClass("custom-class");
  });

  it("applies explicit horizontal orientation", () => {
    render(<ButtonGroup aria-label="actions" orientation="horizontal" />);
    expect(screen.getByRole("group")).toHaveAttribute("data-orientation", "horizontal");
  });

  it("applies vertical orientation", () => {
    render(<ButtonGroup aria-label="actions" orientation="vertical" />);
    expect(screen.getByRole("group")).toHaveAttribute("data-orientation", "vertical");
  });

  it("renders children", () => {
    render(
      <ButtonGroup aria-label="actions">
        <button type="button">A</button>
        <button type="button">B</button>
      </ButtonGroup>,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});

describe("ButtonGroupSeparator", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<ButtonGroupSeparator />);
    expect(container.firstChild).toHaveAttribute("data-slot", "button-group-separator");
  });
});
