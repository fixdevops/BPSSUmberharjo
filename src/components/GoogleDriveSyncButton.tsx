// ─── GoogleDriveSyncButton — Simpan & Pulihkan data via Google Drive ─────────
// Hanya muncul di web (Platform.OS === "web")
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { T } from "../constants/theme";
import {
    googleSignIn,
    googleSignOut,
    isSignedIn,
    restoreFromDrive,
    uploadToDrive
} from "../lib/googleDriveSync";
import { Icon } from "./Icon";

export function GoogleDriveSyncButton({ onRestored }: { onRestored?: () => void }) {
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Hanya tampilkan di web
  if (Platform.OS !== "web") return null;

  // Cek apakah Client ID sudah dikonfigurasi dengan benar
  const configured = isConfigured();

  async function handleUpload() {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      if (!isSignedIn()) {
        await googleSignIn();
        setLoggedIn(true);
      }
      await uploadToDrive();
      setStatus("✅ Data berhasil disimpan ke Google Drive!");
    } catch (e: any) {
      setError(e.message ?? "Gagal menyimpan ke Google Drive.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (Platform.OS === "web") {
      const ok = window.confirm(
        "⚠️ Data lokal saat ini akan ditimpa dengan data dari Google Drive. Lanjutkan?"
      );
      if (!ok) return;
    }
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      if (!isSignedIn()) {
        await googleSignIn();
        setLoggedIn(true);
      }
      await restoreFromDrive();
      setStatus("✅ Data berhasil dipulihkan dari Google Drive! Silakan refresh halaman.");
      onRestored?.();
    } catch (e: any) {
      setError(e.message ?? "Gagal memulihkan dari Google Drive.");
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    googleSignOut();
    setLoggedIn(false);
    setStatus("Keluar dari akun Google.");
  }

  return (
    <View style={{
      backgroundColor: T.white,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: T.outlineVariant,
      padding: 16,
      gap: 12,
      marginBottom: 12,
    }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#e8f0fe", alignItems: "center", justifyContent: "center" }}>
          <Icon name="database" size={18} color="#1a73e8" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: T.onSurface }}>Sinkronisasi Google Drive</Text>
          <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>Backup & pulihkan data lapangan</Text>
        </View>
        {loggedIn && (
          <View style={{ backgroundColor: "#e6f4ea", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ fontSize: 10, color: "#137333", fontWeight: "700" }}>● Terhubung</Text>
          </View>
        )}
      </View>

      {/* Belum dikonfigurasi */}
      {!configured && (
        <View style={{ backgroundColor: "#fef3c7", borderRadius: 10, padding: 12, gap: 6, borderWidth: 1, borderColor: "#fde68a" }}>
          <Text style={{ fontSize: 12, color: "#92400e", fontWeight: "700" }}>⚙️ Konfigurasi Diperlukan</Text>
          <Text style={{ fontSize: 11, color: "#92400e", lineHeight: 16 }}>
            Untuk menggunakan Google Drive, masukkan Client ID di:{"\n"}
            <Text style={{ fontFamily: "monospace" }}>src/lib/googleDriveSync.ts</Text>
          </Text>
          <Text style={{ fontSize: 11, color: "#78350f", lineHeight: 16 }}>
            1. Buka console.cloud.google.com{"\n"}
            2. Buat project → aktifkan Drive API{"\n"}
            3. Buat OAuth 2.0 Client ID (Web){"\n"}
            4. Masukkan URL web Anda di Authorized Origins{"\n"}
            5. Copy Client ID ke file di atas
          </Text>
        </View>
      )}

      {/* Tombol aksi */}
      <View style={{ flexDirection: "row", gap: 8 }}>
        {/* Simpan ke Drive */}
        <Pressable
          style={({ pressed }) => [{
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 6, paddingVertical: 11, borderRadius: 10,
            backgroundColor: configured ? "#1a73e8" : T.outlineVariant,
            opacity: pressed || loading || !configured ? 0.75 : 1,
          }]}
          onPress={handleUpload}
          disabled={loading || !configured}
          accessibilityLabel="Simpan ke Google Drive"
        >
          <Icon name="database" size={14} color={T.white} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: T.white }}>
            {loading ? "Memproses…" : "Simpan"}
          </Text>
        </Pressable>

        {/* Pulihkan dari Drive */}
        <Pressable
          style={({ pressed }) => [{
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 6, paddingVertical: 11, borderRadius: 10,
            backgroundColor: T.white, borderWidth: 1.5,
            borderColor: configured ? "#1a73e8" : T.outlineVariant,
            opacity: pressed || loading || !configured ? 0.75 : 1,
          }]}
          onPress={handleRestore}
          disabled={loading || !configured}
          accessibilityLabel="Pulihkan dari Google Drive"
        >
          <Icon name="arrow-right" size={14} color={configured ? "#1a73e8" : T.onSurfaceVariant} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: configured ? "#1a73e8" : T.onSurfaceVariant }}>
            Pulihkan
          </Text>
        </Pressable>

        {/* Logout */}
        {loggedIn && (
          <Pressable
            style={({ pressed }) => [{
              paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10,
              backgroundColor: T.surfaceContainerLow, borderWidth: 1, borderColor: T.outlineVariant,
              opacity: pressed ? 0.75 : 1,
            }]}
            onPress={handleSignOut}
            accessibilityLabel="Keluar dari Google"
          >
            <Icon name="x" size={16} color={T.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      {/* Status / Error */}
      {status && (
        <View style={{ backgroundColor: "#e6f4ea", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#a8d5b5" }}>
          <Text style={{ fontSize: 12, color: "#137333" }}>{status}</Text>
        </View>
      )}
      {error && (
        <View style={{ backgroundColor: "#fce8e6", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#f5c6c2" }}>
          <Text style={{ fontSize: 12, color: "#c5221f", fontWeight: "700" }}>Error</Text>
          <Text style={{ fontSize: 11, color: "#c5221f", marginTop: 2 }}>{error}</Text>
        </View>
      )}

      <Text style={{ fontSize: 10, color: T.onSurfaceVariant, textAlign: "center", lineHeight: 14 }}>
        Data disimpan di folder "SE2026 BPS Sumberharjo" di Google Drive Anda.{"\n"}
        File: se2026-sumberharjo-data.json
      </Text>
    </View>
  );
}
