import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Slider } from "./slider";

describe("Slider", () => {
  it("renders", () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Slider defaultValue={[50]} />);
    expect(container.firstChild).toHaveAttribute("data-slot", "slider");
  });

  it("merges custom className", () => {
    const { container } = render(<Slider defaultValue={[50]} className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders thumb element", () => {
    const { container } = render(<Slider defaultValue={[75]} min={0} max={100} />);
    const thumb = container.querySelector('[data-slot="slider-thumb"]');
    expect(thumb).toBeInTheDocument();
  });

  it("sets data-disabled when disabled", () => {
    const { container } = render(<Slider defaultValue={[50]} disabled />);
    expect(container.firstChild).toHaveAttribute("data-disabled");
  });
});

describe("Slider interactions", () => {
  it("calls onValueChange when ArrowRight is pressed on the range input", () => {
    const onValueChange = vi.fn();
    render(<Slider defaultValue={[50]} onValueChange={onValueChange} />);
    const rangeInput = document.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.keyDown(rangeInput, { key: "ArrowRight" });
    expect(onValueChange).toHaveBeenCalled();
  });

  it("calls onValueChange when ArrowLeft is pressed on the range input", () => {
    const onValueChange = vi.fn();
    render(<Slider defaultValue={[50]} onValueChange={onValueChange} />);
    const rangeInput = document.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.keyDown(rangeInput, { key: "ArrowLeft" });
    expect(onValueChange).toHaveBeenCalled();
  });
});
