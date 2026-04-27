import { Prop } from "@stencil/core";
import { DEFAULT_THEME, type EXTheme } from "./theme";

/**
 * Base class providing individual theme token @Prop()s for every Stencil component.
 *
 * Each token defaults to undefined so we can detect "not set by consumer" and fall
 * back to DEFAULT_THEME in resolvedTheme. This means:
 *   - Consumers can override a single token via HTML attribute: color-primary="#e11d48"
 *   - Composite components (ex-login-box) can spread resolvedTheme to children
 *   - SSR is safe — no module-level singletons, each render is self-contained
 */
export class ThemeBase {
  // ── Colors ───────────────────────────────────────────────────────────────
  @Prop() colorBackground?: string;
  @Prop() colorSurface?: string;
  @Prop() colorPrimary?: string;
  @Prop() colorPrimaryHover?: string;
  @Prop() colorPrimaryForeground?: string;
  @Prop() colorText?: string;
  @Prop() colorTextMuted?: string;
  @Prop() colorInputBackground?: string;
  @Prop() colorInputBorder?: string;
  @Prop() colorInputBorderFocus?: string;
  @Prop() colorError?: string;
  @Prop() colorDivider?: string;
  @Prop() colorLink?: string;

  // ── Typography ────────────────────────────────────────────────────────────
  @Prop() fontFamily?: string;
  @Prop() fontSizeXs?: string;
  @Prop() fontSizeSm?: string;
  @Prop() fontSizeMd?: string;
  @Prop() fontSizeLg?: string;
  @Prop() fontSizeXl?: string;
  @Prop() fontWeightNormal?: string;
  @Prop() fontWeightMedium?: string;
  @Prop() fontWeightSemibold?: string;

  // ── Radius ────────────────────────────────────────────────────────────────
  @Prop() radiusSm?: string;
  @Prop() radiusMd?: string;
  @Prop() radiusLg?: string;
  @Prop() radiusXl?: string;

  /** Merge consumer-supplied tokens with DEFAULT_THEME. */
  protected get resolvedTheme(): EXTheme {
    return {
      colorBackground: this.colorBackground ?? DEFAULT_THEME.colorBackground,
      colorSurface: this.colorSurface ?? DEFAULT_THEME.colorSurface,
      colorPrimary: this.colorPrimary ?? DEFAULT_THEME.colorPrimary,
      colorPrimaryHover: this.colorPrimaryHover ?? DEFAULT_THEME.colorPrimaryHover,
      colorPrimaryForeground: this.colorPrimaryForeground ?? DEFAULT_THEME.colorPrimaryForeground,
      colorText: this.colorText ?? DEFAULT_THEME.colorText,
      colorTextMuted: this.colorTextMuted ?? DEFAULT_THEME.colorTextMuted,
      colorInputBackground: this.colorInputBackground ?? DEFAULT_THEME.colorInputBackground,
      colorInputBorder: this.colorInputBorder ?? DEFAULT_THEME.colorInputBorder,
      colorInputBorderFocus: this.colorInputBorderFocus ?? DEFAULT_THEME.colorInputBorderFocus,
      colorError: this.colorError ?? DEFAULT_THEME.colorError,
      colorDivider: this.colorDivider ?? DEFAULT_THEME.colorDivider,
      colorLink: this.colorLink ?? DEFAULT_THEME.colorLink,
      fontFamily: this.fontFamily ?? DEFAULT_THEME.fontFamily,
      fontSizeXs: this.fontSizeXs ?? DEFAULT_THEME.fontSizeXs,
      fontSizeSm: this.fontSizeSm ?? DEFAULT_THEME.fontSizeSm,
      fontSizeMd: this.fontSizeMd ?? DEFAULT_THEME.fontSizeMd,
      fontSizeLg: this.fontSizeLg ?? DEFAULT_THEME.fontSizeLg,
      fontSizeXl: this.fontSizeXl ?? DEFAULT_THEME.fontSizeXl,
      fontWeightNormal: this.fontWeightNormal ?? DEFAULT_THEME.fontWeightNormal,
      fontWeightMedium: this.fontWeightMedium ?? DEFAULT_THEME.fontWeightMedium,
      fontWeightSemibold: this.fontWeightSemibold ?? DEFAULT_THEME.fontWeightSemibold,
      radiusSm: this.radiusSm ?? DEFAULT_THEME.radiusSm,
      radiusMd: this.radiusMd ?? DEFAULT_THEME.radiusMd,
      radiusLg: this.radiusLg ?? DEFAULT_THEME.radiusLg,
      radiusXl: this.radiusXl ?? DEFAULT_THEME.radiusXl,
    };
  }
}
