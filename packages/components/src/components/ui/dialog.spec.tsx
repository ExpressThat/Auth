import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

describe("DialogHeader", () => {
  it("renders children", () => {
    render(<DialogHeader>Header content</DialogHeader>);
    expect(screen.getByText("Header content")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<DialogHeader />);
    expect(container.firstChild).toHaveAttribute("data-slot", "dialog-header");
  });

  it("merges custom className", () => {
    const { container } = render(<DialogHeader className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("DialogFooter", () => {
  it("renders children", () => {
    render(<DialogFooter>Footer content</DialogFooter>);
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<DialogFooter />);
    expect(container.firstChild).toHaveAttribute("data-slot", "dialog-footer");
  });
});

describe("DialogTitle", () => {
  it("renders children", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>My Dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("My Dialog")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "dialog-title");
  });
});

describe("DialogDescription", () => {
  it("renders children", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogDescription>Dialog description text.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Dialog description text.")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogDescription>Desc</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "dialog-description");
  });
});
