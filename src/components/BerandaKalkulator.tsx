// ─── BerandaKalkulator — Kalkulator Pendapatan Bulanan ───────────────────────
import { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { T } from "../constants/theme";
import { useBreakpoints } from "../hooks/useBreakpoints";
import { copyToClipboard, parseRupiah, rp } from "../lib/helpers";
import { ui } from "../styles/ui";
import { Icon } from "./Icon";
import { SectionCard } from "./ui/SectionCard";

type SumberPendapatan = { id: string; jumlah: string };

export function BerandaKalkulator() {
  const { isMobile } = useBreakpoints();

  const [pendapatanUtama, setPendapatanUtama] = useState("");
  const [sumberTambahan, setSumberTambahan]   = useState<SumberPendapatan[]>([]);
  const [hasilHitung, setHasilHitung] = useState<null | {
    utamaPerBulan: number;
    tambahanPerBulan: { nama: string; perBulan: number }[];
    totalPerBulan: number;
  }>(null);
  const [sudahHitung, setSudahHitung] = useState(false);

  function tambahSumber() {
    setSumberTambahan((prev) => [...prev, { id: Date.now().toString(), jumlah: "" }]);
    setSudahHitung(false);
  }

  function hapusSumber(id: string) {
    setSumberTambahan((prev) => prev.filter((s) => s.id !== id));
    setSudahHitung(false);
  }

  function updateSumber(id: string, val: string) {
    setSumberTambahan((prev) => prev.map((s) => (s.id === id ? { ...s, jumlah: val } : s)));
    setSudahHitung(false);
  }

  function hitung() {
    const utama = parseRupiah(pendapatanUtama);
    if (utama <= 0 && sumberTambahan.every((s) => parseRupiah(s.jumlah) <= 0)) {
      Alert.alert("Perhatian", "Masukkan minimal satu pendapatan terlebih dahulu.");
      return;
    }
    const utamaPerBulan = utama / 12;
    const tambahanPerBulan = sumberTambahan.map((s, idx) => ({
      nama: `Sumber Lain #${idx + 1}`,
      perBulan: parseRupiah(s.jumlah) / 12,
    }));
    const totalPerBulan = utamaPerBulan + tambahanPerBulan.reduce((sum, t) => sum + t.perBulan, 0);
    setHasilHitung({ utamaPerBulan, tambahanPerBulan, totalPerBulan });
    setSudahHitung(true);
  }

  function reset() {
    setPendapatanUtama("");
    setSumberTambahan([]);
    setHasilHitung(null);
    setSudahHitung(false);
  }

  const totalSetahun = hasilHitung
    ? parseRupiah(pendapatanUtama) + sumberTambahan.reduce((sum, s) => sum + parseRupiah(s.jumlah), 0)
    : 0;

  return (
    <View style={{ gap: 16 }}>
      {/* Header */}
      <View style={[ui.pageHeader, isMobile && { flexDirection: "column", alignItems: "flex-start" }]}>
        <View style={{ flex: 1 }}>
          <Text style={[ui.pageTitle, isMobile && { fontSize: 20 }]}>Kalkulator Pendapatan</Text>
          <Text style={ui.pageSubtitle}>Hitung estimasi pendapatan per bulan dari berbagai sumber penghasilan.</Text>
        </View>
        <View style={[ui.badge, { backgroundColor: "#e8f5e9" }]}>
          <Icon name="bar-chart-2" size={13} color={T.secondary} />
          <Text style={[ui.badgeText, { color: T.secondary }]}>Kalkulator Bulanan</Text>
        </View>
      </View>

      {/* Pendapatan Utama */}
      <SectionCard icon="home" title="Pendapatan Utama (Setahun)">
        <View style={{ gap: 14 }}>
          <View style={ui.fieldWrap}>
            <TextInput
              style={ui.input}
              value={pendapatanUtama}
              onChangeText={(v) => { setPendapatanUtama(v); setSudahHitung(false); }}
              placeholder="contoh: 12000000"
              placeholderTextColor={T.outline}
              keyboardType="numeric"
            />
          </View>
          {pendapatanUtama !== "" && parseRupiah(pendapatanUtama) > 0 && (
            <View style={st.previewRow}>
              <Icon name="chevron-down" size={13} color={T.secondary} />
              <Text style={st.previewText}>
                {rp(parseRupiah(pendapatanUtama))} ÷ 12 ={" "}
                <Text style={{ fontWeight: "700", color: T.secondary }}>
                  {rp(parseRupiah(pendapatanUtama) / 12)} / bulan
                </Text>
              </Text>
            </View>
          )}
        </View>
      </SectionCard>

      {/* Sumber Tambahan */}
      <SectionCard icon="package" title="Sumber Pendapatan Tambahan">
        <View style={{ gap: 14 }}>
          {sumberTambahan.length === 0 && (
            <View style={st.emptyHint}>
              <Icon name="info" size={14} color={T.onSurfaceVariant} />
              <Text style={st.emptyHintText}>Belum ada sumber tambahan. Tap tombol di bawah untuk menambahkan.</Text>
            </View>
          )}

          {sumberTambahan.map((s, idx) => (
            <View key={s.id} style={[st.sumberCard, { borderColor: T.outlineVariant }]}>
              <View style={st.sumberHeader}>
                <View style={st.sumberBadgeNum}>
                  <Text style={st.sumberBadgeNumText}>{idx + 1}</Text>
                </View>
                <Text style={st.sumberHeaderLabel}>Sumber Pendapatan #{idx + 1}</Text>
                <Pressable style={st.hapusBtn} onPress={() => hapusSumber(s.id)} accessibilityLabel={`Hapus sumber pendapatan ${idx + 1}`}>
                  <Icon name="x" size={14} color={T.error} />
                </Pressable>
              </View>
              <View style={[ui.fieldWrap, { marginTop: 10 }]}>
                <TextInput
                  style={ui.input}
                  value={s.jumlah}
                  onChangeText={(v) => updateSumber(s.id, v)}
                  placeholder="contoh: 5000000"
                  placeholderTextColor={T.outline}
                  keyboardType="numeric"
                />
              </View>
              {s.jumlah !== "" && parseRupiah(s.jumlah) > 0 && (
                <View style={[st.previewRow, { marginTop: 8 }]}>
                  <Icon name="chevron-down" size={13} color={T.secondary} />
                  <Text style={st.previewText}>
                    {rp(parseRupiah(s.jumlah))} ÷ 12 ={" "}
                    <Text style={{ fontWeight: "700", color: T.secondary }}>
                      {rp(parseRupiah(s.jumlah) / 12)} / bulan
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          ))}

          <Pressable style={({ pressed }) => [st.tambahBtn, pressed && { opacity: 0.75 }]} onPress={tambahSumber} accessibilityLabel="Tambah sumber pendapatan">
            <View style={st.tambahBtnInner}>
              <View style={st.tambahIcon}>
                <Text style={{ color: T.secondary, fontSize: 20, lineHeight: 22, fontWeight: "700" }}>+</Text>
              </View>
              <Text style={st.tambahBtnText}>Tambah Sumber Pendapatan</Text>
            </View>
          </Pressable>
        </View>
      </SectionCard>

      {/* Tombol Hitung */}
      <Pressable style={({ pressed }) => [ui.submitBtn, pressed && { opacity: 0.85 }]} onPress={hitung} accessibilityLabel="Hitung pendapatan per bulan">
        <Icon name="bar-chart-2" size={18} color={T.onPrimary} />
        <Text style={ui.submitBtnText}>Hitung Pendapatan Per Bulan</Text>
        <Icon name="arrow-right" size={16} color={T.onPrimary} />
      </Pressable>

      {/* Hasil */}
      {sudahHitung && hasilHitung && (
        <View style={st.hasilCard}>
          <View style={st.hasilHeader}>
            <View style={st.hasilIconBox}>
              <Icon name="check-circle" size={22} color={T.onPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.hasilHeaderTitle}>Hasil Perhitungan</Text>
              <Text style={st.hasilHeaderSub}>Estimasi pendapatan rata-rata per bulan</Text>
            </View>
            <Pressable style={st.resetBtn} onPress={reset} accessibilityLabel="Reset kalkulator">
              <Icon name="x" size={13} color={T.onSurfaceVariant} />
              <Text style={st.resetBtnText}>Reset</Text>
            </Pressable>
          </View>

          <View style={st.hasilBody}>
            <View style={st.hasilBaris}>
              <View style={{ flex: 1 }}>
                <Text style={st.hasilBarisNama}>Pendapatan Utama</Text>
                <Text style={st.hasilBarisSetahun}>{rp(parseRupiah(pendapatanUtama))} ÷ 12</Text>
              </View>
              <Text style={st.hasilBarisNilai}>{rp(hasilHitung.utamaPerBulan)}</Text>
            </View>

            {hasilHitung.tambahanPerBulan.map((t, idx) => (
              <View key={idx} style={[st.hasilBaris, { backgroundColor: "#f0fdf4" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={st.hasilBarisNama}>{t.nama}</Text>
                  <Text style={st.hasilBarisSetahun}>{rp(parseRupiah(sumberTambahan[idx]?.jumlah ?? "0"))} ÷ 12</Text>
                </View>
                <Text style={[st.hasilBarisNilai, { color: T.secondary }]}>{rp(t.perBulan)}</Text>
              </View>
            ))}

            <View style={st.separator} />

            <View style={st.hasilTotal}>
              <View style={{ flex: 1 }}>
                <Text style={st.hasilTotalLabel}>Total Pendapatan / Bulan</Text>
                <Text style={st.hasilTotalSetahun}>Setahun: {rp(totalSetahun)}</Text>
              </View>
              <Pressable onPress={() => copyToClipboard(rp(hasilHitung.totalPerBulan))} accessibilityLabel="Salin total pendapatan per bulan">
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={st.hasilTotalNilai}>{rp(hasilHitung.totalPerBulan)}</Text>
                  <View style={st.copyHint}>
                    <Icon name="copy" size={11} color={T.primary} />
                    <Text style={st.copyHintText}>Tap untuk salin</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={st.hasilNote}>
            <Icon name="info" size={12} color={T.onSurfaceVariant} />
            <Text style={st.hasilNoteText}>
              Perhitungan menggunakan pembagian rata merata 12 bulan. Untuk pendapatan musiman, nilai yang dimasukkan adalah total setahun.
            </Text>
          </View>
        </View>
      )}

      <View style={ui.footer}>
        <Text style={ui.footerText}>© 2026 BPS Sumberharjo – SE2026</Text>
        <Text style={ui.footerText}>Kalkulator Pendapatan Bulanan</Text>
      </View>
    </View>
  );
}

// ─── Styles lokal BerandaKalkulator ──────────────────────────────────────────
const st = StyleSheet.create({
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 106, 99, 0.06)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: T.secondary,
  },
  previewText:   { fontSize: 12, color: T.onSurface, flex: 1 },
  emptyHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: T.surfaceContainerLow,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: T.outlineVariant,
  },
  emptyHintText: { fontSize: 12, color: T.onSurfaceVariant, flex: 1, lineHeight: 18 },
  sumberCard: {
    backgroundColor: T.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 14,
  },
  sumberHeader:       { flexDirection: "row", alignItems: "center", gap: 8 },
  sumberBadgeNum:     { width: 24, height: 24, borderRadius: 12, backgroundColor: T.primaryFixed, alignItems: "center", justifyContent: "center" },
  sumberBadgeNumText: { fontSize: 12, fontWeight: "700", color: T.primary },
  sumberHeaderLabel:  { flex: 1, fontSize: 13, fontWeight: "600", color: T.onSurface },
  hapusBtn:           { padding: 6, borderRadius: 8, backgroundColor: "#ffeaea" },
  tambahBtn:          { borderWidth: 1.5, borderColor: T.secondary, borderRadius: 12, overflow: "hidden" },
  tambahBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 106, 99, 0.04)",
  },
  tambahIcon:     { width: 28, height: 28, borderRadius: 14, backgroundColor: T.secondaryContainer, alignItems: "center", justifyContent: "center" },
  tambahBtnText:  { fontSize: 14, fontWeight: "600", color: T.secondary },
  hasilCard: {
    backgroundColor: T.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.outlineVariant,
    overflow: "hidden",
    ...Platform.select({
      web:    { boxShadow: "0px 3px 8px rgba(0,78,199,0.1)" },
      default:{ elevation: 3, shadowColor: T.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8 },
    }),
  } as any,
  hasilHeader:      { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: T.primary, padding: 16 },
  hasilIconBox:     { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  hasilHeaderTitle: { fontSize: 15, fontWeight: "700", color: T.white },
  hasilHeaderSub:   { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  resetBtn:         { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  resetBtnText:     { fontSize: 12, fontWeight: "600", color: T.white },
  hasilBody:        { padding: 16, gap: 4 },
  hasilBaris: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: T.outlineVariant,
  },
  hasilBarisNama:    { fontSize: 13, fontWeight: "600", color: T.onSurface },
  hasilBarisSetahun: { fontSize: 11, color: T.onSurfaceVariant, marginTop: 2 },
  hasilBarisNilai:   { fontSize: 14, fontWeight: "700", color: T.primary, textAlign: "right" },
  separator:         { height: 1, backgroundColor: T.outlineVariant, marginVertical: 8 },
  hasilTotal: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: T.primaryFixed,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: T.primary,
  },
  hasilTotalLabel:   { fontSize: 13, fontWeight: "700", color: T.primary },
  hasilTotalSetahun: { fontSize: 11, color: T.onSurfaceVariant, marginTop: 3 },
  hasilTotalNilai:   { fontSize: 18, fontWeight: "700", color: T.primary },
  copyHint:          { flexDirection: "row", alignItems: "center", gap: 3 },
  copyHintText:      { fontSize: 10, color: T.primary },
  hasilNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: T.surfaceContainerLow,
    padding: 12,
    borderTopWidth: 1,
    borderColor: T.outlineVariant,
  },
  hasilNoteText: { fontSize: 11, color: T.onSurfaceVariant, flex: 1, lineHeight: 17 },
});
