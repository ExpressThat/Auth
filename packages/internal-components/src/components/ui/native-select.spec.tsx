import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "./native-select";

describe("NativeSelect", () => {
  it("renders a select element", () => {
    render(<NativeSelect aria-label="select" />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("sets data-slot on the wrapper", () => {
    const { container } = render(<NativeSelect aria-label="select" />);
    expect(container.firstChild).toHaveAttribute("data-slot", "native-select-wrapper");
  });

  it("sets data-slot on the select", () => {
    render(<NativeSelect aria-label="select" />);
    expect(screen.getByRole("combobox")).toHaveAttribute("data-slot", "native-select");
  });

  it("merges custom className", () => {
    const { container } = render(<NativeSelect aria-label="select" className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("is disabled when disabled prop is true", () => {
    render(<NativeSelect aria-label="select" disabled />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("renders options", () => {
    render(
      <NativeSelect aria-label="select">
        <NativeSelectOption value="a">Option A</NativeSelectOption>
        <NativeSelectOption value="b">Option B</NativeSelectOption>
      </NativeSelect>,
    );
    expect(screen.getByRole("option", { name: "Option A" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Option B" })).toBeInTheDocument();
  });
});

describe("NativeSelectOptGroup", () => {
  it("renders a group with label", () => {
    const { container } = render(
      <select>
        <NativeSelectOptGroup label="Group A">
          <option value="x">X</option>
        </NativeSelectOptGroup>
      </select>,
    );
    expect(container.querySelector("optgroup")).toHaveAttribute("label", "Group A");
  });
});

describe("NativeSelect interactions", () => {
  it("calls onChange when selection changes", () => {
    const onChange = vi.fn();
    render(
      <NativeSelect aria-label="select" onChange={onChange}>
        <NativeSelectOption value="a">A</NativeSelectOption>
        <NativeSelectOption value="b">B</NativeSelectOption>
      </NativeSelect>,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "b" } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("reflects selected value after change", () => {
    render(
      <NativeSelect aria-label="select" defaultValue="a">
        <NativeSelectOption value="a">A</NativeSelectOption>
        <NativeSelectOption value="b">B</NativeSelectOption>
      </NativeSelect>,
    );
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "b" } });
    expect(select).toHaveValue("b");
  });
});
