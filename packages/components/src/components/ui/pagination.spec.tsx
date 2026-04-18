import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

describe("Pagination", () => {
  it("renders as a nav element", () => {
    render(<Pagination aria-label="pagination" />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<Pagination aria-label="pagination" />);
    expect(screen.getByRole("navigation")).toHaveAttribute("data-slot", "pagination");
  });

  it("merges custom className", () => {
    render(<Pagination aria-label="pagination" className="custom-class" />);
    expect(screen.getByRole("navigation")).toHaveClass("custom-class");
  });
});

describe("PaginationContent", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<PaginationContent />);
    expect(container.querySelector("ul")).toHaveAttribute("data-slot", "pagination-content");
  });

  it("merges custom className", () => {
    const { container } = render(<PaginationContent className="custom-class" />);
    expect(container.querySelector("ul")).toHaveClass("custom-class");
  });
});

describe("PaginationItem", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<PaginationItem />);
    expect(container.querySelector("li")).toHaveAttribute("data-slot", "pagination-item");
  });
});

describe("PaginationPrevious", () => {
  it("renders with aria-label", () => {
    render(<PaginationPrevious />);
    expect(document.querySelector('[aria-label="Go to previous page"]')).toBeInTheDocument();
  });
});

describe("PaginationNext", () => {
  it("renders with aria-label", () => {
    render(<PaginationNext />);
    expect(document.querySelector('[aria-label="Go to next page"]')).toBeInTheDocument();
  });
});

describe("PaginationEllipsis", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<PaginationEllipsis />);
    expect(container.firstChild).toHaveAttribute("data-slot", "pagination-ellipsis");
  });
});
