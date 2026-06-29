// ─── FormBangunanScreen — Tambah Bangunan Lengkap ────────────────────────────
import { useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, Image, KeyboardAvoidingView,
    Platform, Pressable, ScrollView, Text, TextInput, View,
} from "react-native";
import { Icon } from "../components/Icon";
import { SectionCard } from "../components/ui/SectionCard";
import { T } from "../constants/theme";
import {
    RT, SLS,
    getRTBySLS, getSLSList,
    insertBangunan, insertFoto, insertKK, nextNomorBangunan,
} from "../lib/database";
import {
    googleSignIn, isConfigured, isSignedIn,
    uploadFotoBase64ToDrive, uploadToDrive,
} from "../lib/googleDriveSync";
import { ui } from "../styles/ui";

// ── Lazy-import native-only ───────────────────────────────────────────────────
let Location: typeof import("expo-location") | null = null;
let ImagePicker: typeof import("expo-image-picker") | null = null;
if (Platform.OS !== "web") {
  try { Location    = require("expo-location"); }    catch (_) {}
  try { ImagePicker = require("expo-image-picker"); } catch (_) {}
}

const JENIS_LIST = ["Rumah", "Kos", "Mushola", "Gudang", "Toko", "Kosong"];
const JENIS_COLOR: Record<string, string> = {
  "Rumah": T.primary, "Kos": "#f59e0b", "Mushola": "#22c55e",
  "Gudang": "#8b5cf6", "Toko": "#ef4444", "Kosong": T.outline,
};

// ─── Preview Foto ─────────────────────────────────────────────────────────────
function FotoInput({ label, uri, onPick, onClear }: {
  label: string; uri: string | null; onPick: () => void; onClear: () => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[ui.fieldLabel, { marginBottom: 6 }]}>{label}</Text>
      {uri ? (
        <View style={{ borderRadius: 10, overflow: "hidden", borderWidth: 1.5, borderColor: "#22c55e" }}>
          <Image source={{ uri }} style={{ width: "100%", height: 130, resizeMode: "cover" }} />
          <Pressable
            style={{ position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 14, padding: 4 }}
            onPress={onClear}
            accessibilityLabel="Hapus foto"
          >
            <Icon name="x" size={14} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [{
            height: 110, borderRadius: 10, borderWidth: 1.5,
            borderStyle: "dashed" as any,
            borderColor: T.outlineVariant, backgroundColor: T.surfaceContainerLow,
            alignItems: "center", justifyContent: "center", gap: 6,
            opacity: pressed ? 0.75 : 1,
          }]}
          onPress={onPick}
          accessibilityLabel={`Pilih ${label}`}
        >
          {/* Ikon kamera/gambar */}
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: T.primaryFixed, alignItems: "center", justifyContent: "center" }}>
            <Icon name="copy" size={20} color={T.primary} />
          </View>
          <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>Tap untuk pilih foto</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Ambil foto ───────────────────────────────────────────────────────────────
async function pickImage(): Promise<string | null> {
  if (Platform.OS === "web") {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type   = "file";
      input.accept = "image/*";
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) ?? null);
        reader.readAsDataURL(file);
      };
      input.click();
    });
  }
  if (!ImagePicker) return null;
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") { Alert.alert("Izin Ditolak", "Izin galeri diperlukan."); return null; }
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.75 });
  if (res.canceled) return null;
  return res.assets[0]?.uri ?? null;
}

