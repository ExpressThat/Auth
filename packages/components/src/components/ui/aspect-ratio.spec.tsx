import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AspectRatio } from "./aspect-ratio";

describe("AspectRatio", () => {
  it("renders", () => {
    const { container } = render(<AspectRatio ratio={16 / 9} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<AspectRatio ratio={1} />);
    expect(container.firstChild).toHaveAttribute("data-slot", "aspect-ratio");
  });

  it("merges custom className", () => {
    const { container } = render(<AspectRatio ratio={1} className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders children", () => {
    const { container } = render(
      <AspectRatio ratio={1}>
        <img alt="test" />
      </AspectRatio>,
    );
    expect(container.querySelector("img")).toBeInTheDocument();
  });
});
