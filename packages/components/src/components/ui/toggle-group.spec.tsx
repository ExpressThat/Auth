import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

describe("ToggleGroup", () => {
  it("renders", () => {
    const { container } = render(
      <ToggleGroup>
        <ToggleGroupItem value="bold">B</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<ToggleGroup />);
    expect(container.firstChild).toHaveAttribute("data-slot", "toggle-group");
  });

  it("merges custom className", () => {
    const { container } = render(<ToggleGroup className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("ToggleGroupItem", () => {
  it("renders children", () => {
    render(
      <ToggleGroup>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByText("Bold")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <ToggleGroup>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(document.querySelector('[data-slot="toggle-group-item"]')).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(
      <ToggleGroup>
        <ToggleGroupItem value="bold" className="custom-class">
          Bold
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(document.querySelector('[data-slot="toggle-group-item"]')).toHaveClass("custom-class");
  });
});
