// ─── DetailBangunanScreen — KK + Foto + Info Bangunan ────────────────────────
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { Icon } from "../components/Icon";
import { SectionCard } from "../components/ui/SectionCard";
import { T } from "../constants/theme";
import {
    Bangunan,
    Foto,
    KK,
    deleteFoto,
    deleteKK,
    getBangunanById,
    getFotoByBangunan,
    getKKByBangunan,
    getRTById,
    getSLSById,
    insertFoto,
    insertKK,
    nextNomorKK,
    updateBangunan,
} from "../lib/database";
import {
    getOrCreateBangunanFolder,
    googleSignIn,
    isConfigured,
    isSignedIn,
    renameBangunanFolder,
    uploadFotoBase64ToDrive,
    uploadToDrive,
} from "../lib/googleDriveSync";
import { ui } from "../styles/ui";

// Lazy-import ImagePicker hanya di native
let ImagePicker: typeof import("expo-image-picker") | null = null;
if (Platform.OS !== "web") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ImagePicker = require("expo-image-picker");
  } catch (_) {}
}

// ─── Form Tambah KK ───────────────────────────────────────────────────────────
function FormKK({ bangunanId, bangunan, onSaved, onCancel }: {
  bangunanId: number;
  bangunan:   Bangunan | null;
  onSaved:    () => void;
  onCancel:   () => void;
}) {
  const [nomorUrut,   setNomorUrut]   = useState("");
  const [nomorHint,   setNomorHint]   = useState("001");
  const [namaKK,      setNamaKK]      = useState("");
  const [namaKepala,  setNamaKepala]  = useState("");
  const [jumlah,      setJumlah]      = useState("1");
  const [catatan,     setCatatan]     = useState("");
  const [saving,      setSaving]      = useState(false);

  useEffect(() => {
    nextNomorKK(bangunanId).then(setNomorHint);
  }, [bangunanId]);

  async function handleSave() {
    if (!namaKK.trim()) { Alert.alert("Validasi", "Nama KK wajib diisi."); return; }
    setSaving(true);
    try {
      const noFinal = nomorUrut.trim() || nomorHint;
      await insertKK({
        bangunan_id:    bangunanId,
        nomor_urut:     noFinal,
        nama_kk:        namaKK.trim(),
        nama_kepala:    namaKepala.trim() || undefined,
        jumlah_anggota: parseInt(jumlah) || 1,
        catatan:        catatan.trim() || undefined,
      });

      // ── Rename folder Drive dengan semua KK terkini ───────────────────
      if (Platform.OS === "web" && isConfigured() && bangunan) {
        try {
          if (!isSignedIn()) await googleSignIn();
          // Ambil semua KK setelah insert (termasuk yang baru)
          const allKK = await getKKByBangunan(bangunanId);
          const namaKKList = allKK.map((k) => `KK_${k.nomor_urut}_${k.nama_kk}`);

          if (bangunan.drive_folder_id) {
            // Folder sudah ada — rename saja
            await renameBangunanFolder({
              bangunanFolderId: bangunan.drive_folder_id,
              nomorUrut:        bangunan.nomor_urut.padStart(3, "0"),
              jenis:            bangunan.jenis,
              namaKKList,
            });
          } else {
            // Folder belum ada (bangunan lama) — buat sekarang
            const rt  = await getRTById(bangunan.rt_id);
            const sls = rt ? await getSLSById(rt.sls_id) : null;
            if (rt && sls) {
              const folderId = await getOrCreateBangunanFolder({
                nomorUrut:  bangunan.nomor_urut.padStart(3, "0"),
                jenis:      bangunan.jenis,
                namaKKList,
                slsKode:    sls.kode,
                namaRT:     rt.nama_rt,
                namaRW:     rt.nama_rw ?? "RW_000",
              });
              await updateBangunan(bangunanId, { drive_folder_id: folderId });
            }
          }
          // Sync JSON backup
          await uploadToDrive();
        } catch (e: any) {
          console.warn("[Drive] Rename/create folder KK gagal:", e.message);
        }
      }

      onSaved();
    } catch { Alert.alert("Error", "Gagal menyimpan KK."); }
    finally { setSaving(false); }
  }

  return (
    <View style={{ backgroundColor: T.white, borderRadius: 14, borderWidth: 1, borderColor: T.outlineVariant, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: T.primary, marginBottom: 4 }}>Form Tambah KK</Text>

      {/* Nomor Urut KK */}
      <View style={ui.fieldWrap}>
        <Text style={ui.fieldLabel}>
          Nomor Urut KK <Text style={{ fontWeight: "400", color: T.onSurfaceVariant }}>(kosong = otomatis: {nomorHint})</Text>
        </Text>
        <TextInput
          style={ui.input}
          value={nomorUrut}
          onChangeText={setNomorUrut}
          placeholder={`otomatis: ${nomorHint}`}
          placeholderTextColor={T.outline}
          keyboardType="numeric"
        />
        {nomorUrut !== "" && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: T.primaryFixed, borderRadius: 8, padding: 8, marginTop: 4 }}>
            <Icon name="check" size={12} color={T.primary} />
            <Text style={{ fontSize: 11, color: T.primary }}>Nomor urut KK: <Text style={{ fontWeight: "700" }}>{nomorUrut}</Text></Text>
          </View>
        )}
      </View>

      {/* Nama KK */}
      <View style={ui.fieldWrap}>
        <Text style={ui.fieldLabel}>Nama KK *</Text>
        <TextInput style={ui.input} value={namaKK} onChangeText={setNamaKK} placeholder="contoh: Keluarga Bapak Slamet" placeholderTextColor={T.outline} />
      </View>
      <View style={ui.fieldWrap}>
        <Text style={ui.fieldLabel}>Nama Kepala Keluarga</Text>
        <TextInput style={ui.input} value={namaKepala} onChangeText={setNamaKepala} placeholder="Nama kepala keluarga" placeholderTextColor={T.outline} />
      </View>
      <View style={ui.fieldWrap}>
        <Text style={ui.fieldLabel}>Jumlah Anggota</Text>
        <TextInput style={ui.input} value={jumlah} onChangeText={setJumlah} keyboardType="numeric" placeholder="1" placeholderTextColor={T.outline} />
      </View>
      <View style={ui.fieldWrap}>
        <Text style={ui.fieldLabel}>Catatan</Text>
        <TextInput style={[ui.input, { minHeight: 60, textAlignVertical: "top" }]} value={catatan} onChangeText={setCatatan} multiline placeholder="opsional…" placeholderTextColor={T.outline} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable style={{ flex: 1, backgroundColor: T.surfaceContainerLow, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: T.outlineVariant }} onPress={onCancel}>
          <Text style={{ fontWeight: "600", color: T.onSurfaceVariant }}>Batal</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [{
            flex: 2, backgroundColor: T.primary, padding: 12, borderRadius: 10,
            alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
            opacity: pressed || saving ? 0.85 : 1,
          }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator size="small" color={T.onPrimary} /> : <Icon name="check-circle" size={16} color={T.onPrimary} />}
          <Text style={{ fontWeight: "700", color: T.onPrimary }}>{saving ? "Menyimpan…" : "Simpan KK"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── KK Card ─────────────────────────────────────────────────────────────────
function KKCard({ item, onDelete }: { item: KK; onDelete: () => void }) {
  return (
    <View style={{
      backgroundColor: T.surfaceContainerLow, borderRadius: 10,
      borderWidth: 1, borderColor: T.outlineVariant, padding: 12, marginBottom: 8,
      flexDirection: "row", alignItems: "center", gap: 10,
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: T.primaryFixed, alignItems: "center", justifyContent: "center",
      }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: T.primary }}>{item.nomor_urut}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: T.onSurface }}>{item.nama_kk}</Text>
        {item.nama_kepala ? <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>{item.nama_kepala}</Text> : null}
        <Text style={{ fontSize: 11, color: T.secondary, marginTop: 2 }}>{item.jumlah_anggota} anggota</Text>
      </View>
      <Pressable
        style={{ padding: 8, backgroundColor: "#ffeaea", borderRadius: 8 }}
        onPress={() => {
          if (Platform.OS === "web") {
            if ((window as any).confirm(`Hapus KK "${item.nama_kk}"?`)) onDelete();
          } else {
            Alert.alert("Hapus KK", `Hapus KK "${item.nama_kk}"?`,
              [{ text: "Batal", style: "cancel" }, { text: "Hapus", style: "destructive", onPress: onDelete }]
            );
          }
        }}
        accessibilityLabel={`Hapus KK ${item.nama_kk}`}
      >
        <Icon name="x" size={14} color={T.error} />
      </Pressable>
    </View>
  );
}

