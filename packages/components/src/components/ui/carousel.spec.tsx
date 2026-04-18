import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel";

describe("Carousel", () => {
  it("renders", () => {
    const { container } = render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    const { container } = render(
      <Carousel>
        <CarouselContent />
      </Carousel>,
    );
    expect(container.firstChild).toHaveAttribute("data-slot", "carousel");
  });

  it("merges custom className", () => {
    const { container } = render(
      <Carousel className="custom-class">
        <CarouselContent />
      </Carousel>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("CarouselContent", () => {
  it("sets data-slot attribute", () => {
    render(
      <Carousel>
        <CarouselContent />
      </Carousel>,
    );
    expect(document.querySelector('[data-slot="carousel-content"]')).toBeInTheDocument();
  });
});

describe("CarouselItem", () => {
  it("renders children", () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    expect(screen.getByText("Slide")).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide</CarouselItem>
        </CarouselContent>
      </Carousel>,
    );
    expect(document.querySelector('[data-slot="carousel-item"]')).toBeInTheDocument();
  });
});

describe("CarouselPrevious", () => {
  it("renders", () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
      </Carousel>,
    );
    expect(document.querySelector('[data-slot="carousel-previous"]')).toBeInTheDocument();
  });
});

describe("CarouselNext", () => {
  it("renders", () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide</CarouselItem>
        </CarouselContent>
        <CarouselNext />
      </Carousel>,
    );
    expect(document.querySelector('[data-slot="carousel-next"]')).toBeInTheDocument();
  });
});
