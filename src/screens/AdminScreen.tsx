// ─── AdminScreen — Panel Admin: Manajemen Kunci Akses ────────────────────────
// Akses hanya dari dalam app, memerlukan ADMIN_SECRET
// Fitur: Login admin, dashboard stats, buat kunci, lihat & hapus kunci
// UI: Material Design 3 — Light Mode, warna BPS biru


const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

// ─── Tipe data ────────────────────────────────────────────────────────────────
type KeyType = "lapangan" | "kalkulator";
interface KeyRecord {
  key: string;
  used: boolean;
  type: KeyType;
  createdBy: string;
  createdAt: string;
  usedAt?: string;
}

// ─── Color Palette BPS ───────────────────────────────────────────────────────
const A = {
  bg:                  "#f8f9ff",
  surface:             "#ffffff",
  surfaceContainer:    "#e5eeff",
  surfaceContainerLow: "#eff4ff",
  primary:             "#003996",
  primaryContainer:    "#004ec7",
  onPrimary:           "#ffffff",
  onPrimaryContainer:  "#bdccff",
  secondary:           "#006591",
  onSurface:           "#0b1c30",
  onSurfaceVariant:    "#434654",
  outline:             "#737685",
  outlineVariant:      "#c3c6d6",
  error:               "#ba1a1a",
  errorContainer:      "#ffdad6",
  inverseOnSurface:    "#eaf1ff",
  inverseSurface:      "#213145",
  success:             "#1a7a3c",
  successBg:           "#e8f5ec",
  text:                "#0b1c30",
  textSub:             "#434654",
  textMuted:           "#737685",
  border:              "#c3c6d6",
};

// ─── Helper shadow ────────────────────────────────────────────────────────────
function sh(y = 2, op = 0.06, r = 8, el = 2) {
  return Platform.OS === "web"
    ? { boxShadow: `0px ${y}px ${r}px rgba(0,0,0,${op})` }
    : { elevation: el, shadowColor: "#000", shadowOffset: { width: 0, height: y }, shadowOpacity: op, shadowRadius: r };
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, topColor, icon }: {
  label: string; value: string | number; topColor: string; icon: string;
}) {
  return (
    <View style={[{
      flex: 1, minWidth: 130, backgroundColor: A.surface,
      borderRadius: 16, borderWidth: 1, borderColor: A.outlineVariant,
      borderTopWidth: 4, borderTopColor: topColor,
      padding: 14, gap: 6,
    }, sh(2, 0.05, 8, 2) as any]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ fontSize: 24, fontWeight: "800", color: topColor, letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, fontWeight: "600", color: A.onSurfaceVariant }}>{label}</Text>
    </View>
  );
}

