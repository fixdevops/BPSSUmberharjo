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
import { buildRows } from "../lib/buildRows";
import { rp } from "../lib/helpers";
import { daftarKategori, daftarKondisiPanen, hitungEstimasi, kategoriMap, kondisiPanenLabel, TEMBAKAU, type KondisiPanen } from "../lib/kalkulatorData";
import { analisisAnomali, type DataUsaha, type HasilAnalisis } from "../lib/anomaliAnalysis";
import { ui } from "../styles/ui";

// ── Komponen UI ──────────────────────────────────────────────────────────────
import { BerandaKalkulator } from "../components/BerandaKalkulator";
import { AnomaliCard } from "../components/AnomaliCard";
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
import { DataLapanganScreen } from "../screens/DataLapanganScreen";
import { DetailBangunanScreen } from "../screens/DetailBangunanScreen";
import { FormBangunanScreen } from "../screens/FormBangunanScreen";
import { MapScreen } from "../screens/MapScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { SLSScreen } from "../screens/SLSScreen";

// ─── Opsi kuesioner SE2026 Blok II (Identitas Usaha) ──────────────────────────
const OPS_JENIS_USAHA = [
  "1. Usaha di dalam bangunan tempat tinggal",
  "2. Usaha keliling",
  "3. Usaha di luar bangunan (lokasi tetap)",
  "4. Usaha konstruksi/tambang perorangan",
  "5. Usaha persewaan rumah/kamar/kantor",
  "6. Usaha pertanian",
];
const OPS_STATUS_BADAN = [
  "Bukan Badan Usaha",
  "Perseroan (PT)",
  "Perseroan perorangan",
  "Yayasan",
  "Koperasi",
  "Dana Pensiun",
  "Perum/Perumda",
  "BUM Desa",
  "CV",
  "Firma",
  "Persekutuan Perdata",
  "Kantor Perwakilan LN",
  "Badan Usaha LN",
  "Badan Usaha Lainnya",
];
const OPS_JARINGAN = ["Tunggal", "Kantor pusat", "Cabang", "Perwakilan", "Pabrik", "Unit penunjang"];
const OPS_MBG = [
  "Tidak terlibat MBG",
  "Sebagai SPPG",
  "Sebagai supplier",
  "Sebagai penerima manfaat",
  "Peran lainnya",
];
const OPS_ALASAN_NIB = [
  "Dalam proses pembuatan NIB",
  "Pengurusan NIB rumit",
  "Tidak memerlukan NIB",
  "Tidak tahu tentang NIB",
  "Lainnya",
];
const OPS_RAMAH_LINGKUNGAN = ["Ya, seluruhnya", "Ya, sebagian", "Tidak sama sekali"];

// Auto-saran KBLI dari komoditas yang dipilih
const KBLI_MAP: Record<string, string> = {
  Padi:           "01121 — Pertanian Padi Hibrida",
  Jagung:         "01112 — Pertanian Serealia Selain Padi",
  Kedelai:        "01113 — Pertanian Kedelai",
  "Kacang Hijau": "01119 — Pertanian Kacang-kacangan Lain",
  "Bawang Merah": "01133 — Pertanian Sayuran",
  Cabai:          "01133 — Pertanian Sayuran",
  Tebu:           "01141 — Pertanian Tebu",
  Tembakau:       "01151 — Pertanian Tembakau",
};

// ─── Tipe navigation stack ────────────────────────────────────────────────────
type Screen =
  | "root"                // tab navigator
  | "tambah_bangunan"
  | "kelola_sls"
  | { type: "detail_bangunan"; id: number };

