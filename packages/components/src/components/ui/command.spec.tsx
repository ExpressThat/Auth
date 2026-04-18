import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";

describe("Command", () => {
  it("renders", () => {
    const { container } = render(<Command />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Command />);
    expect(container.firstChild).toHaveAttribute("data-slot", "command");
  });

  it("merges custom className", () => {
    const { container } = render(<Command className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("CommandInput", () => {
  it("renders an input", () => {
    render(
      <Command>
        <CommandInput placeholder="Search..." />
      </Command>,
    );
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Command>
        <CommandInput placeholder="Search" />
      </Command>,
    );
    expect(document.querySelector('[data-slot="command-input"]')).toBeInTheDocument();
  });
});

describe("CommandList", () => {
  it("sets data-slot attribute", () => {
    render(
      <Command>
        <CommandList />
      </Command>,
    );
    expect(document.querySelector('[data-slot="command-list"]')).toBeInTheDocument();
  });
});

describe("CommandEmpty", () => {
  it("renders children", () => {
    render(
      <Command>
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Command>
        <CommandList>
          <CommandEmpty>Empty</CommandEmpty>
        </CommandList>
      </Command>,
    );
    expect(document.querySelector('[data-slot="command-empty"]')).toBeInTheDocument();
  });
});

describe("CommandGroup", () => {
  it("sets data-slot attribute", () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup heading="Actions" />
        </CommandList>
      </Command>,
    );
    expect(document.querySelector('[data-slot="command-group"]')).toBeInTheDocument();
  });
});

describe("CommandItem", () => {
  it("renders children", () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup>
            <CommandItem value="copy">Copy</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup>
            <CommandItem value="copy">Copy</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    expect(document.querySelector('[data-slot="command-item"]')).toBeInTheDocument();
  });
});

describe("CommandSeparator", () => {
  it("sets data-slot attribute", () => {
    render(
      <Command>
        <CommandList>
          <CommandSeparator />
        </CommandList>
      </Command>,
    );
    expect(document.querySelector('[data-slot="command-separator"]')).toBeInTheDocument();
  });
});

describe("CommandShortcut", () => {
  it("renders children", () => {
    render(<CommandShortcut>⌘K</CommandShortcut>);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<CommandShortcut>⌘K</CommandShortcut>);
    expect(screen.getByText("⌘K")).toHaveAttribute("data-slot", "command-shortcut");
  });
});
