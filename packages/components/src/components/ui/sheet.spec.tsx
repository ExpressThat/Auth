import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./sheet";

describe("SheetHeader", () => {
  it("renders children", () => {
    render(<SheetHeader>Header</SheetHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<SheetHeader />);
    expect(container.firstChild).toHaveAttribute("data-slot", "sheet-header");
  });

  it("merges custom className", () => {
    const { container } = render(<SheetHeader className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("SheetFooter", () => {
  it("renders children", () => {
    render(<SheetFooter>Footer</SheetFooter>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<SheetFooter />);
    expect(container.firstChild).toHaveAttribute("data-slot", "sheet-footer");
  });
});

describe("SheetTitle", () => {
  it("renders children", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Sheet Title</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByText("Sheet Title")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>Title</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "sheet-title");
  });
});

describe("SheetDescription", () => {
  it("renders children", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetDescription>Sheet description.</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByText("Sheet description.")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetDescription>Desc</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "sheet-description");
  });
});
