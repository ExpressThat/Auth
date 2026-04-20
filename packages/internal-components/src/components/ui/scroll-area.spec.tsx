import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollArea, ScrollBar } from "./scroll-area";

describe("ScrollArea", () => {
  it("renders", () => {
    const { container } = render(
      <ScrollArea>
        <div>content</div>
      </ScrollArea>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<ScrollArea />);
    expect(container.firstChild).toHaveAttribute("data-slot", "scroll-area");
  });

  it("merges custom className", () => {
    const { container } = render(<ScrollArea className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders children", () => {
    const { container } = render(
      <ScrollArea>
        <p>Scrollable content</p>
      </ScrollArea>,
    );
    expect(container.querySelector("p")).toBeInTheDocument();
  });
});

describe("ScrollBar", () => {
  it("is exported and is a component", () => {
    expect(typeof ScrollBar).toBe("function");
  });
});
