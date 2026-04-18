import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
