export interface ButtonProps {
  label: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  onClick?: () => void;
}

export default function Button(props: ButtonProps) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      class={`btn btn--${props.variant ?? "primary"}`}
      onClick={() => props.onClick?.()}
    >
      {props.label}
    </button>
  );
}
