import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants } from "./tabs";

const TabsExample = () => (
  <Tabs defaultValue="tab1">
    <TabsList>
      <TabsTrigger value="tab1">Tab 1</TabsTrigger>
      <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">Content 1</TabsContent>
    <TabsContent value="tab2">Content 2</TabsContent>
  </Tabs>
);

describe("Tabs", () => {
  it("renders", () => {
    const { container } = render(<TabsExample />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<TabsExample />);
    expect(container.firstChild).toHaveAttribute("data-slot", "tabs");
  });
});

describe("TabsList", () => {
  it("sets data-slot attribute", () => {
    render(<TabsExample />);
    expect(document.querySelector('[data-slot="tabs-list"]')).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-class">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(document.querySelector('[data-slot="tabs-list"]')).toHaveClass("custom-class");
  });

  it("applies default variant", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList variant="default">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(document.querySelector('[data-slot="tabs-list"]')).toHaveAttribute(
      "data-variant",
      "default",
    );
  });

  it("applies line variant", () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList variant="line">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    expect(document.querySelector('[data-slot="tabs-list"]')).toHaveAttribute(
      "data-variant",
      "line",
    );
  });
});

describe("TabsTrigger", () => {
  it("renders trigger text", () => {
    render(<TabsExample />);
    expect(screen.getByText("Tab 1")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<TabsExample />);
    expect(document.querySelector('[data-slot="tabs-trigger"]')).toBeInTheDocument();
  });
});

describe("TabsContent", () => {
  it("renders active tab content", () => {
    render(<TabsExample />);
    expect(screen.getByText("Content 1")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<TabsExample />);
    expect(document.querySelector('[data-slot="tabs-content"]')).toBeInTheDocument();
  });
});

describe("tabsListVariants", () => {
  it("is a function that returns a className string", () => {
    expect(typeof tabsListVariants({ variant: "default" })).toBe("string");
  });
});

describe("Tabs interactions", () => {
  it("sets data-active on the default tab trigger", () => {
    render(<TabsExample />);
    const tab1 = screen.getByText("Tab 1");
    expect(tab1).toHaveAttribute("data-active");
  });

  it("switches active tab when a trigger is clicked", () => {
    render(<TabsExample />);
    fireEvent.click(screen.getByText("Tab 2"));
    expect(screen.getByText("Tab 2")).toHaveAttribute("data-active");
    expect(screen.getByText("Tab 1")).not.toHaveAttribute("data-active");
  });

  it("calls onValueChange when a tab is clicked", () => {
    const onValueChange = vi.fn();
    render(
      <Tabs defaultValue="tab1" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    fireEvent.click(screen.getByText("Tab 2"));
    expect(onValueChange).toHaveBeenCalledWith("tab2", expect.anything());
  });
});
