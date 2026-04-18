import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxSeparator,
} from "./combobox";

describe("Combobox", () => {
  it("renders", () => {
    const { container } = render(<Combobox />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("ComboboxEmpty", () => {
  it("sets data-slot attribute", () => {
    render(
      <Combobox>
        <ComboboxEmpty>No results</ComboboxEmpty>
      </Combobox>,
    );
    expect(document.querySelector('[data-slot="combobox-empty"]')).toBeInTheDocument();
  });
});

describe("ComboboxGroup", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<ComboboxGroup />);
    expect(container.firstChild).toHaveAttribute("data-slot", "combobox-group");
  });
});

describe("ComboboxLabel", () => {
  it("renders children", () => {
    render(
      <ComboboxGroup>
        <ComboboxLabel>Fruits</ComboboxLabel>
      </ComboboxGroup>,
    );
    expect(screen.getByText("Fruits")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <ComboboxGroup>
        <ComboboxLabel>Label</ComboboxLabel>
      </ComboboxGroup>,
    );
    expect(screen.getByText("Label")).toHaveAttribute("data-slot", "combobox-label");
  });
});

describe("ComboboxItem", () => {
  it("renders children", () => {
    render(
      <Combobox>
        <ComboboxItem value="apple">Apple</ComboboxItem>
      </Combobox>,
    );
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Combobox>
        <ComboboxItem value="apple">Apple</ComboboxItem>
      </Combobox>,
    );
    expect(document.querySelector('[data-slot="combobox-item"]')).toBeInTheDocument();
  });
});

describe("ComboboxSeparator", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<ComboboxSeparator />);
    expect(container.firstChild).toHaveAttribute("data-slot", "combobox-separator");
  });
});

describe("ComboboxChips", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(
      <Combobox>
        <ComboboxChips />
      </Combobox>,
    );
    expect(container.querySelector('[data-slot="combobox-chips"]')).toBeInTheDocument();
  });
});

describe("ComboboxChip", () => {
  it("renders children", () => {
    render(
      <Combobox>
        <ComboboxChips>
          <ComboboxChip>Apple</ComboboxChip>
        </ComboboxChips>
      </Combobox>,
    );
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Combobox>
        <ComboboxChips>
          <ComboboxChip>Apple</ComboboxChip>
        </ComboboxChips>
      </Combobox>,
    );
    expect(document.querySelector('[data-slot="combobox-chip"]')).toBeInTheDocument();
  });
});
