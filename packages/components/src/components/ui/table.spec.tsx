import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

describe("Table", () => {
  it("renders a table element", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("sets data-slot attribute on the table", () => {
    const { container } = render(<Table />);
    expect(container.querySelector("table")).toHaveAttribute("data-slot", "table");
  });

  it("merges custom className on wrapper", () => {
    const { container } = render(<Table className="custom-class" />);
    expect(container.querySelector("table")).toHaveClass("custom-class");
  });
});

describe("TableHeader", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(
      <table>
        <TableHeader />
      </table>,
    );
    expect(container.querySelector("thead")).toHaveAttribute("data-slot", "table-header");
  });
});

describe("TableBody", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(
      <table>
        <TableBody />
      </table>,
    );
    expect(container.querySelector("tbody")).toHaveAttribute("data-slot", "table-body");
  });
});

describe("TableFooter", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(
      <table>
        <TableFooter />
      </table>,
    );
    expect(container.querySelector("tfoot")).toHaveAttribute("data-slot", "table-footer");
  });
});

describe("TableRow", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRow />
        </tbody>
      </table>,
    );
    expect(container.querySelector("tr")).toHaveAttribute("data-slot", "table-row");
  });
});

describe("TableHead", () => {
  it("renders children", () => {
    render(
      <table>
        <thead>
          <tr>
            <TableHead>Name</TableHead>
          </tr>
        </thead>
      </table>,
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(
      <table>
        <thead>
          <tr>
            <TableHead>H</TableHead>
          </tr>
        </thead>
      </table>,
    );
    expect(container.querySelector("th")).toHaveAttribute("data-slot", "table-head");
  });
});

describe("TableCell", () => {
  it("renders children", () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell>Value</TableCell>
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getByText("Value")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(
      <table>
        <tbody>
          <tr>
            <TableCell>C</TableCell>
          </tr>
        </tbody>
      </table>,
    );
    expect(container.querySelector("td")).toHaveAttribute("data-slot", "table-cell");
  });
});

describe("TableCaption", () => {
  it("renders children", () => {
    render(
      <table>
        <TableCaption>Caption text</TableCaption>
      </table>,
    );
    expect(screen.getByText("Caption text")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(
      <table>
        <TableCaption>Cap</TableCaption>
      </table>,
    );
    expect(container.querySelector("caption")).toHaveAttribute("data-slot", "table-caption");
  });
});
