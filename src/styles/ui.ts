import { Platform, StyleSheet } from "react-native";
import { T } from "../constants/theme";

// ─── Cross-platform shadow helper ────────────────────────────────────────────
function sh(offsetY = 2, opacity = 0.08, radius = 6, elevation = 2) {
  return Platform.OS === "web"
    ? { boxShadow: `0px ${offsetY}px ${radius}px rgba(0,0,0,${opacity})` }
    : { elevation, shadowColor: "#000", shadowOffset: { width: 0, height: offsetY }, shadowOpacity: opacity, shadowRadius: radius };
}

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: T.bg },

  // ── Top Nav ──
  topNav: {
    backgroundColor: T.surfaceContainerLow,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: T.outlineVariant,
    ...sh(1, 0.06, 4, 2),
  } as any,
  topNavBrand:   { fontSize: 16, fontWeight: "700", color: T.primary, letterSpacing: 0.2 },
  topNavActions: { flexDirection: "row", gap: 4 },
  topNavBtn:     { padding: 8, borderRadius: 20 },

  // ── Body layout ──
  body: { flex: 1, flexDirection: "row" },

  // ── Side Nav ──
  sideNav: {
    width: 220,
    overflow: "hidden",
    backgroundColor: T.surface,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderColor: T.outlineVariant,
  },
  sideNavBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sideNavLogoBox: {
    width: 38, height: 38,
    backgroundColor: T.primaryFixed,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sideNavBrandTitle: { fontSize: 13, fontWeight: "700", color: T.onSurface },
  sideNavBrandSub:   { fontSize: 9, color: T.onSurfaceVariant, letterSpacing: 0.8, marginTop: 1 },
  sideNavItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  sideNavItemActive: { backgroundColor: T.primaryFixed },
  sideNavLabel:      { fontSize: 13, color: T.onSurfaceVariant },
  sideNavBottom:     { marginTop: 40, paddingTop: 12, borderTopWidth: 1, borderColor: T.outlineVariant },

  // ── Main content ──
  main:        { flex: 1 },
  mainContent: {
    padding: 16,
    paddingBottom: 80,
    maxWidth: 720,
    alignSelf: "center" as const,
    width: "100%",
  },
  dotPattern:  { ...StyleSheet.absoluteFill, opacity: 0.04, backgroundColor: "transparent" },

  // ── Page header ──
  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
    flexWrap: "wrap",
  },
  pageTitle:    { fontSize: 22, fontWeight: "700", color: T.primary, letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 12, color: T.onSurfaceVariant, marginTop: 3 },

  // ── Badge ──
  badge: {
    backgroundColor: T.surfaceContainerHighest,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  badgeText: { fontSize: 11, fontWeight: "600", color: T.onSurface },

  // ── Stepper ──
  stepperWrap:   { marginBottom: 20, marginHorizontal: 4 },
  stepperScroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: T.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    minWidth: "100%" as any,
  },
  stepItem:    { flex: 1, flexDirection: "row", alignItems: "center" },
  stepContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepper:     { flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: T.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: T.primary,   borderColor: T.primary },
  stepCircleDone:   { backgroundColor: T.secondary, borderColor: T.secondary },
  stepNum:   { fontSize: 13, fontWeight: "700", color: T.onSurfaceVariant },
  stepLabel: { fontSize: 13, color: T.onSurfaceVariant, flexShrink: 1 },
  stepLine:  { flex: 1, height: 2, backgroundColor: T.outlineVariant, marginHorizontal: 8, borderRadius: 1 },

  // ── Section card ──
  sectionCard: {
    backgroundColor: T.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    padding: 16,
    marginBottom: 14,
    ...sh(1, 0.05, 4, 1),
  } as any,
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: T.surfaceContainer,
  },
  sectionCardTitle: { fontSize: 16, fontWeight: "600", color: T.onSurface },

  // ── Form ──
  formGrid:   { gap: 14 },
  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: T.onSurface, letterSpacing: 0.1 },
  input: {
    backgroundColor: T.white,
    borderWidth: 1.5,
    borderColor: T.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: T.onSurface,
  },
  select: {
    backgroundColor: T.white,
    borderWidth: 1.5,
    borderColor: T.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { fontSize: 15, color: T.onSurface, flex: 1 },
  luasRow:    { flexDirection: "row" },
  luasSat: {
    backgroundColor: T.surfaceContainerLow,
    borderWidth: 1.5,
    borderColor: T.outlineVariant,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 80,
  },
  luasSatText: { fontSize: 13, fontWeight: "700", color: T.onSurfaceVariant },

  // ── Musim toggle ──
  musimToggleRow:       { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  musimToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: T.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: T.surfaceContainerLow,
  },
  musimToggleBtnActive: { backgroundColor: T.primary, borderColor: T.primary },
  musimToggleTxt:       { fontSize: 14, color: T.onSurfaceVariant, fontWeight: "600" },
  musimToggleTxtActive: { color: T.onPrimary },
  musimInfoRow:         { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  musimInfoTxt:         { fontSize: 12, color: T.secondary },

  // ── Submit button ──
  submitBtn: {
    backgroundColor: T.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginBottom: 20,
    ...sh(4, 0.3, 8, 4),
  } as any,
  submitBtnText: { color: T.onPrimary, fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },

  // ── Info card ──
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    backgroundColor: "rgba(0, 106, 99, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(0, 106, 99, 0.2)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  infoIconBox: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: T.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: { fontSize: 13, fontWeight: "700", color: T.secondary, marginBottom: 4 },
  infoBody:  { fontSize: 12, color: T.onSurfaceVariant, lineHeight: 18 },

  // ── Result card ──
  resultCard: {
    backgroundColor: T.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    overflow: "hidden",
    marginBottom: 24,
    ...sh(2, 0.07, 6, 2),
  } as any,
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: T.outlineVariant,
  },
  resultCardTitle: { fontSize: 15, fontWeight: "700", color: T.onSurface },
  resultCardSub:   { fontSize: 11, color: T.onSurfaceVariant, marginTop: 2 },
  detailToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detailToggleTxt: { fontSize: 12, fontWeight: "600", color: T.secondary },

  // ── Detail worker box ──
  detailBox: {
    margin: 12,
    backgroundColor: T.surfaceContainerLow,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    overflow: "hidden",
  },
  detailBoxTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: T.onSurface,
    padding: 10,
    backgroundColor: T.surfaceContainerHighest,
    borderBottomWidth: 1,
    borderColor: T.outlineVariant,
  },
  detailHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: T.surfaceContainer,
    borderBottomWidth: 1,
    borderColor: T.outlineVariant,
  },
  detailRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderColor: "rgba(194,198,216,0.4)",
  },
  detailCell: { fontSize: 12, color: T.onSurface },

  // ── Table column header ──
  tableColHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tableColText: { fontSize: 11, fontWeight: "700", color: T.white, letterSpacing: 0.4 },

  // ── Result section header ──
  resultSection:     { backgroundColor: T.primaryContainer, paddingVertical: 7, paddingHorizontal: 12 },
  resultSectionText: { fontSize: 12, fontWeight: "700", color: T.onPrimary, letterSpacing: 0.3 },

  // ── Result row ──
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 42,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(194,198,216,0.35)",
  },
  rowEven:  { backgroundColor: "#f0f4ff" },
  rowOdd:   { backgroundColor: T.white },
  rowLabel: { flex: 3, fontSize: 12, color: T.onSurface, paddingRight: 4, lineHeight: 16 },
  rowValue: { flex: 3, fontSize: 12, color: T.primary, fontWeight: "700", textAlign: "right", paddingRight: 6 },
  copyBtn: {
    width: 44, height: 34,
    alignItems: "center", justifyContent: "center",
    backgroundColor: T.primaryFixed, borderRadius: 8,
  },
  copyBtnDone:    { backgroundColor: T.secondaryContainer },
  infoToggleBtn:  { width: 28, height: 34, alignItems: "center", justifyContent: "center", marginRight: 6 },
  explainPanel:   { borderBottomWidth: 1, borderColor: "rgba(194,198,216,0.35)" },
  explainInner: {
    marginHorizontal: 12, marginVertical: 8,
    backgroundColor: T.primaryFixed,
    borderRadius: 10, padding: 12,
    borderLeftWidth: 3, borderLeftColor: T.primary,
  },
  explainTitle: { fontSize: 11, fontWeight: "700", color: T.primary, marginBottom: 5, letterSpacing: 0.3 },
  explainText:  { fontSize: 12, color: T.onSurface, lineHeight: 19 },

  // ── Footer ──
  footer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: T.outlineVariant,
    alignItems: "center",
    gap: 4,
    backgroundColor: T.surfaceContainerHighest,
    borderRadius: 10,
    padding: 12,
  },
  footerText: { fontSize: 11, color: T.onSurfaceVariant },

  // ── Bottom Nav ──
  bottomNav: {
    flexDirection: "row",
    backgroundColor: T.white,
    borderTopWidth: 1,
    borderColor: T.outlineVariant,
    paddingBottom: 8,
    ...sh(2, 0.08, 6, 8),
  } as any,
  bottomNavItem:        { flex: 1, alignItems: "center", paddingTop: 8, gap: 2 },
  bottomNavIconWrap:    { padding: 6, borderRadius: 16 },
  bottomNavIconActive:  { backgroundColor: T.primaryFixed },
  bottomNavLabel:       { fontSize: 10, color: T.onSurfaceVariant, fontWeight: "500" },
  bottomNavLabelActive: { color: T.primary, fontWeight: "700" },

  // ── Coming soon ──
  comingSoonWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  comingSoonCard: {
    backgroundColor: T.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    padding: 32,
    alignItems: "center",
    width: "100%",
    maxWidth: 340,
    ...sh(2, 0.07, 8, 2),
  } as any,
  comingSoonIconBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: T.primaryFixed,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  comingSoonTitle: { fontSize: 20, fontWeight: "700", color: T.onSurface, marginBottom: 6 },
  comingSoonSub:   { fontSize: 14, color: T.onSurfaceVariant, marginBottom: 8 },
  comingSoonDesc:  { fontSize: 12, color: T.onSurfaceVariant, textAlign: "center", lineHeight: 18, marginBottom: 16 },
  comingSoonBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: T.secondaryContainer,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, marginBottom: 20,
  },
  comingSoonBadgeText: { fontSize: 12, fontWeight: "600", color: T.secondary },
  devBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: T.primary,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12,
  },
  devBtnPressed: { opacity: 0.85 },
  devBtnText:    { fontSize: 14, fontWeight: "600", color: T.onPrimary },
});
