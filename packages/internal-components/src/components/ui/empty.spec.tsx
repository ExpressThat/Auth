import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";

describe("Empty", () => {
  it("renders", () => {
    const { container } = render(<Empty />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Empty />);
    expect(container.firstChild).toHaveAttribute("data-slot", "empty");
  });

  it("merges custom className", () => {
    const { container } = render(<Empty className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("EmptyHeader", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<EmptyHeader />);
    expect(container.firstChild).toHaveAttribute("data-slot", "empty-header");
  });
});

describe("EmptyTitle", () => {
  it("renders children", () => {
    render(<EmptyTitle>No Results</EmptyTitle>);
    expect(screen.getByText("No Results")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<EmptyTitle>No Results</EmptyTitle>);
    expect(screen.getByText("No Results")).toHaveAttribute("data-slot", "empty-title");
  });
});

describe("EmptyDescription", () => {
  it("renders children", () => {
    render(<EmptyDescription>Try adjusting your search.</EmptyDescription>);
    expect(screen.getByText("Try adjusting your search.")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<EmptyDescription>Desc</EmptyDescription>);
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "empty-description");
  });
});

describe("EmptyContent", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<EmptyContent />);
    expect(container.firstChild).toHaveAttribute("data-slot", "empty-content");
  });
});

describe("EmptyMedia", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<EmptyMedia />);
    expect(container.firstChild).toHaveAttribute("data-slot", "empty-icon");
  });

  it("applies default variant", () => {
    const { container } = render(<EmptyMedia variant="default" />);
    expect(container.firstChild).toHaveAttribute("data-variant", "default");
  });

  it("applies icon variant", () => {
    const { container } = render(<EmptyMedia variant="icon" />);
    expect(container.firstChild).toHaveAttribute("data-variant", "icon");
  });
});

describe("Full Empty composition", () => {
  it("renders a complete empty state", () => {
    render(
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No items</EmptyTitle>
          <EmptyDescription>Add an item to get started.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <button type="button">Add Item</button>
        </EmptyContent>
      </Empty>,
    );
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Add an item to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Item" })).toBeInTheDocument();
  });
});
