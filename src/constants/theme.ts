// ─── Design Tokens (Material You – BPS) ──────────────────────────────────────
export const T = {
  primary:          "#004ec7",
  primaryContainer: "#1565f5",
  onPrimary:        "#ffffff",
  onPrimaryFixed:   "#001849",
  primaryFixed:     "#dbe1ff",
  primaryFixedDim:  "#b3c5ff",

  secondary:        "#006a63",
  secondaryContainer:"#99efe5",
  onSecondary:      "#ffffff",
  onSecondaryContainer:"#006f67",

  surface:          "#f7f9fb",
  surfaceContainer: "#eceef0",
  surfaceContainerLow:"#f2f4f6",
  surfaceContainerHigh:"#e6e8ea",
  surfaceContainerHighest:"#e0e3e5",
  surfaceBright:    "#f7f9fb",
  onSurface:        "#191c1e",
  onSurfaceVariant: "#424655",

  outline:          "#737687",
  outlineVariant:   "#c2c6d8",

  error:            "#ba1a1a",
  errorContainer:   "#ffdad6",

  white:            "#ffffff",
  bg:               "#f7f9fb",
};

// ─── Stub exports untuk kompatibilitas komponen template Expo ────────────────
// (komponen app-tabs, themed-text, dll memerlukan ini agar tidak TS error)
export const Colors = {
  light: { text: T.onSurface, background: T.bg, tint: T.primary, icon: T.onSurfaceVariant, tabIconDefault: T.outline, tabIconSelected: T.primary },
  dark:  { text: "#ecedee",   background: "#151718", tint: "#fff", icon: "#9BA1A6", tabIconDefault: "#9BA1A6", tabIconSelected: "#fff" },
};

export const Fonts = {
  regular:   { fontFamily: "System", fontWeight: "400" as const },
  medium:    { fontFamily: "System", fontWeight: "500" as const },
  bold:      { fontFamily: "System", fontWeight: "700" as const },
  heavy:     { fontFamily: "System", fontWeight: "900" as const },
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export type ThemeColor = keyof typeof Colors.light;

export const MaxContentWidth = 768;
