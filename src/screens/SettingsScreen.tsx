// ─── SettingsScreen — Pengaturan & Sinkronisasi ───────────────────────────────
import { Platform, ScrollView, Text, View } from "react-native";
import { GoogleDriveSyncButton } from "../components/GoogleDriveSyncButton";
import { Icon } from "../components/Icon";
import { T } from "../constants/theme";
import { ui } from "../styles/ui";

export function SettingsScreen() {
  return (
    <ScrollView
      style={ui.main}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
    >
      {/* Header */}
      <View style={[ui.pageHeader, { flexDirection: "column", alignItems: "flex-start" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: T.primaryFixed, alignItems: "center", justifyContent: "center" }}>
            <Icon name="settings" size={20} color={T.primary} />
          </View>
          <View>
            <Text style={ui.pageTitle}>Pengaturan</Text>
            <Text style={ui.pageSubtitle}>Sinkronisasi & konfigurasi aplikasi</Text>
          </View>
        </View>
      </View>

      {/* Google Drive — hanya tampil di web */}
      {Platform.OS === "web" && (
        <View style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: T.onSurfaceVariant, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Penyimpanan Cloud
          </Text>
          <GoogleDriveSyncButton />
        </View>
      )}

      {/* Info versi */}
      <View style={{
        backgroundColor: T.white, borderRadius: 14, borderWidth: 1,
        borderColor: T.outlineVariant, padding: 16, gap: 10,
      }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Informasi Aplikasi
        </Text>
        {[
          { label: "Nama Aplikasi", value: "BPS SE2026 Sumberharjo" },
          { label: "Versi",         value: "v1.1.0" },
          { label: "Platform",      value: Platform.OS === "web" ? "Web Browser" : Platform.OS === "android" ? "Android" : "iOS" },
          { label: "Tahun",         value: "2026" },
          { label: "Instansi",      value: "BPS Kab. Bojonegoro" },
        ].map((row) => (
          <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderColor: T.outlineVariant }}>
            <Text style={{ fontSize: 13, color: T.onSurfaceVariant }}>{row.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: T.onSurface }}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Cara pakai Google Drive */}
      {Platform.OS === "web" && (
        <View style={{
          marginTop: 12, backgroundColor: "#f0f4ff", borderRadius: 14,
          borderWidth: 1, borderColor: "#c7d7f9", padding: 16, gap: 8,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="info" size={16} color={T.primary} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: T.primary }}>Cara Simpan ke Google Drive</Text>
          </View>
          {[
            "1. Klik tombol \"Simpan\" di panel Sinkronisasi Google Drive.",
            "2. Login dengan akun Google yang Anda inginkan.",
            "3. Setujui izin akses ke Google Drive.",
            "4. Data otomatis tersimpan di folder \"SE2026 BPS Sumberharjo\".",
            "5. Untuk pindah perangkat: buka web → Pengaturan → klik \"Pulihkan\".",
          ].map((step, i) => (
            <Text key={i} style={{ fontSize: 12, color: "#1e3a8a", lineHeight: 18 }}>{step}</Text>
          ))}
        </View>
      )}

      {/* Info mobile */}
      {Platform.OS !== "web" && (
        <View style={{
          marginTop: 12, backgroundColor: T.surfaceContainerLow, borderRadius: 14,
          borderWidth: 1, borderColor: T.outlineVariant, padding: 16, gap: 8,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="info" size={16} color={T.onSurfaceVariant} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: T.onSurface }}>Sinkronisasi Google Drive</Text>
          </View>
          <Text style={{ fontSize: 12, color: T.onSurfaceVariant, lineHeight: 18 }}>
            Fitur simpan ke Google Drive tersedia di versi web. Akses aplikasi melalui browser untuk menggunakan fitur ini.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
