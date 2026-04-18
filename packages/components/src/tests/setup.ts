import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll } from "vitest";

beforeAll(() => {
  if (typeof global.ResizeObserver === "undefined") {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (typeof global.IntersectionObserver === "undefined") {
    global.IntersectionObserver = class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
  }
  if (typeof window.matchMedia === "undefined") {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
  if (typeof Element.prototype.scrollIntoView === "undefined") {
    Element.prototype.scrollIntoView = () => {};
  }
  if (typeof global.PointerEvent === "undefined") {
    global.PointerEvent = class PointerEvent extends MouseEvent {
      pointerId: number;
      pointerType: string;
      constructor(type: string, params: PointerEventInit = {}) {
        super(type, params);
        this.pointerId = params.pointerId ?? 1;
        this.pointerType = params.pointerType ?? "mouse";
      }
    } as unknown as typeof PointerEvent;
  }
});

afterEach(() => {
  cleanup();
});
