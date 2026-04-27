// biome-ignore lint/correctness/noUnusedImports: Stencil requires explicit h factory and decorator imports
import { Component, Event, type EventEmitter, h, State } from "@stencil/core";
import { ThemeBase } from "../../theme-base";

export interface EXLoginBoxSubmitDetail {
  email: string;
  password: string;
}

@Component({
  tag: "ex-login-box",
  styleUrl: "ex-login-box.css",
  shadow: true,
})
export class EXLoginBox extends ThemeBase {
  /** Fired when the form is submitted; detail contains email + password. */
  @Event() exSubmit!: EventEmitter<EXLoginBoxSubmitDetail>;

  /** Fired when the forgot-password link is clicked. */
  @Event() exForgotPassword!: EventEmitter<void>;

  @State() private email: string = "";
  @State() private password: string = "";
  @State() private showPassword: boolean = false;

  private handleSubmit = (e?: Event) => {
    e?.preventDefault();
    this.exSubmit.emit({ email: this.email, password: this.password });
  };

  render() {
    const theme = this.resolvedTheme;
    const passwordType = this.showPassword ? "text" : "password";
    const passwordToggleLabel = this.showPassword ? "Hide" : "Show";

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          backgroundColor: theme.colorBackground,
          fontFamily: theme.fontFamily,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "2.5rem",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
            backgroundColor: theme.colorSurface,
            borderRadius: theme.radiusLg,
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "2rem", textAlign: "center" }}>
            <h1
              style={{
                margin: "0 0 0.5rem 0",
                fontSize: theme.fontSizeXl,
                fontWeight: theme.fontWeightSemibold,
                color: theme.colorText,
              }}
            >
              Welcome back
            </h1>
            <p
              style={{
                margin: "0",
                fontSize: theme.fontSizeSm,
                color: theme.colorTextMuted,
              }}
            >
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={this.handleSubmit} noValidate>
            {/* Email field */}
            <div style={{ marginBottom: "1.25rem" }}>
              <ex-input
                input-id="ex-login-email"
                type="email"
                label="Email address"
                value={this.email}
                placeholder="you@example.com"
                {...theme}
                onExChange={(e: CustomEvent<string>) => (this.email = e.detail)}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "0.375rem",
                }}
              >
                <span
                  style={{
                    fontSize: theme.fontSizeSm,
                    fontWeight: theme.fontWeightMedium,
                    color: theme.colorText,
                  }}
                >
                  Password
                </span>
                <button
                  type="button"
                  part="forgot-password"
                  onClick={() => this.exForgotPassword.emit()}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "0",
                    cursor: "pointer",
                    fontSize: theme.fontSizeXs,
                    color: theme.colorLink,
                    fontFamily: theme.fontFamily,
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <ex-input
                input-id="ex-login-password"
                type={passwordType}
                value={this.password}
                placeholder="••••••••"
                right-button-label={passwordToggleLabel}
                {...theme}
                onExChange={(e: CustomEvent<string>) => (this.password = e.detail)}
                onExRightButtonClick={() => (this.showPassword = !this.showPassword)}
              />
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              <ex-button
                label="Sign in"
                type="submit"
                variant="primary"
                {...theme}
                onExClick={this.handleSubmit}
              />
            </div>
          </form>

          {/* Social logins slot */}
          <div style={{ marginTop: "1.75rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ flex: "1", height: "1px", backgroundColor: theme.colorDivider }} />
              <span
                style={{
                  whiteSpace: "nowrap",
                  fontSize: theme.fontSizeXs,
                  color: theme.colorTextMuted,
                }}
              >
                or continue with
              </span>
              <div style={{ flex: "1", height: "1px", backgroundColor: theme.colorDivider }} />
            </div>
            <slot name="social-logins" />
          </div>
        </div>
      </div>
    );
  }
}