export default function HomeScreen() {
  const { isMobile, isTablet, showSidebar } = useBreakpoints();
  const { ready: dbReady, error: dbError }  = useDatabase();

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

  // ── State Blok II SE2026 (Identitas Usaha) untuk analisis anomali ─────────
  const [jenisUsaha,    setJenisUsaha]    = useState("6. Usaha pertanian");
  const [punyaNIB,      setPunyaNIB]      = useState<"Ya" | "Tidak">("Tidak");
  const [alasanNIB,     setAlasanNIB]     = useState("Tidak memerlukan NIB");
  const [statusBadan,   setStatusBadan]   = useState("Bukan Badan Usaha");
  const [punyaCatatan,  setPunyaCatatan]  = useState<"Ya" | "Tidak">("Tidak");
  const [jaringan,      setJaringan]      = useState("Tunggal");
  const [pakaiInternet, setPakaiInternet] = useState<"Ya" | "Tidak">("Tidak");
  const [tujuanNet,     setTujuanNet]     = useState<string[]>([]); // multi-toggle
  const [pakaiAI,       setPakaiAI]       = useState<"Ya" | "Tidak">("Tidak");
  const [ramahLing,     setRamahLing]     = useState("Tidak sama sekali");
  const [ramahInput,    setRamahInput]    = useState<"Ya" | "Tidak">("Tidak");
  const [mitraKDKMP,    setMitraKDKMP]    = useState<"Ya" | "Tidak">("Tidak");
  const [peranMBG,      setPeranMBG]      = useState("Tidak terlibat MBG");
  const [eksporBarang,  setEksporBarang]  = useState<"Ya" | "Tidak">("Tidak");
  const [eksporJasa,    setEksporJasa]    = useState<"Ya" | "Tidak">("Tidak");
  const [imporJasa,     setImporJasa]     = useState<"Ya" | "Tidak">("Tidak");

  // ── State hasil analisis anomali ──────────────────────────────────────────
  const [analisis, setAnalisis] = useState<HasilAnalisis | null>(null);

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
        });
        if (res) {
          setHasil(res);
          setStep(1);
          // ── Jalankan analisis anomali (aturan cerdas offline) ──────────
          const dataUsaha: DataUsaha = {
            kom, musimTanam, status,
            tahunMulai: tahun,
            punyaNIB, punyaCatatan, punyaAsetDigital: pakaiAI,
            tahunData: 2025,
          };
          setAnalisis(analisisAnomali(res, dataUsaha));
        }
      } catch (err) {
        console.error("[hitung] error:", err);
        Alert.alert("Error", "Terjadi kesalahan saat menghitung. Periksa input Anda.");
      } finally {
        setLoading(false);
      }
    }, 0);
  }

  // buildRows dipanggil di render — bungkus supaya tidak crash halaman
  let rows: ReturnType<typeof buildRows> = [];
  try {
    rows = buildRows({ hasil, kom, mode, panen, satPanen, status, musimTanam });
  } catch (err) {
    console.error("[buildRows] error:", err);
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
                      Kalkulasi statistik Sensus Ekonomi 2026 — berbasis HOK & kg/ha
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

                    {kom !== "Tembakau" && (
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
                        <InputField label="Jumlah Pohon" value={jumlahPohon} onChangeText={setJumlahPohon}
                          placeholder="contoh: 1000" keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
                        <InputField label="Luas Lahan (m²) — untuk PBB" value={luasTembakau} onChangeText={setLuasTembakau}
                          placeholder="contoh: 15" keyboardType="numeric" width={isTablet ? "48%" : "100%"} />
                      </>
                    )}

                    {/* Kondisi Hasil Panen — semua komoditas */}
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
                  </View>
                </SectionCard>

                {/* Section 2: Lahan */}
                <SectionCard icon="location_on" title="Section 2: Detail Lahan & Lokasi">
                  <View style={[ui.formGrid, isTablet && { flexDirection: "row", flexWrap: "wrap" }]}>
                    <SelectField label="Status Lahan" value={status} width={isTablet ? "48%" : "100%"}
                      onPress={() => openPicker("Status Lahan", ["Milik Sendiri", "Sewa", "Bagi Hasil"], status, setStatus)} />
                    <SelectField label="Desa" value="Sumberharjo" width={isTablet ? "48%" : "100%"} onPress={() => {}} />
                  </View>
                </SectionCard>

                {/* Section 3: Data Usaha SE2026 Blok II (untuk analisis anomali) */}
                <SectionCard icon="business" title="Section 3: Data Usaha SE2026 (Blok II)">
                  <View style={[ui.formGrid, isTablet && { flexDirection: "row", flexWrap: "wrap" }]}>
                    {/* KBLI auto-saran */}
                    <SelectField
                      label="13.g. KBLI (auto dari komoditas)"
                      value={KBLI_MAP[kom] ?? "—"}
                      width={isTablet ? "48%" : "100%"}
                      onPress={() => Alert.alert(
                        "KBLI Rekomendasi",
                        `Komoditas "${kom}" → ${KBLI_MAP[kom] ?? "belum dipetakan"}.\n\nKode ini digunakan untuk validasi GEN AI di CAPI SE2026.`
                      )}
                    />
                    <SelectField
                      label="25. Tahun Mulai Operasi"
                      value={tahun}
                      width={isTablet ? "48%" : "100%"}
                      onPress={() => openPicker("Tahun Mulai Operasi", ["2000","2005","2010","2015","2020","2022","2023","2024","2025","2026"], tahun, setTahun)}
                    />

                    <SelectField
                      label="9.a. Jenis Usaha"
                      value={jenisUsaha}
                      width={isTablet ? "48%" : "100%"}
                      onPress={() => openPicker("Jenis Usaha", OPS_JENIS_USAHA, jenisUsaha, setJenisUsaha)}
                    />
                    <SelectField
                      label="11.a. Status Badan Usaha"
                      value={statusBadan}
                      width={isTablet ? "48%" : "100%"}
                      onPress={() => openPicker("Status Badan Usaha", OPS_STATUS_BADAN, statusBadan, setStatusBadan)}
                    />

                    {/* 10.a NIB */}
                    <View style={[ui.fieldWrap, { width: isTablet ? "48%" : "100%" }]}>
                      <Text style={ui.fieldLabel}>10.a. Memiliki NIB?</Text>
                      <View style={ui.musimToggleRow}>
                        {(["Ya", "Tidak"] as const).map((opt) => {
                          const active = punyaNIB === opt;
                          return (
                            <Pressable
                              key={opt}
                              style={({ pressed }) => [ui.musimToggleBtn, active && ui.musimToggleBtnActive, pressed && { opacity: 0.75 }]}
                              onPress={() => setPunyaNIB(opt)}
                              accessibilityLabel={`NIB ${opt}`}
                            >
                              <Icon name={active ? "check" : "chevron-down"} size={13} color={active ? T.onPrimary : T.onSurfaceVariant} />
                              <Text style={[ui.musimToggleTxt, active && ui.musimToggleTxtActive]}>{opt}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {punyaNIB === "Tidak" && (
                      <SelectField
                        label="10.c. Alasan Tidak Punya NIB"
                        value={alasanNIB}
                        width={isTablet ? "48%" : "100%"}
                        onPress={() => openPicker("Alasan Tidak Punya NIB", OPS_ALASAN_NIB, alasanNIB, setAlasanNIB)}
                      />
                    )}

                    {/* 11.d Catatan keuangan */}
                    <View style={[ui.fieldWrap, { width: isTablet ? "48%" : "100%" }]}>
                      <Text style={ui.fieldLabel}>11.d. Punya Catatan Keuangan?</Text>
                      <View style={ui.musimToggleRow}>
                        {(["Ya", "Tidak"] as const).map((opt) => {
                          const active = punyaCatatan === opt;
                          return (
                            <Pressable
                              key={opt}
                              style={({ pressed }) => [ui.musimToggleBtn, active && ui.musimToggleBtnActive, pressed && { opacity: 0.75 }]}
                              onPress={() => setPunyaCatatan(opt)}
                              accessibilityLabel={`Catatan keuangan ${opt}`}
                            >
                              <Icon name={active ? "check" : "chevron-down"} size={13} color={active ? T.onPrimary : T.onSurfaceVariant} />
                              <Text style={[ui.musimToggleTxt, active && ui.musimToggleTxtActive]}>{opt}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    <SelectField
                      label="14.a. Jaringan Usaha"
                      value={jaringan}
                      width={isTablet ? "48%" : "100%"}
                      onPress={() => openPicker("Jaringan Usaha", OPS_JARINGAN, jaringan, setJaringan)}
                    />

                    {/* 16.a Internet */}
                    <View style={[ui.fieldWrap, { width: isTablet ? "48%" : "100%" }]}>
                      <Text style={ui.fieldLabel}>16.a. Pakai Internet?</Text>
                      <View style={ui.musimToggleRow}>
                        {(["Ya", "Tidak"] as const).map((opt) => {
                          const active = pakaiInternet === opt;
                          return (
                            <Pressable
                              key={opt}
                              style={({ pressed }) => [ui.musimToggleBtn, active && ui.musimToggleBtnActive, pressed && { opacity: 0.75 }]}
                              onPress={() => setPakaiInternet(opt)}
                              accessibilityLabel={`Internet ${opt}`}
                            >
                              <Icon name={active ? "check" : "chevron-down"} size={13} color={active ? T.onPrimary : T.onSurfaceVariant} />
                              <Text style={[ui.musimToggleTxt, active && ui.musimToggleTxtActive]}>{opt}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {/* 16.b Tujuan internet (multi-toggle) */}
                    {pakaiInternet === "Ya" && (
                      <View style={[ui.fieldWrap, { width: "100%" }]}>
                        <Text style={ui.fieldLabel}>16.b. Tujuan Penggunaan Internet</Text>
                        <View style={[ui.musimToggleRow, { flexWrap: "wrap" as any }]}>
                          {["Menerima pesanan", "Produksi", "Distribusi", "Beli bahan", "Promosi"].map((opt) => {
                            const active = tujuanNet.includes(opt);
                            return (
                              <Pressable
                                key={opt}
                                style={({ pressed }) => [ui.musimToggleBtn, active && ui.musimToggleBtnActive, pressed && { opacity: 0.75 }]}
                                onPress={() => setTujuanNet((prev) => active ? prev.filter((x) => x !== opt) : [...prev, opt])}
                                accessibilityLabel={`Tujuan internet ${opt}`}
                              >
                                <Icon name={active ? "check" : "chevron-down"} size={13} color={active ? T.onPrimary : T.onSurfaceVariant} />
                                <Text style={[ui.musimToggleTxt, active && ui.musimToggleTxtActive]}>{opt}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* 16.c Teknologi AI/IoT */}
                    <View style={[ui.fieldWrap, { width: isTablet ? "48%" : "100%" }]}>
                      <Text style={ui.fieldLabel}>16.c. Pakai Teknologi AI/IoT/Big Data?</Text>
                      <View style={ui.musimToggleRow}>
                        {(["Ya", "Tidak"] as const).map((opt) => {
                          const active = pakaiAI === opt;
                          return (
                            <Pressable
                              key={opt}
                              style={({ pressed }) => [ui.musimToggleBtn, active && ui.musimToggleBtnActive, pressed && { opacity: 0.75 }]}
                              onPress={() => setPakaiAI(opt)}
                              accessibilityLabel={`AI/IoT ${opt}`}
                            >
                              <Icon name={active ? "check" : "chevron-down"} size={13} color={active ? T.onPrimary : T.onSurfaceVariant} />
                              <Text style={[ui.musimToggleTxt, active && ui.musimToggleTxtActive]}>{opt}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    <SelectField
                      label="17.a. Produk Ramah Lingkungan"
                      value={ramahLing}
                      width={isTablet ? "48%" : "100%"}
                      onPress={() => openPicker("Produk Ramah Lingkungan", OPS_RAMAH_LINGKUNGAN, ramahLing, setRamahLing)}
                    />

                    {/* 21 KDKMP */}
                    <View style={[ui.fieldWrap, { width: isTablet ? "48%" : "100%" }]}>
                      <Text style={ui.fieldLabel}>21. Mitra Koperasi Desa Merah Putih?</Text>
                      <View style={ui.musimToggleRow}>
                        {(["Ya", "Tidak"] as const).map((opt) => {
                          const active = mitraKDKMP === opt;
                          return (
                            <Pressable
                              key={opt}
                              style={({ pressed }) => [ui.musimToggleBtn, active && ui.musimToggleBtnActive, pressed && { opacity: 0.75 }]}
                              onPress={() => setMitraKDKMP(opt)}
                              accessibilityLabel={`KDKMP ${opt}`}
                            >
                              <Icon name={active ? "check" : "chevron-down"} size={13} color={active ? T.onPrimary : T.onSurfaceVariant} />
                              <Text style={[ui.musimToggleTxt, active && ui.musimToggleTxtActive]}>{opt}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    <SelectField
                      label="22. Keterlibatan MBG"
                      value={peranMBG}
                      width={isTablet ? "48%" : "100%"}
                      onPress={() => openPicker("Keterlibatan MBG", OPS_MBG, peranMBG, setPeranMBG)}
                    />

                    {/* 23 Ekspor/Impor */}
                    <View style={[ui.fieldWrap, { width: "100%" }]}>
                      <Text style={ui.fieldLabel}>23. Transaksi dengan Luar Negeri (Mei 2024–Ags 2026)</Text>
                      <View style={{ gap: 6, marginTop: 4 }}>
                        {([
                          ["Jual/Beli Barang", eksporBarang, setEksporBarang],
                          ["Jual Jasa",        eksporJasa,   setEksporJasa],
                          ["Beli Jasa",        imporJasa,    setImporJasa],
                        ] as const).map(([lbl, val, set]) => (
                          <View key={lbl} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={{ flex: 1, fontSize: 12, color: T.onSurface }}>{lbl}</Text>
                            <View style={ui.musimToggleRow}>
                              {(["Ya", "Tidak"] as const).map((opt) => {
                                const active = val === opt;
                                return (
                                  <Pressable
                                    key={opt}
                                    style={({ pressed }) => [ui.musimToggleBtn, active && ui.musimToggleBtnActive, pressed && { opacity: 0.75 }]}
                                    onPress={() => set(opt)}
                                  >
                                    <Icon name={active ? "check" : "chevron-down"} size={12} color={active ? T.onPrimary : T.onSurfaceVariant} />
                                    <Text style={[ui.musimToggleTxt, active && ui.musimToggleTxtActive, { fontSize: 12 }]}>{opt}</Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </SectionCard>

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
                        <Text style={ui.resultCardSub}>Komoditas: {kom} · Desa Sumberharjo</Text>
                      </View>
                      <Pressable style={ui.detailToggleBtn} onPress={() => setShowDetail(!showDetail)}>
                        <Icon name={showDetail ? "x" : "bar-chart-2"} size={13} color={T.secondary} />
                        <Text style={ui.detailToggleTxt}>{showDetail ? "Tutup" : "Detail HOK"}</Text>
                      </Pressable>
                    </View>

                    {/* Detail HOK collapsible */}
                    {showDetail && (
                      <View style={ui.detailBox}>
                        <Text style={ui.detailBoxTitle}>Rincian HOK (Hari Orang Kerja)</Text>
                        <View style={ui.detailHeaderRow}>
                          <Text style={[ui.detailCell, { flex: 5, fontWeight: "700", color: T.onSurface }]}>Komponen</Text>
                          <Text style={[ui.detailCell, { flex: 2, textAlign: "center", fontWeight: "700", color: T.onSurface }]}>HOK</Text>
                          <Text style={[ui.detailCell, { flex: 3, textAlign: "right", fontWeight: "700", color: T.onSurface }]}>Estimasi Biaya</Text>
                        </View>

                        {hasil.isTembakau && hasil.jenis === "Tembakau Basah" && (<>
                          <DetailRow label="Kowak/Bajak (Rp 75rb/HOK)"    qty={`${hasil.tkKowak} org`}  amount={rp(hasil.tkKowak * 75000)} />
                          <DetailRow label="Macul/Bedengan (Rp 75rb/HOK)" qty={`${hasil.tkMacul} org`}  amount={rp(hasil.tkMacul * 75000)} />
                          <DetailRow label="Panen/Petik (Rp 75rb/HOK)"    qty={`${hasil.tkPanen} org`}  amount={rp(hasil.tkPanen * 75000)} />
                          <DetailRow label="Total HOK Dibayar"              qty={`${hasil.hokDibayar} HOK`} amount={rp(hasil.gajiTK)} />
                        </>)}
                        {hasil.isTembakau && hasil.jenis === "Tembakau Kering" && (<>
                          <DetailRow label={`Ngrajang (Rp ${TEMBAKAU.upahRajang.toLocaleString()}/kg)`} qty={`${Math.round(hasil.kgBasah).toLocaleString()} kg`} amount={rp(TEMBAKAU.upahRajang * hasil.kgBasah)} />
                          <DetailRow label={`Mepe/Jemur (Rp ${TEMBAKAU.upahMepe.toLocaleString()}/kg)`} qty={`${Math.round(hasil.kgBasah).toLocaleString()} kg`} amount={rp(TEMBAKAU.upahMepe * hasil.kgBasah)} />
                          <DetailRow label="Total Upah TK"                  qty={`${hasil.hokDibayar} HOK`} amount={rp(hasil.gajiTK)} />
                        </>)}
                        {!hasil.isTembakau && (<>
                          <DetailRow label="HOK Laki-laki (40%)"            qty={`${hasil.hokLaki} HOK`}      amount={rp(Math.round(hasil.hokLaki * 0.75) * 70_000)} />
                          <DetailRow label="HOK Perempuan (60%)"            qty={`${hasil.hokPerempuan} HOK`} amount={rp(Math.round(hasil.hokPerempuan * 0.75) * 70_000)} />
                          <DetailRow label="HOK Tidak Dibayar (keluarga)"   qty={`${hasil.hokTidakDibayar} HOK`} amount="Rp 0" />
                          <DetailRow label="Total HOK Dibayar"              qty={`${hasil.hokDibayar} HOK`}   amount={rp(hasil.upah)} />
                          {kom === "Padi" && (
                            <DetailRow label="Combi Panen + Angkut" qty={`${(hasil.prod / 100).toFixed(1)} kw`} amount={rp(hasil.combiCost)} />
                          )}
                          {kom === "Padi" && hasil.bbmCost > 0 && (
                            <DetailRow label="BBM Irigasi (Walikan)" qty={`${(hasil.ha ?? hasil.luasM2_f / 10000).toFixed(3)} ha`} amount={rp(hasil.bbmCost)} />
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

                {/* ── Analisis AI: deteksi anomali SE2026 ───────────────────── */}
                {analisis && <AnomaliCard analisis={analisis} />}

                <View style={ui.footer}>
                  <Text style={ui.footerText}>© 2026 BPS Sumberharjo – SE2026</Text>
                  <Text style={ui.footerText}>Versi v1.2.0 · Analisis AI Anomali</Text>
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
