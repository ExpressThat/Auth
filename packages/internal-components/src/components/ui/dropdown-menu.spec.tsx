import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu", () => {
  it("renders trigger", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      </DropdownMenu>,
    );
    expect(screen.getByText("Open")).toBeInTheDocument();
  });
});

describe("DropdownMenuTrigger", () => {
  it("sets data-slot attribute", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Trigger</DropdownMenuTrigger>
      </DropdownMenu>,
    );
    expect(document.querySelector('[data-slot="dropdown-menu-trigger"]')).toBeInTheDocument();
  });
});

describe("DropdownMenuLabel", () => {
  it("renders children", () => {
    render(
      <DropdownMenuGroup>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
      </DropdownMenuGroup>,
    );
    expect(screen.getByText("My Account")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <DropdownMenuGroup>
        <DropdownMenuLabel>Label</DropdownMenuLabel>
      </DropdownMenuGroup>,
    );
    expect(screen.getByText("Label")).toHaveAttribute("data-slot", "dropdown-menu-label");
  });
});

describe("DropdownMenuSeparator", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<DropdownMenuSeparator />);
    expect(container.firstChild).toHaveAttribute("data-slot", "dropdown-menu-separator");
  });
});

describe("DropdownMenuShortcut", () => {
  it("renders children", () => {
    render(<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>);
    expect(screen.getByText("⌘K")).toHaveAttribute("data-slot", "dropdown-menu-shortcut");
  });
});

describe("DropdownMenuGroup", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<DropdownMenuGroup />);
    expect(container.firstChild).toHaveAttribute("data-slot", "dropdown-menu-group");
  });
});

describe("DropdownMenu interactions", () => {
  it("opens menu content when trigger is clicked", () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    fireEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Item")).toBeInTheDocument();
  });

  it("calls onClick on menu item click", () => {
    const onClick = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onClick}>Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    fireEvent.click(screen.getByText("Open"));
    fireEvent.click(screen.getByText("Item"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
