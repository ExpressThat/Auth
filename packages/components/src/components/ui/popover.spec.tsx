import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "./popover";

describe("PopoverHeader", () => {
  it("renders children", () => {
    render(<PopoverHeader>Header</PopoverHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<PopoverHeader />);
    expect(container.firstChild).toHaveAttribute("data-slot", "popover-header");
  });

  it("merges custom className", () => {
    const { container } = render(<PopoverHeader className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("PopoverTitle", () => {
  it("renders children", () => {
    render(
      <Popover open>
        <PopoverContent>
          <PopoverTitle>Popover Title</PopoverTitle>
        </PopoverContent>
      </Popover>,
    );
    expect(screen.getByText("Popover Title")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Popover open>
        <PopoverContent>
          <PopoverTitle>Title</PopoverTitle>
        </PopoverContent>
      </Popover>,
    );
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "popover-title");
  });
});

describe("PopoverDescription", () => {
  it("renders children", () => {
    render(
      <Popover open>
        <PopoverContent>
          <PopoverDescription>Popover description.</PopoverDescription>
        </PopoverContent>
      </Popover>,
    );
    expect(screen.getByText("Popover description.")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Popover open>
        <PopoverContent>
          <PopoverDescription>Desc</PopoverDescription>
        </PopoverContent>
      </Popover>,
    );
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "popover-description");
  });
});
