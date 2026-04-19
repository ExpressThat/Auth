import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("renders", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<Textarea />);
    expect(screen.getByRole("textbox")).toHaveAttribute("data-slot", "textarea");
  });

  it("merges custom className", () => {
    render(<Textarea className="custom-class" />);
    expect(screen.getByRole("textbox")).toHaveClass("custom-class");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Textarea disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("renders with placeholder", () => {
    render(<Textarea placeholder="Write something..." />);
    expect(screen.getByPlaceholderText("Write something...")).toBeInTheDocument();
  });

  it("renders correct number of rows", () => {
    const { container } = render(<Textarea rows={5} />);
    expect(container.querySelector("textarea")).toHaveAttribute("rows", "5");
  });
});

describe("Textarea interactions", () => {
  it("calls onChange with new value", () => {
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "test" } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("calls onFocus when focused", () => {
    const onFocus = vi.fn();
    render(<Textarea onFocus={onFocus} />);
    fireEvent.focus(screen.getByRole("textbox"));
    expect(onFocus).toHaveBeenCalledOnce();
  });

  it("calls onBlur when blurred", () => {
    const onBlur = vi.fn();
    render(<Textarea onBlur={onBlur} />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(onBlur).toHaveBeenCalledOnce();
  });
});
