import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable";

describe("ResizablePanelGroup", () => {
  it("renders", () => {
    const { container } = render(
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={100}>Content</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(container.firstChild).toHaveAttribute("data-slot", "resizable-panel-group");
  });

  it("merges custom className", () => {
    const { container } = render(
      <ResizablePanelGroup orientation="horizontal" className="custom-class">
        <ResizablePanel defaultSize={100}>Content</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("ResizablePanel", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={100}>Content</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(container.querySelector('[data-slot="resizable-panel"]')).toBeInTheDocument();
  });
});

describe("ResizableHandle", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={50}>L</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50}>R</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(container.querySelector('[data-slot="resizable-handle"]')).toBeInTheDocument();
  });
});
