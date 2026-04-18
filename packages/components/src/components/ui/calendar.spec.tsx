import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "./calendar";

describe("Calendar", () => {
  it("renders", () => {
    render(<Calendar />);
    expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<Calendar />);
    expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<Calendar className="custom-class" />);
    expect(document.querySelector('[data-slot="calendar"]')).toHaveClass("custom-class");
  });

  it("renders navigation buttons", () => {
    render(<Calendar />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders day grid cells", () => {
    render(<Calendar />);
    const gridCells = screen.getAllByRole("gridcell");
    expect(gridCells.length).toBeGreaterThan(0);
  });

  it("renders in single selection mode by default", () => {
    render(<Calendar mode="single" />);
    expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument();
  });

  it("renders in multiple selection mode", () => {
    render(<Calendar mode="multiple" />);
    expect(document.querySelector('[data-slot="calendar"]')).toBeInTheDocument();
  });
});
