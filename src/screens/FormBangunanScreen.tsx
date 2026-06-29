// ─── FormBangunanScreen — Tambah Bangunan (RT + Nomor Urut Manual) ───────────
import { useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, KeyboardAvoidingView,
    Platform, Pressable, ScrollView, Text, TextInput, View,
} from "react-native";
import { Icon } from "../components/Icon";
import { SectionCard } from "../components/ui/SectionCard";
import { T } from "../constants/theme";
import {
    RT, SLS,
    getRTBySLS, getSLSList,
    insertBangunan, nextNomorBangunan,
} from "../lib/database";
import { ui } from "../styles/ui";

// Lazy-import expo-location hanya di native
let Location: typeof import("expo-location") | null = null;
if (Platform.OS !== "web") {
  try { Location = require("expo-location"); } catch (_) {}
}

const JENIS_LIST = ["Rumah", "Kos", "Mushola", "Gudang", "Toko", "Kosong"];
const JENIS_COLOR: Record<string, string> = {
  "Rumah": T.primary, "Kos": "#f59e0b", "Mushola": "#22c55e",
  "Gudang": "#8b5cf6", "Toko": "#ef4444", "Kosong": T.outline,
};

export function FormBangunanScreen({
  defaultRtId,
  onSave,
  onCancel,
}: {
  defaultRtId?: number;
  onSave:       () => void;
  onCancel:     () => void;
}) {
  // SLS + RT selection
  const [slsList,    setSlsList]    = useState<SLS[]>([]);
  const [rtList,     setRTList]     = useState<RT[]>([]);
  const [selectedSLS, setSelectedSLS] = useState<SLS | null>(null);
  const [selectedRT,  setSelectedRT]  = useState<RT | null>(null);

  // Field
  const [nomorUrut,  setNomorUrut]  = useState("");
  const [nomorHint,  setNomorHint]  = useState("otomatis");
  const [jenis,      setJenis]      = useState("Rumah");
  const [alamat,     setAlamat]     = useState("");
  const [catatan,    setCatatan]    = useState("");
  const [lat,        setLat]        = useState<number | null>(null);
  const [lng,        setLng]        = useState<number | null>(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [saving,     setSaving]     = useState(false);

  // Load SLS list on mount
  useEffect(() => {
    getSLSList().then((data) => {
      setSlsList(data);
      if (data.length === 1) handleSelectSLS(data[0]);
    });
  }, []);

  async function handleSelectSLS(sls: SLS) {
    setSelectedSLS(sls);
    setSelectedRT(null);
    const rts = await getRTBySLS(sls.id);
    setRTList(rts);
    if (rts.length === 1) handleSelectRT(rts[0]);
  }

  async function handleSelectRT(rt: RT) {
    setSelectedRT(rt);
    const next = await nextNomorBangunan(rt.id);
    setNomorHint(next);
    setNomorUrut(""); // kosongkan agar user bisa isi manual atau biarkan auto
  }

  async function ambilGPS() {
    setLoadingGPS(true);
    try {
      if (Platform.OS === "web") {
        // Web: pakai Geolocation API bawaan browser
        if (!("geolocation" in navigator)) {
          Alert.alert("Tidak Didukung", "Browser Anda tidak mendukung GPS.");
          return;
        }
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLat(pos.coords.latitude);
              setLng(pos.coords.longitude);
              resolve();
            },
            (err) => {
              if (err.code === err.PERMISSION_DENIED) {
                Alert.alert("Izin Ditolak", "Izinkan akses lokasi di browser untuk mengambil GPS.");
              } else {
                Alert.alert("Error GPS", "Gagal mendapatkan lokasi: " + err.message);
              }
              reject(err);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        });
      } else {
        // Native: pakai expo-location
        if (!Location) { Alert.alert("Tidak Didukung", "GPS hanya tersedia di mobile."); return; }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { Alert.alert("Izin Ditolak", "Izin lokasi diperlukan."); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLat(loc.coords.latitude);
        setLng(loc.coords.longitude);
      }
    } catch (_) {
      // error sudah di-handle di atas
    } finally {
      setLoadingGPS(false);
    }
  }

  async function handleSave() {
    if (!selectedRT) { Alert.alert("Validasi", "Pilih RT terlebih dahulu."); return; }
    setSaving(true);
    try {
      await insertBangunan({
        rt_id:       selectedRT.id,
        nomor_urut:  nomorUrut.trim() || undefined, // kosong → auto
        jenis,
        alamat:      alamat.trim() || undefined,
        lat:         lat ?? undefined,
        lng:         lng ?? undefined,
        catatan:     catatan.trim() || undefined,
      });
      onSave();
    } catch { Alert.alert("Error", "Gagal menyimpan bangunan."); }
    finally { setSaving(false); }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={[ui.topNav, { paddingVertical: 10 }]}>
        <Pressable onPress={onCancel} style={{ padding: 6 }}>
          <Icon name="arrow-right" size={20} color={T.onSurfaceVariant} />
        </Pressable>
        <Text style={[ui.topNavBrand, { fontSize: 15 }]}>Tambah Bangunan</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">

        {/* Pilih SLS */}
        <SectionCard icon="database" title="Wilayah Kerja (SLS) *">
          {slsList.length === 0 ? (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: T.surfaceContainerLow, borderRadius: 10, padding: 12 }}>
              <Icon name="info" size={14} color={T.error} />
              <Text style={{ fontSize: 13, color: T.error, flex: 1 }}>Belum ada SLS. Buat dulu di tab Data Lapangan → Wilayah Kerja.</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {slsList.map((sls) => {
                const active = selectedSLS?.id === sls.id;
                return (
                  <Pressable key={sls.id}
                    style={({ pressed }) => [{ padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: active ? T.primary : T.outlineVariant, backgroundColor: active ? T.primaryFixed : T.white, opacity: pressed ? 0.8 : 1, flexDirection: "row", alignItems: "center", gap: 8 }]}
                    onPress={() => handleSelectSLS(sls)}
                  >
                    <Icon name="database" size={16} color={active ? T.primary : T.onSurfaceVariant} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: active ? "700" : "500", color: active ? T.primary : T.onSurface }}>{sls.nama}</Text>
                      <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>{sls.kode} · Kec. {sls.kecamatan}</Text>
                    </View>
                    {active && <Icon name="check" size={16} color={T.primary} />}
                  </Pressable>
                );
              })}
            </View>
          )}
        </SectionCard>

        {/* Pilih RT */}
        {selectedSLS && (
          <SectionCard icon="map-pin" title={`Pilih RT dalam ${selectedSLS.nama} *`}>
            {rtList.length === 0 ? (
              <Text style={{ fontSize: 13, color: T.onSurfaceVariant }}>Belum ada RT. Tambah RT dulu dari menu Wilayah Kerja.</Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {rtList.map((rt) => {
                  const active = selectedRT?.id === rt.id;
                  return (
                    <Pressable key={rt.id}
                      style={({ pressed }) => [{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: active ? T.secondary : T.outlineVariant, backgroundColor: active ? T.secondaryContainer : T.white, opacity: pressed ? 0.8 : 1 }]}
                      onPress={() => handleSelectRT(rt)}
                    >
                      <Text style={{ fontSize: 13, fontWeight: active ? "700" : "500", color: active ? T.secondary : T.onSurface }}>{rt.nama_rt}</Text>
                      {rt.nama_rw ? <Text style={{ fontSize: 10, color: T.onSurfaceVariant }}>{rt.nama_rw}</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </SectionCard>
        )}

        {/* Nomor Urut Bangunan */}
        {selectedRT && (
          <SectionCard icon="home" title="Nomor Urut Bangunan">
            <View style={ui.fieldWrap}>
              <Text style={ui.fieldLabel}>
                Nomor Urut <Text style={{ color: T.onSurfaceVariant, fontWeight: "400" }}>(kosongkan untuk otomatis: {nomorHint})</Text>
              </Text>
              <TextInput
                style={ui.input}
                value={nomorUrut}
                onChangeText={setNomorUrut}
                placeholder={`otomatis: ${nomorHint}`}
                placeholderTextColor={T.outline}
                keyboardType="numeric"
              />
            </View>
            {nomorUrut !== "" && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: T.primaryFixed, borderRadius: 8, padding: 8, marginTop: 6 }}>
                <Icon name="check" size={13} color={T.primary} />
                <Text style={{ fontSize: 12, color: T.primary }}>Nomor urut bangunan: <Text style={{ fontWeight: "700" }}>{nomorUrut}</Text></Text>
              </View>
            )}
          </SectionCard>
        )}

        {/* Jenis Bangunan */}
        <SectionCard icon="home" title="Jenis Bangunan *">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {JENIS_LIST.map((j) => {
              const active = jenis === j;
              const color  = JENIS_COLOR[j] ?? T.outline;
              return (
                <Pressable key={j}
                  style={({ pressed }) => [{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: active ? color : T.outlineVariant, backgroundColor: active ? color + "18" : T.white, opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => setJenis(j)}
                >
                  <Text style={{ fontSize: 14, fontWeight: active ? "700" : "500", color: active ? color : T.onSurfaceVariant }}>{j}</Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {/* Alamat */}
        <SectionCard icon="map-pin" title="Alamat">
          <TextInput style={[ui.input, { minHeight: 56, textAlignVertical: "top" }]} value={alamat} onChangeText={setAlamat} placeholder="contoh: Jl. Merdeka No. 12 RT 01/01" placeholderTextColor={T.outline} multiline />
        </SectionCard>

        {/* GPS */}
        <SectionCard icon="map-pin" title="Lokasi GPS">
          {lat != null ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#22c55e", marginBottom: 10 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" }} />
              <Text style={{ fontSize: 11, color: "#166534", flex: 1 }}>{lat.toFixed(6)}, {lng?.toFixed(6)}</Text>
              <Pressable onPress={() => { setLat(null); setLng(null); }}><Icon name="x" size={14} color={T.error} /></Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: T.surfaceContainerLow, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: T.outlineVariant, marginBottom: 10 }}>
              <Icon name="info" size={13} color={T.outline} />
              <Text style={{ fontSize: 12, color: T.onSurfaceVariant }}>GPS belum diambil</Text>
            </View>
          )}
          <Pressable
            style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: lat != null ? "#22c55e" : T.secondary, paddingVertical: 12, borderRadius: 10, opacity: pressed || loadingGPS ? 0.8 : 1 }]}
            onPress={ambilGPS} disabled={loadingGPS}
          >
            {loadingGPS ? <ActivityIndicator size="small" color={T.onPrimary} /> : <Icon name="map-pin" size={15} color={T.onPrimary} />}
            <Text style={{ fontSize: 14, fontWeight: "700", color: T.onPrimary }}>{loadingGPS ? "Mengambil GPS…" : lat != null ? "Perbarui GPS" : "Ambil Lokasi GPS"}</Text>
          </Pressable>
        </SectionCard>

        {/* Catatan */}
        <SectionCard icon="info" title="Catatan (opsional)">
          <TextInput style={[ui.input, { minHeight: 64, textAlignVertical: "top" }]} value={catatan} onChangeText={setCatatan} placeholder="Catatan tambahan…" placeholderTextColor={T.outline} multiline />
        </SectionCard>

        {/* Simpan */}
        <Pressable
          style={({ pressed }) => [ui.submitBtn, { opacity: pressed || saving ? 0.85 : 1 }]}
          onPress={handleSave} disabled={saving || !selectedRT}
        >
          {saving ? <ActivityIndicator size="small" color={T.onPrimary} /> : <Icon name="check-circle" size={18} color={T.onPrimary} />}
          <Text style={ui.submitBtnText}>{saving ? "Menyimpan…" : "Simpan Bangunan"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
