// ─── SLSScreen — Daftar Wilayah Kerja (SLS = RT) ─────────────────────────────
// Setiap SLS adalah 1 RT — tidak ada sub-level RT terpisah.
// Saat user tambah SLS, otomatis dibuat 1 RT internal dengan nama yang sama.
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Platform,
    Pressable, RefreshControl, ScrollView, Text, TextInput, View
} from "react-native";
import { Icon } from "../components/Icon";
import { T } from "../constants/theme";
import { SLS, deleteSLS, getSLSList, insertSLS, updateSLS } from "../lib/database";
import { ui } from "../styles/ui";

// ─── Helper konfirmasi lintas platform ───────────────────────────────────────
function confirmDelete(nama: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if ((window as any).confirm(`Hapus "${nama}"?\n\nSemua bangunan dan KK di wilayah ini akan ikut terhapus.`)) {
      onConfirm();
    }
  } else {
    Alert.alert(
      "Hapus Wilayah",
      `Hapus "${nama}"?\n\nSemua bangunan dan KK di wilayah ini akan ikut terhapus.`,
      [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: onConfirm },
      ]
    );
  }
}
function FormSLS({ onSaved, onCancel, edit }: {
  onSaved:  () => void;
  onCancel: () => void;
  edit?:    SLS;
}) {
  const [nama,    setNama]    = useState(edit?.nama      ?? "");
  const [kode,    setKode]    = useState(edit?.kode      ?? "");
  const [catatan, setCatatan] = useState(edit?.catatan   ?? "");
  const [saving,  setSaving]  = useState(false);

  async function handleSave() {
    if (!nama.trim()) { Alert.alert("Validasi", "Nama wilayah wajib diisi."); return; }
    if (!kode.trim()) { Alert.alert("Validasi", "Kode SLS wajib diisi (misal: SLS-001)."); return; }
    setSaving(true);
    try {
      if (edit) {
        await updateSLS(edit.id, {
          nama:    nama.trim(),
          kode:    kode.trim(),
          catatan: catatan.trim() || null,
        });
      } else {
        await insertSLS({
          nama:    nama.trim(),
          kode:    kode.trim(),
          catatan: catatan.trim() || undefined,
        });
      }
      onSaved();
    } catch (e: any) {
      Alert.alert("Error", "Gagal menyimpan. Pastikan kode SLS belum dipakai.");
    } finally { setSaving(false); }
  }

  return (
    <View style={{
      backgroundColor: T.white, borderRadius: 14, borderWidth: 1,
      borderColor: T.outlineVariant, padding: 16, gap: 12, marginBottom: 16,
    }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: T.primary }}>
        {edit ? "✏️ Edit Wilayah Kerja" : "➕ Tambah Wilayah Kerja (SLS)"}
      </Text>
      <Text style={{ fontSize: 12, color: T.onSurfaceVariant, marginTop: -6, lineHeight: 18 }}>
        Masukkan nama RT/RW sebagai nama wilayah kerja. Contoh: "RT 001 RW 002"
      </Text>

      <View style={ui.fieldWrap}>
        <Text style={ui.fieldLabel}>Nama Wilayah (RT/RW) *</Text>
        <TextInput
          style={ui.input} value={nama} onChangeText={setNama}
          placeholder="contoh: RT 001 RW 002" placeholderTextColor={T.outline}
        />
      </View>

      <View style={ui.fieldWrap}>
        <Text style={ui.fieldLabel}>Kode SLS *</Text>
        <TextInput
          style={ui.input} value={kode} onChangeText={setKode}
          placeholder="contoh: SLS-001" placeholderTextColor={T.outline}
          autoCapitalize="characters"
        />
      </View>

      <View style={ui.fieldWrap}>
        <Text style={ui.fieldLabel}>Catatan</Text>
        <TextInput
          style={[ui.input, { minHeight: 56, textAlignVertical: "top" }]}
          value={catatan} onChangeText={setCatatan}
          multiline placeholder="opsional…" placeholderTextColor={T.outline}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          style={{ flex: 1, backgroundColor: T.surfaceContainerLow, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: T.outlineVariant }}
          onPress={onCancel}
        >
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
          <Icon name={saving ? "zap" : "check-circle"} size={16} color={T.onPrimary} />
          <Text style={{ fontWeight: "700", color: T.onPrimary }}>
            {saving ? "Menyimpan…" : edit ? "Simpan Perubahan" : "Simpan"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── SLS Card ─────────────────────────────────────────────────────────────────
function SLSCard({ item, onEdit, onDelete }: {
  item:     SLS;
  onEdit:   () => void;
  onDelete: () => void;
}) {
  return (
    <View style={{
      backgroundColor: T.white, borderRadius: 14, borderWidth: 1,
      borderColor: T.outlineVariant, marginBottom: 12, overflow: "hidden",
    }}>
      {/* Info utama */}
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: 5, backgroundColor: T.primary }} />
        <View style={{ flex: 1, padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{
              width: 42, height: 42, borderRadius: 12,
              backgroundColor: T.primaryFixed,
              alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="map-pin" size={20} color={T.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: T.primary }}>{item.nama}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                <View style={{ backgroundColor: T.primaryFixed, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color: T.primary }}>{item.kode}</Text>
                </View>
                {item.kecamatan ? (
                  <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>Kec. {item.kecamatan}</Text>
                ) : null}
              </View>
              {item.catatan ? (
                <Text style={{ fontSize: 11, color: T.onSurfaceVariant, marginTop: 4 }} numberOfLines={1}>
                  {item.catatan}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {/* Baris aksi: Edit & Hapus */}
      <View style={{
        flexDirection: "row", borderTopWidth: 1, borderTopColor: T.outlineVariant,
        backgroundColor: T.surfaceContainerLow,
      }}>
        <Pressable
          style={({ pressed }) => [{
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 6, paddingVertical: 11,
            borderRightWidth: 1, borderRightColor: T.outlineVariant,
            opacity: pressed ? 0.7 : 1,
          }]}
          onPress={onEdit}
          accessibilityLabel={`Edit wilayah ${item.nama}`}
        >
          <Icon name="settings" size={13} color={T.primary} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: T.primary }}>Edit</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [{
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: 6, paddingVertical: 11, opacity: pressed ? 0.7 : 1,
          }]}
          onPress={() => confirmDelete(item.nama, onDelete)}
          accessibilityLabel={`Hapus wilayah ${item.nama}`}
        >
          <Icon name="x" size={13} color={T.error} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: T.error }}>Hapus</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main SLSScreen ───────────────────────────────────────────────────────────
export function SLSScreen({ onBack }: { onBack: () => void }) {
  const [slsList,    setSlsList]    = useState<SLS[]>([]);
  const [showForm,   setShowForm]   = useState(false);
  const [editSLS,    setEditSLS]    = useState<SLS | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const data = await getSLSList();
    setSlsList(data);
    setRefreshing(false);
  }
  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header */}
      <View style={[ui.topNav, { paddingVertical: 10 }]}>
        <Pressable onPress={onBack} style={{ padding: 6 }} accessibilityLabel="Kembali">
          <Icon name="arrow-right" size={20} color={T.onSurfaceVariant} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[ui.topNavBrand, { fontSize: 15 }]}>📋 Wilayah Kerja (SLS)</Text>
          <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>{slsList.length} wilayah terdaftar</Text>
        </View>
        <Pressable
          style={{ backgroundColor: T.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5 }}
          onPress={() => { setEditSLS(null); setShowForm(true); }}
          accessibilityLabel="Tambah wilayah baru"
        >
          <Icon name="zap" size={13} color={T.onPrimary} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: T.onPrimary }}>+ Tambah</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Form tambah / edit */}
        {(showForm || editSLS) && (
          <FormSLS
            edit={editSLS ?? undefined}
            onSaved={() => { setShowForm(false); setEditSLS(null); load(); }}
            onCancel={() => { setShowForm(false); setEditSLS(null); }}
          />
        )}

        {/* Kosong */}
        {slsList.length === 0 && !showForm && !editSLS && (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}>
            <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: T.primaryFixed, alignItems: "center", justifyContent: "center" }}>
              <Icon name="map-pin" size={40} color={T.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: T.onSurface }}>Belum Ada Wilayah</Text>
            <Text style={{ fontSize: 13, color: T.onSurfaceVariant, textAlign: "center", lineHeight: 20 }}>
              Tambahkan wilayah kerja (SLS/RT) untuk mulai menginput bangunan.
            </Text>
            <Pressable
              style={{ backgroundColor: T.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8 }}
              onPress={() => setShowForm(true)}
            >
              <Icon name="zap" size={16} color={T.onPrimary} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: T.onPrimary }}>Tambah Wilayah</Text>
            </Pressable>
          </View>
        )}

        {/* Daftar SLS */}
        {slsList.map((sls) => (
          <SLSCard
            key={sls.id}
            item={sls}
            onEdit={() => { setShowForm(false); setEditSLS(sls); }}
            onDelete={async () => {
              await deleteSLS(sls.id);
              load();
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}
