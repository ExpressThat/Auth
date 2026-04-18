import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Kbd, KbdGroup } from "./kbd";

describe("Kbd", () => {
  it("renders children", () => {
    render(<Kbd>Ctrl</Kbd>);
    expect(screen.getByText("Ctrl")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<Kbd>K</Kbd>);
    expect(screen.getByText("K")).toHaveAttribute("data-slot", "kbd");
  });

  it("renders as a kbd element", () => {
    render(<Kbd>Enter</Kbd>);
    expect(screen.getByText("Enter").tagName).toBe("KBD");
  });

  it("merges custom className", () => {
    render(<Kbd className="custom-class">K</Kbd>);
    expect(screen.getByText("K")).toHaveClass("custom-class");
  });
});

describe("KbdGroup", () => {
  it("renders children", () => {
    render(
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>C</Kbd>
      </KbdGroup>,
    );
    expect(screen.getByText("Ctrl")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<KbdGroup />);
    expect(container.firstChild).toHaveAttribute("data-slot", "kbd-group");
  });

  it("merges custom className", () => {
    const { container } = render(<KbdGroup className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
