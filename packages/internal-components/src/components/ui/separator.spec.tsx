import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Separator } from "./separator";

describe("Separator", () => {
  it("renders", () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toHaveAttribute("data-slot", "separator");
  });

  it("merges custom className", () => {
    const { container } = render(<Separator className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("applies horizontal orientation by default", () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toHaveAttribute("data-orientation", "horizontal");
  });

  it("applies vertical orientation", () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.firstChild).toHaveAttribute("data-orientation", "vertical");
  });
});
