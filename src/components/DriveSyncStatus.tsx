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
  error:          { dot: "🔴", text: "Gagal sync — tap retry",    bg: "#fce8e6",  textColor: "#c5221f" },
  local_only:     { dot: "🟡", text: "Lokal saja",                bg: "#fff9e6",  textColor: "#856404" },
};

export function DriveSyncStatus() {
  const [status,    setStatus]    = useState<DriveStatus>(getDriveStatus());
  const [user,      setUser]      = useState<GoogleUser | null>(getSignedInUser());
  const [loading,   setLoading]   = useState(false);
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null);

  useEffect(() => {
    onDriveStatusChange((s) => {
      setStatus(s);
      setUser(getSignedInUser());
      // reset pesan error saat status bukan error
      if (s !== "error") setErrorMsg(null);
    });
  }, []);

  if (Platform.OS !== "web") return null;
  if (!isConfigured()) return null;
  if (!isLapanganGranted()) return null;

  const cfg = STATUS_CONFIG[status];

  async function handlePress() {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (status === "not_logged_in") {
        await loginAndSync();
        setUser(getSignedInUser());
      } else if (status === "error" || status === "local_only") {
        await forceDriveSync();
      }
    } catch (e: any) {
      // Tampilkan pesan error ringkas di tooltip
      const msg: string = e?.message ?? "Gagal sync";
      // Sederhanakan pesan untuk UI
      if (msg.includes("403") || msg.includes("forbidden") || msg.includes("insufficientPermissions")) {
        setErrorMsg("Izin Drive ditolak. Coba login ulang.");
      } else if (msg.includes("popup_closed") || msg.includes("Popup")) {
        setErrorMsg("Popup login ditutup.");
      } else if (msg.includes("network") || msg.includes("fetch")) {
        setErrorMsg("Koneksi gagal. Cek internet.");
      } else {
        setErrorMsg(msg.length > 60 ? msg.slice(0, 60) + "…" : msg);
      }
      console.warn("Drive action gagal:", msg);
    } finally {
      setLoading(false);
    }
  }

  const shortName = user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? null;
  const isClickable = !loading && status !== "synced" && status !== "syncing" && status !== "not_configured";

  return (
    <View style={{ gap: 3 }}>
      <Pressable
        onPress={handlePress}
        disabled={!isClickable}
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
      {/* Pesan error di bawah badge */}
      {errorMsg && (
        <Text style={{ fontSize: 10, color: "#c5221f", paddingHorizontal: 10 }}>
          ⚠ {errorMsg}
        </Text>
      )}
    </View>
  );
}
