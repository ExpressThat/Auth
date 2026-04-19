import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "./input-otp";

// input-otp schedules timers via React's setMirrorSelectionStart that fire
// after jsdom teardown. Wait after each test AND after all tests to let them
// fire while jsdom is still active.
afterEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 50));
});

describe("InputOTP", () => {
  it("renders", () => {
    const { container } = render(
      <InputOTP maxLength={4}>
        <InputOTPGroup />
      </InputOTP>,
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it("sets data-slot attribute", () => {
    render(
      <InputOTP maxLength={4}>
        <InputOTPGroup />
      </InputOTP>,
    );
    expect(document.querySelector('[data-slot="input-otp"]')).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(
      <InputOTP maxLength={4} className="custom-class">
        <InputOTPGroup />
      </InputOTP>,
    );
    expect(document.querySelector('[data-slot="input-otp"]')).toHaveClass("custom-class");
  });
});

describe("InputOTPGroup", () => {
  it("sets data-slot attribute", () => {
    const { container } = render(
      <InputOTP maxLength={4}>
        <InputOTPGroup />
      </InputOTP>,
    );
    expect(container.querySelector('[data-slot="input-otp-group"]')).toBeInTheDocument();
  });
});

describe("InputOTPSlot", () => {
  it("renders a slot element", () => {
    render(
      <InputOTP maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
      </InputOTP>,
    );
    expect(document.querySelector('[data-slot="input-otp-slot"]')).toBeInTheDocument();
  });
});

describe("InputOTPSeparator", () => {
  it("renders a separator", () => {
    const { container } = render(
      <InputOTP maxLength={6}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={1} />
        </InputOTPGroup>
      </InputOTP>,
    );
    expect(container.querySelector('[data-slot="input-otp-separator"]')).toBeInTheDocument();
  });
});

describe("Full InputOTP composition", () => {
  it("renders all 4 slots", () => {
    render(
      <InputOTP maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>,
    );
    const slots = document.querySelectorAll('[data-slot="input-otp-slot"]');
    expect(slots).toHaveLength(4);
  });

  it("renders with hidden input for accessibility", () => {
    const { container } = render(
      <InputOTP maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
      </InputOTP>,
    );
    expect(container.querySelector("input")).toBeInTheDocument();
  });

  it("renders the underlying input element", () => {
    const { container: c } = render(
      <InputOTP maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
      </InputOTP>,
    );
    expect(c.querySelector("input")).toBeInTheDocument();
  });
});

describe("InputOTP interactions", () => {
  it("allows typing into the underlying input", () => {
    const { container } = render(
      <InputOTP maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
        </InputOTPGroup>
      </InputOTP>,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "12" } });
    expect(input).toHaveValue("12");
  });

  it("respects maxLength for the input", () => {
    const { container } = render(
      <InputOTP maxLength={4}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
      </InputOTP>,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input).toHaveAttribute("maxlength", "4");
  });
});
