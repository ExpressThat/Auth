import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

describe("Card", () => {
  it("renders", () => {
    const { container } = render(<Card />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Card />);
    expect(container.firstChild).toHaveAttribute("data-slot", "card");
  });

  it("merges custom className", () => {
    const { container } = render(<Card className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("applies default size", () => {
    const { container } = render(<Card size="default" />);
    expect(container.firstChild).toHaveAttribute("data-size", "default");
  });

  it("applies sm size", () => {
    const { container } = render(<Card size="sm" />);
    expect(container.firstChild).toHaveAttribute("data-size", "sm");
  });
});

describe("CardHeader", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<CardHeader />);
    expect(container.firstChild).toHaveAttribute("data-slot", "card-header");
  });

  it("merges custom className", () => {
    const { container } = render(<CardHeader className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("CardTitle", () => {
  it("renders children", () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "card-title");
  });
});

describe("CardDescription", () => {
  it("renders children", () => {
    render(<CardDescription>My Description</CardDescription>);
    expect(screen.getByText("My Description")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<CardDescription>Desc</CardDescription>);
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "card-description");
  });
});

describe("CardAction", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<CardAction />);
    expect(container.firstChild).toHaveAttribute("data-slot", "card-action");
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText("Content")).toHaveAttribute("data-slot", "card-content");
  });
});

describe("CardFooter", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<CardFooter />);
    expect(container.firstChild).toHaveAttribute("data-slot", "card-footer");
  });

  it("merges custom className", () => {
    const { container } = render(<CardFooter className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
