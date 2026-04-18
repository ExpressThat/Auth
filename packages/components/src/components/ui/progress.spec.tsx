import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Progress,
  ProgressIndicator,
  ProgressLabel,
  ProgressTrack,
  ProgressValue,
} from "./progress";

describe("Progress", () => {
  it("renders", () => {
    const { container } = render(<Progress value={50} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(<Progress value={50} />);
    expect(container.firstChild).toHaveAttribute("data-slot", "progress");
  });

  it("merges custom className", () => {
    const { container } = render(<Progress value={50} className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("ProgressTrack", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(
      <Progress value={50}>
        <ProgressTrack />
      </Progress>,
    );
    expect(container.querySelector('[data-slot="progress-track"]')).toBeInTheDocument();
  });
});

describe("ProgressIndicator", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(
      <Progress value={50}>
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </Progress>,
    );
    expect(container.querySelector('[data-slot="progress-indicator"]')).toBeInTheDocument();
  });
});

describe("ProgressLabel", () => {
  it("renders children", () => {
    render(
      <Progress value={50}>
        <ProgressLabel>Loading...</ProgressLabel>
      </Progress>,
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Progress value={50}>
        <ProgressLabel>Label</ProgressLabel>
      </Progress>,
    );
    expect(document.querySelector('[data-slot="progress-label"]')).toBeInTheDocument();
  });
});

describe("ProgressValue", () => {
  it("renders children", () => {
    render(
      <Progress value={50}>
        <ProgressValue>{() => "50%"}</ProgressValue>
      </Progress>,
    );
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Progress value={50}>
        <ProgressValue>{() => "50%"}</ProgressValue>
      </Progress>,
    );
    expect(document.querySelector('[data-slot="progress-value"]')).toBeInTheDocument();
  });
});
