import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

describe("ToggleGroupItem interactions", () => {
  it("sets aria-pressed on clicked item", () => {
    render(
      <ToggleGroup>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      </ToggleGroup>,
    );
    const item = document.querySelector('[data-slot="toggle-group-item"]')!;
    fireEvent.click(item);
    expect(item).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onValueChange when an item is clicked", () => {
    const onValueChange = vi.fn();
    render(
      <ToggleGroup onValueChange={onValueChange}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      </ToggleGroup>,
    );
    fireEvent.click(document.querySelector('[data-slot="toggle-group-item"]')!);
    expect(onValueChange).toHaveBeenCalled();
  });

  it("each item can be independently pressed in multiple mode", () => {
    render(
      <ToggleGroup multiple>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );
    const items = document.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]');
    fireEvent.click(items[0]!);
    expect(items[0]).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(items[1]!);
    expect(items[1]).toHaveAttribute("aria-pressed", "true");
  });
});
