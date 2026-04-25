import { Show, useContext, useStore } from "@builder.io/mitosis";
import EXButton from "./eXButton.lite";
import EXInput from "./eXInput.lite";
import ThemeContext from "./theme.context.lite";

export interface EXLoginBoxProps {
  title?: string;
  subtitle?: string;
  emailLabel?: string;
  passwordLabel?: string;
  submitLabel?: string;
  forgotPasswordLabel?: string;
  socialDividerLabel?: string;
  socialLogins?: any;
  onForgotPassword?: () => void;
  onSubmit?: (email: string, password: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
}

export default function EXLoginBox(props: EXLoginBoxProps) {
  const theme = useContext(ThemeContext);
  const state = useStore({
    email: "",
    password: "",
    showPassword: false,
    get passwordInputType(): string {
      return state.showPassword ? "text" : "password";
    },
    get showPasswordLabel(): string {
      return state.showPassword ? "Hide" : "Show";
    },
    handleSubmit(event: any) {
      event.preventDefault();
      if (props.isLoading) {
        return;
      }
      props.onSubmit?.(state.email, state.password);
    },
  });

  return (
    <div
      css={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
      style={{
        backgroundColor: theme.colorBackground,
        fontFamily: theme.fontFamily,
      }}
    >
      <div
        css={{
          width: "100%",
          maxWidth: "420px",
          padding: "2.5rem",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
        }}
        style={{
          backgroundColor: theme.colorSurface,
          borderRadius: theme.radiusLg,
        }}
      >
        {/* Header */}
        <div css={{ marginBottom: "2rem", textAlign: "center" }}>
          <h1
            css={{ margin: "0 0 0.5rem 0" }}
            style={{
              fontSize: theme.fontSizeXl,
              fontWeight: theme.fontWeightSemibold,
              color: theme.colorText,
            }}
          >
            {props.title || "Welcome back"}
          </h1>
          <p
            css={{ margin: "0" }}
            style={{
              fontSize: theme.fontSizeSm,
              color: theme.colorTextMuted,
            }}
          >
            {props.subtitle || "Sign in to your account"}
          </p>
        </div>

        <form onSubmit={(event) => state.handleSubmit(event)}>
          {/* Email */}
          <div css={{ marginBottom: "1.25rem" }}>
            <EXInput
              id="ex-login-email"
              type="email"
              label={props.emailLabel || "Email"}
              value={state.email}
              placeholder="you@example.com"
              onChange={(value) => (state.email = value)}
            />
          </div>

          {/* Password */}
          <div css={{ marginBottom: "1.25rem" }}>
            <div
              css={{
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
                {props.passwordLabel || "Password"}
              </span>
              <Show when={props.onForgotPassword != null}>
                <button
                  type="button"
                  onClick={() => props.onForgotPassword?.()}
                  css={{
                    background: "none",
                    border: "none",
                    padding: "0",
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                  style={{
                    fontSize: theme.fontSizeXs,
                    color: theme.colorLink,
                    fontFamily: theme.fontFamily,
                  }}
                >
                  {props.forgotPasswordLabel || "Forgot password?"}
                </button>
              </Show>
            </div>
            <EXInput
              id="ex-login-password"
              type={state.passwordInputType}
              value={state.password}
              placeholder="••••••••"
              onChange={(value) => (state.password = value)}
              rightButtonLabel={state.showPasswordLabel}
              onRightButtonClick={() => (state.showPassword = !state.showPassword)}
            />
          </div>

          {/* Error message */}
          <Show when={props.errorMessage != null}>
            <div
              css={{
                marginBottom: "1rem",
                padding: "0.75rem",
                borderWidth: "1px",
                borderStyle: "solid",
              }}
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                borderColor: "rgba(239, 68, 68, 0.25)",
                borderRadius: theme.radiusSm,
                fontSize: theme.fontSizeSm,
                color: theme.colorError,
              }}
            >
              {props.errorMessage}
            </div>
          </Show>

          <div css={{ marginTop: "0.5rem" }}>
            <EXButton
              label={props.submitLabel || "Sign in"}
              type="submit"
              variant="primary"
              isLoading={props.isLoading}
            />
          </div>
        </form>

        {/* Social logins */}
        <Show when={props.socialLogins != null}>
          <div css={{ marginTop: "1.75rem" }}>
            <div
              css={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <div
                css={{ flex: "1", height: "1px" }}
                style={{ backgroundColor: theme.colorDivider }}
              />
              <span
                css={{ whiteSpace: "nowrap" }}
                style={{
                  fontSize: theme.fontSizeXs,
                  color: theme.colorTextMuted,
                }}
              >
                {props.socialDividerLabel || "or continue with"}
              </span>
              <div
                css={{ flex: "1", height: "1px" }}
                style={{ backgroundColor: theme.colorDivider }}
              />
            </div>
            {props.socialLogins}
          </div>
        </Show>
      </div>
    </div>
  );
}
