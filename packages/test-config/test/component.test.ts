// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createComponentTestConfig } from "../src/component.js";
import "../src/setup-dom.js";

describe("component test configuration", () => {
  it("selects jsdom, a stable origin, and shared DOM setup", () => {
    const config = createComponentTestConfig();

    expect(config.test).toMatchObject({
      environment: "jsdom",
      environmentOptions: { jsdom: { url: "http://localhost/" } },
      setupFiles: ["@expressthat-auth/test-config/setup-dom"],
    });
  });

  it("merges component-specific overrides and installs DOM matchers", () => {
    const config = createComponentTestConfig({ test: { testTimeout: 2_000 } });
    const element = document.createElement("button");
    element.textContent = "Continue";
    document.body.append(element);

    expect(config.test?.testTimeout).toBe(2_000);
    expect(element).toBeInTheDocument();
    expect(element).toHaveAccessibleName("Continue");
  });
});
