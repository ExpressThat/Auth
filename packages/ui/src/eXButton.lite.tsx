import { Show, useContext, useStore } from "@builder.io/mitosis";
import ThemeContext from "./theme.context.lite";

export interface EXButtonProps {
  label: string;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
}

export default function EXButton(props: EXButtonProps) {
  const theme = useContext(ThemeContext);
  const state = useStore({
    isHovered: false,
    get isPrimary(): boolean {
      return !props.variant || props.variant === "primary";
    },
    get isDisabled(): boolean {
      return !!(props.disabled || props.isLoading);
    },
  });

  return (
    <button
      type={props.type || "button"}
      disabled={state.isDisabled}
      onMouseEnter={() => (state.isHovered = true)}
      onMouseLeave={() => (state.isHovered = false)}
      onClick={() => props.onClick?.()}
      css={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: "0.75rem 1.5rem",
        borderWidth: "1px",
        borderStyle: "solid",
        transition: "background-color 0.15s ease, opacity 0.15s ease",
      }}
      style={{
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSizeMd,
        fontWeight: theme.fontWeightSemibold,
        borderRadius: theme.radiusMd,
        borderColor:
          props.variant === "ghost" || state.isPrimary ? "transparent" : theme.colorPrimary,
        cursor: state.isDisabled ? "not-allowed" : "pointer",
        opacity: state.isDisabled ? "0.6" : "1",
        backgroundColor: state.isPrimary
          ? state.isHovered
            ? theme.colorPrimaryHover
            : theme.colorPrimary
          : "transparent",
        color: state.isPrimary ? theme.colorPrimaryForeground : theme.colorPrimary,
        boxShadow: state.isPrimary ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
      }}
    >
      <Show when={!!props.isLoading} else={<span>{props.label}</span>}>
        <span>Loading…</span>
      </Show>
    </button>
  );
}
