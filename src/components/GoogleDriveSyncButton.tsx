// ─── GoogleDriveSyncButton — Simpan & Pulihkan data via Google Drive ─────────
// Hanya muncul di web (Platform.OS === "web")
// Menampilkan akun aktif, tombol Ganti Akun, Simpan, Pulihkan
import { useEffect, useState } from "react";
import { Image, Platform, Pressable, Text, View } from "react-native";
import { T } from "../constants/theme";
import {
    GoogleUser,
    getSignedInUser,
    googleSignIn,
    googleSignOut,
    isConfigured,
    isSignedIn,
    restoreFromDrive,
    switchAccount,
    uploadToDrive,
} from "../lib/googleDriveSync";
import { isLapanganGranted } from "../lib/keyAuth";
import { Icon } from "./Icon";

// ── Avatar placeholder ────────────────────────────────────────────────────────
function Avatar({ user }: { user: GoogleUser }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  if (user.photo && !imgErr) {
    return (
      <Image
        source={{ uri: user.photo }}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: T.primaryFixed }}
        onError={() => setImgErr(true)}
        accessibilityLabel={`Foto profil ${user.name}`}
      />
    );
  }
  return (
    <View style={{
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: "#1a73e8", alignItems: "center", justifyContent: "center",
    }}>
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>{initials || "G"}</Text>
    </View>
  );
}

