// ─── DataLapanganScreen — daftar bangunan SE2026 ─────────────────────────────
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator, Alert, FlatList,
    Pressable, RefreshControl, Text, TextInput, View,
} from "react-native";
import { Icon } from "../components/Icon";
import { T } from "../constants/theme";
import { Bangunan, deleteBangunan, getBangunanList, getStats } from "../lib/database";
import { ui } from "../styles/ui";

const JENIS_ICON: Record<string, string> = {
  "Rumah": "home", "Kos": "package", "Mushola": "check-circle",
  "Gudang": "database", "Toko": "zap", "Kosong": "x",
};
const JENIS_COLOR: Record<string, string> = {
  "Rumah": T.primary, "Kos": "#f59e0b", "Mushola": "#22c55e",
  "Gudang": "#8b5cf6", "Toko": "#ef4444", "Kosong": T.outline,
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }: {
  icon: string; label: string; value: number; color?: string;
}) {
  return (
    <View style={{
      flex: 1, backgroundColor: T.white, borderRadius: 12,
      borderWidth: 1, borderColor: T.outlineVariant,
      padding: 10, alignItems: "center", gap: 3,
    }}>
      <Icon name={icon} size={18} color={color ?? T.primary} />
      <Text style={{ fontSize: 18, fontWeight: "700", color: color ?? T.primary }}>{value}</Text>
      <Text style={{ fontSize: 9, color: T.onSurfaceVariant, textAlign: "center", lineHeight: 13 }}>{label}</Text>
    </View>
  );
}

