// ─── SLSScreen — Daftar Wilayah Kerja (SLS) + RT ─────────────────────────────
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Pressable, RefreshControl, ScrollView, Text, TextInput, View
} from "react-native";
import { Icon } from "../components/Icon";
import { T } from "../constants/theme";
import {
    RT, SLS,
    deleteRT, deleteSLS,
    getRTBySLS, getSLSList,
    insertRT, insertSLS, updateSLS,
} from "../lib/database";
import { ui } from "../styles/ui";

// ─── Form SLS ─────────────────────────────────────────────────────────────────
function FormSLS({ onSaved, onCancel, edit }: {
  onSaved:  () => void;
  onCancel: () => void;
  edit?:    SLS;
}) {
  const [nama,      setNama]      = useState(edit?.nama ?? "");
  const [kode,      setKode]      = useState(edit?.kode ?? "");
  const [kecamatan, setKecamatan] = useState(edit?.kecamatan ?? "Sumberharjo");
  const [kabupaten, setKabupaten] = useState(edit?.kabupaten ?? "Bojonegoro");
  const [catatan,   setCatatan]   = useState(edit?.catatan ?? "");
  const [saving,    setSaving]    = useState(false);

  async function handleSave() {
    if (!nama.trim()) { Alert.alert("Validasi", "Nama SLS wajib diisi."); return; }
    if (!kode.trim()) { Alert.alert("Validasi", "Kode SLS wajib diisi."); return; }
    setSaving(true);
    try {
      if (edit) {
        await updateSLS(edit.id, { nama: nama.trim(), kode: kode.trim(), kecamatan: kecamatan.trim() || null, kabupaten: kabupaten.trim() || null, catatan: catatan.trim() || null });
      } else {
        await insertSLS({ nama: nama.trim(), kode: kode.trim(), kecamatan: kecamatan.trim() || undefined, kabupaten: kabupaten.trim() || undefined, catatan: catatan.trim() || undefined });
      }
      onSaved();
    } catch (e: any) {
      Alert.alert("Error", e?.message?.includes("UNIQUE") ? "Kode SLS sudah digunakan." : "Gagal menyimpan.");
    } finally { setSaving(false); }
  }

  return (
    <View style={{ backgroundColor: T.white, borderRadius: 14, borderWidth: 1, borderColor: T.outlineVariant, padding: 16, gap: 12, marginBottom: 16 }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: T.primary }}>{edit ? "Edit Wilayah Kerja" : "Tambah Wilayah Kerja (SLS)"}</Text>
      {[
        { label: "Nama SLS *", val: nama,       set: setNama,       ph: "contoh: Desa Sumberharjo" },
        { label: "Kode SLS *", val: kode,       set: setKode,       ph: "contoh: SLS-001" },
        { label: "Kecamatan",  val: kecamatan,  set: setKecamatan,  ph: "Sumberharjo" },
        { label: "Kabupaten",  val: kabupaten,  set: setKabupaten,  ph: "Bojonegoro" },
      ].map((f) => (
        <View key={f.label} style={ui.fieldWrap}>
          <Text style={ui.fieldLabel}>{f.label}</Text>
          <TextInput style={ui.input} value={f.val} onChangeText={f.set} placeholder={f.ph} placeholderTextColor={T.outline} />
        </View>
      ))}
      <View style={ui.fieldWrap}>
        <Text style={ui.fieldLabel}>Catatan</Text>
        <TextInput style={[ui.input, { minHeight: 56, textAlignVertical: "top" }]} value={catatan} onChangeText={setCatatan} multiline placeholder="opsional…" placeholderTextColor={T.outline} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable style={{ flex: 1, backgroundColor: T.surfaceContainerLow, padding: 12, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: T.outlineVariant }} onPress={onCancel}>
          <Text style={{ fontWeight: "600", color: T.onSurfaceVariant }}>Batal</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [{ flex: 2, backgroundColor: T.primary, padding: 12, borderRadius: 10, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: pressed || saving ? 0.85 : 1 }]}
          onPress={handleSave} disabled={saving}
        >
          <Icon name={saving ? "zap" : "check-circle"} size={16} color={T.onPrimary} />
          <Text style={{ fontWeight: "700", color: T.onPrimary }}>{saving ? "Menyimpan…" : "Simpan"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Form RT ──────────────────────────────────────────────────────────────────
function FormRT({ slsId, onSaved, onCancel }: {
  slsId:    number;
  onSaved:  () => void;
  onCancel: () => void;
}) {
  const [namaRT,   setNamaRT]   = useState("");
  const [namaRW,   setNamaRW]   = useState("");
  const [ketuaRT,  setKetuaRT]  = useState("");
  const [catatan,  setCatatan]  = useState("");
  const [saving,   setSaving]   = useState(false);

  async function handleSave() {
    if (!namaRT.trim()) { Alert.alert("Validasi", "Nama RT wajib diisi."); return; }
    setSaving(true);
    try {
      await insertRT({ sls_id: slsId, nama_rt: namaRT.trim(), nama_rw: namaRW.trim() || undefined, ketua_rt: ketuaRT.trim() || undefined, catatan: catatan.trim() || undefined });
      onSaved();
    } catch { Alert.alert("Error", "Gagal menyimpan RT."); }
    finally { setSaving(false); }
  }

  return (
    <View style={{ backgroundColor: T.surfaceContainerLow, borderRadius: 12, borderWidth: 1, borderColor: T.outlineVariant, padding: 14, gap: 10, marginBottom: 8 }}>
      <Text style={{ fontSize: 13, fontWeight: "700", color: T.secondary }}>Tambah RT Baru</Text>
      {[
        { label: "Nama RT *", val: namaRT,   set: setNamaRT,  ph: "contoh: RT 04" },
        { label: "RW",        val: namaRW,   set: setNamaRW,  ph: "contoh: RW 02" },
        { label: "Ketua RT",  val: ketuaRT,  set: setKetuaRT, ph: "Nama ketua RT" },
      ].map((f) => (
        <View key={f.label} style={ui.fieldWrap}>
          <Text style={ui.fieldLabel}>{f.label}</Text>
          <TextInput style={ui.input} value={f.val} onChangeText={f.set} placeholder={f.ph} placeholderTextColor={T.outline} />
        </View>
      ))}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable style={{ flex: 1, backgroundColor: T.white, padding: 10, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: T.outlineVariant }} onPress={onCancel}>
          <Text style={{ fontWeight: "600", color: T.onSurfaceVariant, fontSize: 13 }}>Batal</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [{ flex: 2, backgroundColor: T.secondary, padding: 10, borderRadius: 8, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, opacity: pressed || saving ? 0.85 : 1 }]}
          onPress={handleSave} disabled={saving}
        >
          <Icon name="check-circle" size={14} color={T.onPrimary} />
          <Text style={{ fontWeight: "700", color: T.onPrimary, fontSize: 13 }}>{saving ? "Simpan…" : "Simpan RT"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── RT Card ──────────────────────────────────────────────────────────────────
function RTCard({ item, onPress, onDelete }: { item: RT; onPress: () => void; onDelete: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [{
        backgroundColor: T.white, borderRadius: 12, borderWidth: 1,
        borderColor: T.outlineVariant, marginBottom: 8, overflow: "hidden",
        opacity: pressed ? 0.85 : 1,
      }]}
      onPress={onPress}
      onLongPress={() => Alert.alert("Hapus RT", `Hapus "${item.nama_rt}"?\nSemua bangunan & KK akan terhapus.`, [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: onDelete },
      ])}
    >
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: 4, backgroundColor: T.secondary }} />
        <View style={{ flex: 1, padding: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: T.secondaryContainer, alignItems: "center", justifyContent: "center" }}>
              <Icon name="map-pin" size={16} color={T.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: T.onSurface }}>{item.nama_rt}</Text>
              {item.nama_rw ? <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>{item.nama_rw}</Text> : null}
              {item.ketua_rt ? <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>Ketua: {item.ketua_rt}</Text> : null}
            </View>
            <View style={{ alignItems: "flex-end", gap: 3 }}>
              <View style={{ backgroundColor: T.primaryFixed, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: T.primary }}>{(item.jumlah_bangunan ?? 0).toLocaleString("id-ID")} bangunan</Text>
              </View>
              <View style={{ backgroundColor: T.secondaryContainer, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 11, color: T.secondary }}>{(item.jumlah_kk ?? 0).toLocaleString("id-ID")} KK</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── SLS Card ─────────────────────────────────────────────────────────────────
