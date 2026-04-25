import { Show, useContext, useStore } from "@builder.io/mitosis";
import ThemeContext from "./theme.context.lite";

export interface EXInputProps {
  id?: string;
  type?: string;
  label?: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  /** Label for an optional right-side button (e.g. "Show" / "Hide"). */
  rightButtonLabel?: string;
  onRightButtonClick?: () => void;
  onChange?: (value: string) => void;
}

export default function EXInput(props: EXInputProps) {
  const theme = useContext(ThemeContext);
  const state = useStore({
    isFocused: false,
    get hasRightButton(): boolean {
      return props.rightButtonLabel != null;
    },
    get hasError(): boolean {
      return props.error != null && props.error !== "";
    },
  });

  return (
    <div style={{ fontFamily: theme.fontFamily }}>
      <Show when={props.label != null}>
        <label
          for={props.id}
          css={{ display: "block", marginBottom: "0.375rem" }}
          style={{
            fontSize: theme.fontSizeSm,
            fontWeight: theme.fontWeightMedium,
            color: theme.colorText,
          }}
        >
          {props.label}
        </label>
      </Show>
      <div css={{ position: "relative" }}>
        <input
          id={props.id}
          type={props.type || "text"}
          value={props.value}
          placeholder={props.placeholder}
          disabled={props.disabled}
          onFocus={() => (state.isFocused = true)}
          onBlur={() => (state.isFocused = false)}
          onInput={(event) => props.onChange?.(event.target.value)}
          css={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            outline: "none",
            transition: "border-color 0.15s ease",
            borderWidth: "1px",
            borderStyle: "solid",
          }}
          style={{
            padding: state.hasRightButton ? "0.625rem 3rem 0.625rem 0.875rem" : "0.625rem 0.875rem",
            fontSize: theme.fontSizeMd,
            color: theme.colorText,
            backgroundColor: theme.colorInputBackground,
            borderColor: state.hasError
              ? theme.colorError
              : state.isFocused
                ? theme.colorInputBorderFocus
                : theme.colorInputBorder,
            borderRadius: theme.radiusMd,
          }}
        />
        <Show when={state.hasRightButton}>
          <div
            css={{
              position: "absolute",
              right: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => props.onRightButtonClick?.()}
              css={{
                background: "none",
                border: "none",
                padding: "0",
                cursor: "pointer",
                lineHeight: "1",
              }}
              style={{
                fontSize: theme.fontSizeSm,
                color: theme.colorTextMuted,
                fontFamily: theme.fontFamily,
              }}
            >
              {props.rightButtonLabel}
            </button>
          </div>
        </Show>
      </div>
      <Show when={state.hasError}>
        <span
          css={{ display: "block", marginTop: "0.375rem" }}
          style={{
            fontSize: theme.fontSizeXs,
            color: theme.colorError,
          }}
        >
          {props.error}
        </span>
      </Show>
    </div>
  );
}
