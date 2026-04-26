// biome-ignore lint/correctness/noUnusedImports: Stencil requires explicit h factory and decorator imports
import { Component, Event, type EventEmitter, h, Prop } from "@stencil/core";

@Component({
  tag: "ex-button",
  styleUrl: "ex-button.css",
  shadow: true,
})
export class ExButton {
  /** Text content of the button. */
  @Prop() label: string = "Button";

  /** Visual style variant. */
  @Prop() variant: "primary" | "secondary" | "outline" = "primary";

  /** Whether the button is disabled. */
  @Prop() disabled: boolean = false;

  /** Fired when the button is clicked. */
  @Event() exClick!: EventEmitter<void>;

  private handleClick = () => {
    this.exClick.emit();
  };

  render() {
    return (
      <button
        class={`btn btn--${this.variant}`}
        disabled={this.disabled}
        onClick={this.handleClick}
        type="button"
        part="button"
      >
        {this.label}
      </button>
    );
  }
}