function SLSCard({ item, onPress, onDelete }: { item: SLS; onPress: () => void; onDelete: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [{
        backgroundColor: T.white, borderRadius: 14, borderWidth: 1,
        borderColor: T.outlineVariant, marginBottom: 12, overflow: "hidden",
        opacity: pressed ? 0.9 : 1,
      }]}
      onPress={onPress}
      onLongPress={() => Alert.alert("Hapus SLS", `Hapus "${item.nama}"?\nSemua RT, Bangunan, KK akan terhapus.`, [
        { text: "Batal", style: "cancel" },
        { text: "Hapus", style: "destructive", onPress: onDelete },
      ])}
    >
      <View style={{ flexDirection: "row" }}>
        <View style={{ width: 5, backgroundColor: T.primary }} />
        <View style={{ flex: 1, padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: T.primaryFixed, alignItems: "center", justifyContent: "center" }}>
              <Icon name="database" size={20} color={T.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: T.primary }}>{item.nama}</Text>
              <Text style={{ fontSize: 11, color: T.onSurfaceVariant, marginTop: 1 }}>Kode: {item.kode}</Text>
              {item.kecamatan ? <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>Kec. {item.kecamatan} · {item.kabupaten}</Text> : null}
            </View>
            <Icon name="arrow-right" size={16} color={T.onSurfaceVariant} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Detail SLS: daftar RT ────────────────────────────────────────────────────
