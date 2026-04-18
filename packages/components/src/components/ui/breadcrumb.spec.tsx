import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

describe("Breadcrumb", () => {
  it("renders as a nav element", () => {
    render(<Breadcrumb aria-label="breadcrumb" />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<Breadcrumb aria-label="breadcrumb" />);
    expect(screen.getByRole("navigation")).toHaveAttribute("data-slot", "breadcrumb");
  });

  it("merges custom className", () => {
    render(<Breadcrumb aria-label="breadcrumb" className="custom-class" />);
    expect(screen.getByRole("navigation")).toHaveClass("custom-class");
  });
});

describe("BreadcrumbList", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<BreadcrumbList />);
    expect(container.querySelector("ol")).toHaveAttribute("data-slot", "breadcrumb-list");
  });
});

describe("BreadcrumbItem", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<BreadcrumbItem />);
    expect(container.querySelector("li")).toHaveAttribute("data-slot", "breadcrumb-item");
  });
});

describe("BreadcrumbPage", () => {
  it("renders children", () => {
    render(<BreadcrumbPage>Home</BreadcrumbPage>);
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<BreadcrumbPage>Page</BreadcrumbPage>);
    expect(screen.getByText("Page")).toHaveAttribute("data-slot", "breadcrumb-page");
  });
});

describe("BreadcrumbSeparator", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<BreadcrumbSeparator />);
    expect(container.querySelector("li")).toHaveAttribute("data-slot", "breadcrumb-separator");
  });
});

describe("BreadcrumbEllipsis", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<BreadcrumbEllipsis />);
    expect(container.firstChild).toHaveAttribute("data-slot", "breadcrumb-ellipsis");
  });
});
