import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("renders", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toHaveAttribute("data-slot", "input");
  });

  it("merges custom className", () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole("textbox")).toHaveClass("custom-class");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("renders with placeholder", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("renders as password type", () => {
    const { container } = render(<Input type="password" />);
    expect(container.querySelector("input")).toHaveAttribute("type", "password");
  });
});

describe("Input interactions", () => {
  it("calls onChange with new value", () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("calls onFocus when focused", () => {
    const onFocus = vi.fn();
    render(<Input onFocus={onFocus} />);
    fireEvent.focus(screen.getByRole("textbox"));
    expect(onFocus).toHaveBeenCalledOnce();
  });

  it("calls onBlur when blurred", () => {
    const onBlur = vi.fn();
    render(<Input onBlur={onBlur} />);
    fireEvent.blur(screen.getByRole("textbox"));
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("reflects controlled value", () => {
    render(<Input value="controlled" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("controlled");
  });
});
