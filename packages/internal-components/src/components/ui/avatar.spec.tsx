import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "./avatar";

describe("Avatar", () => {
  it("renders", () => {
    const { container } = render(<Avatar />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Avatar />);
    expect(container.firstChild).toHaveAttribute("data-slot", "avatar");
  });

  it("merges custom className", () => {
    const { container } = render(<Avatar className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  describe("sizes", () => {
    it("applies default size", () => {
      const { container } = render(<Avatar size="default" />);
      expect(container.firstChild).toHaveAttribute("data-size", "default");
    });

    it("applies sm size", () => {
      const { container } = render(<Avatar size="sm" />);
      expect(container.firstChild).toHaveAttribute("data-size", "sm");
    });

    it("applies lg size", () => {
      const { container } = render(<Avatar size="lg" />);
      expect(container.firstChild).toHaveAttribute("data-size", "lg");
    });
  });
});

describe("AvatarFallback", () => {
  it("renders children", () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>,
    );
    expect(document.querySelector('[data-slot="avatar-fallback"]')).toBeInTheDocument();
  });
});

describe("AvatarImage", () => {
  it("is exported and is a component", () => {
    // @base-ui/react AvatarImage only renders when image loads (not in jsdom)
    expect(typeof AvatarImage).toBe("function");
  });
});

describe("AvatarBadge", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(
      <Avatar>
        <AvatarBadge />
      </Avatar>,
    );
    expect(container.querySelector('[data-slot="avatar-badge"]')).toBeInTheDocument();
  });
});

describe("AvatarGroup", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<AvatarGroup />);
    expect(container.firstChild).toHaveAttribute("data-slot", "avatar-group");
  });

  it("merges custom className", () => {
    const { container } = render(<AvatarGroup className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("AvatarGroupCount", () => {
  it("renders children", () => {
    render(<AvatarGroupCount>+5</AvatarGroupCount>);
    expect(screen.getByText("+5")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<AvatarGroupCount />);
    expect(container.firstChild).toHaveAttribute("data-slot", "avatar-group-count");
  });
});
