// biome-ignore lint/correctness/noUnusedImports: Stencil requires explicit h factory and decorator imports
import { Component, Event, type EventEmitter, h, Prop, State } from "@stencil/core";
import { ThemeBase } from "../../theme-base";

@Component({
  tag: "ex-button",
  styleUrl: "ex-button.css",
  shadow: true,
})
export class EXButton extends ThemeBase {
  /** Text content of the button. */
  @Prop() label: string = "Button";

  /** HTML button type. */
  @Prop() type: "button" | "submit" | "reset" = "button";

  /** Visual style variant. */
  @Prop() variant: "primary" | "secondary" | "ghost" = "primary";

  /** Disables the button. */
  @Prop() disabled: boolean = false;

  /** Shows a loading indicator and disables interaction. */
  @Prop() isLoading: boolean = false;

  /** Fired when the button is clicked. */
  @Event() exClick!: EventEmitter<void>;

  @State() private isHovered: boolean = false;

  private get isPrimary(): boolean {
    return this.variant === "primary";
  }

  private get isDisabled(): boolean {
    return this.disabled || this.isLoading;
  }

  private handleClick = () => {
    if (!this.isDisabled) {
      this.exClick.emit();
    }
  };

  render() {
    const theme = this.resolvedTheme;
    const bg = this.isPrimary
      ? this.isHovered
        ? theme.colorPrimaryHover
        : theme.colorPrimary
      : "transparent";

    return (
      <button
        type={this.type}
        disabled={this.isDisabled}
        part="button"
        onMouseEnter={() => (this.isHovered = true)}
        onMouseLeave={() => (this.isHovered = false)}
        onClick={this.handleClick}
        style={{
          fontFamily: theme.fontFamily,
          fontSize: theme.fontSizeMd,
          fontWeight: theme.fontWeightSemibold,
          borderRadius: theme.radiusMd,
          borderColor:
            this.variant === "ghost" || this.isPrimary ? "transparent" : theme.colorPrimary,
          cursor: this.isDisabled ? "not-allowed" : "pointer",
          opacity: this.isDisabled ? "0.6" : "1",
          backgroundColor: bg,
          color: this.isPrimary ? theme.colorPrimaryForeground : theme.colorPrimary,
          boxShadow: this.isPrimary ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {this.isLoading ? <span>Loading…</span> : <span>{this.label}</span>}
      </button>
    );
  }
}
