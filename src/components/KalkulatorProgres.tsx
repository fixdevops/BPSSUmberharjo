// ─── KalkulatorProgres — Kalkulator Progres SE2026 ───────────────────────────
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { T } from "../constants/theme";
import { useBreakpoints } from "../hooks/useBreakpoints";
import { Icon } from "./Icon";
import { SectionCard } from "./ui/SectionCard";

type FieldKey = "target" | "open" | "draft" | "submit" | "approve" | "reject";
type Values = Record<FieldKey, string>;

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: "target",  label: "Target"  },
  { key: "open",    label: "Open"    },
  { key: "draft",   label: "Draft"   },
  { key: "submit",  label: "Submit"  },
  { key: "approve", label: "Approve" },
  { key: "reject",  label: "Reject"  },
];

const DEFAULT: Values = {
  target: "459", open: "239", draft: "34",
  submit: "8", approve: "208", reject: "4",
};

function pctStr(val: number, total: number) {
  if (total <= 0) return "0,00%";
  return ((val / total) * 100).toFixed(2).replace(".", ",") + "%";
}

function pctNum(val: number, total: number) {
  if (total <= 0) return 0;
  return Math.min((val / total) * 100, 100);
}

function statusColor(pct: number): string {
  if (pct >= 80) return "#16a34a"; // hijau
  if (pct >= 50) return "#d97706"; // kuning/amber
  return "#dc2626";                // merah
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 6, backgroundColor: T.outlineVariant, borderRadius: 3, overflow: "hidden" },
  fill:  { height: 6, borderRadius: 3 },
});

// ─── Komponen utama ───────────────────────────────────────────────────────────
export function KalkulatorProgres() {
  const { isMobile } = useBreakpoints();
  const [vals, setVals]   = useState<Values>(DEFAULT);
  const [hasil, setHasil] = useState<null | {
    dsar: number; sar: number; ar: number; target: number;
  }>(null);

  function set(key: FieldKey, v: string) {
    setVals((p) => ({ ...p, [key]: v.replace(/[^0-9]/g, "") }));
    setHasil(null);
  }

  function hitung() {
    const t = parseInt(vals.target) || 0;
    if (t <= 0) { Alert.alert("Perhatian", "Target harus lebih dari 0!"); return; }
    const d = parseInt(vals.draft)   || 0;
    const s = parseInt(vals.submit)  || 0;
    const a = parseInt(vals.approve) || 0;
    const r = parseInt(vals.reject)  || 0;
    setHasil({ dsar: d+s+a+r, sar: s+a+r, ar: a+r, target: t });
  }

  function reset() { setVals(DEFAULT); setHasil(null); }

  // grid 3 kolom di tablet, 2 kolom di mobile
  const cols = isMobile ? 2 : 3;
  // flexBasis per cell = (100% - gap*(cols-1)) / cols
  // Pakai pendekatan aman: render per-baris manual
  const rows2: (typeof FIELDS)[] = [];
  for (let i = 0; i < FIELDS.length; i += cols) {
    rows2.push(FIELDS.slice(i, i + cols));
  }

  return (
    <SectionCard icon="bar-chart-2" title="Progres SE2026">

      {/* ── Grid input ── */}
      <View style={st.grid}>
        {rows2.map((row, ri) => (
          <View key={ri} style={st.gridRow}>
            {row.map((f) => (
              <View key={f.key} style={st.cell}>
                <Text style={st.cellLabel}>{f.label}</Text>
                <TextInput
                  style={st.cellInput}
                  value={vals[f.key]}
                  onChangeText={(v) => set(f.key, v)}
                  keyboardType="numeric"
                  selectTextOnFocus
                  accessibilityLabel={f.label}
                />
              </View>
            ))}
            {/* Isi sisa slot kosong agar kolom terakhir tidak meregang */}
            {row.length < cols && Array.from({ length: cols - row.length }).map((_, ei) => (
              <View key={`empty-${ei}`} style={st.cell} />
            ))}
          </View>
        ))}
      </View>

      {/* ── Tombol ── */}
      <View style={st.btnRow}>
        <Pressable
          style={({ pressed }) => [st.btnPrimary, pressed && { opacity: 0.82 }]}
          onPress={hitung}
          accessibilityLabel="Hitung progres"
        >
          <Icon name="zap" size={15} color={T.onPrimary} />
          <Text style={st.btnPrimaryText}>Hitung</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [st.btnSecondary, pressed && { opacity: 0.7 }]}
          onPress={reset}
          accessibilityLabel="Reset"
        >
          <Icon name="refresh-cw" size={14} color={T.onSurfaceVariant} />
          <Text style={st.btnSecondaryText}>Reset</Text>
        </Pressable>
      </View>

      {/* ── Hasil ── */}
      {hasil && (() => {
        const rows: { label: string; val: number }[] = [
          { label: "D + S + A + R", val: hasil.dsar },
          { label: "S + A + R",     val: hasil.sar  },
          { label: "A + R",         val: hasil.ar   },
        ];
        return (
          <View style={st.hasil}>
            {rows.map((row, i) => {
              const pct   = pctNum(row.val, hasil.target);
              const str   = pctStr(row.val, hasil.target);
              const color = statusColor(pct);
              return (
                <View key={i} style={[st.resultRow, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={st.resultMeta}>
                    <Text style={st.resultLabel}>{row.label}</Text>
                    <Text style={st.resultCount}>{row.val} / {hasil.target}</Text>
                  </View>
                  <View style={st.resultRight}>
                    <Text style={[st.resultPct, { color }]}>{str}</Text>
                    <ProgressBar pct={pct} color={color} />
                  </View>
                </View>
              );
            })}
          </View>
        );
      })()}
    </SectionCard>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  // grid
  grid:    { gap: 8, marginBottom: 12 },
  gridRow: { flexDirection: "row", gap: 8 },
  cell:    { flex: 1, gap: 4 },
  cellLabel: {
    fontSize: 11, fontWeight: "600",
    color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.4,
  },
  cellInput: {
    backgroundColor: T.white,
    borderWidth: 1.5, borderColor: T.outlineVariant, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 10,
    fontSize: 16, fontWeight: "700", color: T.onSurface,
    textAlign: "center",
  },

  // buttons
  btnRow:   { flexDirection: "row", gap: 8, marginBottom: 4 },
  btnPrimary: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 7,
    backgroundColor: T.primary,
    paddingVertical: 13, borderRadius: 10,
    ...Platform.select({
      web:     { boxShadow: "0px 2px 8px rgba(0,78,199,0.22)" },
      default: { elevation: 3, shadowColor: T.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 6 },
    }),
  } as any,
  btnPrimaryText:   { color: T.onPrimary, fontSize: 14, fontWeight: "700" },
  btnSecondary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: 10,
    borderWidth: 1.5, borderColor: T.outlineVariant,
    backgroundColor: T.surfaceContainerLow,
  },
  btnSecondaryText: { fontSize: 14, fontWeight: "600", color: T.onSurfaceVariant },

  // hasil
  hasil: {
    marginTop: 12, gap: 0,
    borderWidth: 1, borderColor: T.outlineVariant,
    borderRadius: 12, overflow: "hidden",
  },
  resultRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: T.white,
    borderBottomWidth: 1, borderColor: T.outlineVariant,
    gap: 12,
  },
  resultMeta:  { width: 110 },
  resultLabel: { fontSize: 12, fontWeight: "700", color: T.onSurface },
  resultCount: { fontSize: 11, color: T.onSurfaceVariant, marginTop: 2 },
  resultRight: { flex: 1, gap: 6 },
  resultPct:   { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
});