function DetailSLS({ sls, onBack, onPilihRT }: {
  sls:       SLS;
  onBack:    () => void;
  onPilihRT: (rt: RT) => void;
}) {
  const [rtList,      setRTList]      = useState<RT[]>([]);
  const [showFormRT,  setShowFormRT]  = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  async function load() {
    const data = await getRTBySLS(sls.id);
    setRTList(data);
    setRefreshing(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={[ui.topNav, { paddingVertical: 10 }]}>
        <Pressable onPress={onBack} style={{ padding: 6 }}>
          <Icon name="arrow-right" size={20} color={T.onSurfaceVariant} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[ui.topNavBrand, { fontSize: 15 }]}>{sls.nama}</Text>
          <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>Kode: {sls.kode}</Text>
        </View>
        <Pressable
          style={{ backgroundColor: T.secondary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5 }}
          onPress={() => setShowFormRT(true)}
        >
          <Icon name="zap" size={13} color={T.onPrimary} />
          <Text style={{ fontSize: 12, fontWeight: "700", color: T.onPrimary }}>+ RT</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {showFormRT && (
          <FormRT
            slsId={sls.id}
            onSaved={() => { setShowFormRT(false); load(); }}
            onCancel={() => setShowFormRT(false)}
          />
        )}

        {rtList.length === 0 && !showFormRT ? (
          <View style={{ alignItems: "center", paddingVertical: 48, gap: 12 }}>
            <Icon name="map-pin" size={40} color={T.primaryFixed} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: T.onSurface }}>Belum Ada RT</Text>
            <Text style={{ fontSize: 13, color: T.onSurfaceVariant, textAlign: "center" }}>
              Tap "+ RT" untuk menambahkan RT dalam wilayah kerja ini.
            </Text>
          </View>
        ) : rtList.map((rt) => (
          <RTCard
            key={rt.id}
            item={rt}
            onPress={() => onPilihRT(rt)}
            onDelete={async () => { await deleteRT(rt.id); load(); }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Main SLSScreen ───────────────────────────────────────────────────────────
export function SLSScreen({ onPilihRT }: {
  onPilihRT: (rt: RT, sls: SLS) => void;
}) {
  const [slsList,    setSlsList]    = useState<SLS[]>([]);
  const [activeSLS,  setActiveSLS]  = useState<SLS | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const data = await getSLSList();
    setSlsList(data);
    setRefreshing(false);
  }
  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  // Tampilkan detail RT dari SLS terpilih
  if (activeSLS) {
    return (
      <DetailSLS
        sls={activeSLS}
        onBack={() => { setActiveSLS(null); load(); }}
        onPilihRT={(rt) => onPilihRT(rt, activeSLS)}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={[ui.topNav, { paddingVertical: 10 }]}>
        <View>
          <Text style={[ui.topNavBrand, { fontSize: 15 }]}>📋 Wilayah Kerja (SLS)</Text>
          <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>SE2026 Sumberharjo</Text>
        </View>
        <Pressable
          style={{ backgroundColor: T.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5 }}
          onPress={() => setShowForm(true)}
        >
          <Icon name="zap" size={13} color={T.onPrimary} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: T.onPrimary }}>+ SLS</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {showForm && (
          <FormSLS
            onSaved={() => { setShowForm(false); load(); }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {slsList.length === 0 && !showForm ? (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}>
            <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: T.primaryFixed, alignItems: "center", justifyContent: "center" }}>
              <Icon name="database" size={40} color={T.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: T.onSurface }}>Belum Ada Wilayah Kerja</Text>
            <Text style={{ fontSize: 13, color: T.onSurfaceVariant, textAlign: "center", lineHeight: 20 }}>
              Tambahkan SLS (Satuan Lingkungan Setempat) sebagai wilayah kerja sensus.
            </Text>
            <Pressable
              style={{ backgroundColor: T.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8 }}
              onPress={() => setShowForm(true)}
            >
              <Icon name="zap" size={16} color={T.onPrimary} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: T.onPrimary }}>Tambah Wilayah Kerja</Text>
            </Pressable>
          </View>
        ) : slsList.map((sls) => (
          <SLSCard
            key={sls.id}
            item={sls}
            onPress={() => setActiveSLS(sls)}
            onDelete={async () => { await deleteSLS(sls.id); load(); }}
          />
        ))}
      </ScrollView>
    </View>
  );
}
