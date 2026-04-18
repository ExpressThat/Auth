import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item";

describe("Item", () => {
  it("renders children", () => {
    render(<Item>Item content</Item>);
    expect(screen.getByText("Item content")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<Item>Item</Item>);
    expect(screen.getByText("Item")).toHaveAttribute("data-slot", "item");
  });

  it("merges custom className", () => {
    render(<Item className="custom-class">Item</Item>);
    expect(screen.getByText("Item")).toHaveClass("custom-class");
  });

  describe("variants", () => {
    it("applies default variant", () => {
      render(<Item variant="default">Item</Item>);
      expect(screen.getByText("Item")).toHaveAttribute("data-variant", "default");
    });

    it("applies outline variant", () => {
      render(<Item variant="outline">Item</Item>);
      expect(screen.getByText("Item")).toHaveAttribute("data-variant", "outline");
    });

    it("applies muted variant", () => {
      render(<Item variant="muted">Item</Item>);
      expect(screen.getByText("Item")).toHaveAttribute("data-variant", "muted");
    });
  });

  describe("sizes", () => {
    it("applies default size", () => {
      render(<Item size="default">Item</Item>);
      expect(screen.getByText("Item")).toHaveAttribute("data-size", "default");
    });

    it("applies sm size", () => {
      render(<Item size="sm">Item</Item>);
      expect(screen.getByText("Item")).toHaveAttribute("data-size", "sm");
    });

    it("applies xs size", () => {
      render(<Item size="xs">Item</Item>);
      expect(screen.getByText("Item")).toHaveAttribute("data-size", "xs");
    });
  });
});

describe("ItemMedia", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<ItemMedia />);
    expect(container.firstChild).toHaveAttribute("data-slot", "item-media");
  });

  it("applies default variant", () => {
    const { container } = render(<ItemMedia variant="default" />);
    expect(container.firstChild).toHaveAttribute("data-variant", "default");
  });
});

describe("ItemContent", () => {
  it("renders children", () => {
    render(<ItemContent>Content</ItemContent>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<ItemContent>Content</ItemContent>);
    expect(screen.getByText("Content")).toHaveAttribute("data-slot", "item-content");
  });
});

describe("ItemTitle", () => {
  it("renders children", () => {
    render(<ItemTitle>Title</ItemTitle>);
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<ItemTitle>Title</ItemTitle>);
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "item-title");
  });
});

describe("ItemDescription", () => {
  it("renders children", () => {
    render(<ItemDescription>Description text</ItemDescription>);
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<ItemDescription>Desc</ItemDescription>);
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "item-description");
  });
});

describe("ItemActions", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<ItemActions />);
    expect(container.firstChild).toHaveAttribute("data-slot", "item-actions");
  });
});

describe("ItemHeader", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<ItemHeader />);
    expect(container.firstChild).toHaveAttribute("data-slot", "item-header");
  });
});

describe("ItemFooter", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<ItemFooter />);
    expect(container.firstChild).toHaveAttribute("data-slot", "item-footer");
  });
});

describe("ItemGroup", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<ItemGroup />);
    expect(container.firstChild).toHaveAttribute("data-slot", "item-group");
  });
});

describe("ItemSeparator", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<ItemSeparator />);
    expect(container.firstChild).toHaveAttribute("data-slot", "item-separator");
  });
});
