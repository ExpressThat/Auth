import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "./field";

describe("Field", () => {
  it("renders children", () => {
    render(<Field>Field content</Field>);
    expect(screen.getByText("Field content")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Field />);
    expect(container.firstChild).toHaveAttribute("data-slot", "field");
  });

  it("merges custom className", () => {
    const { container } = render(<Field className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("applies vertical orientation by default", () => {
    const { container } = render(<Field />);
    expect(container.firstChild).toHaveAttribute("data-orientation", "vertical");
  });

  it("applies horizontal orientation", () => {
    const { container } = render(<Field orientation="horizontal" />);
    expect(container.firstChild).toHaveAttribute("data-orientation", "horizontal");
  });
});

describe("FieldLabel", () => {
  it("renders children", () => {
    render(<FieldLabel>Name</FieldLabel>);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<FieldLabel>Label</FieldLabel>);
    expect(screen.getByText("Label")).toHaveAttribute("data-slot", "field-label");
  });
});

describe("FieldTitle", () => {
  it("renders children", () => {
    render(<FieldTitle>Title</FieldTitle>);
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<FieldTitle>Title</FieldTitle>);
    // FieldTitle uses data-slot="field-label" (component source convention)
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "field-label");
  });
});

describe("FieldDescription", () => {
  it("renders children", () => {
    render(<FieldDescription>Description text.</FieldDescription>);
    expect(screen.getByText("Description text.")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<FieldDescription>Desc</FieldDescription>);
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "field-description");
  });
});

describe("FieldError", () => {
  it("renders an error message", () => {
    render(<FieldError errors={[{ message: "This field is required" }]} />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("renders multiple errors", () => {
    render(<FieldError errors={[{ message: "Too short" }, { message: "Invalid format" }]} />);
    expect(screen.getByText("Too short")).toBeInTheDocument();
    expect(screen.getByText("Invalid format")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(<FieldError errors={[{ message: "Error" }]} />);
    expect(document.querySelector('[data-slot="field-error"]')).toBeInTheDocument();
  });
});

describe("FieldGroup", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<FieldGroup />);
    expect(container.firstChild).toHaveAttribute("data-slot", "field-group");
  });
});

describe("FieldLegend", () => {
  it("renders children", () => {
    render(
      <fieldset>
        <FieldLegend>Personal Info</FieldLegend>
      </fieldset>,
    );
    expect(screen.getByText("Personal Info")).toBeInTheDocument();
  });
});

describe("FieldSeparator", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<FieldSeparator />);
    expect(container.firstChild).toHaveAttribute("data-slot", "field-separator");
  });
});

describe("FieldSet", () => {
  it("renders children", () => {
    render(<FieldSet>fieldset content</FieldSet>);
    expect(screen.getByText("fieldset content")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<FieldSet />);
    expect(container.firstChild).toHaveAttribute("data-slot", "field-set");
  });
});

describe("FieldContent", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(<FieldContent />);
    expect(container.firstChild).toHaveAttribute("data-slot", "field-content");
  });
});
