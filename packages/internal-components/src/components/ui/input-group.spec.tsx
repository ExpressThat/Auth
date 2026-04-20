import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group";

describe("InputGroup", () => {
  it("renders", () => {
    render(<InputGroup aria-label="input group" />);
    expect(screen.getByRole("group")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<InputGroup aria-label="input group" />);
    expect(screen.getByRole("group")).toHaveAttribute("data-slot", "input-group");
  });

  it("merges custom className", () => {
    render(<InputGroup aria-label="input group" className="custom-class" />);
    expect(screen.getByRole("group")).toHaveClass("custom-class");
  });
});

describe("InputGroupAddon", () => {
  it("renders children", () => {
    render(<InputGroupAddon>@</InputGroupAddon>);
    expect(screen.getByText("@")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<InputGroupAddon>@</InputGroupAddon>);
    expect(screen.getByText("@")).toHaveAttribute("data-slot", "input-group-addon");
  });
});

describe("InputGroupText", () => {
  it("renders children", () => {
    render(<InputGroupText>Label</InputGroupText>);
    expect(screen.getByText("Label")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    const { container } = render(<InputGroupText className="custom-class">T</InputGroupText>);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("InputGroupButton", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<InputGroupButton />);
    // InputGroupButton wraps Button which has data-slot="button"
    expect(container.firstChild).toHaveAttribute("data-slot", "button");
  });
});

describe("InputGroupInput", () => {
  it("renders an input element", () => {
    render(<InputGroupInput aria-label="text input" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<InputGroupInput aria-label="text input" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("data-slot", "input-group-control");
  });
});

describe("InputGroupTextarea", () => {
  it("renders a textarea element", () => {
    render(<InputGroupTextarea aria-label="text area" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<InputGroupTextarea aria-label="text area" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("data-slot", "input-group-control");
  });
});
