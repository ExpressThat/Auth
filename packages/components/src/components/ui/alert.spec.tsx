import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";

describe("Alert", () => {
  it("renders", () => {
    const { container } = render(<Alert />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Alert />);
    expect(container.firstChild).toHaveAttribute("data-slot", "alert");
  });

  it("merges custom className", () => {
    const { container } = render(<Alert className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  describe("variants", () => {
    it("applies default variant", () => {
      const { container } = render(<Alert variant="default" />);
      expect(container.firstChild).toHaveClass("bg-card");
    });

    it("applies destructive variant", () => {
      const { container } = render(<Alert variant="destructive" />);
      expect(container.firstChild).toHaveClass("text-destructive");
    });
  });
});

describe("AlertTitle", () => {
  it("renders children", () => {
    render(<AlertTitle>Alert Title</AlertTitle>);
    expect(screen.getByText("Alert Title")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<AlertTitle>Title</AlertTitle>);
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "alert-title");
  });
});

describe("AlertDescription", () => {
  it("renders children", () => {
    render(<AlertDescription>Something happened.</AlertDescription>);
    expect(screen.getByText("Something happened.")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<AlertDescription>Desc</AlertDescription>);
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "alert-description");
  });
});

describe("AlertAction", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<AlertAction />);
    expect(container.firstChild).toHaveAttribute("data-slot", "alert-action");
  });
});

describe("Full Alert composition", () => {
  it("renders a complete alert", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
        <AlertAction>Dismiss</AlertAction>
      </Alert>,
    );
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(screen.getByText("Dismiss")).toBeInTheDocument();
  });
});
