// ─── DriveSyncStatus — indikator status sinkronisasi Drive + akun aktif ───────
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import {
    DriveStatus,
    forceDriveSync,
    getDriveStatus,
    loginAndSync,
    onDriveStatusChange,
} from "../lib/driveStorage";
import { GoogleUser, getSignedInUser, isConfigured } from "../lib/googleDriveSync";
import { isLapanganGranted } from "../lib/keyAuth";
const STATUS_CONFIG: Record<DriveStatus, { dot: string; text: string; bg: string; textColor: string }> = {
  not_configured: { dot: "⚪", text: "Drive belum dikonfigurasi", bg: "#f5f5f5",  textColor: "#888"    },
  not_logged_in:  { dot: "🔴", text: "Tap untuk login Drive",     bg: "#fff3cd",  textColor: "#856404" },
  syncing:        { dot: "🔄", text: "Menyimpan…",                bg: "#e8f4fd",  textColor: "#0c63e4" },
  synced:         { dot: "🟢", text: "Drive ✓",                   bg: "#d1fae5",  textColor: "#065f46" },
  error:          { dot: "🔴", text: "Gagal sync",                bg: "#fce8e6",  textColor: "#c5221f" },
  local_only:     { dot: "🟡", text: "Lokal saja",                bg: "#fff9e6",  textColor: "#856404" },
};

export function DriveSyncStatus() {
  const [status,  setStatus]  = useState<DriveStatus>(getDriveStatus());
  const [user,    setUser]    = useState<GoogleUser | null>(getSignedInUser());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onDriveStatusChange((s) => {
      setStatus(s);
      // refresh user info setiap status berubah
      setUser(getSignedInUser());
    });
  }, []);

  if (Platform.OS !== "web") return null;
  if (!isConfigured()) return null;
  if (!isLapanganGranted()) return null;  // sembunyikan jika bukan kunci lapangan

  const cfg = STATUS_CONFIG[status];

  async function handlePress() {
    if (loading) return;
    setLoading(true);
    try {
      if (status === "not_logged_in") {
        await loginAndSync();
        setUser(getSignedInUser());
      } else if (status === "error" || status === "local_only") {
        await forceDriveSync();
      }
    } catch (e: any) {
      console.warn("Drive action gagal:", e.message);
    } finally {
      setLoading(false);
    }
  }

  // Nama pendek: ambil kata pertama dari nama akun
  const shortName = user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? null;

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || status === "synced" || status === "syncing"}
      accessibilityLabel={`Status Google Drive: ${cfg.text}${user ? ` (${user.email})` : ""}`}
      style={({ pressed }) => [{
        flexDirection: "row", alignItems: "center", gap: 5,
        backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 20, opacity: pressed ? 0.8 : 1,
      }]}
    >
      <Text style={{ fontSize: 13 }}>{cfg.dot}</Text>
      <Text style={{ fontSize: 11, fontWeight: "600", color: cfg.textColor }}>
        {loading ? "Memproses…" : cfg.text}
      </Text>
      {/* Tampilkan nama akun kalau sudah login dan status synced/syncing */}
      {shortName && (status === "synced" || status === "syncing") && (
        <View style={{
          backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 10,
          paddingHorizontal: 6, paddingVertical: 2,
        }}>
          <Text style={{ fontSize: 10, color: cfg.textColor, fontWeight: "600" }}>
            {shortName}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