export function GoogleDriveSyncButton({ onRestored }: { onRestored?: () => void }) {
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [user,     setUser]     = useState<GoogleUser | null>(getSignedInUser());
  const configured   = isConfigured();
  const hasLapangan  = isLapanganGranted();

  // Refresh state akun saat komponen mount
  useEffect(() => {
    setUser(isSignedIn() ? getSignedInUser() : null);
  }, []);

  if (Platform.OS !== "web") return null;

  // ── Gate: harus punya kunci lapangan ────────────────────────────────────
  if (!hasLapangan) {
    return (
      <View style={{
        backgroundColor: T.white, borderRadius: 14, borderWidth: 1,
        borderColor: T.outlineVariant, padding: 16, gap: 10, marginBottom: 12,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center" }}>
            <Icon name="key" size={18} color="#92400e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: T.onSurface }}>Sinkronisasi Google Drive</Text>
            <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>Memerlukan kunci akses Lapangan</Text>
          </View>
        </View>
        <View style={{ backgroundColor: "#fef3c7", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#fde68a", gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#92400e" }}>🔐 Akses Terkunci</Text>
          <Text style={{ fontSize: 12, color: "#92400e", lineHeight: 18 }}>
            Fitur Google Drive hanya tersedia untuk pengguna dengan kunci akses tipe <Text style={{ fontWeight: "700" }}>Lapangan</Text>.
          </Text>
          <Text style={{ fontSize: 12, color: "#92400e", lineHeight: 18 }}>
            Hubungi Admin BPS SE2026 untuk mendapatkan kunci Lapangan.
          </Text>
        </View>
      </View>
    );
  }

  // ── Login / ensure signed in ─────────────────────────────────────────────
  async function ensureSignedIn() {
    if (!isSignedIn()) {
      await googleSignIn();
      setUser(getSignedInUser());
    }
  }

  // ── Simpan ke Drive ───────────────────────────────────────────────────────
  async function handleUpload() {
    setLoading(true); setError(null); setStatus(null);
    try {
      await ensureSignedIn();
      await uploadToDrive();
      setStatus(`✅ Data berhasil disimpan ke Drive (${getSignedInUser()?.email ?? ""})`);
    } catch (e: any) {
      setError(e.message ?? "Gagal menyimpan ke Google Drive.");
    } finally { setLoading(false); }
  }

  // ── Pulihkan dari Drive ───────────────────────────────────────────────────
  async function handleRestore() {
    const ok = window.confirm(
      "⚠️ Data lokal saat ini akan ditimpa dengan data dari Google Drive. Lanjutkan?"
    );
    if (!ok) return;
    setLoading(true); setError(null); setStatus(null);
    try {
      await ensureSignedIn();
      await restoreFromDrive();
      setStatus("✅ Data berhasil dipulihkan! Silakan refresh halaman.");
      onRestored?.();
    } catch (e: any) {
      setError(e.message ?? "Gagal memulihkan dari Google Drive.");
    } finally { setLoading(false); }
  }

  // ── Ganti Akun ───────────────────────────────────────────────────────────
  async function handleSwitchAccount() {
    setLoading(true); setError(null); setStatus(null);
    try {
      await switchAccount();
      const newUser = getSignedInUser();
      setUser(newUser);
      setStatus(`✅ Login sebagai ${newUser?.email ?? "akun baru"}`);
    } catch (e: any) {
      setError(e.message ?? "Gagal ganti akun.");
    } finally { setLoading(false); }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  function handleSignOut() {
    googleSignOut();
    setUser(null);
    setStatus("Keluar dari akun Google.");
  }

  return (
    <View style={{
      backgroundColor: T.white, borderRadius: 14, borderWidth: 1,
      borderColor: T.outlineVariant, padding: 16, gap: 12, marginBottom: 12,
    }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#e8f0fe", alignItems: "center", justifyContent: "center" }}>
          <Icon name="database" size={18} color="#1a73e8" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: T.onSurface }}>Sinkronisasi Google Drive</Text>
          <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>Setiap simpan otomatis masuk ke Drive akun Anda</Text>
        </View>
      </View>

      {/* ── Belum dikonfigurasi ──────────────────────────────────────────── */}
      {!configured && (
        <View style={{ backgroundColor: "#fef3c7", borderRadius: 10, padding: 12, gap: 6, borderWidth: 1, borderColor: "#fde68a" }}>
          <Text style={{ fontSize: 12, color: "#92400e", fontWeight: "700" }}>⚙️ Konfigurasi Diperlukan</Text>
          <Text style={{ fontSize: 11, color: "#92400e", lineHeight: 16 }}>
            Masukkan Client ID Google di:{"\n"}
            <Text style={{ fontFamily: "monospace" }}>src/lib/googleDriveSync.ts</Text>
          </Text>
        </View>
      )}

      {/* ── Panel Akun Aktif ─────────────────────────────────────────────── */}
      {configured && user ? (
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 10,
          backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10,
          borderWidth: 1, borderColor: "#86efac",
        }}>
          <Avatar user={user} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#166534" }} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={{ fontSize: 11, color: "#16a34a" }} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
          {/* Tombol Ganti Akun */}
          <Pressable
            style={({ pressed }) => [{
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
              backgroundColor: T.white, borderWidth: 1, borderColor: "#86efac",
              opacity: pressed || loading ? 0.75 : 1,
            }]}
            onPress={handleSwitchAccount}
            disabled={loading}
            accessibilityLabel="Ganti akun Google"
          >
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#166534" }}>Ganti</Text>
          </Pressable>
          {/* Tombol Logout */}
          <Pressable
            style={({ pressed }) => [{
              padding: 6, borderRadius: 8,
              backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fca5a5",
              opacity: pressed ? 0.75 : 1,
            }]}
            onPress={handleSignOut}
            accessibilityLabel="Keluar dari Google"
          >
            <Icon name="x" size={13} color="#dc2626" />
          </Pressable>
        </View>
      ) : configured ? (
        /* Belum login — tampilkan tombol Login */
        <Pressable
          style={({ pressed }) => [{
            flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 8, paddingVertical: 12, borderRadius: 10,
            backgroundColor: "#1a73e8", opacity: pressed || loading ? 0.8 : 1,
          }]}
          onPress={async () => {
            setLoading(true); setError(null);
            try { await ensureSignedIn(); }
            catch (e: any) { setError(e.message); }
            finally { setLoading(false); }
          }}
          disabled={loading}
          accessibilityLabel="Login dengan Google"
        >
          <Icon name="user" size={16} color="#fff" />
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
            {loading ? "Memuat…" : "Login dengan Google"}
          </Text>
        </Pressable>
      ) : null}

      {/* ── Tombol Simpan & Pulihkan (hanya tampil setelah login) ────────── */}
      {configured && user && (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            style={({ pressed }) => [{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: "#1a73e8",
              opacity: pressed || loading ? 0.75 : 1,
            }]}
            onPress={handleUpload}
            disabled={loading}
            accessibilityLabel="Simpan ke Google Drive"
          >
            <Icon name="database" size={14} color="#fff" />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
              {loading ? "Memproses…" : "Simpan Sekarang"}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 6, paddingVertical: 11, borderRadius: 10,
              backgroundColor: T.white, borderWidth: 1.5, borderColor: "#1a73e8",
              opacity: pressed || loading ? 0.75 : 1,
            }]}
            onPress={handleRestore}
            disabled={loading}
            accessibilityLabel="Pulihkan dari Google Drive"
          >
            <Icon name="arrow-right" size={14} color="#1a73e8" />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#1a73e8" }}>Pulihkan</Text>
          </Pressable>
        </View>
      )}

      {/* ── Status / Error ───────────────────────────────────────────────── */}
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
        Setiap kali menyimpan bangunan, data otomatis masuk ke Drive akun yang aktif.{"\n"}
        Folder: SE2026 BPS Sumberharjo › Foto › SLS-RT-RW › Bangunan
      </Text>
    </View>
  );
}