// ─── Bangunan Card ────────────────────────────────────────────────────────────
function BangunanCard({ item, onPress, onDelete }: {
  item:     Bangunan;
  onPress:  () => void;
  onDelete: () => void;
}) {
  const color  = JENIS_COLOR[item.jenis] ?? T.outline;
  const icon   = JENIS_ICON[item.jenis]  ?? "home";
  const hasGPS = item.lat != null;

  return (
    <Pressable
      style={({ pressed }) => [{
        backgroundColor: T.white, borderRadius: 14,
        borderWidth: 1, borderColor: T.outlineVariant,
        marginBottom: 10, overflow: "hidden",
        opacity: pressed ? 0.9 : 1,
      }]}
      onPress={onPress}
      onLongPress={() => Alert.alert(
        "Hapus Bangunan",
        `Hapus [${item.nomor_urut}] ${item.jenis}?\nSemua KK & foto terkait akan ikut terhapus.`,
        [{ text: "Batal", style: "cancel" }, { text: "Hapus", style: "destructive", onPress: onDelete }]
      )}
    >
      <View style={{ flexDirection: "row" }}>
        {/* stripe kiri warna jenis */}
        <View style={{ width: 5, backgroundColor: color }} />
        <View style={{ flex: 1, padding: 12 }}>
          {/* Baris atas: ikon + info + stats */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: color + "20", alignItems: "center", justifyContent: "center" }}>
              <Icon name={icon} size={17} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: T.onSurface }}>
                  No. {item.nomor_urut}
                </Text>
                <View style={{ backgroundColor: color + "18", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "600", color }}>{item.jenis}</Text>
                </View>
              </View>
              {/* SLS + RT badge */}
              {(item.nama_rt || item.nama_sls) && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                  {item.nama_sls && (
                    <View style={{ backgroundColor: T.primaryFixed, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                      <Text style={{ fontSize: 10, color: T.primary, fontWeight: "600" }}>{item.nama_sls}</Text>
                    </View>
                  )}
                  {item.nama_rt && (
                    <View style={{ backgroundColor: T.secondaryContainer, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                      <Text style={{ fontSize: 10, color: T.secondary, fontWeight: "600" }}>{item.nama_rt}</Text>
                    </View>
                  )}
                </View>
              )}
              {item.alamat ? (
                <Text style={{ fontSize: 11, color: T.onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>
                  📍 {item.alamat}
                </Text>
              ) : null}
            </View>
            {/* kanan: KK + GPS */}
            <View style={{ alignItems: "flex-end", gap: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: T.primary }}>
                {item.jumlah_kk ?? 0} KK
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: hasGPS ? "#22c55e" : T.outlineVariant }} />
                <Text style={{ fontSize: 10, color: T.onSurfaceVariant }}>{hasGPS ? "GPS" : "–"}</Text>
              </View>
            </View>
          </View>
          {/* Catatan */}
          {item.catatan ? (
            <Text style={{ fontSize: 11, color: T.onSurfaceVariant, marginTop: 8, backgroundColor: T.surfaceContainerLow, borderRadius: 6, padding: 6 }} numberOfLines={2}>
              {item.catatan}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DataLapanganScreen({
  onTambahBangunan,
  onDetailBangunan,
  onKelolaSLS,
}: {
  onTambahBangunan: () => void;
  onDetailBangunan: (id: number) => void;
  onKelolaSLS:      () => void;
}) {
  const [buildings,  setBuildings]  = useState<Bangunan[]>([]);
  const [stats,      setStats]      = useState({
    totalSLS: 0, totalRT: 0, totalBangunan: 0,
    totalKK: 0, totalFoto: 0, bangunanBerGPS: 0,
  });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState("");

  async function load() {
    try {
      const [data, s] = await Promise.all([getBangunanList(), getStats()]);
      setBuildings(data);
      setStats(s);
    } catch { Alert.alert("Error", "Gagal memuat data."); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useEffect(() => { load(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  async function handleDelete(id: number) {
    try { await deleteBangunan(id); load(); }
    catch { Alert.alert("Error", "Gagal menghapus bangunan."); }
  }

  const filtered = search.trim()
    ? buildings.filter((b) =>
        b.nomor_urut.includes(search) ||
        b.jenis.toLowerCase().includes(search.toLowerCase()) ||
        (b.alamat ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (b.nama_rt ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (b.nama_sls ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : buildings;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg }}>
        <ActivityIndicator size="large" color={T.primary} />
        <Text style={{ marginTop: 12, color: T.onSurfaceVariant }}>Memuat data…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Header */}
      <View style={[ui.topNav, { paddingVertical: 10 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[ui.topNavBrand, { fontSize: 15 }]}>🏠 Data Lapangan</Text>
          <Text style={{ fontSize: 11, color: T.onSurfaceVariant }}>SE2026 Sumberharjo</Text>
        </View>
        {/* Kelola SLS */}
        <Pressable
          style={{ backgroundColor: T.surfaceContainerLow, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9, borderWidth: 1, borderColor: T.outlineVariant, flexDirection: "row", alignItems: "center", gap: 4, marginRight: 8 }}
          onPress={onKelolaSLS}
          accessibilityLabel="Kelola Wilayah Kerja"
        >
          <Icon name="database" size={14} color={T.secondary} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: T.secondary }}>SLS/RT</Text>
        </Pressable>
        <Pressable
          style={{ backgroundColor: T.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 5 }}
          onPress={onTambahBangunan}
          accessibilityLabel="Tambah bangunan baru"
        >
          <Icon name="zap" size={14} color={T.onPrimary} />
          <Text style={{ fontSize: 13, fontWeight: "700", color: T.onPrimary }}>+ Bangunan</Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 14, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              <StatCard icon="database" label="SLS"      value={stats.totalSLS}       color={T.primary} />
              <View style={{ width: 8 }} />
              <StatCard icon="map-pin"  label="RT"       value={stats.totalRT}        color={T.secondary} />
              <View style={{ width: 8 }} />
              <StatCard icon="home"     label="Bangunan" value={stats.totalBangunan}  color="#8b5cf6" />
            </View>
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              <StatCard icon="user"    label="KK"      value={stats.totalKK}        color="#f59e0b" />
              <View style={{ width: 8 }} />
              <StatCard icon="map-pin" label="Ber-GPS" value={stats.bangunanBerGPS} color="#22c55e" />
              <View style={{ width: 8 }} />
              <StatCard icon="copy"    label="Foto"    value={stats.totalFoto}      color="#ef4444" />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: T.white, borderRadius: 10, borderWidth: 1.5, borderColor: T.outlineVariant, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 8 }}>
              <Icon name="info" size={16} color={T.outline} />
              <View style={{ width: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 14, color: T.onSurface, padding: 0 }}
                value={search}
                onChangeText={setSearch}
                placeholder="Cari no. / jenis / RT / SLS…"
                placeholderTextColor={T.outline}
              />
              {search ? (
                <Pressable onPress={() => setSearch("")}>
                  <Icon name="x" size={16} color={T.outline} />
                </Pressable>
              ) : null}
            </View>
            {stats.totalSLS === 0 ? (
              <Pressable
                style={{ flexDirection: "row", alignItems: "center", backgroundColor: T.primaryFixed, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: T.primary, marginBottom: 4 }}
                onPress={onKelolaSLS}
              >
                <Icon name="info" size={18} color={T.primary} />
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: T.primary }}>{"Atur Wilayah Kerja Dulu"}</Text>
                  <Text style={{ fontSize: 11, color: T.onSurfaceVariant, marginTop: 2 }}>{"Tambahkan SLS dan RT sebelum input bangunan."}</Text>
                </View>
                <Icon name="arrow-right" size={16} color={T.primary} />
              </Pressable>
            ) : null}
            {(search.length > 0 && filtered.length === 0) ? (
              <Text style={{ textAlign: "center", color: T.onSurfaceVariant, fontSize: 13 }}>
                {`Tidak ditemukan hasil untuk "${search}"`}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
            <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: T.primaryFixed, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Icon name="home" size={40} color={T.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: T.onSurface, marginBottom: 4 }}>{"Belum Ada Bangunan"}</Text>
            <Text style={{ fontSize: 13, color: T.onSurfaceVariant, textAlign: "center", lineHeight: 20, marginBottom: 16 }}>
              {"Pastikan SLS & RT sudah dibuat,\nlalu tap \"+ Bangunan\" untuk memulai."}
            </Text>
            <View style={{ flexDirection: "row" }}>
              <Pressable
                style={{ backgroundColor: T.surfaceContainerLow, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: T.outlineVariant }}
                onPress={onKelolaSLS}
              >
                <Icon name="database" size={14} color={T.secondary} />
                <View style={{ width: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: T.secondary }}>{"Kelola SLS/RT"}</Text>
              </Pressable>
              <View style={{ width: 10 }} />
              <Pressable
                style={{ backgroundColor: T.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, flexDirection: "row", alignItems: "center" }}
                onPress={onTambahBangunan}
              >
                <Icon name="zap" size={14} color={T.onPrimary} />
                <View style={{ width: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: T.onPrimary }}>{"+ Bangunan"}</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <BangunanCard
            item={item}
            onPress={() => onDetailBangunan(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />
    </View>
  );
}
