// ─── SettingsScreen — Pengaturan & Sinkronisasi ───────────────────────────────
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable, ScrollView, Text, TextInput, View
} from "react-native";
import { GoogleDriveSyncButton } from "../components/GoogleDriveSyncButton";
import { Icon } from "../components/Icon";
import { T } from "../constants/theme";
import {
  getKeyType,
  isLapanganGranted,
  revokeAccess,
  verifyKey,
} from "../lib/keyAuth";
import { ui } from "../styles/ui";

// ─── Komponen Verifikasi Kunci Lapangan ───────────────────────────────────────
function LapanganKeySection({ onUnlocked }: { onUnlocked: () => void }) {
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState(false);
  const [showKey,  setShowKey]  = useState(false);
  const isUnlocked = isLapanganGranted();
  const keyType    = getKeyType();

  async function handleVerify() {
    if (!input.trim()) { setError("Masukkan kunci lapangan."); return; }
    setLoading(true); setError(null);
    const result = await verifyKey(input.trim());
    setLoading(false);
    if (result.success) {
      // Cek apakah kunci yang baru diverifikasi adalah tipe lapangan
      if (isLapanganGranted()) {
        setSuccess(true);
        setTimeout(() => { setSuccess(false); onUnlocked(); }, 1200);
      } else {
        setError("Kunci ini bukan tipe Lapangan. Minta kunci Lapangan dari Admin.");
        // Revoke karena kunci app tidak berguna di sini
        revokeAccess();
      }
    } else {
      setError(result.message);
    }
  }

  if (isUnlocked) {
    return (
      <View style={{
        backgroundColor: "#f0fdf4", borderRadius: 14, borderWidth: 1,
        borderColor: "#86efac", padding: 16, gap: 10, marginBottom: 8,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" }}>
            <Icon name="check-circle" size={20} color="#16a34a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#166534" }}>Fitur Lapangan Aktif</Text>
            <Text style={{ fontSize: 12, color: "#16a34a" }}>
              Kunci {keyType === "lapangan" ? "Lapangan" : "lama"} — Data Lapangan, Peta & Drive tersedia
            </Text>
          </View>
          <View style={{ backgroundColor: "#16a34a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>✓ AKTIF</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{
      backgroundColor: T.white, borderRadius: 14, borderWidth: 1,
      borderColor: T.outlineVariant, padding: 16, gap: 12, marginBottom: 8,
    }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center" }}>
          <Icon name="key" size={18} color="#92400e" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: T.onSurface }}>Verifikasi Kunci Lapangan</Text>
          <Text style={{ fontSize: 12, color: T.onSurfaceVariant }}>Untuk membuka fitur Data Lapangan, Peta & Drive</Text>
        </View>
      </View>

      {/* Info fitur yang akan terbuka */}
      <View style={{ backgroundColor: T.surfaceContainerLow, borderRadius: 10, padding: 12, gap: 6 }}>
        {[
          { icon: "home",     label: "Data Lapangan — Input bangunan & KK" },
          { icon: "map-pin",  label: "Peta GPS — Lihat marker bangunan" },
          { icon: "database", label: "Google Drive — Sinkronisasi otomatis" },
        ].map((f) => (
          <View key={f.icon} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: T.primaryFixed, alignItems: "center", justifyContent: "center" }}>
              <Icon name={f.icon} size={12} color={T.primary} />
            </View>
            <Text style={{ fontSize: 12, color: T.onSurfaceVariant }}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Input kunci */}
      <View>
        <Text style={{ fontSize: 12, fontWeight: "600", color: T.onSurfaceVariant, marginBottom: 6 }}>
          Kunci Akses Lapangan
        </Text>
        <View style={{
          flexDirection: "row", alignItems: "center",
          borderWidth: 1.5,
          borderColor: error ? T.error : success ? "#16a34a" : T.outlineVariant,
          borderRadius: 10, backgroundColor: T.surfaceContainerLow,
          paddingHorizontal: 12, paddingVertical: Platform.OS === "web" ? 10 : 4,
        }}>
          <Icon name="key" size={14} color={T.onSurfaceVariant} />
          <TextInput
            style={{
              flex: 1, marginLeft: 8, fontSize: 13, color: T.onSurface,
              fontFamily: Platform.OS === "web" ? "monospace" : undefined,
              ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
            } as any}
            value={input}
            onChangeText={(v) => { setInput(v); if (error) setError(null); }}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            placeholderTextColor={T.outline}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={!showKey}
            editable={!loading && !success}
            onSubmitEditing={handleVerify}
          />
          <Pressable onPress={() => setShowKey((p) => !p)} style={{ padding: 4 }}>
            <Icon name={showKey ? "eye-off" : "eye"} size={14} color={T.onSurfaceVariant} />
          </Pressable>
        </View>

        {error && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            <Icon name="alert-circle" size={12} color={T.error} />
            <Text style={{ fontSize: 12, color: T.error, flex: 1 }}>{error}</Text>
          </View>
        )}
        {success && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
            <Icon name="check-circle" size={12} color="#16a34a" />
            <Text style={{ fontSize: 12, color: "#16a34a", fontWeight: "600" }}>Kunci valid! Fitur lapangan terbuka…</Text>
          </View>
        )}
      </View>

      {/* Tombol verifikasi */}
      <Pressable
        style={({ pressed }) => ({
          flexDirection: "row", alignItems: "center", justifyContent: "center",
          gap: 8, backgroundColor: success ? "#16a34a" : T.primary,
          paddingVertical: 12, borderRadius: 10,
          opacity: pressed || loading || success ? 0.85 : 1,
        })}
        onPress={handleVerify}
        disabled={loading || success}
      >
        {loading
          ? <ActivityIndicator size="small" color="#fff" />
          : <Icon name={success ? "check-circle" : "unlock"} size={16} color="#fff" />
        }
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
          {loading ? "Memverifikasi…" : success ? "Berhasil!" : "Verifikasi & Buka Fitur"}
        </Text>
      </Pressable>

      <Text style={{ fontSize: 11, color: T.onSurfaceVariant, textAlign: "center" }}>
        Hubungi Admin BPS SE2026 untuk mendapatkan kunci Lapangan
      </Text>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function SettingsScreen({
  onLapanganUnlocked,
  onAdminPress,
}: {
  onLapanganUnlocked?: () => void;
  onAdminPress?: () => void;
}) {
  const [lapanganActive, setLapanganActive] = useState(isLapanganGranted());

  function handleUnlocked() {
    setLapanganActive(true);
    onLapanganUnlocked?.();
  }

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
            <Text style={ui.pageSubtitle}>Kunci akses & konfigurasi aplikasi</Text>
          </View>
        </View>
      </View>

      {/* ── Section: Admin Panel ────────────────────────────────────────── */}
      {onAdminPress && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: T.onSurfaceVariant, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Panel Administrator
          </Text>
          <Pressable
            onPress={onAdminPress}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", gap: 14,
              backgroundColor: T.primary, borderRadius: 14,
              padding: 16, opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
              <Icon name="shield" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>Admin Panel</Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Manajemen kunci akses SE2026</Text>
            </View>
            <Icon name="arrow-right" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      )}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: T.onSurfaceVariant, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Akses Fitur Lapangan
        </Text>
        <LapanganKeySection onUnlocked={handleUnlocked} />
      </View>

      {/* ── Section: Google Drive (hanya tampil kalau lapangan aktif & web) */}
      {Platform.OS === "web" && lapanganActive && (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: T.onSurfaceVariant, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Penyimpanan Cloud
          </Text>
          <GoogleDriveSyncButton />
        </View>
      )}

      {/* ── Section: Info Aplikasi ─────────────────────────────────────── */}
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
          { label: "Akses",         value: lapanganActive ? "🟢 Lapangan" : "🔑 App" },
        ].map((row) => (
          <View key={row.label} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderColor: T.outlineVariant }}>
            <Text style={{ fontSize: 13, color: T.onSurfaceVariant }}>{row.label}</Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: T.onSurface }}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Panduan drive hanya kalau lapangan aktif */}
      {Platform.OS === "web" && lapanganActive && (
        <View style={{
          marginTop: 12, backgroundColor: "#f0f4ff", borderRadius: 14,
          borderWidth: 1, borderColor: "#c7d7f9", padding: 16, gap: 8,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="info" size={16} color={T.primary} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: T.primary }}>Cara Simpan ke Google Drive</Text>
          </View>
          {[
            "1. Pastikan kunci Lapangan sudah aktif (di atas).",
            "2. Klik \"Login dengan Google\" di panel Penyimpanan Cloud.",
            "3. Pilih akun Google — data otomatis masuk Drive akun tersebut.",
            "4. Ganti akun: klik tombol \"Ganti\" di sebelah nama akun.",
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
            Fitur Google Drive tersedia di versi web browser.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
