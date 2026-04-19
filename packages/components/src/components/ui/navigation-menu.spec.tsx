import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  NavigationMenu,
  NavigationMenuIndicator,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./navigation-menu";

describe("NavigationMenu", () => {
  it("renders", () => {
    const { container } = render(<NavigationMenu />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<NavigationMenu />);
    expect(container.firstChild).toHaveAttribute("data-slot", "navigation-menu");
  });

  it("merges custom className", () => {
    const { container } = render(<NavigationMenu className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("NavigationMenuList", () => {
  it("renders children", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <li>Item</li>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    expect(screen.getByText("Item")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList />
      </NavigationMenu>,
    );
    expect(document.querySelector('[data-slot="navigation-menu-list"]')).toBeInTheDocument();
  });
});

describe("NavigationMenuPositioner", () => {
  it("renders without error inside NavigationMenu", () => {
    // NavigationMenu renders NavigationMenuPositioner internally
    const { container } = render(<NavigationMenu />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("NavigationMenuIndicator", () => {
  it("is exported and is a component", () => {
    expect(typeof NavigationMenuIndicator).toBe("function");
  });
});

describe("navigationMenuTriggerStyle", () => {
  it("is a function that returns a className string", () => {
    expect(typeof navigationMenuTriggerStyle()).toBe("string");
  });
});
