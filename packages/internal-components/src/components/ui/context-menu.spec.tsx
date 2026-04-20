import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "./context-menu";

describe("ContextMenuLabel", () => {
  it("renders children", () => {
    render(
      <ContextMenuGroup>
        <ContextMenuLabel>File</ContextMenuLabel>
      </ContextMenuGroup>,
    );
    expect(screen.getByText("File")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <ContextMenuGroup>
        <ContextMenuLabel>Label</ContextMenuLabel>
      </ContextMenuGroup>,
    );
    expect(screen.getByText("Label")).toHaveAttribute("data-slot", "context-menu-label");
  });

  it("merges custom className", () => {
    render(
      <ContextMenuGroup>
        <ContextMenuLabel className="custom-class">Label</ContextMenuLabel>
      </ContextMenuGroup>,
    );
    expect(screen.getByText("Label")).toHaveClass("custom-class");
  });
});

describe("ContextMenuSeparator", () => {
  it("renders", () => {
    const { container } = render(<ContextMenuSeparator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<ContextMenuSeparator />);
    expect(container.firstChild).toHaveAttribute("data-slot", "context-menu-separator");
  });
});

describe("ContextMenuShortcut", () => {
  it("renders children", () => {
    render(<ContextMenuShortcut>⌘C</ContextMenuShortcut>);
    expect(screen.getByText("⌘C")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<ContextMenuShortcut>⌘C</ContextMenuShortcut>);
    expect(screen.getByText("⌘C")).toHaveAttribute("data-slot", "context-menu-shortcut");
  });
});

describe("ContextMenu interactions", () => {
  it("opens menu on contextMenu event", () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText("Right-click me"));
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("calls onClick when a menu item is clicked", () => {
    const onClick = vi.fn();
    render(
      <ContextMenu>
        <ContextMenuTrigger>Right-click me</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onClick}>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByText("Right-click me"));
    fireEvent.click(screen.getByText("Copy"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
