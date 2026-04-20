import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HoverCard, HoverCardTrigger } from "./hover-card";

describe("HoverCard", () => {
  it("renders", () => {
    const { container } = render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
      </HoverCard>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("HoverCardTrigger", () => {
  it("renders trigger content", () => {
    const { container } = render(
      <HoverCard>
        <HoverCardTrigger>
          <span data-testid="trigger-content">hover</span>
        </HoverCardTrigger>
      </HoverCard>,
    );
    expect(container.querySelector('[data-testid="trigger-content"]')).toBeInTheDocument();
  });
});