// ─── Ambil GPS ────────────────────────────────────────────────────────────────
async function getGPSLocation(): Promise<{ lat: number; lng: number } | null> {
  if (Platform.OS === "web") {
    if (!("geolocation" in navigator)) {
      Alert.alert("Tidak Didukung", "Browser Anda tidak mendukung GPS.\nIsi Latitude & Longitude secara manual.");
      return null;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          Alert.alert(
            err.code === 1 ? "Izin Lokasi Ditolak" : "GPS Error",
            err.code === 1
              ? "Izinkan akses lokasi di browser, atau isi Latitude & Longitude secara manual."
              : "Gagal ambil lokasi: " + err.message
          );
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }
  if (!Location) return null;
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") { Alert.alert("Izin Ditolak", "Izin lokasi diperlukan."); return null; }
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { lat: loc.coords.latitude, lng: loc.coords.longitude };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function FormBangunanScreen({ defaultRtId, onSave, onCancel }: {
  defaultRtId?: number; onSave: () => void; onCancel: () => void;
}) {
  const [slsList,     setSlsList]     = useState<SLS[]>([]);
  const [rtList,      setRTList]      = useState<RT[]>([]);
  const [selectedSLS, setSelectedSLS] = useState<SLS | null>(null);
  const [selectedRT,  setSelectedRT]  = useState<RT | null>(null);

  const [namaPenghuni, setNamaPenghuni] = useState("");
  const [noKK,         setNoKK]         = useState("");
  const [nomorUrut,    setNomorUrut]    = useState("");
  const [nomorHint,    setNomorHint]    = useState("otomatis");
  const [jenis,        setJenis]        = useState("Rumah");
  const [alamat,       setAlamat]       = useState("");
  const [lat,          setLat]          = useState("");
  const [lng,          setLng]          = useState("");
  const [loadingGPS,   setLoadingGPS]   = useState(false);
  const [fotoDepan,    setFotoDepan]    = useState<string | null>(null);
  const [fotoDalam,    setFotoDalam]    = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState<string | null>(null);

  const gpsValid = lat.trim() !== "" && lng.trim() !== "" &&
    !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));

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
    setNomorUrut("");
  }

  async function ambilGPS() {
    setLoadingGPS(true);
    try {
      const pos = await getGPSLocation();
      if (pos) { setLat(pos.lat.toFixed(7)); setLng(pos.lng.toFixed(7)); }
    } finally { setLoadingGPS(false); }
  }

  async function handleSave() {
    if (!selectedRT)          { Alert.alert("Validasi", "Pilih RT terlebih dahulu."); return; }
    if (!namaPenghuni.trim()) { Alert.alert("Validasi", "Nama penghuni wajib diisi."); return; }
    setSaving(true);
    try {
      setSaveMsg("Menyimpan data bangunan…");
      const bangunanId = await insertBangunan({
        rt_id:      selectedRT.id,
        nomor_urut: nomorUrut.trim() || undefined,
        jenis,
        alamat:     alamat.trim() || undefined,
        lat:        gpsValid ? parseFloat(lat) : undefined,
        lng:        gpsValid ? parseFloat(lng) : undefined,
        catatan:    namaPenghuni.trim(),
      });

      setSaveMsg("Menyimpan KK…");
      await insertKK({ bangunan_id: bangunanId, nomor_urut: noKK.trim() || undefined, nama_kk: namaPenghuni.trim() });

      const fotoSlots = [
        { uri: fotoDepan, ket: "Foto Depan" },
        { uri: fotoDalam, ket: "Foto Dalam" },
      ].filter((f) => f.uri !== null) as { uri: string; ket: string }[];

      for (const { uri, ket } of fotoSlots) {
        setSaveMsg(`Menyimpan ${ket}…`);
        if (Platform.OS === "web" && isConfigured() && uri.startsWith("data:")) {
          setSaveMsg(`Upload ${ket} ke Drive…`);
          if (!isSignedIn()) await googleSignIn();
          const nama = `${ket.replace(" ", "_")}_B${bangunanId}_${Date.now()}.jpg`;
          const cloudUrl = await uploadFotoBase64ToDrive(uri, nama);
          if (cloudUrl) console.log(`${ket} → ${cloudUrl}`);
        }
        await insertFoto({ bangunan_id: bangunanId, uri, keterangan: ket });
      }

      if (Platform.OS === "web" && isConfigured()) {
        setSaveMsg("Menyimpan ke Google Drive…");
        try {
          if (!isSignedIn()) await googleSignIn();
          await uploadToDrive();
        } catch (e: any) { console.warn("Drive sync gagal:", e.message); }
      }

      onSave();
    } catch (e: any) {
      Alert.alert("Error", "Gagal menyimpan: " + (e?.message ?? String(e)));
    } finally { setSaving(false); setSaveMsg(null); }
  }

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[ui.topNav, { paddingVertical: 10 }]}>
        <Pressable onPress={onCancel} style={{ padding: 6 }} accessibilityLabel="Kembali">
          <Icon name="arrow-right" size={20} color={T.onSurfaceVariant} />
        </Pressable>
        <Text style={[ui.topNavBrand, { fontSize: 15 }]}>Tambah Bangunan</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

        {/* SLS */}
        <SectionCard icon="database" title="Wilayah Kerja (SLS) *">
          {slsList.length === 0 ? (
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: T.surfaceContainerLow, borderRadius: 10, padding: 12 }}>
              <Icon name="info" size={14} color={T.error} />
              <Text style={{ fontSize: 13, color: T.error, flex: 1 }}>Belum ada SLS. Buat di tab Data Lapangan → Wilayah Kerja.</Text>
            </View>
          ) : slsList.map((sls) => {
            const active = selectedSLS?.id === sls.id;
            return (
              <Pressable key={sls.id}
                style={({ pressed }) => [{ padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: active ? T.primary : T.outlineVariant, backgroundColor: active ? T.primaryFixed : T.white, opacity: pressed ? 0.8 : 1, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }]}
                onPress={() => handleSelectSLS(sls)}
              >
                <Icon name="database" size={16} color={active ? T.primary : T.onSurfaceVariant} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: active ? "700" : "500", color: active ? T.primary : T.onSurface }}>{sls.nama}</Text>
                  <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>{sls.kode} · {sls.kecamatan}</Text>
                </View>
                {active && <Icon name="check" size={16} color={T.primary} />}
              </Pressable>
            );
          })}
        </SectionCard>

        {/* RT */}
        {selectedSLS && (
          <SectionCard icon="map-pin" title={`RT dalam ${selectedSLS.nama} *`}>
            {rtList.length === 0 ? (
              <Text style={{ fontSize: 13, color: T.onSurfaceVariant }}>Belum ada RT. Tambah dari menu Wilayah Kerja.</Text>
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

        {/* Identitas */}
        <SectionCard icon="home" title="Identitas Penghuni *">
          <View style={ui.fieldWrap}>
            <Text style={ui.fieldLabel}>Nama Penghuni / KK *</Text>
            <TextInput style={ui.input} value={namaPenghuni} onChangeText={setNamaPenghuni}
              placeholder="contoh: Budi Santoso" placeholderTextColor={T.outline} />
          </View>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={[ui.fieldWrap, { flex: 1 }]}>
              <Text style={ui.fieldLabel}>No. KK</Text>
              <TextInput style={ui.input} value={noKK} onChangeText={setNoKK}
                placeholder="001" placeholderTextColor={T.outline} keyboardType="numeric" />
            </View>
            <View style={[ui.fieldWrap, { flex: 1 }]}>
              <Text style={ui.fieldLabel}>No. Bangunan <Text style={{ fontWeight: "400", color: T.onSurfaceVariant }}>(auto: {nomorHint})</Text></Text>
              <TextInput style={ui.input} value={nomorUrut} onChangeText={setNomorUrut}
                placeholder={nomorHint} placeholderTextColor={T.outline} keyboardType="numeric" />
            </View>
          </View>
        </SectionCard>

        {/* Jenis */}
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
          <TextInput style={[ui.input, { minHeight: 52, textAlignVertical: "top" }]}
            value={alamat} onChangeText={setAlamat}
            placeholder="contoh: Jl. Merdeka No. 12" placeholderTextColor={T.outline} multiline />
        </SectionCard>

        {/* GPS */}
        <SectionCard icon="map-pin" title="Lokasi GPS">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8,
            backgroundColor: gpsValid ? "#f0fdf4" : T.surfaceContainerLow,
            borderRadius: 10, padding: 10, borderWidth: 1,
            borderColor: gpsValid ? "#22c55e" : T.outlineVariant, marginBottom: 10 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: gpsValid ? "#22c55e" : T.outline }} />
            <Text style={{ fontSize: 11, color: gpsValid ? "#166534" : T.onSurfaceVariant, flex: 1 }}>
              {gpsValid ? `✅ Lat: ${parseFloat(lat).toFixed(6)} | Lng: ${parseFloat(lng).toFixed(6)}` : "Belum ada GPS — isi manual atau tap 📍"}
            </Text>
            {gpsValid && <Pressable onPress={() => { setLat(""); setLng(""); }}><Icon name="x" size={14} color={T.error} /></Pressable>}
          </View>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
            <View style={[ui.fieldWrap, { flex: 1 }]}>
              <Text style={ui.fieldLabel}>Latitude</Text>
              <TextInput style={ui.input} value={lat} onChangeText={setLat}
                placeholder="-7.1167000" placeholderTextColor={T.outline} keyboardType="decimal-pad"
                onFocus={async () => {
                  if (!lat && !loadingGPS) {
                    setLoadingGPS(true);
                    try { const p = await getGPSLocation(); if (p) { setLat(p.lat.toFixed(7)); setLng(p.lng.toFixed(7)); } }
                    finally { setLoadingGPS(false); }
                  }
                }}
              />
            </View>
            <View style={[ui.fieldWrap, { flex: 1 }]}>
              <Text style={ui.fieldLabel}>Longitude</Text>
              <TextInput style={ui.input} value={lng} onChangeText={setLng}
                placeholder="111.8833000" placeholderTextColor={T.outline} keyboardType="decimal-pad" />
            </View>
            <Pressable
              style={({ pressed }) => [{ width: 46, height: 46, borderRadius: 10, marginBottom: 2, backgroundColor: gpsValid ? "#22c55e" : T.secondary, alignItems: "center", justifyContent: "center", opacity: pressed || loadingGPS ? 0.75 : 1 }]}
              onPress={ambilGPS} disabled={loadingGPS} accessibilityLabel="Ambil GPS otomatis"
            >
              {loadingGPS ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="map-pin" size={20} color="#fff" />}
            </Pressable>
          </View>
          <Text style={{ fontSize: 10, color: T.onSurfaceVariant, marginTop: 4 }}>
            Tap field Latitude untuk ambil otomatis, isi manual, atau tap 📍
          </Text>
        </SectionCard>

        {/* Foto */}
        <SectionCard icon="copy" title="Foto Bangunan">
          <View style={{ flexDirection: "row", gap: 12 }}>
            <FotoInput label="📷 Foto Depan" uri={fotoDepan}
              onPick={() => pickImage().then((u) => u && setFotoDepan(u))}
              onClear={() => setFotoDepan(null)} />
            <FotoInput label="🏠 Foto Dalam" uri={fotoDalam}
              onPick={() => pickImage().then((u) => u && setFotoDalam(u))}
              onClear={() => setFotoDalam(null)} />
          </View>
          {Platform.OS === "web" && isConfigured() && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f0f4ff", borderRadius: 8, padding: 8, marginTop: 10 }}>
              <Icon name="database" size={12} color={T.primary} />
              <Text style={{ fontSize: 10, color: T.primary }}>Foto & data otomatis tersimpan ke Google Drive</Text>
            </View>
          )}
        </SectionCard>

        {saveMsg && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: T.primaryFixed, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <ActivityIndicator size="small" color={T.primary} />
            <Text style={{ fontSize: 13, color: T.primary, flex: 1 }}>{saveMsg}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [ui.submitBtn, { opacity: pressed || saving ? 0.85 : 1 }]}
          onPress={handleSave} disabled={saving || !selectedRT}
        >
          {saving ? <ActivityIndicator size="small" color={T.onPrimary} /> : <Icon name="check-circle" size={18} color={T.onPrimary} />}
          <Text style={ui.submitBtnText}>{saving ? "Menyimpan…" : "Simpan Bangunan"}</Text>
        </Pressable>

        {gpsValid && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f0fdf4", borderRadius: 8, padding: 10, marginTop: 8 }}>
            <Icon name="map-pin" size={13} color="#22c55e" />
            <Text style={{ fontSize: 11, color: "#166534" }}>Marker akan muncul di Peta dengan nama & nomor bangunan</Text>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
