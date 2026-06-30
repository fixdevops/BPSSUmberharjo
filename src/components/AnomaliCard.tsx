// ─── AnomaliCard — kartu hasil Analisis AI (deteksi anomali SE2026) ───────────
//
// Menampilkan: skor kesehatan data (0–100) + daftar temuan
// (error/warning/ok/info) dengan saran koreksi.
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { T } from "../constants/theme";
import {
  type HasilAnalisis, type Level, type Temuan,
  labelSkor,
} from "../lib/anomaliAnalysis";
import { Icon } from "./Icon";

// ─── Konfigurasi visual per level ─────────────────────────────────────────────
const LEVEL_CFG: Record<Level, {
  label:   string;
  warna:   string;
  bg:      string;
  icon:    string;
}> = {
  error:   { label: "ERROR",   warna: "#ef4444", bg: "#fef2f2", icon: "alert-circle" },
  warning: { label: "CEK",     warna: "#f59e0b", bg: "#fffbeb", icon: "alert-triangle" },
  ok:      { label: "OK",      warna: "#22c55e", bg: "#f0fdf4", icon: "check-circle" },
  info:    { label: "INFO",    warna: T.primary, bg: T.primaryFixed, icon: "info" },
};

// ─── Item Temuan (collapsible) ────────────────────────────────────────────────
function TemuanItem({ t, idx }: { t: Temuan; idx: number }) {
  const [buka, setBuka] = useState(t.level === "error" || t.level === "warning");
  const cfg = LEVEL_CFG[t.level];

  return (
    <View style={[st.temuanCard, { backgroundColor: cfg.bg, borderLeftColor: cfg.warna }]}>
      <Pressable
        style={st.temuanHead}
        onPress={() => setBuka((v) => !v)}
        accessibilityLabel={`${cfg.label} ${t.judul}`}
      >
        <Icon name={cfg.icon} size={16} color={cfg.warna} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <View style={[st.levelBadge, { backgroundColor: cfg.warna }]}>
              <Text style={st.levelBadgeText}>{cfg.label}</Text>
            </View>
            <Text style={{ fontSize: 10, color: T.onSurfaceVariant }}>{t.kode}</Text>
          </View>
          <Text style={st.temuanJudul}>{t.judul}</Text>
        </View>
        <Icon name={buka ? "chevron-up" : "chevron-down"} size={16} color={T.onSurfaceVariant} />
      </Pressable>

      {buka && (
        <View style={st.temuanBody}>
          {t.detail ? (
            <View style={st.temuanSec}>
              <Text style={st.temuanSecLabel}>Detail</Text>
              <Text style={st.temuanSecText}>{t.detail}</Text>
            </View>
          ) : null}
          {t.saran ? (
            <View style={[st.temuanSec, { marginTop: 8 }]}>
              <Text style={st.temuanSecLabel}>Saran</Text>
              <Text style={[st.temuanSecText, { color: cfg.warna, fontWeight: "600" }]}>{t.saran}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

// ─── AnomaliCard utama ────────────────────────────────────────────────────────
export function AnomaliCard({ analisis }: { analisis: HasilAnalisis }) {
  const { temuan, ringkasan } = analisis;
  const { skorKesehatan } = ringkasan;
  const { teks, warna } = labelSkor(skorKesehatan);

  // Urut: error → warning → info → ok
  const urut: Record<Level, number> = { error: 0, warning: 1, info: 2, ok: 3 };
  const sorted = [...temuan].sort((a, b) => urut[a.level] - urut[b.level]);

  // Stat chips
  const chips: { label: string; value: number; warna: string }[] = [
    { label: "Error",   value: ringkasan.totalError,   warna: "#ef4444" },
    { label: "Perlu Cek", value: ringkasan.totalWarning, warna: "#f59e0b" },
    { label: "Info",    value: ringkasan.totalInfo,    warna: T.primary },
    { label: "OK",      value: ringkasan.totalOk,      warna: "#22c55e" },
  ];

  return (
    <View style={st.card}>
      {/* ── Header: skor kesehatan ──────────────────────────────────────── */}
      <View style={[st.header, { backgroundColor: warna }]}>
        <View style={st.headerLeft}>
          <View style={st.headerIconBox}>
            <Icon name="cpu" size={22} color={T.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.headerTitle}>Analisis AI · Deteksi Anomali SE2026</Text>
            <Text style={st.headerSub}>
              Status data: <Text style={{ fontWeight: "700" }}>{teks}</Text>
            </Text>
          </View>
        </View>
        <View style={st.skorBox}>
          <Text style={st.skorNilai}>{skorKesehatan}</Text>
          <Text style={st.skorLabel}>/ 100</Text>
        </View>
      </View>

      {/* ── Stat chips ──────────────────────────────────────────────────── */}
      <View style={st.chipRow}>
        {chips.map((c, i) => (
          <View key={i} style={[st.chip, { borderColor: c.warna }]}>
            <Text style={[st.chipVal, { color: c.warna }]}>{c.value}</Text>
            <Text style={st.chipLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Daftar temuan ───────────────────────────────────────────────── */}
      <View style={st.body}>
        <Text style={st.bodyTitle}>
          {temuan.length} Temuan Ditemukan
        </Text>
        {sorted.map((t, i) => (
          <TemuanItem key={`${t.kode}-${i}`} t={t} idx={i} />
        ))}
      </View>

      {/* ── Footer note ─────────────────────────────────────────────────── */}
      <View style={st.footerNote}>
        <Icon name="info" size={12} color={T.onSurfaceVariant} />
        <Text style={st.footerNoteText}>
          Analisis berbasis aturan patokan BPS Bojonegoro (offline). Bukan pengganti
          verifikasi lapangan — gunakan sebagai pemandu pemeriksaan konsistensi data.
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  card: {
    backgroundColor: T.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    overflow: "hidden",
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerIconBox: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 14, fontWeight: "700", color: T.white },
  headerSub:   { fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 2 },
  skorBox:     { alignItems: "center" },
  skorNilai:   { fontSize: 26, fontWeight: "800", color: T.white, lineHeight: 28 },
  skorLabel:   { fontSize: 11, color: "rgba(255,255,255,0.85)" },

  chipRow: { flexDirection: "row", gap: 6, padding: 12 },
  chip: {
    flex: 1, borderWidth: 1.2, borderRadius: 10,
    paddingVertical: 8, alignItems: "center",
    backgroundColor: T.surfaceContainerLow,
  },
  chipVal:   { fontSize: 16, fontWeight: "800" },
  chipLabel: { fontSize: 9, color: T.onSurfaceVariant, marginTop: 1 },

  body:     { padding: 12, paddingTop: 0 },
  bodyTitle:{ fontSize: 12, fontWeight: "700", color: T.onSurface, marginBottom: 8, marginTop: 4 },

  temuanCard: {
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  temuanHead: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  levelBadge: {
    paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 4,
  },
  levelBadgeText: { fontSize: 9, fontWeight: "700", color: T.white, letterSpacing: 0.3 },
  temuanJudul: { fontSize: 12, fontWeight: "600", color: T.onSurface, marginTop: 3, lineHeight: 16 },
  temuanBody: { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2 },
  temuanSec: {},
  temuanSecLabel: { fontSize: 10, fontWeight: "700", color: T.onSurfaceVariant, marginBottom: 2, letterSpacing: 0.3 },
  temuanSecText:  { fontSize: 11, color: T.onSurface, lineHeight: 16 },

  footerNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: T.surfaceContainerLow,
    padding: 12,
    borderTopWidth: 1,
    borderColor: T.outlineVariant,
  },
  footerNoteText: { fontSize: 10, color: T.onSurfaceVariant, flex: 1, lineHeight: 15 },
});
