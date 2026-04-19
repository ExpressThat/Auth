import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DirectionProvider, useDirection } from "./direction";

describe("DirectionProvider", () => {
  it("is defined and renderable", () => {
    expect(DirectionProvider).toBeDefined();
  });

  it("renders children", () => {
    render(
      <DirectionProvider direction="ltr">
        <span>child</span>
      </DirectionProvider>,
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});

describe("useDirection", () => {
  it("is defined and callable", () => {
    expect(useDirection).toBeDefined();
    expect(typeof useDirection).toBe("function");
  });
});
