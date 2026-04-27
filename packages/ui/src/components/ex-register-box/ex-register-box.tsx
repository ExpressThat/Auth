// biome-ignore lint/correctness/noUnusedImports: Stencil requires explicit h factory and decorator imports

import { createExpressThatAuthClient } from "@expressthat-auth/api-client";
import { Component, Event, type EventEmitter, h, State } from "@stencil/core";
import { ThemeBase } from "../../theme-base";

export interface EXRegisterBoxSubmitDetail {
  email: string;
  password: string;
}

@Component({
  tag: "ex-register-box",
  styleUrl: "ex-register-box.css",
  shadow: true,
})
export class EXRegisterBox extends ThemeBase {
  /** Fired when the form is submitted; detail contains email + password. */
  @Event() exSubmit!: EventEmitter<EXRegisterBoxSubmitDetail>;

  /** Fired when the "Sign in" link is clicked. */
  @Event() exSignIn!: EventEmitter<void>;

  @State() private email: string = "";
  @State() private password: string = "";
  @State() private confirmPassword: string = "";
  @State() private showPassword: boolean = false;
  @State() private showConfirmPassword: boolean = false;
  @State() private confirmError: string = "";

  private client = createExpressThatAuthClient("http://localhost:3001");

  private handleSubmit = (e?: Event) => {
    console.log("Submitting registration form with email:", this.email);
    e?.preventDefault();
    if (this.password !== this.confirmPassword) {
      this.confirmError = "Passwords do not match";
      return;
    }
    this.confirmError = "";

    this.client.account
      .register({
        email: this.email,
        password: this.password,
      })
      .then((response) => {
        console.log(`Registration successful: Email: ${response.email}, User ID: ${response.id}`);
      })
      .catch((error) => {
        console.error("Registration failed:", error);
      });

    this.exSubmit.emit({ email: this.email, password: this.password });
  };

  render() {
    const theme = this.resolvedTheme;
    const passwordToggleLabel = this.showPassword ? "Hide" : "Show";
    const confirmToggleLabel = this.showConfirmPassword ? "Hide" : "Show";

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
              Create an account
            </h1>
            <p
              style={{
                margin: "0",
                fontSize: theme.fontSizeSm,
                color: theme.colorTextMuted,
              }}
            >
              Sign up to get started
            </p>
          </div>

          {/* Form */}
          <form onSubmit={this.handleSubmit} noValidate>
            {/* Email field */}
            <div style={{ marginBottom: "1.25rem" }}>
              <ex-input
                input-id="ex-register-email"
                type="email"
                label="Email address"
                value={this.email}
                placeholder="you@example.com"
                {...theme}
                onExChange={(e: CustomEvent<string>) => (this.email = e.detail)}
              />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: "1.25rem" }}>
              <ex-input
                input-id="ex-register-password"
                type={this.showPassword ? "text" : "password"}
                label="Password"
                value={this.password}
                placeholder="••••••••"
                right-button-label={passwordToggleLabel}
                {...theme}
                onExChange={(e: CustomEvent<string>) => (this.password = e.detail)}
                onExRightButtonClick={() => (this.showPassword = !this.showPassword)}
              />
            </div>

            {/* Confirm password field */}
            <div style={{ marginBottom: "1.5rem" }}>
              <ex-input
                input-id="ex-register-confirm-password"
                type={this.showConfirmPassword ? "text" : "password"}
                label="Confirm password"
                value={this.confirmPassword}
                placeholder="••••••••"
                right-button-label={confirmToggleLabel}
                error={this.confirmError}
                {...theme}
                onExChange={(e: CustomEvent<string>) => (this.confirmPassword = e.detail)}
                onExRightButtonClick={() => (this.showConfirmPassword = !this.showConfirmPassword)}
              />
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              <ex-button
                label="Create account"
                type="button"
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

          {/* Sign in link */}
          <p
            style={{
              marginTop: "1.5rem",
              marginBottom: "0",
              textAlign: "center",
              fontSize: theme.fontSizeSm,
              color: theme.colorTextMuted,
            }}
          >
            Already have an account?{" "}
            <button
              type="button"
              part="sign-in"
              onClick={() => this.exSignIn.emit()}
              style={{
                background: "none",
                border: "none",
                padding: "0",
                cursor: "pointer",
                fontSize: theme.fontSizeSm,
                color: theme.colorLink,
                fontFamily: theme.fontFamily,
                fontWeight: theme.fontWeightMedium,
              }}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }
}
