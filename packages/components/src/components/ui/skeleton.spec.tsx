import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Skeleton } from "./skeleton";

describe("Skeleton", () => {
  it("renders a div element", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute("data-slot", "skeleton");
  });

  it("applies animate-pulse class", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("merges custom className", () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders children", () => {
    render(<Skeleton>inner</Skeleton>);
    expect(screen.getByText("inner")).toBeInTheDocument();
  });
});
