// biome-ignore lint/correctness/noUnusedImports: Stencil requires explicit h factory and decorator imports
import { Component, Event, type EventEmitter, h, Prop, State } from "@stencil/core";
import { ThemeBase } from "../../theme-base";

@Component({
  tag: "ex-input",
  styleUrl: "ex-input.css",
  shadow: true,
})
export class EXInput extends ThemeBase {
  /** Associates the label with the input. */
  @Prop() inputId?: string;

  /** Input type (text, email, password, etc.). */
  @Prop() type: string = "text";

  /** Visible label above the input. */
  @Prop() label?: string;

  /** Controlled value. */
  @Prop() value: string = "";

  /** Placeholder text. */
  @Prop() placeholder?: string;

  /** Disables the input. */
  @Prop() disabled: boolean = false;

  /** Validation error message shown below the input. */
  @Prop() error?: string;

  /** Label for an optional right-side button (e.g. "Show" / "Hide"). */
  @Prop() rightButtonLabel?: string;

  /** Fired when the right button is clicked. */
  @Event() exRightButtonClick!: EventEmitter<void>;

  /** Fired when the value changes; detail is the new string value. */
  @Event() exChange!: EventEmitter<string>;

  @State() private isFocused: boolean = false;

  private get hasRightButton(): boolean {
    return this.rightButtonLabel != null;
  }

  private get hasError(): boolean {
    return this.error != null && this.error !== "";
  }

  render() {
    const theme = this.resolvedTheme;

    return (
      <div style={{ fontFamily: theme.fontFamily }}>
        {this.label != null && (
          <label
            htmlFor={this.inputId}
            style={{
              display: "block",
              marginBottom: "0.375rem",
              fontSize: theme.fontSizeSm,
              fontWeight: theme.fontWeightMedium,
              color: theme.colorText,
            }}
          >
            {this.label}
          </label>
        )}
        <div style={{ position: "relative" }}>
          <input
            id={this.inputId}
            type={this.type}
            value={this.value}
            placeholder={this.placeholder}
            disabled={this.disabled}
            part="input"
            onFocus={() => (this.isFocused = true)}
            onBlur={() => (this.isFocused = false)}
            onInput={(e) => this.exChange.emit((e.target as HTMLInputElement).value)}
            style={{
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              outline: "none",
              transition: "border-color 0.15s ease",
              borderWidth: "1px",
              borderStyle: "solid",
              padding: this.hasRightButton
                ? "0.625rem 3rem 0.625rem 0.875rem"
                : "0.625rem 0.875rem",
              fontSize: theme.fontSizeMd,
              color: theme.colorText,
              backgroundColor: theme.colorInputBackground,
              borderColor: this.hasError
                ? theme.colorError
                : this.isFocused
                  ? theme.colorInputBorderFocus
                  : theme.colorInputBorder,
              borderRadius: theme.radiusMd,
            }}
          />
          {this.hasRightButton && (
            <div
              style={{
                position: "absolute",
                top: "0",
                right: "0",
                bottom: "0",
                display: "flex",
                alignItems: "center",
                paddingRight: "0.625rem",
              }}
            >
              <button
                type="button"
                part="right-button"
                onClick={() => this.exRightButtonClick.emit()}
                style={{
                  background: "none",
                  border: "none",
                  padding: "0",
                  cursor: "pointer",
                  fontSize: theme.fontSizeXs,
                  fontWeight: theme.fontWeightMedium,
                  color: theme.colorLink,
                  fontFamily: theme.fontFamily,
                }}
              >
                {this.rightButtonLabel}
              </button>
            </div>
          )}
        </div>
        {this.hasError && (
          <p
            style={{
              marginTop: "0.375rem",
              marginBottom: "0",
              fontSize: theme.fontSizeXs,
              color: theme.colorError,
            }}
          >
            {this.error}
          </p>
        )}
      </div>
    );
  }
}
