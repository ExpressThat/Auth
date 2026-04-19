import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

describe("Select", () => {
  it("renders a trigger", () => {
    render(
      <Select>
        <SelectTrigger aria-label="select">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows placeholder text", () => {
    render(
      <Select>
        <SelectTrigger aria-label="select">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
      </Select>,
    );
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });
});

describe("SelectTrigger", () => {
  it("sets data-slot attribute", () => {
    render(
      <Select>
        <SelectTrigger aria-label="select" />
      </Select>,
    );
    expect(screen.getByRole("combobox")).toHaveAttribute("data-slot", "select-trigger");
  });

  it("merges custom className", () => {
    render(
      <Select>
        <SelectTrigger aria-label="select" className="custom-class" />
      </Select>,
    );
    expect(screen.getByRole("combobox")).toHaveClass("custom-class");
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <Select>
        <SelectTrigger aria-label="select" disabled />
      </Select>,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("applies default size", () => {
    render(
      <Select>
        <SelectTrigger aria-label="select" size="default" />
      </Select>,
    );
    expect(screen.getByRole("combobox")).toHaveAttribute("data-size", "default");
  });

  it("applies sm size", () => {
    render(
      <Select>
        <SelectTrigger aria-label="select" size="sm" />
      </Select>,
    );
    expect(screen.getByRole("combobox")).toHaveAttribute("data-size", "sm");
  });
});

describe("SelectGroup", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<SelectGroup />);
    expect(container.firstChild).toHaveAttribute("data-slot", "select-group");
  });
});

describe("SelectLabel", () => {
  it("renders children", () => {
    render(
      <SelectGroup>
        <SelectLabel>Fruits</SelectLabel>
      </SelectGroup>,
    );
    expect(screen.getByText("Fruits")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <SelectGroup>
        <SelectLabel>Label</SelectLabel>
      </SelectGroup>,
    );
    expect(screen.getByText("Label")).toHaveAttribute("data-slot", "select-label");
  });
});

describe("SelectSeparator", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<SelectSeparator />);
    expect(container.firstChild).toHaveAttribute("data-slot", "select-separator");
  });
});

describe("SelectScrollUpButton", () => {
  it("is exported and is a component", () => {
    expect(typeof SelectScrollUpButton).toBe("function");
  });
});

describe("SelectScrollDownButton", () => {
  it("is exported and is a component", () => {
    expect(typeof SelectScrollDownButton).toBe("function");
  });
});

describe("Select interactions", () => {
  it("opens popup when trigger is clicked", () => {
    render(
      <Select>
        <SelectTrigger aria-label="select">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>,
    );
    fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByText("Option A")).toBeInTheDocument();
  });

  it("calls onValueChange when an item is selected", () => {
    const onValueChange = vi.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger aria-label="select">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>,
    );
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Option A"));
    expect(onValueChange).toHaveBeenCalledWith("a", expect.anything());
  });
});
