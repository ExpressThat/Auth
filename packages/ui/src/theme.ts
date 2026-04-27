/**
 * Flat theme token interface.
 * Kept flat (no nested objects) so it maps cleanly to a Stencil store
 * and CSS custom properties without any deep-merge complexity.
 */
export interface EXTheme {
  // Colors
  colorBackground: string;
  colorSurface: string;
  colorPrimary: string;
  colorPrimaryHover: string;
  colorPrimaryForeground: string;
  colorText: string;
  colorTextMuted: string;
  colorInputBackground: string;
  colorInputBorder: string;
  colorInputBorderFocus: string;
  colorError: string;
  colorDivider: string;
  colorLink: string;
  // Typography
  fontFamily: string;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeMd: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontWeightNormal: string;
  fontWeightMedium: string;
  fontWeightSemibold: string;
  // Spacing / radius
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
}

export const DEFAULT_THEME: EXTheme = {
  colorBackground: "#f3f4f6",
  colorSurface: "#ffffff",
  colorPrimary: "#6366f1",
  colorPrimaryHover: "#4f46e5",
  colorPrimaryForeground: "#ffffff",
  colorText: "#111827",
  colorTextMuted: "#6b7280",
  colorInputBackground: "#f9fafb",
  colorInputBorder: "#d1d5db",
  colorInputBorderFocus: "#6366f1",
  colorError: "#ef4444",
  colorDivider: "#e5e7eb",
  colorLink: "#6366f1",
  fontFamily: "Inter, system-ui, sans-serif",
  fontSizeXs: "0.75rem",
  fontSizeSm: "0.875rem",
  fontSizeMd: "0.9375rem",
  fontSizeLg: "1.125rem",
  fontSizeXl: "1.5rem",
  fontWeightNormal: "400",
  fontWeightMedium: "500",
  fontWeightSemibold: "600",
  radiusSm: "6px",
  radiusMd: "10px",
  radiusLg: "16px",
  radiusXl: "24px",
};
