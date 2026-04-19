import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

describe("Collapsible", () => {
  it("renders", () => {
    const { container } = render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Collapsible />);
    expect(container.firstChild).toHaveAttribute("data-slot", "collapsible");
  });

  it("merges custom className", () => {
    const { container } = render(<Collapsible className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("CollapsibleTrigger", () => {
  it("renders trigger", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>,
    );
    expect(screen.getByText("Toggle")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      </Collapsible>,
    );
    expect(document.querySelector('[data-slot="collapsible-trigger"]')).toBeInTheDocument();
  });
});

describe("CollapsibleContent", () => {
  it("sets data-slot attribute", () => {
    render(
      <Collapsible open>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>,
    );
    expect(document.querySelector('[data-slot="collapsible-content"]')).toBeInTheDocument();
  });

  it("renders children when open", () => {
    render(
      <Collapsible open>
        <CollapsibleContent>Visible content</CollapsibleContent>
      </Collapsible>,
    );
    expect(screen.getByText("Visible content")).toBeInTheDocument();
  });
});

describe("Collapsible interactions", () => {
  it("calls onOpenChange with true when trigger is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <Collapsible onOpenChange={onOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>,
    );
    fireEvent.click(screen.getByText("Toggle"));
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("calls onOpenChange with false on second trigger click", () => {
    const onOpenChange = vi.fn();
    render(
      <Collapsible onOpenChange={onOpenChange}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>,
    );
    fireEvent.click(screen.getByText("Toggle"));
    fireEvent.click(screen.getByText("Toggle"));
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
  });

  it("shows content after trigger click", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Hidden content</CollapsibleContent>
      </Collapsible>,
    );
    fireEvent.click(screen.getByText("Toggle"));
    expect(screen.getByText("Hidden content")).toBeInTheDocument();
  });
});