// ─── Foto Card ────────────────────────────────────────────────────────────────
function FotoCard({ item, onDelete }: { item: Foto; onDelete: () => void }) {
  return (
    <View style={{ marginRight: 10, position: "relative" }}>
      <Image
        source={{ uri: item.uri }}
        style={{ width: 90, height: 90, borderRadius: 10, backgroundColor: T.surfaceContainer }}
        resizeMode="cover"
      />
      <Pressable
        style={{
          position: "absolute", top: 4, right: 4,
          backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 10, padding: 4,
        }}
        onPress={() => {
          if (Platform.OS === "web") {
            if ((window as any).confirm("Hapus foto ini?")) onDelete();
          } else {
            Alert.alert("Hapus Foto", "Hapus foto ini?",
              [{ text: "Batal", style: "cancel" }, { text: "Hapus", style: "destructive", onPress: onDelete }]
            );
          }
        }}
        accessibilityLabel="Hapus foto"
      >
        <Icon name="x" size={12} color={T.white} />
      </Pressable>
      {item.keterangan ? (
        <Text style={{ fontSize: 9, color: T.onSurfaceVariant, marginTop: 3, width: 90 }} numberOfLines={1}>
          {item.keterangan}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DetailBangunanScreen({
  bangunanId,
  onBack,
}: {
  bangunanId: number;
  onBack:     () => void;
}) {
  const [bangunan,    setBangunan]    = useState<Bangunan | null>(null);
  const [kkList,      setKKList]      = useState<KK[]>([]);
  const [fotoList,    setFotoList]    = useState<Foto[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showFormKK,  setShowFormKK]  = useState(false);
  const [addingFoto,  setAddingFoto]  = useState(false);

  async function load() {
    try {
      const [b, kk, foto] = await Promise.all([
        getBangunanById(bangunanId),
        getKKByBangunan(bangunanId),
        getFotoByBangunan(bangunanId),
      ]);
      setBangunan(b);
      setKKList(kk);
      setFotoList(foto);
    } catch {
      Alert.alert("Error", "Gagal memuat detail.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);
  const reload = useCallback(() => load(), [bangunanId]);

  async function handleAddFoto(fromCamera: boolean) {
    if (Platform.OS === "web") {
      // Web: pakai input[type=file]
      const uri = await new Promise<string | null>((resolve) => {
        const input = document.createElement("input");
        input.type   = "file";
        input.accept = "image/*";
        if (fromCamera) input.capture = "environment";
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) { resolve(null); return; }
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) ?? null);
          reader.readAsDataURL(file);
        };
        input.click();
      });
      if (!uri) return;
      setAddingFoto(true);
      try {
        let finalUri = uri;
        // Upload ke folder Drive bangunan jika tersedia
        if (isConfigured() && bangunan?.drive_folder_id && uri.startsWith("data:")) {
          try {
            if (!isSignedIn()) await googleSignIn();
            const ext = uri.startsWith("data:image/png") ? "png" : "jpg";
            const ts  = Date.now();
            const cloudUrl = await uploadFotoBase64ToDrive(
              uri, `Foto_${ts}.${ext}`, bangunan.drive_folder_id
            );
            if (cloudUrl) finalUri = cloudUrl;
          } catch (_) {}
        }
        await insertFoto({ bangunan_id: bangunanId, uri: finalUri });
        // Sync JSON backup ke Drive
        if (isConfigured()) {
          try {
            if (!isSignedIn()) await googleSignIn();
            await uploadToDrive();
          } catch (_) {}
        }
        reload();
      } catch { Alert.alert("Error", "Gagal menyimpan foto."); }
      finally { setAddingFoto(false); }
      return;
    }

    if (!ImagePicker) {
      Alert.alert("Tidak Didukung", "Fitur foto hanya tersedia di aplikasi mobile (Android/iOS).");
      return;
    }
    setAddingFoto(true);
    try {
      let result;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Izin Ditolak", "Izin kamera diperlukan.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: "images" as any,
          quality: 0.75,
          allowsEditing: true,
          aspect: [4, 3],
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Izin Ditolak", "Izin galeri diperlukan.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images" as any,
          quality: 0.75,
          allowsEditing: true,
          aspect: [4, 3],
        });
      }
      if (result && !result.canceled && result.assets[0]) {
        await insertFoto({ bangunan_id: bangunanId, uri: result.assets[0].uri });
        reload();
      }
    } catch {
      Alert.alert("Error", "Gagal memproses foto.");
    } finally {
      setAddingFoto(false);
    }
  }

  function showFotoOptions() {
    if (Platform.OS === "web") {
      // Di web langsung buka file picker
      handleAddFoto(false);
      return;
    }
    Alert.alert("Tambah Foto", "Pilih sumber foto:", [
      { text: "Kamera",  onPress: () => handleAddFoto(true)  },
      { text: "Galeri",  onPress: () => handleAddFoto(false) },
      { text: "Batal",   style: "cancel" },
    ]);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  if (!bangunan) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg }}>
        <Text style={{ color: T.error }}>Bangunan tidak ditemukan.</Text>
        <Pressable onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: T.primary }}>← Kembali</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={[ui.topNav, { paddingVertical: 10 }]}>
        <Pressable onPress={onBack} style={{ padding: 6 }} accessibilityLabel="Kembali">
          <Icon name="arrow-right" size={20} color={T.onSurfaceVariant} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[ui.topNavBrand, { fontSize: 15 }]}>
            [{bangunan.nomor_urut}] {bangunan.jenis}
          </Text>
          {bangunan.alamat ? (
            <Text style={{ fontSize: 11, color: T.onSurfaceVariant }} numberOfLines={1}>
              {bangunan.alamat}
            </Text>
          ) : null}
        </View>
        {bangunan.lat != null && (
          <Pressable
            style={{ padding: 8, backgroundColor: "#f0fdf4", borderRadius: 10 }}
            onPress={() => Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${bangunan.lat},${bangunan.lng}&travelmode=walking`
            )}
            accessibilityLabel="Buka rute di Google Maps"
          >
            <Icon name="map-pin" size={18} color="#22c55e" />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>
        {/* Info GPS */}
        {bangunan.lat != null ? (
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 8,
            backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10,
            borderWidth: 1, borderColor: "#22c55e", marginBottom: 14,
          }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e" }} />
            <Text style={{ fontSize: 12, color: "#166534", flex: 1 }}>
              GPS: {bangunan.lat?.toFixed(6)}, {bangunan.lng?.toFixed(6)}
            </Text>
          </View>
        ) : (
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 8,
            backgroundColor: T.surfaceContainerLow, borderRadius: 10, padding: 10,
            borderWidth: 1, borderColor: T.outlineVariant, marginBottom: 14,
          }}>
            <Icon name="info" size={14} color={T.outline} />
            <Text style={{ fontSize: 12, color: T.onSurfaceVariant }}>Belum ada data GPS</Text>
          </View>
        )}

        {/* Catatan bangunan */}
        {bangunan.catatan ? (
          <View style={{
            backgroundColor: T.primaryFixed, borderRadius: 10, padding: 12,
            borderLeftWidth: 3, borderLeftColor: T.primary, marginBottom: 14,
          }}>
            <Text style={{ fontSize: 12, color: T.onSurface }}>{bangunan.catatan}</Text>
          </View>
        ) : null}

        {/* KK Section */}
        <SectionCard icon="user" title={`Kartu Keluarga (${kkList.length} KK)`}>
          {kkList.map((kk) => (
            <KKCard
              key={kk.id}
              item={kk}
              onDelete={async () => {
                await deleteKK(kk.id);
                reload();
              }}
            />
          ))}

          {showFormKK ? (
            <FormKK
              bangunanId={bangunanId}
              bangunan={bangunan}
              onSaved={() => { setShowFormKK(false); reload(); }}
              onCancel={() => setShowFormKK(false)}
            />
          ) : (
            <Pressable
              style={({ pressed }) => [{
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                borderWidth: 1.5, borderColor: T.primary, borderRadius: 10,
                paddingVertical: 12, backgroundColor: T.primaryFixed,
                opacity: pressed ? 0.8 : 1,
              }]}
              onPress={() => setShowFormKK(true)}
              accessibilityLabel="Tambah KK baru"
            >
              <Icon name="user" size={16} color={T.primary} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: T.primary }}>+ Tambah KK</Text>
            </Pressable>
          )}
        </SectionCard>

        {/* Foto Section */}
        <SectionCard icon="copy" title={`Foto (${fotoList.length})`}>
          {fotoList.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {fotoList.map((f) => (
                <FotoCard
                  key={f.id}
                  item={f}
                  onDelete={async () => {
                    await deleteFoto(f.id);
                    reload();
                  }}
                />
              ))}
            </ScrollView>
          )}
          <Pressable
            style={({ pressed }) => [{
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              backgroundColor: addingFoto ? T.surfaceContainerLow : T.secondary,
              paddingVertical: 12, borderRadius: 10,
              opacity: pressed || addingFoto ? 0.8 : 1,
            }]}
            onPress={showFotoOptions}
            disabled={addingFoto}
            accessibilityLabel="Tambah foto"
          >
            {addingFoto ? (
              <ActivityIndicator size="small" color={T.onPrimary} />
            ) : (
              <Icon name="copy" size={16} color={T.onPrimary} />
            )}
            <Text style={{ fontSize: 14, fontWeight: "600", color: T.onPrimary }}>
              {addingFoto ? "Memproses…" : "+ Tambah Foto"}
            </Text>
          </Pressable>
        </SectionCard>

        {/* Metadata */}
        <View style={[ui.footer, { marginTop: 8 }]}>
          <Text style={ui.footerText}>Dibuat: {bangunan.created_at}</Text>
          <Text style={ui.footerText}>ID Bangunan: #{bangunan.id}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
