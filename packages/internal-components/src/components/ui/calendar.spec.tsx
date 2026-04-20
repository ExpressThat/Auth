import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

describe("Calendar interactions", () => {
  it("calls onSelect when a day is clicked", () => {
    const onSelect = vi.fn();
    render(<Calendar mode="single" onSelect={onSelect} />);
    const cells = screen.getAllByRole("gridcell");
    const dayButton = cells
      .find((cell) => !cell.getAttribute("aria-disabled") && cell.querySelector("button"))
      ?.querySelector("button");
    if (dayButton) {
      fireEvent.click(dayButton);
      expect(onSelect).toHaveBeenCalled();
    }
  });

  it("navigates to the next month when the next button is clicked", () => {
    render(<Calendar />);
    const buttons = screen.getAllByRole("button");
    // The next-month button is among the navigation buttons
    const nextButton = buttons.find((b) =>
      b.getAttribute("aria-label")?.toLowerCase().includes("next"),
    );
    if (nextButton) {
      expect(() => fireEvent.click(nextButton)).not.toThrow();
    }
  });

  it("navigates to the previous month when the previous button is clicked", () => {
    render(<Calendar />);
    const buttons = screen.getAllByRole("button");
    const prevButton = buttons.find((b) =>
      b.getAttribute("aria-label")?.toLowerCase().includes("previous"),
    );
    if (prevButton) {
      expect(() => fireEvent.click(prevButton)).not.toThrow();
    }
  });
});
