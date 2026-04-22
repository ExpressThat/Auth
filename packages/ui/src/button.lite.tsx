import { useStore } from "@builder.io/mitosis";

export interface ButtonProps {
  label: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}

export default function Button(props: ButtonProps) {
  const state = useStore({
    get buttonClass(): string {
      return `btn btn--${props.variant ?? "primary"}`;
    },
  });

  return (
    <button
      type="button"
      disabled={props.disabled}
      class={state.buttonClass}
      onClick={() => props.onClick?.()}
    >
      {props.label}
    </button>
  );
}
