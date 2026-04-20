import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

describe("AlertDialogHeader", () => {
  it("renders children", () => {
    render(<AlertDialogHeader>Header content</AlertDialogHeader>);
    expect(screen.getByText("Header content")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<AlertDialogHeader />);
    expect(container.firstChild).toHaveAttribute("data-slot", "alert-dialog-header");
  });

  it("merges custom className", () => {
    const { container } = render(<AlertDialogHeader className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("AlertDialogFooter", () => {
  it("renders children", () => {
    render(<AlertDialogFooter>Footer content</AlertDialogFooter>);
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<AlertDialogFooter />);
    expect(container.firstChild).toHaveAttribute("data-slot", "alert-dialog-footer");
  });
});

describe("AlertDialogTitle", () => {
  it("renders children", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm Action</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByText("Confirm Action")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "alert-dialog-title");
  });
});

describe("AlertDialogDescription", () => {
  it("renders children", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogDescription>Are you sure?</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogDescription>Desc</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "alert-dialog-description");
  });
});

describe("AlertDialogCancel", () => {
  it("renders as a button", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute(
      "data-slot",
      "alert-dialog-cancel",
    );
  });
});
