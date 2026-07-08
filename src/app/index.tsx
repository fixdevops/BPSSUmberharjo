// ─── HomeScreen — Root navigator SE2026 Smart Estimator ──────────────────────
// Navigasi: Tab (5 tab) + modal stack untuk form lapangan
// Stack:
//   "home" | "estimasi" | "map" | "lapangan" | "settings"
//   lapangan → tambah_bangunan
//   lapangan → detail_bangunan/:id

import { useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { T } from "../constants/theme";
import { useBreakpoints } from "../hooks/useBreakpoints";
import { useDatabase } from "../hooks/useDatabase";
import { buildRows, buildRowsPeternakan } from "../lib/buildRows";
import { rp } from "../lib/helpers";
import { daftarKategori, daftarKondisiPanen, hitungEstimasi, kategoriMap, kondisiPanenLabel, UPAH_HOK, type KondisiPanen } from "../lib/kalkulatorData";
import { ui } from "../styles/ui";

// ── Komponen UI ──────────────────────────────────────────────────────────────
import { BerandaKalkulator } from "../components/BerandaKalkulator";
import { Icon } from "../components/Icon";
import { InfoCard } from "../components/InfoCard";
import { BottomNav } from "../components/navigation/BottomNav";
import { SideNav } from "../components/navigation/SideNav";
import { TopNav } from "../components/navigation/TopNav";
import { PickerModal } from "../components/PickerModal";
import { Badge } from "../components/ui/Badge";
import { InputField, LuasField, SelectField } from "../components/ui/FormFields";
import { DetailRow, ResultRow, ResultSection } from "../components/ui/ResultRow";
import { SectionCard } from "../components/ui/SectionCard";
import { Stepper } from "../components/ui/Stepper";

// ── Screen lapangan ───────────────────────────────────────────────────────────
import { isAccessGranted } from "../lib/keyAuth";
import { DataLapanganScreen } from "../screens/DataLapanganScreen";
import { DetailBangunanScreen } from "../screens/DetailBangunanScreen";
import { FormBangunanScreen } from "../screens/FormBangunanScreen";
import { KeyAuthScreen } from "../screens/KeyAuthScreen";
import { MapScreen } from "../screens/MapScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { SLSScreen } from "../screens/SLSScreen";

// ─── Tipe navigation stack ────────────────────────────────────────────────────
type Screen =
  | "root"                // tab navigator
  | "tambah_bangunan"
  | "kelola_sls"
  | { type: "detail_bangunan"; id: number };

export default function HomeScreen() {
  const { isMobile, isTablet, showSidebar } = useBreakpoints();
  const { ready: dbReady, error: dbError }  = useDatabase();

  // ── Autentikasi kunci akses ───────────────────────────────────────────────
  const [accessGranted, setAccessGranted] = useState<boolean>(() => isAccessGranted());

  // ── Tab aktif ────────────────────────────────────────────────────────────
  const [activePage, setActivePage] = useState<string>("estimasi");

  // ── Navigation stack (untuk layar lapangan yang menutupi tab) ────────────
  const [screen, setScreen] = useState<Screen>("root");

  // ─── State form estimasi ─────────────────────────────────────────────────
  const [kategori, setKategori]   = useState("Tanaman Pangan");
  const [kom, setKom]             = useState("Padi");
  const [mode, setMode]           = useState("panen");
  const [luas, setLuas]           = useState("6660");
  const [satLuas, setSatLuas]     = useState("M2");
  const [panen, setPanen]         = useState("100");
  const [satPanen, setSatPanen]   = useState("KUINTAL");
  const [musimTanam, setMusimTanam] = useState<string[]>(["Rendengan"]);
  const [jenisTembakau, setJenisTembakau] = useState("Tembakau Basah");
  const [jumlahPohon,   setJumlahPohon]   = useState("1000");
  const [luasTembakau,  setLuasTembakau]  = useState("15");
  const [kondisiPanen,  setKondisiPanen]  = useState<KondisiPanen>("Sedang");
  const [status, setStatus]   = useState("Milik Sendiri");
  const [tahun,  setTahun]    = useState("2002");

  // ── State UI estimasi ─────────────────────────────────────────────────────
  const [hasil,      setHasil]      = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [step,       setStep]       = useState(0);

  // ── State input tenaga kerja (HOK-based) ─────────────────────────────────
  const [upahHarian, setUpahHarian] = useState(String(UPAH_HOK)); // Rp/HOK

  // ── State override peternakan ─────────────────────────────────────────────
  const [peternakanLaki,      setPeternakanLaki]      = useState(""); // pekerja laki-laki (jiwa)
  const [peternakanPerempuan, setPeternakanPerempuan] = useState(""); // pekerja perempuan (jiwa)
  const [peternakanDibayar,   setPeternakanDibayar]   = useState<"Dibayar" | "Tidak Dibayar">("Dibayar");

  // ── Picker ────────────────────────────────────────────────────────────────
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType,    setPickerType]    = useState("");
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const pickerCallback = useRef<(v: string) => void>(() => {});

  function openPicker(label: string, options: string[], _cur: string, cb: (v: string) => void) {
    setPickerType(label);
    setPickerOptions(options);
    pickerCallback.current = cb;
    setPickerVisible(true);
  }

  // ── Hitung estimasi ───────────────────────────────────────────────────────
  function hitung() {
    setLoading(true);
    // Pakai setTimeout agar React sempat render state loading sebelum kalkulasi
    setTimeout(() => {
      try {
        const res = hitungEstimasi({
          kom, mode, luas, satLuas, panen, satPanen,
          musimTanam, jenisTembakau, jumlahPohon, luasTembakau, status,
          kondisiPanen,
          upahHarian: parseFloat(upahHarian) || UPAH_HOK,
          peternakanLaki:      peternakanLaki      ? parseInt(peternakanLaki)      : undefined,
          peternakanPerempuan: peternakanPerempuan ? parseInt(peternakanPerempuan) : undefined,
          peternakanDibayar:   kategori === "Peternakan" ? peternakanDibayar === "Dibayar" : undefined,
        });
        if (res) {
          setHasil(res);
          setStep(1);
        }
      } catch (err) {
        console.error("[hitung] error:", err);
        Alert.alert("Error", "Terjadi kesalahan saat menghitung. Periksa input Anda.");
      } finally {
        setLoading(false);
      }
    }, 0);
  }

  // ── Helper: hitung ulang dengan override parameter tertentu ────────────────
  function hitungUlangDengan(overrides: {
    upahHarian?: number;
    panen?:     string;
    satPanen?:  string;
    mode?:      string;
  } = {}) {
    const upahBaru    = overrides.upahHarian ?? (parseFloat(upahHarian) || UPAH_HOK);
    const panenBaru   = overrides.panen    ?? panen;
    const satPanenBaru= overrides.satPanen ?? satPanen;
    const modeBaru    = overrides.mode     ?? mode;

    setLoading(true);
    setTimeout(() => {
      try {
        const res = hitungEstimasi({
          kom, mode: modeBaru, luas, satLuas,
          panen: panenBaru, satPanen: satPanenBaru,
          musimTanam, jenisTembakau, jumlahPohon, luasTembakau, status,
          kondisiPanen,
          upahHarian: upahBaru,
          peternakanLaki:      peternakanLaki      ? parseInt(peternakanLaki)      : undefined,
          peternakanPerempuan: peternakanPerempuan ? parseInt(peternakanPerempuan) : undefined,
          peternakanDibayar:   kategori === "Peternakan" ? peternakanDibayar === "Dibayar" : undefined,
        });
        if (res) {
          setHasil(res);
          setStep(1);
        }
      } catch (err) {
        console.error("[hitungUlang] error:", err);
        Alert.alert("Error", "Terjadi kesalahan saat menghitung ulang.");
      } finally {
        setLoading(false);
      }
    }, 0);
  }

  // buildRows dipanggil di render — bungkus supaya tidak crash halaman
  let rows: ReturnType<typeof buildRows> = [];
  try {
    if (hasil?.isPeternakan) {
      rows = buildRowsPeternakan(hasil);
    } else {
      rows = buildRows({ hasil, kom, mode, panen, satPanen, status, musimTanam });
    }
  } catch (err) {
    console.error("[buildRows] error:", err);
  }

  // ─── Autentikasi — tampilkan KeyAuthScreen jika belum punya akses ───────────
  if (!accessGranted) {
    return <KeyAuthScreen onAccessGranted={() => setAccessGranted(true)} />;
  }

  // ─── DB belum siap ────────────────────────────────────────────────────────
  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: T.bg, gap: 12 }}>
        <Icon name="database" size={40} color={T.primaryFixed} />
        {dbError ? (
          <Text style={{ color: T.error, fontSize: 13, textAlign: "center", paddingHorizontal: 24 }}>
            Gagal membuka database:{"\n"}{dbError}
          </Text>
        ) : (
          <Text style={{ color: T.onSurfaceVariant, fontSize: 13 }}>Mempersiapkan database…</Text>
        )}
      </View>
    );
  }

  // ─── Stack: Form tambah bangunan ──────────────────────────────────────────
  if (screen === "tambah_bangunan") {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <FormBangunanScreen
          onSave={() => { setScreen("root"); setActivePage("lapangan"); }}
          onCancel={() => setScreen("root")}
        />
      </View>
    );
  }

  // ─── Stack: Kelola SLS/RT ────────────────────────────────────────────────
  if (screen === "kelola_sls") {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <SLSScreen
          onPilihRT={() => {
            setScreen("root");
            setActivePage("lapangan");
          }}
        />
        {/* Tombol kembali jika tidak ada RT dipilih */}
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
          {isMobile && (
            <View style={{ backgroundColor: T.white, borderTopWidth: 1, borderColor: T.outlineVariant, padding: 12 }}>
              <Pressable
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: T.surfaceContainerLow, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: T.outlineVariant }}
                onPress={() => { setScreen("root"); setActivePage("lapangan"); }}
              >
                <Icon name="arrow-right" size={16} color={T.onSurfaceVariant} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: T.onSurfaceVariant }}>Kembali ke Data Lapangan</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }

  // ─── Stack: Detail bangunan ───────────────────────────────────────────────
  if (typeof screen === "object" && screen.type === "detail_bangunan") {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <DetailBangunanScreen
          bangunanId={screen.id}
          onBack={() => setScreen("root")}
        />
      </View>
    );
  }

  // ─── Root: Tab navigator ──────────────────────────────────────────────────
  return (
    <View style={ui.screen}>
      <TopNav onSettingsPress={() => setActivePage("settings")} />

      <View style={ui.body}>
        {showSidebar && <SideNav active={activePage} onPress={setActivePage} />}

        {/* ── TAB: MAP ────────────────────────────────────────────────────── */}
        <View style={{ flex: 1, display: activePage === "map" ? "flex" : "none" }}>
          <MapScreen
            onDetailBangunan={(id) => setScreen({ type: "detail_bangunan", id })}
          />
        </View>

        {/* ── TAB: DATA LAPANGAN ──────────────────────────────────────────── */}
        <View style={{ flex: 1, display: activePage === "lapangan" ? "flex" : "none" }}>
          <DataLapanganScreen
            onTambahBangunan={() => setScreen("tambah_bangunan")}
            onDetailBangunan={(id) => setScreen({ type: "detail_bangunan", id })}
            onKelolaSLS={() => setScreen("kelola_sls")}
          />
        </View>

        {/* ── TAB: BERANDA + ESTIMASI + SETTINGS ──────────────────────────── */}
        {/* Dibungkus satu ScrollView, visibility diatur per tab agar state tidak hilang */}
        <ScrollView
          style={[ui.main, { display: (activePage === "home" || activePage === "estimasi" || activePage === "settings") ? "flex" : "none" }]}
          contentContainerStyle={[
            ui.mainContent,
            { padding: isMobile ? 12 : 20, paddingBottom: isMobile ? 90 : 48 },
          ]}
        >
          <View style={[ui.dotPattern, { pointerEvents: "none" } as any]} />

          {/* Semua tab tetap mounted, visibility dikendalikan dengan display */}
          <View style={{ display: activePage === "home" ? "flex" : "none" }}>
            <BerandaKalkulator />
          </View>
          <View style={{ display: activePage === "settings" ? "flex" : "none" }}>
            <SettingsScreen />
          </View>

          {/* Tab estimasi — selalu mounted agar state tidak hilang saat pindah tab */}
          <View style={{ display: activePage === "estimasi" ? "flex" : "none" }}>
            {activePage === "estimasi" && (
              <>
                {/* Header */}
                <View style={[ui.pageHeader, isMobile && { flexDirection: "column", alignItems: "flex-start" }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[ui.pageTitle, isMobile && { fontSize: 20 }]}>Parameter Estimasi</Text>
                    <Text style={ui.pageSubtitle}>
                      Kalkulasi statistik Sensus Ekonomi 2026 — berbasis hari kerja & kg/ha
                    </Text>
                  </View>
                  <Badge text="SE2026 v1" />
                </View>

                <Stepper step={step} />

                {/* Section 1: Komoditas */}
                <SectionCard icon="inventory_2" title="Section 1: Data Komoditas">
                  <View style={[ui.formGrid, isTablet && { flexDirection: "row", flexWrap: "wrap" }]}>
                    <SelectField
                      label="Kategori Usaha"
                      value={kategori}
                      width={isTablet ? "48%" : "100%"}
                      onPress={() => openPicker("Kategori Usaha", daftarKategori, kategori, (v) => {
                        setKategori(v);
                        const first = kategoriMap[v]?.[0];
                        if (first) setKom(first);
                      })}
                    />
                    <SelectField
                      label="Komoditas"
                      value={kom}
                      width={isTablet ? "48%" : "100%"}
                      onPress={() => openPicker("Komoditas", kategoriMap[kategori] ?? [], kom, setKom)}
                    />

                    {kom !== "Tembakau" && kategori !== "Peternakan" && (
                      <>
                        <SelectField
                          label="Mode Input"
                          width={isTablet ? "48%" : "100%"}
                          value={mode === "luas" ? "Berdasarkan Luas Lahan" : "Berdasarkan Hasil Panen"}
                          onPress={() => openPicker(
                            "Mode Input",
                            ["Berdasarkan Luas Lahan", "Berdasarkan Hasil Panen"],
                            mode === "luas" ? "Berdasarkan Luas Lahan" : "Berdasarkan Hasil Panen",
                            (v) => setMode(v === "Berdasarkan Luas Lahan" ? "luas" : "panen")
                          )}
                        />
                        {mode === "luas" ? (
                          <LuasField luas={luas} setLuas={setLuas} width={isTablet ? "48%" : "100%"} />
                        ) : (
                          <>
                            <InputField label="Hasil Panen" value={panen} onChangeText={setPanen}
                              placeholder="contoh: 100" keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
                            <SelectField label="Satuan Panen" value={satPanen} width={isTablet ? "48%" : "100%"}
                              onPress={() => openPicker("Satuan Panen", ["KUINTAL", "KG", "TON"], satPanen, setSatPanen)} />
                          </>
                        )}
                      </>
                    )}

                    {/* ── INPUT PETERNAKAN ───────────────────────────────── */}
                    {kategori === "Peternakan" && (
                      <>
                        <InputField
                          label="Jumlah Ternak (Ekor)"
                          value={jumlahPohon}
                          onChangeText={setJumlahPohon}
                          placeholder={
                            kom === "Sapi" ? "contoh: 2" :
                            kom === "Kambing" ? "contoh: 5" :
                            "contoh: 50"
                          }
                          keyboardType="numeric"
                          width={isTablet ? "48%" : "100%"}
                        />
                        <InputField
                          label="Pekerja Laki-laki (Jiwa)"
                          value={peternakanLaki}
                          onChangeText={setPeternakanLaki}
                          placeholder="contoh: 1 (kosong = otomatis)"
                          keyboardType="numeric"
                          width={isTablet ? "48%" : "100%"}
                        />
                        <InputField
                          label="Pekerja Perempuan (Jiwa)"
                          value={peternakanPerempuan}
                          onChangeText={setPeternakanPerempuan}
                          placeholder="contoh: 1 (kosong = otomatis)"
                          keyboardType="numeric"
                          width={isTablet ? "48%" : "100%"}
                        />
                        <View style={[ui.fieldWrap, { width: isTablet ? "48%" : "100%" }]}>
                          <Text style={ui.fieldLabel}>Pekerja Dibayar?</Text>
                          <View style={ui.musimToggleRow}>
                            {(["Dibayar", "Tidak Dibayar"] as const).map((opt) => {
                              const active = peternakanDibayar === opt;
                              return (
                                <Pressable
                                  key={opt}
                                  style={({ pressed }) => [
                                    ui.musimToggleBtn,
                                    active && ui.musimToggleBtnActive,
                                    pressed && { opacity: 0.75 },
                                  ]}
                                  onPress={() => setPeternakanDibayar(opt)}
                                  accessibilityLabel={opt}
                                >
                                  <Icon name={active ? "check" : "chevron-down"} size={13} color={active ? T.onPrimary : T.onSurfaceVariant} />
                                  <Text style={[ui.musimToggleTxt, active && ui.musimToggleTxtActive]}>{opt}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      </>
                    )}

                    {kom === "Padi" && (
                      <View style={[ui.fieldWrap, { width: "100%" }]}>
                        <Text style={ui.fieldLabel}>Musim Tanam</Text>
                        <View style={ui.musimToggleRow}>
                          {(["Rendengan", "Walikan"] as const).map((m) => {
                            const active = musimTanam.includes(m);
                            return (
                              <Pressable
                                key={m}
                                style={({ pressed }) => [
                                  ui.musimToggleBtn,
                                  active && ui.musimToggleBtnActive,
                                  pressed && { opacity: 0.75 },
                                ]}
                                onPress={() => {
                                  setMusimTanam((prev) => {
                                    if (active) {
                                      if (prev.length === 1) return prev;
                                      return prev.filter((x) => x !== m);
                                    }
                                    return [...prev, m];
                                  });
                                }}
                                accessibilityLabel={`${active ? "Hapus" : "Pilih"} musim ${m}`}
                              >
                                <Icon name={active ? "check" : "chevron-down"} size={13} color={active ? T.onPrimary : T.onSurfaceVariant} />
                                <Text style={[ui.musimToggleTxt, active && ui.musimToggleTxtActive]}>{m}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                        {musimTanam.length === 2 && (
                          <View style={ui.musimInfoRow}>
                            <Icon name="info" size={12} color={T.secondary} />
                            <Text style={ui.musimInfoTxt}>Hasil akan diakumulasi dari 2 musim tanam</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {kom === "Tembakau" && (
                      <>
                        <SelectField
                          label="Jenis Tembakau"
                          value={jenisTembakau}
                          width="100%"
                          onPress={() => openPicker("Jenis Tembakau", ["Tembakau Basah", "Tembakau Kering"], jenisTembakau, setJenisTembakau)}
                        />
                        {jenisTembakau === "Tembakau Kering" ? (
                          <InputField
                            label="Jumlah Daun Basah yang Dirajang (kg)"
                            value={jumlahPohon}
                            onChangeText={setJumlahPohon}
                            placeholder="contoh: 1000 kg"
                            keyboardType="numeric"
                            width={isTablet ? "48%" : "100%"}
                          />
                        ) : (
                          <>
                            <InputField label="Jumlah Pohon" value={jumlahPohon} onChangeText={setJumlahPohon}
                              placeholder="contoh: 1000" keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
                            <InputField label="Luas Lahan Tanam (m²)" value={luasTembakau} onChangeText={setLuasTembakau}
                              placeholder="contoh: 15" keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
                          </>
                        )}
                      </>
                    )}

                    {/* Kondisi Hasil Panen — tanaman & tembakau saja, bukan peternakan */}
                    {kategori !== "Peternakan" && (
                    <SelectField
                      label="Kondisi Hasil Panen"
                      value={kondisiPanenLabel[kondisiPanen]}
                      width={isTablet ? "48%" : "100%"}
                      onPress={() => openPicker(
                        "Kondisi Hasil Panen",
                        daftarKondisiPanen.map((k) => kondisiPanenLabel[k]),
                        kondisiPanenLabel[kondisiPanen],
                        (v) => {
                          const found = daftarKondisiPanen.find((k) => kondisiPanenLabel[k] === v);
                          if (found) setKondisiPanen(found);
                        }
                      )}
                    />
                    )}
                  </View>
                </SectionCard>

                {/* Section 2: berbeda per kategori */}
                {kategori === "Peternakan" ? (
                  /* ── PETERNAKAN: Kandang & Info Usaha ──────────────────── */
                  <SectionCard icon="location_on" title="Section 2: Detail Kandang & Usaha">
                    <View style={[ui.formGrid, isTablet && { flexDirection: "row", flexWrap: "wrap" }]}>
                      <SelectField label="Status Kandang" value={status} width={isTablet ? "48%" : "100%"}
                        onPress={() => openPicker("Status Kandang", ["Milik Sendiri", "Sewa", "Bagi Hasil"], status, setStatus)} />
                      <SelectField label="Desa" value="Sumberharjo" width={isTablet ? "48%" : "100%"} onPress={() => {}} />
                      <InputField label="Tahun Mulai Usaha" value={tahun} onChangeText={setTahun}
                        placeholder="YYYY" keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
                    </View>
                  </SectionCard>
                ) : kom === "Tembakau" && jenisTembakau === "Tembakau Kering" ? (
                  /* ── TEMBAKAU KERING (Rajangan): tidak ada lahan ────────── */
                  <SectionCard icon="settings" title="Section 2: Detail Usaha Rajangan">
                    <View style={[ui.formGrid, isTablet && { flexDirection: "row", flexWrap: "wrap" }]}>
                      <SelectField label="Status Usaha" value={status} width={isTablet ? "48%" : "100%"}
                        onPress={() => openPicker("Status Usaha", ["Milik Sendiri", "Bagi Hasil"], status, (v) => setStatus(v))} />
                      <SelectField label="Desa" value="Sumberharjo" width={isTablet ? "48%" : "100%"} onPress={() => {}} />
                      <InputField label="Upah per Hari Kerja (Rp)" value={upahHarian} onChangeText={setUpahHarian}
                        placeholder={`contoh: ${UPAH_HOK}`} keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
                      <InputField label="Tahun Mulai Usaha" value={tahun} onChangeText={setTahun}
                        placeholder="YYYY" keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
                    </View>
                  </SectionCard>
                ) : (
                  /* ── TANAMAN PANGAN / PERKEBUNAN: Lahan & TK ───────────── */
                  <SectionCard icon="location_on" title="Section 2: Detail Lahan & Tenaga Kerja">
                    <View style={[ui.formGrid, isTablet && { flexDirection: "row", flexWrap: "wrap" }]}>
                      <SelectField label="Status Lahan" value={status} width={isTablet ? "48%" : "100%"}
                        onPress={() => openPicker("Status Lahan", ["Milik Sendiri", "Sewa", "Bagi Hasil"], status, setStatus)} />
                      <SelectField label="Desa" value="Sumberharjo" width={isTablet ? "48%" : "100%"} onPress={() => {}} />
                      <InputField label="Upah per Hari Kerja (Rp)" value={upahHarian} onChangeText={setUpahHarian}
                        placeholder={`contoh: ${UPAH_HOK}`} keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
                      <InputField label="Tahun Mulai Usaha" value={tahun} onChangeText={setTahun}
                        placeholder="YYYY" keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
                    </View>
                  </SectionCard>
                )}

                {/* Shortcut ke tab lapangan */}
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 4 }}>
                  <Pressable
                    style={({ pressed }) => [{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: T.surfaceContainerLow, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: T.outlineVariant, opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => setScreen("tambah_bangunan")}
                  >
                    <Icon name="home" size={15} color={T.secondary} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: T.secondary }}>+ Bangunan</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: T.surfaceContainerLow, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: T.outlineVariant, opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => setScreen("kelola_sls")}
                  >
                    <Icon name="database" size={15} color={T.secondary} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: T.secondary }}>Kelola SLS/RT</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: T.surfaceContainerLow, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: T.outlineVariant, opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => setActivePage("map")}
                  >
                    <Icon name="map-pin" size={15} color={T.secondary} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: T.secondary }}>Peta</Text>
                  </Pressable>
                </View>

                {/* Tombol Hitung */}
                <Pressable
                  style={({ pressed }) => [ui.submitBtn, { opacity: pressed || loading ? 0.85 : 1 }]}
                  onPress={hitung}
                  disabled={loading}
                >
                  <Icon name="zap" size={18} color={T.onPrimary} />
                  <Text style={ui.submitBtnText}>{loading ? "Menghitung…" : "Hitung Estimasi SE2026"}</Text>
                  {!loading && <Icon name="arrow-right" size={16} color={T.onPrimary} />}
                </Pressable>

                <InfoCard />

                {/* Hasil */}
                {hasil && (
                  <View style={ui.resultCard}>
                    <View style={ui.resultCardHeader}>
                      <View>
                        <Text style={ui.resultCardTitle}>Hasil Estimasi</Text>
                        <Text style={ui.resultCardSub}>
                          Komoditas: {hasil?.isPeternakan ? hasil.jenisTernak : kom} · Desa Sumberharjo
                        </Text>
                      </View>
                      <Pressable style={ui.detailToggleBtn} onPress={() => setShowDetail(!showDetail)}>
                        <Icon name={showDetail ? "x" : "bar-chart-2"} size={13} color={T.secondary} />
                        <Text style={ui.detailToggleTxt}>{showDetail ? "Tutup" : "Detail Hari"}</Text>
                      </Pressable>
                    </View>

                    {/* Detail HOK collapsible */}
                    {showDetail && (
                      <View style={ui.detailBox}>
                        <Text style={ui.detailBoxTitle}>Rincian Hari Kerja (Hari Usaha)</Text>
                        <View style={ui.detailHeaderRow}>
                          <Text style={[ui.detailCell, { flex: 5, fontWeight: "700", color: T.onSurface }]}>Komponen</Text>
                          <Text style={[ui.detailCell, { flex: 2, textAlign: "center", fontWeight: "700", color: T.onSurface }]}>Hari Kerja</Text>
                          <Text style={[ui.detailCell, { flex: 3, textAlign: "right", fontWeight: "700", color: T.onSurface }]}>Estimasi Biaya</Text>
                        </View>

                        {hasil.isTembakau && hasil.jenis === "Tembakau Basah" && (<>
                          <DetailRow label="Kowak/Bersih Lahan (Rp 75rb/hari)"     qty={`${hasil.tkKowak ?? 0} org`}  amount={rp(hasil.biayaKowak ?? 0)} />
                          <DetailRow label="Macul/Bedengan (Rp 75rb/hari)"         qty={`${hasil.tkMacul ?? 0} org`}  amount={rp(hasil.biayaMacul ?? 0)} />
                          <DetailRow label="Tanam Bit (Rp 70rb/hari)"           qty={`${hasil.tkTanam ?? 0} org`}  amount={rp(hasil.biayaTanam ?? 0)} />
                          <DetailRow label="Matun/Rumput (Rp 70rb/hari)"          qty={`${hasil.tkMatun ?? 0} org`}  amount={rp(hasil.biayaMatun ?? 0)} />
                          <DetailRow label="Panen/Petik Daun (Rp 80rb/hari)"     qty={`${hasil.tkPanen ?? 0} org`}  amount={rp(hasil.biayaPanen ?? 0)} />
                          <DetailRow label="Total Upah TK"                       qty={`${hasil.hokDibayar} hari`} amount={rp(hasil.gajiTK)} />
                        </>)}
                        {hasil.isTembakau && hasil.jenis === "Tembakau Kering" && (<>
                          <DetailRow label={`Ngrajang (Rp 1.000/kg)`}           qty={`${Math.round(hasil.kgBasah).toLocaleString("id-ID")} kg`} amount={rp(hasil.biayaRajang ?? 0)} />
                          <DetailRow label={`Mepe/Jemur (Rp 250/kg)`}            qty={`${Math.round(hasil.kgBasah).toLocaleString("id-ID")} kg`} amount={rp(hasil.biayaMepe ?? 0)} />
                          <DetailRow label={`Sortasi (Rp 150/kg)`}                qty={`${Math.round(hasil.kgBasah).toLocaleString("id-ID")} kg`} amount={rp(hasil.biayaSortasi ?? 0)} />
                          <DetailRow label={`Press (Rp 100/kg)`}                  qty={`${Math.round(hasil.kgBasah).toLocaleString("id-ID")} kg`} amount={rp(hasil.biayaPress ?? 0)} />
                          <DetailRow label={`Packing (Rp 50/kg)`}                qty={`${Math.round(hasil.kgBasah).toLocaleString("id-ID")} kg`} amount={rp(hasil.biayaPacking ?? 0)} />
                          <DetailRow label="Total Upah TK (26.a)"                qty={`${hasil.hokDibayar} hari`} amount={rp(hasil.gajiTK)} />
                        </>)}
                        {hasil.isPeternakan && (() => {
                          const mandiri = hasil.mandiri === true || (hasil.upahHarian ?? 0) <= 0 || hasil.hokDibayar === 0;
                          if (mandiri) return (<>
                            <DetailRow label="Pemilik (laki-laki) — tidak dibayar"   qty={`${hasil.hokLaki} hari`}      amount="Rp 0" />
                            <DetailRow label="Keluarga (perempuan) — tidak dibayar"  qty={`${hasil.hokPerempuan} hari`} amount="Rp 0" />
                            <DetailRow label="Total Upah TK (Mandiri/Owner)"         qty="0 hari"                       amount="Rp 0" />
                          </>);
                          return (<>
                            <DetailRow label="Hari Kerja Laki-laki (60%)"    qty={`${hasil.hokLaki} hari`}         amount={rp(Math.round(hasil.biayaTK * 0.60))} />
                            <DetailRow label="Hari Kerja Perempuan (40%)"    qty={`${hasil.hokPerempuan} hari`}    amount={rp(Math.round(hasil.biayaTK * 0.40))} />
                            <DetailRow label="Keluarga (tidak dibayar)"      qty={`${hasil.hokTidakDibayar} hari`} amount="Rp 0" />
                            <DetailRow label="Total Gaji TK (flat/siklus)"   qty={`${hasil.hokDibayar} hari`}      amount={rp(hasil.biayaTK)} />
                          </>);
                        })()}
                        {!hasil.isTembakau && !hasil.isPeternakan && (<>
                          <DetailRow label="Hari Kerja Laki-laki (40%)"            qty={`${hasil.hokLaki} hari`}      amount={rp(hasil.hokLaki * (hasil.upahHarian ?? UPAH_HOK))} />
                          <DetailRow label="Hari Kerja Perempuan (60%)"            qty={`${hasil.hokPerempuan} hari`} amount={rp(hasil.hokPerempuan * (hasil.upahHarian ?? UPAH_HOK))} />
                          <DetailRow label="Pekerja Keluarga (tidak dibayar)"   qty={`${hasil.hokTidakDibayar} hari`} amount="Rp 0" />
                          <DetailRow label="Total Hari Kerja Dibayar"              qty={`${hasil.hokDibayar} hari`}   amount={rp(hasil.upah)} />
                          {kom === "Padi" && (
                            <DetailRow label="Combi Panen + Angkut" qty={`${(hasil.prod / 100).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kw`} amount={rp(hasil.combiCost)} />
                          )}
                          {kom === "Padi" && hasil.bbmCost > 0 && (
                            <DetailRow label="BBM Irigasi (Walikan)" qty={`${(hasil.ha ?? hasil.luasM2_f / 10000).toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ha`} amount={rp(hasil.bbmCost)} />
                          )}
                        </>)}
                      </View>
                    )}

                    {/* Table header */}
                    <View style={ui.tableColHeader}>
                      <Text style={[ui.tableColText, { width: 30 }]}>Info</Text>
                      <Text style={[ui.tableColText, { flex: 4 }]}>Kode / Keterangan</Text>
                      <Text style={[ui.tableColText, { flex: 4, textAlign: "right" }]}>Nilai</Text>
                      <Text style={[ui.tableColText, { width: 44, textAlign: "center" }]}>Salin</Text>
                    </View>

                    {/* Rows */}
                    {(() => {
                      let localIdx = 0;
                      return rows.map((item, idx) => {
                        if ("section" in item) {
                          return <ResultSection key={idx} title={item.section as string} />;
                        }
                        const even = localIdx % 2 === 0;
                        localIdx++;
                        return (
                          <ResultRow
                            key={idx}
                            label={item.label}
                            value={item.value}
                            isEven={even}
                            explain={(item as any).explain}
                          />
                        );
                      });
                    })()}
                  </View>
                )}

                {/* ── Footer ─────────────────────────────────────────── */}
                <View style={ui.footer}>
                  <Text style={ui.footerText}>© 2026 BPS Sumberharjo – SE2026</Text>
                  <Text style={ui.footerText}>Versi v1.2.0 · Tanaman Pangan & Peternakan</Text>
                </View>
              </>
            )}
          </View>{/* /estimasi view */}
        </ScrollView>

      </View>

      {/* Bottom nav — sembunyikan saat screen stack aktif */}
      {screen === "root" && isMobile && (
        <BottomNav active={activePage} onPress={setActivePage} />
      )}

      {/* Picker modal */}
      <PickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        title={`Pilih ${pickerType}`}
        options={pickerOptions}
        onSelect={(item) => pickerCallback.current(item)}
      />
    </View>
  );
}
