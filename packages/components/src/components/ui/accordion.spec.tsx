import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

const AccordionExample = () => (
  <Accordion>
    <AccordionItem value="item-1">
      <AccordionTrigger>Section 1</AccordionTrigger>
      <AccordionContent>Content 1</AccordionContent>
    </AccordionItem>
  </Accordion>
);

describe("Accordion", () => {
  it("renders", () => {
    const { container } = render(<AccordionExample />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot on root", () => {
    const { container } = render(<AccordionExample />);
    expect(container.firstChild).toHaveAttribute("data-slot", "accordion");
  });

  it("merges custom className on root", () => {
    render(
      <Accordion className="custom-class">
        <AccordionItem value="x">
          <AccordionTrigger>T</AccordionTrigger>
          <AccordionContent>C</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(document.querySelector('[data-slot="accordion"]')).toHaveClass("custom-class");
  });
});

describe("AccordionItem", () => {
  it("sets data-slot attribute", () => {
    render(<AccordionExample />);
    expect(document.querySelector('[data-slot="accordion-item"]')).toBeInTheDocument();
  });
});

describe("AccordionTrigger", () => {
  it("renders trigger text", () => {
    render(<AccordionExample />);
    expect(screen.getByText("Section 1")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<AccordionExample />);
    expect(document.querySelector('[data-slot="accordion-trigger"]')).toBeInTheDocument();
  });

  it("toggles content on click", () => {
    render(<AccordionExample />);
    const trigger = screen.getByText("Section 1");
    fireEvent.click(trigger);
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });
});

describe("AccordionContent", () => {
  it("sets data-slot attribute", () => {
    render(<AccordionExample />);
    const trigger = screen.getByText("Section 1");
    fireEvent.click(trigger);
    expect(document.querySelector('[data-slot="accordion-content"]')).toBeInTheDocument();
  });
});

describe("Accordion interactions", () => {
  it("calls onValueChange when a section is opened", () => {
    const onValueChange = vi.fn();
    render(
      <Accordion onValueChange={onValueChange}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    fireEvent.click(screen.getByText("Section 1"));
    expect(onValueChange).toHaveBeenCalledWith(["item-1"], expect.anything());
  });

  it("collapses an open section on second click", () => {
    render(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = screen.getByText("Section 1");
    fireEvent.click(trigger);
    expect(screen.getByText("Content 1")).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
  });

  it("supports opening multiple items independently", () => {
    render(
      <Accordion>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    fireEvent.click(screen.getByText("Section 1"));
    fireEvent.click(screen.getByText("Section 2"));
    expect(screen.getByText("Content 2")).toBeInTheDocument();
  });
});
