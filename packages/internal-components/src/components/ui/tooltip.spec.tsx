import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tooltip, TooltipProvider, TooltipTrigger } from "./tooltip";

describe("TooltipProvider", () => {
  it("renders children", () => {
    render(
      <TooltipProvider>
        <span>child</span>
      </TooltipProvider>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});

describe("Tooltip", () => {
  it("renders trigger", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByText("Hover")).toBeInTheDocument();
  });
});

describe("TooltipTrigger", () => {
  it("sets data-slot attribute", () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(document.querySelector('[data-slot="tooltip-trigger"]')).toBeInTheDocument();
  });
});