// ─── Badge Tipe ───────────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: KeyType }) {
  const isLapangan = type === "lapangan";
  return (
    <View style={{
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
      backgroundColor: isLapangan ? "rgba(0,57,150,0.1)" : "rgba(0,101,145,0.1)",
    }}>
      <Text style={{
        fontSize: 10, fontWeight: "700",
        color: isLapangan ? A.primary : A.secondary,
        textTransform: "uppercase", letterSpacing: 0.4,
      }}>
        {isLapangan ? "Lapangan" : "Kalkulator"}
      </Text>
    </View>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ used }: { used: boolean }) {
  return (
    <View style={{
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
      backgroundColor: used ? A.errorContainer : A.successBg,
    }}>
      <Text style={{
        fontSize: 10, fontWeight: "700",
        color: used ? A.error : A.success,
        textTransform: "uppercase", letterSpacing: 0.4,
      }}>
        {used ? "Terpakai" : "Tersedia"}
      </Text>
    </View>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function AdminLoginScreen({ onLogin }: { onLogin: (secret: string) => void }) {
  const [secret, setSecret] = useState("");
  const [show,   setShow]   = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!secret.trim()) { setError("Masukkan Admin Secret."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin?secret=${encodeURIComponent(secret.trim())}&action=list`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      if (res.status === 401) {
        setError("Secret salah. Akses ditolak.");
      } else {
        onLogin(secret.trim());
      }
    } catch {
      onLogin(secret.trim());
    }
    setLoading(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: A.bg, justifyContent: "center", alignItems: "center", padding: 24 }}>
      <View style={[{
        width: 72, height: 72, borderRadius: 20,
        backgroundColor: A.primary, alignItems: "center", justifyContent: "center",
        marginBottom: 16,
      }, sh(6, 0.08, 16, 6) as any]}>
        <Text style={{ fontSize: 36, fontWeight: "900", color: A.onPrimary }}>S</Text>
      </View>
      <Text style={{ fontSize: 22, fontWeight: "800", color: A.onSurface, letterSpacing: -0.4, marginBottom: 4 }}>
        Admin Panel BPS SE2026
      </Text>
      <Text style={{ fontSize: 13, color: A.onSurfaceVariant, marginBottom: 32, textAlign: "center" }}>
        BPS Sumberharjo — Manajemen Kunci Akses
      </Text>
      <View style={[{
        width: "100%", maxWidth: 400, backgroundColor: A.surface,
        borderRadius: 20, borderWidth: 1, borderColor: A.outlineVariant, padding: 24,
      }, sh(2, 0.06, 12, 3) as any]}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: A.onSurfaceVariant, marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Autentikasi Admin
        </Text>
        <View style={{ gap: 6, marginBottom: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: A.onSurfaceVariant }}>Admin Secret</Text>
          <View style={{
            flexDirection: "row", alignItems: "center",
            borderWidth: 1.5, borderColor: error ? A.error : A.outlineVariant,
            borderRadius: 10, backgroundColor: A.surface,
            paddingHorizontal: 14, paddingVertical: Platform.OS === "web" ? 12 : 4,
          }}>
            <Text style={{ fontSize: 16, color: A.textMuted, marginRight: 8 }}>🔐</Text>
            <TextInput
              style={{
                flex: 1, fontSize: 14, color: A.text,
                fontFamily: Platform.OS === "web" ? "monospace" : undefined,
                ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
              } as any}
              placeholder="Masukkan Admin Secret..."
              placeholderTextColor={A.textMuted}
              value={secret}
              onChangeText={(v) => { setSecret(v); if (error) setError(null); }}
              secureTextEntry={!show}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleLogin}
              editable={!loading}
            />
            <Pressable onPress={() => setShow(p => !p)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 14, color: A.textMuted }}>{show ? "👁️" : "🙈"}</Text>
            </Pressable>
          </View>
          {error && <Text style={{ fontSize: 12, color: A.error, marginTop: 4 }}>⚠️ {error}</Text>}
        </View>
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={({ pressed }) => [{
            backgroundColor: A.primary, borderRadius: 12,
            paddingVertical: 14, alignItems: "center", justifyContent: "center",
            flexDirection: "row", gap: 8,
            opacity: pressed || loading ? 0.85 : 1,
          }, sh(2, 0.08, 8, 3) as any]}
        >
          {loading
            ? <ActivityIndicator size="small" color={A.onPrimary} />
            : <Text style={{ fontSize: 15, fontWeight: "700", color: A.onPrimary }}>🔓 Masuk sebagai Admin</Text>
          }
        </Pressable>
      </View>
      <Text style={{ fontSize: 11, color: A.textMuted, marginTop: 24, textAlign: "center" }}>
        BPS Kabupaten Bojonegoro · SE2026 · Admin Panel
      </Text>
    </View>
  );
}

// ─── Baris kunci di tabel ─────────────────────────────────────────────────────
function KeyRow({ item, index, onDelete, onCopy, deleting, isMobile }: {
  item: KeyRecord; index: number; onDelete: (key: string) => void;
  onCopy: (key: string) => void; deleting: string | null; isMobile: boolean;
}) {
  const isDeleting = deleting === item.key;
  const shortKey = item.key.substring(0, 8) + "…" + item.key.slice(-6);
  const dateStr  = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" })
    : "-";

  return (
    <View style={{
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: isMobile ? 12 : 16, paddingVertical: 12,
      backgroundColor: index % 2 === 0 ? A.surface : A.surfaceContainerLow,
      borderBottomWidth: 1, borderColor: A.outlineVariant,
      opacity: isDeleting ? 0.4 : 1, gap: 8,
    }}>
      {/* Identitas */}
      <View style={{ flex: 2, minWidth: 0 }}>
        <Text style={{ fontSize: 12, color: A.onSurface, fontWeight: "600" }} numberOfLines={1}>
          {item.createdBy || "-"}
        </Text>
        <Text style={{ fontSize: 10, color: A.textMuted, marginTop: 1 }}>{dateStr}</Text>
      </View>

      {/* Tipe */}
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        <TypeBadge type={item.type} />
      </View>

      {/* Kunci — sembunyikan di mobile */}
      {!isMobile && (
        <View style={{ flex: 2, minWidth: 0 }}>
          <Text style={{
            fontSize: 11, color: A.onSurfaceVariant, fontWeight: "600",
            fontFamily: Platform.OS === "web" ? "monospace" : undefined,
          }} numberOfLines={1}>
            {shortKey}
          </Text>
        </View>
      )}

      {/* Status */}
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        <StatusBadge used={item.used} />
      </View>

      {/* Aksi */}
      <View style={{ flexDirection: "row", gap: 4 }}>
        {!item.used && (
          <Pressable
            onPress={() => onCopy(item.key)}
            style={({ pressed }) => [{
              paddingHorizontal: 8, paddingVertical: 6,
              backgroundColor: A.surface, borderRadius: 8,
              borderWidth: 1, borderColor: A.primary,
              opacity: pressed ? 0.7 : 1,
            }]}
          >
            <Text style={{ fontSize: 11, color: A.primary }}>📋</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => !isDeleting && onDelete(item.key)}
          style={({ pressed }) => [{
            paddingHorizontal: 8, paddingVertical: 6,
            backgroundColor: A.surface, borderRadius: 8,
            borderWidth: 1, borderColor: A.error,
            opacity: pressed || isDeleting ? 0.7 : 1,
          }]}
        >
          {isDeleting
            ? <ActivityIndicator size="small" color={A.error} style={{ width: 13 }} />
            : <Text style={{ fontSize: 11, color: A.error }}>🗑️</Text>
          }
        </Pressable>
      </View>
    </View>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ keyToDelete, onConfirm, onCancel }: {
  keyToDelete: string | null; onConfirm: () => void; onCancel: () => void;
}) {
  if (!keyToDelete) return null;
  const shortKey = keyToDelete.substring(0, 8) + "…" + keyToDelete.slice(-6);
  return (
    <View style={{
      position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center", justifyContent: "center", padding: 24, zIndex: 100,
    } as any}>
      <View style={[{
        backgroundColor: A.surface, borderRadius: 20,
        borderWidth: 1, borderColor: A.outlineVariant,
        padding: 28, width: "100%", maxWidth: 380, alignItems: "center",
      }, sh(8, 0.08, 20, 10) as any]}>
        <View style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: A.errorContainer, alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <Text style={{ fontSize: 28 }}>🗑️</Text>
        </View>
        <Text style={{ fontSize: 16, fontWeight: "800", color: A.onSurface, marginBottom: 6 }}>Hapus Kunci?</Text>
        <Text style={{ fontSize: 13, color: A.textSub, textAlign: "center", marginBottom: 12, lineHeight: 20 }}>
          Pengguna yang memakai kunci ini akan{" "}
          <Text style={{ fontWeight: "700", color: A.error }}>dipaksa login ulang</Text>.
        </Text>
        <View style={{
          backgroundColor: A.errorContainer, borderRadius: 10, padding: 10, marginBottom: 20, width: "100%",
        }}>
          <Text style={{
            fontSize: 12, color: A.error, textAlign: "center", fontWeight: "700",
            fontFamily: Platform.OS === "web" ? "monospace" : undefined,
          }}>
            {shortKey}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [{
              flex: 1, paddingVertical: 12, borderRadius: 10,
              backgroundColor: A.surface, borderWidth: 1, borderColor: A.outlineVariant,
              alignItems: "center", opacity: pressed ? 0.7 : 1,
            }]}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: A.onSurfaceVariant }}>Batal</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => [{
              flex: 1, paddingVertical: 12, borderRadius: 10,
              backgroundColor: A.error, alignItems: "center", opacity: pressed ? 0.8 : 1,
            }, sh(2, 0.08, 8, 3) as any]}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Ya, Hapus</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Dashboard utama ──────────────────────────────────────────────────────────
function AdminDashboard({ secret, onLogout }: { secret: string; onLogout: () => void }) {
  const { width } = useWindowDimensions();
  const isMobile  = width < 600;
  const isTablet  = width >= 600 && width < 900;

  const [keys,     setKeys]     = useState<KeyRecord[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [filter,   setFilter]   = useState<"all" | KeyType>("all");

  // Form buat kunci
  const [note,     setNote]     = useState("");
  const [keyType,  setKeyType]  = useState<KeyType>("lapangan");
  const [minting,  setMinting]  = useState(false);
  const [newKey,   setNewKey]   = useState<string | null>(null);
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin?secret=${encodeURIComponent(secret)}&action=list`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const data = await res.json();
      if (data.keys) setKeys(data.keys.filter(Boolean));
    } catch {
      showToast("Gagal memuat data kunci.", false);
    }
    setLoading(false);
  }, [secret, showToast]);

  React.useEffect(() => { loadKeys(); }, [loadKeys]);

  async function handleMint() {
    if (!note.trim()) { showToast("Mohon isi nama/catatan petugas.", false); return; }
    setMinting(true); setNewKey(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin?secret=${encodeURIComponent(secret)}&action=mint`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: note.trim(), type: keyType }) }
      );
      const data = await res.json();
      if (data.success) {
        setNewKey(data.key);
        setNote("");
        setKeys(prev => [{ key: data.key, used: false, type: keyType, createdBy: note.trim(), createdAt: new Date().toISOString() }, ...prev]);
        showToast("Kunci akses baru berhasil dibuat.");
      } else {
        showToast(data.message || "Gagal membuat kunci.", false);
      }
    } catch {
      showToast("Error koneksi ke server.", false);
    }
    setMinting(false);
  }

  async function handleDelete(key: string) {
    setDeleting(key); setToDelete(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin?secret=${encodeURIComponent(secret)}&action=delete`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }) }
      );
      const data = await res.json();
      if (data.success) {
        setKeys(prev => prev.filter(k => k.key !== key));
        showToast("Kunci berhasil dihapus.");
      } else {
        showToast(data.message || "Gagal menghapus.", false);
      }
    } catch {
      showToast("Error koneksi ke server.", false);
    }
    setDeleting(null);
  }

  function copyKey(key: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(key).then(() => showToast("Kunci disalin ke clipboard."));
    } else {
      showToast("Salin manual: " + key);
    }
  }

  const filtered = filter === "all" ? keys : keys.filter(k => k.type === filter);
  const totalKeys     = keys.length;
  const tersediaKeys  = keys.filter(k => !k.used).length;
  const lapanganCount = keys.filter(k => k.type === "lapangan").length;
  const kalkulatorCount = keys.filter(k => k.type === "kalkulator").length;

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: A.bg }}>

      {/* ── Header ── */}
      <View style={[{
        height: 56, flexDirection: "row", alignItems: "center",
        paddingHorizontal: isMobile ? 16 : 24,
        backgroundColor: A.surface,
        borderBottomWidth: 1, borderColor: A.outlineVariant,
        justifyContent: "space-between",
      }, sh(1, 0.04, 4, 2) as any]}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: A.primary }}>
          BPS SE2026 · Admin
        </Text>
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
            backgroundColor: A.errorContainer, opacity: pressed ? 0.7 : 1,
          }]}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: A.error }}>Keluar</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: isMobile ? 16 : 24, gap: 20 }}>

        {/* ── Breadcrumb ── */}
        <Text style={{ fontSize: 12, color: A.textMuted }}>
          Admin {">"} <Text style={{ color: A.primary, fontWeight: "700" }}>Kunci Akses</Text>
        </Text>

        <Text style={{ fontSize: isMobile ? 22 : 26, fontWeight: "900", color: A.onSurface, marginTop: -4 }}>
          Manajemen Kunci Akses
        </Text>

        {/* ── Stat Cards ── */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <StatCard label="Total Kunci"       value={totalKeys}       topColor={A.primary}   icon="🔑" />
          <StatCard label="Tersedia"          value={tersediaKeys}    topColor={A.secondary}  icon="✅" />
          <StatCard label="Kunci Lapangan"    value={lapanganCount}   topColor="#1a7a3c"      icon="🗺️" />
          <StatCard label="Kunci Kalkulator"  value={kalkulatorCount} topColor="#772400"      icon="🧮" />
        </View>

        {/* ── Layout: 1 kolom (mobile) / 2 kolom (tablet+) ── */}
        <View style={{
          flexDirection: isMobile ? "column" : "row",
          gap: 16, alignItems: "flex-start",
        }}>

          {/* ── Form Buat Kunci ── */}
          <View style={[{
            backgroundColor: A.surface, borderRadius: 16,
            borderWidth: 1, borderColor: A.outlineVariant,
            padding: 20,
            width: isMobile ? "100%" : isTablet ? "45%" : "35%",
          }, sh(2, 0.05, 8, 2) as any]}>
            <Text style={{ fontSize: 14, fontWeight: "800", color: A.onSurface, marginBottom: 16 }}>
              ➕ Buat Kunci Baru
            </Text>

            {/* Nama */}
            <Text style={{ fontSize: 11, fontWeight: "700", color: A.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Nama / Catatan
            </Text>
            <View style={{
              flexDirection: "row", alignItems: "center",
              borderWidth: 1.5, borderColor: A.outlineVariant, borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: Platform.OS === "web" ? 10 : 4,
              marginBottom: 14,
            }}>
              <TextInput
                style={{
                  flex: 1, fontSize: 13, color: A.text,
                  ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
                } as any}
                placeholder="cth: Ahmad Fauzi - PCL-01"
                placeholderTextColor={A.textMuted}
                value={note}
                onChangeText={setNote}
                editable={!minting}
              />
            </View>

            {/* Tipe Kunci */}
            <Text style={{ fontSize: 11, fontWeight: "700", color: A.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Tipe Kunci
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
              {(["lapangan", "kalkulator"] as KeyType[]).map(t => (
                <Pressable
                  key={t}
                  onPress={() => setKeyType(t)}
                  style={[{
                    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
                    borderWidth: 1.5,
                    borderColor: keyType === t ? (t === "lapangan" ? A.primary : A.secondary) : A.outlineVariant,
                    backgroundColor: keyType === t
                      ? (t === "lapangan" ? "rgba(0,57,150,0.08)" : "rgba(0,101,145,0.08)")
                      : A.surface,
                  }]}
                >
                  <Text style={{ fontSize: 16, marginBottom: 2 }}>{t === "lapangan" ? "🗺️" : "🧮"}</Text>
                  <Text style={{
                    fontSize: 11, fontWeight: "700", textTransform: "capitalize",
                    color: keyType === t ? (t === "lapangan" ? A.primary : A.secondary) : A.textMuted,
                  }}>
                    {t === "lapangan" ? "Lapangan" : "Kalkulator"}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tombol Generate */}
            <Pressable
              onPress={handleMint}
              disabled={minting}
              style={({ pressed }) => [{
                backgroundColor: A.primary, borderRadius: 10,
                paddingVertical: 13, alignItems: "center", justifyContent: "center",
                flexDirection: "row", gap: 8,
                opacity: pressed || minting ? 0.8 : 1,
              }, sh(2, 0.08, 8, 3) as any]}
            >
              {minting
                ? <ActivityIndicator size="small" color={A.onPrimary} />
                : <Text style={{ fontSize: 13, fontWeight: "700", color: A.onPrimary }}>Generate Kunci Akses</Text>
              }
            </Pressable>

            {/* Hasil kunci baru */}
            {newKey && (
              <View style={{
                marginTop: 14, padding: 14, borderRadius: 12,
                backgroundColor: A.successBg, borderWidth: 1, borderColor: "#b7e4c7",
              }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: A.success, marginBottom: 6 }}>
                  ✅ Kunci Berhasil Dibuat
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={{
                    flex: 1, fontSize: 11, color: A.onSurface, fontWeight: "600",
                    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
                  }} numberOfLines={2}>
                    {newKey}
                  </Text>
                  <Pressable onPress={() => copyKey(newKey)}
                    style={({ pressed }) => [{ padding: 6, borderRadius: 8, backgroundColor: A.surface, opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={{ fontSize: 14 }}>📋</Text>
                  </Pressable>
                </View>
                <Text style={{ fontSize: 10, color: "#6b7280", marginTop: 6 }}>
                  ⚠️ Salin dan simpan. Tidak akan ditampilkan ulang.
                </Text>
              </View>
            )}
          </View>

          {/* ── Tabel Kunci ── */}
          <View style={[{
            flex: 1, backgroundColor: A.surface, borderRadius: 16,
            borderWidth: 1, borderColor: A.outlineVariant, overflow: "hidden",
            width: isMobile ? "100%" : undefined,
          }, sh(2, 0.05, 8, 2) as any]}>

            {/* Header tabel + filter */}
            <View style={{
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: "space-between",
              padding: 16, borderBottomWidth: 1, borderColor: A.outlineVariant, gap: 10,
            }}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: A.onSurface }}>
                📋 Daftar Kunci Terdaftar
              </Text>
              <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                {(["all", "lapangan", "kalkulator"] as const).map(f => (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[{
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                      borderWidth: 1,
                      borderColor: filter === f ? A.primary : A.outlineVariant,
                      backgroundColor: filter === f ? "rgba(0,57,150,0.08)" : A.surface,
                    }]}
                  >
                    <Text style={{
                      fontSize: 11, fontWeight: "700",
                      color: filter === f ? A.primary : A.textMuted,
                      textTransform: "capitalize",
                    }}>
                      {f === "all" ? "Semua" : f === "lapangan" ? "Lapangan" : "Kalkulator"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Header kolom */}
            <View style={{
              flexDirection: "row", paddingHorizontal: isMobile ? 12 : 16, paddingVertical: 8,
              backgroundColor: A.surfaceContainerLow,
              borderBottomWidth: 1, borderColor: A.outlineVariant,
            }}>
              <Text style={{ flex: 2, fontSize: 10, fontWeight: "700", color: A.textMuted, textTransform: "uppercase" }}>Identitas</Text>
              <Text style={{ flex: 1, fontSize: 10, fontWeight: "700", color: A.textMuted, textTransform: "uppercase" }}>Tipe</Text>
              {!isMobile && <Text style={{ flex: 2, fontSize: 10, fontWeight: "700", color: A.textMuted, textTransform: "uppercase" }}>Kunci</Text>}
              <Text style={{ flex: 1, fontSize: 10, fontWeight: "700", color: A.textMuted, textTransform: "uppercase" }}>Status</Text>
              <Text style={{ fontSize: 10, fontWeight: "700", color: A.textMuted, textTransform: "uppercase" }}>Aksi</Text>
            </View>

            {/* Isi tabel */}
            {loading ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color={A.primary} />
                <Text style={{ fontSize: 12, color: A.textMuted, marginTop: 8 }}>Memuat kunci...</Text>
              </View>
            ) : filtered.length === 0 ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🔑</Text>
                <Text style={{ fontSize: 13, color: A.textMuted }}>Belum ada kunci yang diterbitkan.</Text>
              </View>
            ) : (
              filtered.map((item, index) => (
                <KeyRow
                  key={item.key}
                  item={item}
                  index={index}
                  onDelete={(k) => setToDelete(k)}
                  onCopy={copyKey}
                  deleting={deleting}
                  isMobile={isMobile}
                />
              ))
            )}

            {/* Footer tabel */}
            <View style={{
              flexDirection: "row", justifyContent: "space-between", alignItems: "center",
              padding: 12, borderTopWidth: 1, borderColor: A.outlineVariant,
              backgroundColor: A.surfaceContainerLow,
            }}>
              <Text style={{ fontSize: 11, color: A.textMuted }}>
                {filtered.length} dari {totalKeys} kunci
              </Text>
              <Pressable onPress={loadKeys} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: A.primary }}>🔄 Refresh</Text>
              </Pressable>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Toast ── */}
      {toast && (
        <View style={[{
          position: "absolute", bottom: 24, right: 16, left: 16,
          backgroundColor: A.surface, borderRadius: 12,
          borderLeftWidth: 4, borderLeftColor: toast.ok ? A.success : A.error,
          padding: 14, flexDirection: "row", alignItems: "center", gap: 10,
          zIndex: 200,
        }, sh(4, 0.12, 12, 6) as any]}>
          <Text style={{ fontSize: 16 }}>{toast.ok ? "✅" : "❌"}</Text>
          <Text style={{ flex: 1, fontSize: 13, color: A.onSurface, fontWeight: "600" }}>{toast.msg}</Text>
        </View>
      )}

      {/* ── Confirm Delete Modal ── */}
      <ConfirmDeleteModal
        keyToDelete={toDelete}
        onConfirm={() => toDelete && handleDelete(toDelete)}
        onCancel={() => setToDelete(null)}
      />
    </View>
  );
}

// ─── Export default: AdminScreen ──────────────────────────────────────────────
export function AdminScreen({ onBack }: { onBack?: () => void }) {
  const [secret, setSecret] = useState<string | null>(null);

  if (!secret) {
    return <AdminLoginScreen onLogin={(s) => setSecret(s)} />;
  }

  return (
    <AdminDashboard
      secret={secret}
      onLogout={() => setSecret(null)}
    />
  );
}
