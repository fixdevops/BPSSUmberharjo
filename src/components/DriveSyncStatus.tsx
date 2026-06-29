// ─── DriveSyncStatus — indikator status sinkronisasi Drive (web only) ─────────
import { useEffect, useState } from "react";
import { Platform, Pressable, Text } from "react-native";
import {
    DriveStatus,
    forceDriveSync,
    getDriveStatus, loginAndSync,
    onDriveStatusChange,
} from "../lib/driveStorage";
import { isConfigured } from "../lib/googleDriveSync";

const STATUS_CONFIG: Record<DriveStatus, { dot: string; text: string; bg: string; textColor: string }> = {
  not_configured: { dot: "⚪", text: "Drive belum dikonfigurasi", bg: "#f5f5f5", textColor: "#888" },
  not_logged_in:  { dot: "🔴", text: "Login Google Drive",         bg: "#fff3cd", textColor: "#856404" },
  syncing:        { dot: "🔄", text: "Menyimpan ke Drive…",        bg: "#e8f4fd", textColor: "#0c63e4" },
  synced:         { dot: "🟢", text: "Tersimpan di Drive",          bg: "#d1fae5", textColor: "#065f46" },
  error:          { dot: "🔴", text: "Gagal sync Drive",            bg: "#fce8e6", textColor: "#c5221f" },
  local_only:     { dot: "🟡", text: "Hanya lokal (belum ke Drive)", bg: "#fff9e6", textColor: "#856404" },
};

export function DriveSyncStatus() {
  const [status, setStatus]   = useState<DriveStatus>(getDriveStatus());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onDriveStatusChange(setStatus);
  }, []);

  if (Platform.OS !== "web") return null;
  if (!isConfigured()) return null; // sembunyikan jika belum dikonfigurasi

  const cfg = STATUS_CONFIG[status];

  async function handlePress() {
    if (loading) return;
    setLoading(true);
    try {
      if (status === "not_logged_in") {
        await loginAndSync();
      } else if (status === "error" || status === "local_only") {
        await forceDriveSync();
      }
    } catch (e: any) {
      console.warn("Drive action gagal:", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading || status === "synced" || status === "syncing"}
      accessibilityLabel={`Status Google Drive: ${cfg.text}`}
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
    </Pressable>
  );
}
