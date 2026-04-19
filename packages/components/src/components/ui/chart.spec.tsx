import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltipContent } from "./chart";

const config = {
  desktop: { label: "Desktop", color: "#2563eb" },
  mobile: { label: "Mobile", color: "#60a5fa" },
};

describe("ChartContainer", () => {
  it("renders", () => {
    const { container } = render(
      <ChartContainer config={config}>
        <svg />
      </ChartContainer>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(
      <ChartContainer config={config}>
        <svg />
      </ChartContainer>,
    );
    expect(container.firstChild).toHaveAttribute("data-slot", "chart");
  });

  it("merges custom className", () => {
    const { container } = render(
      <ChartContainer config={config} className="custom-class">
        <svg />
      </ChartContainer>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("ChartLegend", () => {
  it("is defined", () => {
    expect(ChartLegend).toBeDefined();
  });
});

describe("ChartLegendContent", () => {
  it("is exported and is a component", () => {
    expect(typeof ChartLegendContent).toBe("function");
  });
});

describe("ChartTooltipContent", () => {
  it("is exported and is a component", () => {
    expect(typeof ChartTooltipContent).toBe("function");
  });
});
