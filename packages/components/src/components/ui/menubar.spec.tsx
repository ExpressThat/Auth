import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "./menubar";

describe("Menubar", () => {
  it("renders", () => {
    const { container } = render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
        </MenubarMenu>
      </Menubar>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Menubar />);
    expect(container.firstChild).toHaveAttribute("data-slot", "menubar");
  });

  it("merges custom className", () => {
    const { container } = render(<Menubar className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("MenubarTrigger", () => {
  it("renders trigger text", () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
        </MenubarMenu>
      </Menubar>,
    );
    expect(screen.getByText("File")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
        </MenubarMenu>
      </Menubar>,
    );
    expect(document.querySelector('[data-slot="menubar-trigger"]')).toBeInTheDocument();
  });
});

describe("MenubarSeparator", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<MenubarSeparator />);
    expect(container.firstChild).toHaveAttribute("data-slot", "menubar-separator");
  });
});

describe("MenubarShortcut", () => {
  it("renders children", () => {
    render(<MenubarShortcut>⌘S</MenubarShortcut>);
    expect(screen.getByText("⌘S")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<MenubarShortcut>⌘S</MenubarShortcut>);
    expect(screen.getByText("⌘S")).toHaveAttribute("data-slot", "menubar-shortcut");
  });
});

describe("Menubar interactions", () => {
  it("opens menu when trigger is clicked", () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>New</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
    fireEvent.click(screen.getByText("File"));
    expect(screen.getByText("New")).toBeInTheDocument();
  });
});
