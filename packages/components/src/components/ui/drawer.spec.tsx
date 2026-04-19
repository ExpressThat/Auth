import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./drawer";

describe("DrawerHeader", () => {
  it("renders children", () => {
    render(<DrawerHeader>Header</DrawerHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<DrawerHeader />);
    expect(container.firstChild).toHaveAttribute("data-slot", "drawer-header");
  });

  it("merges custom className", () => {
    const { container } = render(<DrawerHeader className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("DrawerFooter", () => {
  it("renders children", () => {
    render(<DrawerFooter>Footer</DrawerFooter>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<DrawerFooter />);
    expect(container.firstChild).toHaveAttribute("data-slot", "drawer-footer");
  });
});

describe("DrawerTitle", () => {
  it("renders children", () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerTitle>Drawer Title</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Drawer Title")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerTitle>Title</DrawerTitle>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "drawer-title");
  });
});

describe("DrawerDescription", () => {
  it("renders children", () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerDescription>Drawer description.</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Drawer description.")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Drawer open>
        <DrawerContent>
          <DrawerDescription>Desc</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "drawer-description");
  });
});
