// ─── Data & Logika Kalkulator SE2026 — Versi BPS Realistis ──────────────────
//
// PRINSIP:
//   • Luas    → hektar (ha)
//   • Produksi → kg/ha (produktivitas BPS)
//   • TK      → HOK/ha (Hari Orang Kerja per hektar)
//   • Biaya   → per 1.000 kg produksi (patokan BPS lapangan)
//   • Tembakau → per 1.000 pohon (satuan plot standar BPS)
//   • Gender   → 40% laki-laki : 60% perempuan (BPS lapangan)

import { Alert } from "react-native";

// ─── Tipe Database Komoditas ──────────────────────────────────────────────────
export type KomoditasData = {
  prod:     number;   // produktivitas (kg/ha per musim)
  harga:    number;   // harga jual (Rp/kg)
  t:        number;   // kebutuhan TK total (HOK/ha per musim)
  gaji1000: number;   // gaji TK per 1.000 kg produksi (Rp)
  sapr1000: number;   // saprotan per 1.000 kg produksi (Rp)
  ops1000:  number;   // operasional per 1.000 kg produksi (Rp)
};

// ─── Tipe Rincian Saprotan ────────────────────────────────────────────────────
export type ItemSaprotan = {
  nama:   string;
  vol:    number;
  satuan: string;
  harga:  number;
};

// ─── Rincian Saprotan per Komoditas (per ha atau per 1.000 pohon) ─────────────
export const saprotanDetail: Record<string, ItemSaprotan[]> = {
  Padi: [
    { nama: "Benih Padi (Ciherang/IR64)",  vol: 25,  satuan: "kg",    harga: 10_000  },
    { nama: "Pupuk Urea",                  vol: 150, satuan: "kg",    harga: 2_200   },
    { nama: "Pupuk NPK Phonska",           vol: 100, satuan: "kg",    harga: 2_100   },
    { nama: "Pupuk Organik/Kompos",        vol: 500, satuan: "kg",    harga: 400     },
    { nama: "Pestisida (Regent/Furadan)",  vol: 1,   satuan: "liter", harga: 50_000  },
  ],
  Jagung: [
    { nama: "Benih Jagung Hibrida (Bisi)", vol: 20,  satuan: "kg",    harga: 40_000  },
    { nama: "Pupuk Urea",                  vol: 200, satuan: "kg",    harga: 2_200   },
    { nama: "Pupuk NPK",                   vol: 100, satuan: "kg",    harga: 2_100   },
    { nama: "Pestisida ulat",              vol: 0.5, satuan: "liter", harga: 50_000  },
    { nama: "Herbisida",                   vol: 1,   satuan: "liter", harga: 40_000  },
  ],
  Kedelai: [
    { nama: "Benih Kedelai (Anjasmoro)",   vol: 40,  satuan: "kg",    harga: 12_000  },
    { nama: "Pupuk NPK",                   vol: 75,  satuan: "kg",    harga: 2_100   },
    { nama: "Rhizobium (inokulant)",       vol: 2,   satuan: "pak",   harga: 15_000  },
    { nama: "Pestisida (Decis)",           vol: 0.5, satuan: "liter", harga: 50_000  },
    { nama: "Fungisida",                   vol: 0.2, satuan: "kg",    harga: 60_000  },
  ],
  "Kacang Hijau": [
    { nama: "Benih Kacang Hijau",          vol: 20,  satuan: "kg",    harga: 18_000  },
    { nama: "Pupuk Urea",                  vol: 50,  satuan: "kg",    harga: 2_200   },
    { nama: "Pupuk SP-36",                 vol: 50,  satuan: "kg",    harga: 2_800   },
    { nama: "Pestisida",                   vol: 0.3, satuan: "liter", harga: 50_000  },
  ],
  "Bawang Merah": [
    { nama: "Benih Bawang Merah (umbi)",   vol: 800, satuan: "kg",    harga: 25_000  },
    { nama: "Pupuk Urea",                  vol: 150, satuan: "kg",    harga: 2_200   },
    { nama: "Pupuk NPK Mutiara",           vol: 200, satuan: "kg",    harga: 9_000   },
    { nama: "Fungisida (Dithane M-45)",    vol: 2,   satuan: "kg",    harga: 60_000  },
    { nama: "Insektisida (Confidor)",      vol: 0.5, satuan: "liter", harga: 50_000  },
    { nama: "Herbisida",                   vol: 1,   satuan: "liter", harga: 40_000  },
  ],
  Cabai: [
    { nama: "Benih Cabai (Lado/TM-999)",   vol: 0.1, satuan: "kg",    harga: 2_000_000 },
    { nama: "Pupuk NPK",                   vol: 200, satuan: "kg",    harga: 2_100   },
    { nama: "Pupuk Kandang",               vol: 2000,satuan: "kg",    harga: 400     },
    { nama: "Fungisida (Antracol)",        vol: 2,   satuan: "kg",    harga: 60_000  },
    { nama: "Insektisida (Curacron)",      vol: 1,   satuan: "liter", harga: 50_000  },
    { nama: "Mulsa Plastik Hitam Perak",   vol: 8,   satuan: "rol",   harga: 130_000 },
  ],
  Tebu: [
    { nama: "Bibit Tebu (stek 2 mata)",    vol: 8,   satuan: "ku",    harga: 150_000 },
    { nama: "Pupuk Za",                    vol: 200, satuan: "kg",    harga: 1_500   },
    { nama: "Pupuk NPK",                   vol: 150, satuan: "kg",    harga: 2_100   },
    { nama: "Herbisida Atrazin",           vol: 3,   satuan: "kg",    harga: 40_000  },
    { nama: "Insektisida tanah",           vol: 5,   satuan: "kg",    harga: 25_000  },
  ],
  // ── Tembakau per 1.000 pohon ──────────────────────────────────────────────
  "Tembakau Basah": [
    { nama: "Pupuk Kandang",               vol: 200, satuan: "kg",    harga: 400     },
    { nama: "Pupuk Urea",                  vol: 20,  satuan: "kg",    harga: 2_200   },
    { nama: "Pupuk Za",                    vol: 10,  satuan: "kg",    harga: 1_500   },
    { nama: "Pestisida",                   vol: 0.1, satuan: "liter", harga: 50_000  },
  ],
  "Tembakau Kering": [
    { nama: "Pupuk Kandang",               vol: 200, satuan: "kg",    harga: 400     },
    { nama: "Pupuk Urea",                  vol: 30,  satuan: "kg",    harga: 2_200   },
    { nama: "Pupuk NPK",                   vol: 20,  satuan: "kg",    harga: 2_100   },
    { nama: "Fungisida",                   vol: 0.5, satuan: "kg",    harga: 60_000  },
    { nama: "Insektisida",                 vol: 0.3, satuan: "liter", harga: 50_000  },
    { nama: "Rajang mesin (jasa)",         vol: 1,   satuan: "unit",  harga: 100_000 },
    { nama: "Widek (bambu rajang)",        vol: 1,   satuan: "unit",  harga: 200_000 },
    { nama: "Bahan bakar",                 vol: 5,   satuan: "liter", harga: 10_000  },
    { nama: "Karung + tali",               vol: 5,   satuan: "set",   harga: 20_000  },
  ],
};

// ─── Fungsi helper: hitung total saprotan per ha ──────────────────────────────
export function totalSaprotanPerHa(kom: string): number {
  return (saprotanDetail[kom] ?? []).reduce(
    (sum, item) => sum + item.vol * item.harga, 0
  );
}

// ─── Fungsi helper: teks rincian saprotan untuk explain ──────────────────────
export function explainSaprotan(kom: string, ha: number, totalBiaya: number): string {
  // Tembakau Basah / Kering: unit per 1.000 pohon, bukan per ha
  const isTembakauKey = kom === "Tembakau Basah" || kom === "Tembakau Kering";
  const items = saprotanDetail[kom];
  if (!items || items.length === 0)
    return `Biaya saprotan Rp ${totalBiaya.toLocaleString("id-ID")} berdasarkan patokan lapangan`;

  if (isTembakauKey) {
    const lines = items.map((item) => {
      const totalItem = item.vol * item.harga;
      const volStr = item.vol % 1 === 0 ? item.vol.toFixed(0) : item.vol.toFixed(1);
      return `  • ${item.nama.padEnd(28)} ${volStr} ${item.satuan.padEnd(6)} × Rp ${item.harga.toLocaleString("id-ID")} = Rp ${Math.round(totalItem).toLocaleString("id-ID")}`;
    });
    const perSatuanTotal = items.reduce((s, i) => s + i.vol * i.harga, 0);
    return (
      `Rincian saprotan per 1.000 pohon:\n\n` +
      lines.join("\n") +
      `\n\n  Per 1.000 pohon = Rp ${Math.round(perSatuanTotal).toLocaleString("id-ID")}` +
      `\n  Total = Rp ${Math.round(totalBiaya).toLocaleString("id-ID")}` +
      `\n\n  ⚠ Harga dapat berbeda di lapangan.`
    );
  }

  const lines = items.map((item) => {
    const totalItem = item.vol * ha * item.harga;
    const vol = item.vol * ha;
    const volStr = vol < 1 ? vol.toFixed(2) : vol % 1 === 0 ? vol.toFixed(0) : vol.toFixed(1);
    return `  • ${item.nama.padEnd(28)} ${volStr} ${item.satuan.padEnd(6)} × Rp ${item.harga.toLocaleString("id-ID")} = Rp ${Math.round(totalItem).toLocaleString("id-ID")}`;
  });

  const perHaTotal = totalSaprotanPerHa(kom);
  return (
    `Rincian saprotan untuk ${ha.toFixed(3)} ha:\n\n` +
    lines.join("\n") +
    `\n\n  Per ha estimasi = Rp ${Math.round(perHaTotal).toLocaleString("id-ID")}` +
    `\n  Total (${ha.toFixed(3)} ha) = Rp ${Math.round(totalBiaya).toLocaleString("id-ID")}` +
    `\n\n  ⚠ Harga dapat berbeda di lapangan.`
  );
}

// ─── Database Komoditas (patokan BPS lapangan per 1.000 kg produksi) ─────────
export const db: Record<string, KomoditasData> = {
  Padi: {
    prod:     7042,        // kg/ha — 1 ton = 1.420 m² → 1000/0.142 ha = 7.042 kg/ha
    harga:    6_000,       // Rp/kg GKP (patokan: 1 ton = Rp 6.000.000)
    t:        100,         // HOK/ha per musim (semi-mekanisasi Bojonegoro)
    gaji1000: 2_000_000,   // Rp 2 juta per ton (patokan)
    sapr1000: 800_000,     // Rp 800 ribu per ton (patokan)
    ops1000:  200_000,     // Rp 200 ribu per ton (patokan)
  },
  Jagung: {
    prod:     5000,
    harga:    4_000,
    t:        80,
    gaji1000: 1_500_000,
    sapr1000: 600_000,
    ops1000:  150_000,
  },
  Kedelai: {
    prod:     1500,
    harga:    8_000,
    t:        70,
    gaji1000: 2_500_000,
    sapr1000: 1_000_000,
    ops1000:  200_000,
  },
  "Kacang Hijau": {
    prod:     1200,
    harga:    10_000,
    t:        60,
    gaji1000: 2_000_000,
    sapr1000: 800_000,
    ops1000:  150_000,
  },
  "Bawang Merah": {
    prod:     8000,
    harga:    20_000,
    t:        150,
    gaji1000: 1_800_000,
    sapr1000: 3_000_000,
    ops1000:  300_000,
  },
  Cabai: {
    prod:     6000,
    harga:    25_000,
    t:        140,
    gaji1000: 2_000_000,
    sapr1000: 4_000_000,
    ops1000:  400_000,
  },
  Tebu: {
    prod:     70000,
    harga:    600,
    t:        90,
    gaji1000: 500_000,
    sapr1000: 200_000,
    ops1000:  80_000,
  },
};

// ─── Konstanta Tembakau (per 1.000 pohon, BPS realistis) ─────────────────────
export const TEMBAKAU = {
  // Produksi
  kgPer1000:      120,    // kg daun basah per 1.000 pohon
  susut:          0.12,   // konversi basah → kering (susut ±88%)

  // Harga jual
  hargaBasah:     3_000,  // Rp/kg daun basah (patokan)
  hargaKering:    30_000, // Rp/kg daun kering

  // HOK per 1.000 pohon (BASAH)
  hokPer1000:     4,
  hokRasioLaki:   0.5,    // tembakau basah: 50% laki-laki

  // Upah harian (Rp/HOK) — patokan Bojonegoro
  upahHarian:     75_000,

  // ── Detail upah per jenis pekerjaan TEMBAKAU KERING (per kg basah) ────────
  // Biaya produksi tembakau kering = biaya rajang per kg
  // Setiap pekerjaan punya upah per kg + gender dominan
  pekerjaanKering: {
    ngrajang:  { label: "Ngrajang (rajang daun)", upahPerKg: 1_000, gender: "campuran" as const },
    mepe:      { label: "Mepe (jemur daun)",      upahPerKg: 250,   gender: "perempuan" as const },
    sortasi:   { label: "Sortasi (pilih kualitas)", upahPerKg: 150,  gender: "perempuan" as const },
    press:     { label: "Press (press bal)",        upahPerKg: 100,  gender: "laki" as const },
    packing:   { label: "Packing (karung/ikat)",   upahPerKg: 50,   gender: "campuran" as const },
  },

  // ── Detail upah per jenis pekerjaan TEMBAKAU BASAH ──────────────────────
  pekerjaanBasah: {
    kowak:  { label: "Kowak (bersih lahan)",     upahPerHOK: 75_000, gender: "laki" as const },
    macul:  { label: "Macul (bedengan)",         upahPerHOK: 75_000, gender: "campuran" as const },
    tanam:  { label: "Tanam bibit",             upahPerHOK: 70_000, gender: "campuran" as const },
    matun:  { label: "Matun (rumput)",           upahPerHOK: 70_000, gender: "perempuan" as const },
    panen:  { label: "Panen/petik daun",        upahPerHOK: 80_000, gender: "perempuan" as const },
  },

  // ── Biaya per 1.000 pohon BASAH ──────────────────────────────────────────
  gajiBasahPer1000:     500_000,
  saprotanBasahPer1000: 400_000,
  operBasahPer1000:     180_000,

  // ── Biaya per 1.000 pohon KERING ─────────────────────────────────────────
  gajiKeringPer1000:     150_000,
  saprotanKeringPer1000: 800_000,
  operKeringPer1000:     100_000,

  // Aset (tetap, per unit usaha)
  asetTanah:       1_500_000, // 15 m² × Rp 100.000/m²
  asetMesinKecil:  1_000_000,
  asetMesinBesar:  4_000_000,
  asetWidek:         800_000,
  luasProduksi:         15,   // m²

  // PBB (hanya untuk basah)
  pbbPerM2:           500,    // Rp/m²/tahun
};

// ─── Peta Kategori → Komoditas ────────────────────────────────────────────────
export const kategoriMap: Record<string, string[]> = {
  "Tanaman Pangan": ["Padi", "Jagung", "Kedelai", "Kacang Hijau"],
  "Perkebunan":     ["Tembakau", "Tebu", "Bawang Merah", "Cabai"],
};
export const daftarKategori = Object.keys(kategoriMap);

// ─── Kondisi Hasil Panen ──────────────────────────────────────────────────────
// Mempengaruhi produktivitas (kg/ha) dan nilai produksi akhir
export type KondisiPanen = "Sedang" | "Baik" | "Sangat Baik";

export const daftarKondisiPanen: KondisiPanen[] = ["Sedang", "Baik", "Sangat Baik"];

// Faktor pengali produktivitas per kondisi
export const kondisiPanenFaktor: Record<KondisiPanen, number> = {
  "Sedang":      1.00,   // baseline (patokan normal BPS)
  "Baik":        1.15,   // +15% dari baseline
  "Sangat Baik": 1.30,   // +30% dari baseline
};

export const kondisiPanenLabel: Record<KondisiPanen, string> = {
  "Sedang":      "Sedang (normal)",
  "Baik":        "Baik (+15%)",
  "Sangat Baik": "Sangat Baik (+30%)",
};

// ─── Tipe HasilMusim ──────────────────────────────────────────────────────────
export type HasilMusim = {
  musim:    string;
  ha:       number;
  prod:     number;
  luasM2_f: number;

  // HOK
  hokTotal:        number;
  hokLaki:         number;
  hokPerempuan:    number;
  hokDibayar:      number;
  hokTidakDibayar: number;

  // PEKERJA (JIWA)
  pekerjaLaki:         number;
  pekerjaPerempuan:    number;
  pekerjaDibayar:      number;
  pekerjaTidakDibayar: number;
  totalPekerja:        number;

  // Keuangan
  pend:         number;
  pendPetani:   number;
  upah:         number;
  upahHarian:   number; // Rp/HOK yang dipakai
  biaya:        number;
  oper:         number;
  sewaLahan:    number;
  bagiHasilPot: number;
  non:          number;
  totalPeng:    number;

  // Aset
  asetTanah:  number;
  asetLain:   number;
  alatUnits:  number[];

  // Biaya detail (padi)
  combiCost: number;
  bbmCost:   number;

  // Kondisi panen
  kondisiPanen:  KondisiPanen;
  faktorKondisi: number;
};

// ─── Konstanta Biaya Operasional ─────────────────────────────────────────────
const SEWA_PER_HA    = 12_000_000;
const RASIO_BH       = 0.50;
const PBB_TAHUNAN    = 20_000;
export const UPAH_HOK = 70_000;  // upah harian patokan (Rp/HOK) Bojonegoro

// ─── Distribusi gender HOK ────────────────────────────────────────────────────
const RASIO_LAKI      = 0.40;
const RASIO_PEREMPUAN = 0.60;

// ─── Hitung 1 musim komoditas biasa ──────────────────────────────────────────
export function hitungSatuMusim(params: {
  musim: string;
  kom: string;
  mode: string;
  luas: string;
  satLuas: string;
  panen: string;
  satPanen: string;
  status: string;
  kondisiPanen?: KondisiPanen;
  upahHarian?: number;
}): HasilMusim {
  const { musim, kom, mode, luas, panen, satPanen, status, kondisiPanen } = params;
  const upahHarian = params.upahHarian ?? UPAH_HOK;
  const d = db[kom]!;

  // Faktor kondisi panen (default: Sedang = 1.0)
  // Guard: pastikan faktor tidak pernah 0 agar tidak ada pembagian dengan nol
  const faktorKondisi = kondisiPanenFaktor[kondisiPanen ?? "Sedang"] || 1.0;

  // ── 1. Hitung ha & prod ───────────────────────────────────────────────────
  // Walikan (musim kering) → produktivitas −15%
  // Padi: 7.042 kg/ha × 0,85 = 5.986 kg/ha (Walikan)
  // kondisiPanen: Sedang × 1.0, Baik × 1.15, Sangat Baik × 1.30
  const PROD_PER_HA_BASE = (kom === "Padi" && musim === "Walikan")
    ? d.prod * 0.85
    : d.prod;
  // Guard: PROD_PER_HA tidak boleh 0 (hindari pembagian nol)
  const PROD_PER_HA = Math.max(1, PROD_PER_HA_BASE * faktorKondisi);

  let ha = 0, prod = 0;
  if (mode === "luas") {
    const n = parseFloat(luas) || 0;
    ha   = n / 10000;
    prod = ha * PROD_PER_HA;
  } else {
    const n = parseFloat(panen) || 0;
    if      (satPanen === "TON")     prod = n * 1000;
    else if (satPanen === "KUINTAL") prod = n * 100;
    else                             prod = n;
    ha = prod / PROD_PER_HA;
  }
  const luasM2_f = ha * 10000;

  // ── 2. Nilai produksi ─────────────────────────────────────────────────────
  const hargaJual = (kom === "Padi" && musim === "Walikan") ? 6_800 : d.harga;
  const pend      = prod * hargaJual;

  // ── 3. HOK ────────────────────────────────────────────────────────────────
  const totalHOK        = Math.max(1, Math.round(ha * d.t));
  const hokDibayar      = Math.max(1, Math.round(totalHOK * 0.60));
  const hokTidakDibayar = Math.max(1, Math.round(totalHOK * 0.40));
  const hokLaki         = Math.max(1, Math.round(totalHOK * RASIO_LAKI));
  const hokPerempuan    = Math.max(1, Math.round(totalHOK * RASIO_PEREMPUAN));
  const hokTotal        = hokDibayar + hokTidakDibayar;

  // ── 3b. PEKERJA (JIWA) ────────────────────────────────────────────────────
  let pekerjaTidakDibayar = 2;
  if (kom === "Padi") {
    // Pekerja tidak dibayar flat 4 karena pemilik nya ikut setiap musim rendeng walikan
    pekerjaTidakDibayar = 4;
  }

  let pekerjaDibayar = 0;
  if (kom === "Padi") {
    pekerjaDibayar = Math.max(1, Math.round(ha * 15));
  } else if (kom === "Kedelai") {
    pekerjaDibayar = Math.max(1, Math.round(ha * 10));
  } else {
    pekerjaDibayar = Math.max(1, Math.round(ha * 12));
  }

  const totalPekerja = pekerjaDibayar + pekerjaTidakDibayar;

  // Split Laki-laki & Perempuan berdasarkan ratio
  // Padi & Kedelai: 40% laki, 60% perempuan
  // Lainnya default 45% laki, 55% perempuan
  const ratioPekerjaLaki = (kom === "Padi" || kom === "Kedelai") ? 0.40 : 0.45;
  const pekerjaLaki = Math.max(1, Math.min(totalPekerja - 1, Math.round(totalPekerja * ratioPekerjaLaki)));
  const pekerjaPerempuan = totalPekerja - pekerjaLaki;

  // ── 4. Biaya ─────────────────────────────────────────────────────────────
  const ribuan = prod / 1000; // satuan 1.000 kg (untuk saprotan & operasional)

  // Upah TK (26.a): HOK dibayar × upah harian — akurat lapangan
  // (sebelumnya: ton × gaji1000, tidak nyambung ke jumlah HOK)
  const upah = hokDibayar * upahHarian;

  // Saprotan
  const saprotanDasar = ribuan * d.sapr1000;
  const rasioWalikan  = (kom === "Padi" && musim === "Walikan") ? 1.03 : 1.0;
  let biaya = saprotanDasar * rasioWalikan;

  // Operasional: per 1.000 kg, lalu tambah BBM Walikan
  const combiCost = ribuan * d.ops1000;
  const bbmCost   = (kom === "Padi" && musim === "Walikan") ? ha * 187_500 : 0;
  const oper      = combiCost + bbmCost;

  // Status lahan
  let sewaLahan    = 0;
  let bagiHasilPot = 0;
  let pendPetani   = pend;

  if (status === "Sewa") {
    sewaLahan = ha * SEWA_PER_HA;
    biaya    += sewaLahan;
  } else if (status === "Bagi Hasil") {
    bagiHasilPot = pend * RASIO_BH;
    pendPetani   = pend * (1 - RASIO_BH);
  }

  const non       = PBB_TAHUNAN;
  const totalPeng = upah + biaya + oper + bagiHasilPot + non;

  // ── 5. Aset ───────────────────────────────────────────────────────────────
  let asetTanah = luasM2_f * 100_000;
  let asetLain = 0;
  let alatUnits: number[] = [];

  if (kom === "Padi") {
    asetTanah = luasM2_f * 100_000;
    const unitAlkon   = Math.max(1, Math.round(luasM2_f / 10000));
    const unitSprayer = Math.max(1, Math.round(luasM2_f / 10000));
    const unitSabit   = Math.max(1, Math.round(luasM2_f / 3000));
    const unitCangkul = Math.max(1, Math.round(luasM2_f / 3000));
    alatUnits = [unitAlkon, unitSprayer, unitSabit, unitCangkul];
    asetLain = (unitAlkon * 1_500_000) + (unitSprayer * 250_000) + (unitSabit * 50_000) + (unitCangkul * 75_000);
  } else if (kom === "Kedelai") {
    asetTanah = luasM2_f * 80_000;
    const unitSprayer = Math.max(1, Math.round(luasM2_f / 10000));
    const unitSabit   = Math.max(1, Math.round(luasM2_f / 3000));
    const unitCangkul = Math.max(1, Math.round(luasM2_f / 3000));
    const unitTerpal  = Math.max(1, Math.round(luasM2_f / 2500));
    // [Sprayer, Sabit, Cangkul, Terpal]
    alatUnits = [unitSprayer, unitSabit, unitCangkul, unitTerpal];
    asetLain = (unitSprayer * 250_000) + (unitSabit * 50_000) + (unitCangkul * 75_000) + (unitTerpal * 150_000);
  } else {
    asetTanah = luasM2_f * 90_000;
    const unitSprayer = Math.max(1, Math.round(luasM2_f / 10000));
    const unitSabit   = Math.max(1, Math.round(luasM2_f / 3000));
    const unitCangkul = Math.max(1, Math.round(luasM2_f / 3000));
    alatUnits = [0, unitSprayer, unitSabit, unitCangkul];
    asetLain = (unitSprayer * 250_000) + (unitSabit * 50_000) + (unitCangkul * 75_000);
  }

  return {
    musim, ha, prod, luasM2_f,
    hokTotal, hokLaki, hokPerempuan, hokDibayar, hokTidakDibayar,
    pekerjaLaki, pekerjaPerempuan, pekerjaDibayar, pekerjaTidakDibayar, totalPekerja,
    pend, pendPetani, upah, upahHarian, biaya, oper, combiCost, bbmCost,
    sewaLahan, bagiHasilPot, non, totalPeng,
    asetTanah, asetLain, alatUnits,
    kondisiPanen: kondisiPanen ?? "Sedang",
    faktorKondisi,
  };
}

// ─── Tipe Params Hitung Utama ─────────────────────────────────────────────────
export type HitungParams = {
  kom: string;
  mode: string;
  luas: string;
  satLuas: string;
  panen: string;
  satPanen: string;
  musimTanam: string[];
  jenisTembakau: string;
  jumlahPohon: string;
  luasTembakau: string;
  status: string;
  kondisiPanen?: KondisiPanen;
  upahHarian?: number; // Rp/HOK (default UPAH_HOK)
};

// ─── Fungsi Hitung Utama ──────────────────────────────────────────────────────
export function hitungEstimasi(params: HitungParams): any | null {
  const {
    kom, mode, luas, satLuas, panen, satPanen,
    musimTanam, jenisTembakau, jumlahPohon, luasTembakau, status,
    kondisiPanen,
  } = params;
  const upahHarian = params.upahHarian;

  // ══════════════════════════════════════════════════════════════════════
  // JALUR TEMBAKAU
  // ══════════════════════════════════════════════════════════════════════
  if (kom === "Tembakau") {
    const TB       = TEMBAKAU;
    const isKering = jenisTembakau === "Tembakau Kering";
    const _faktorTembakau = kondisiPanenFaktor[kondisiPanen ?? "Sedang"] || 1.0;

    // ══════════════════════════════════════════════════════════════════════
    // TEMBAKAU KERING — input cuma kg daun basah yang mau dirajang
    // ══════════════════════════════════════════════════════════════════════
    if (isKering) {
      const kgBasah  = Math.max(1, parseFloat(jumlahPohon) || 100); // REUSE field "jumlahPohon" sebagai kg basah
      const kgKering = kgBasah * TB.susut;
      const nilaiProd = kgKering * TB.hargaKering;

      // ── Biaya produksi = Σ upah per jenis pekerjaan × kg ───────────────
      const pk = TB.pekerjaanKering;
      const biayaRajang = kgBasah * pk.ngrajang.upahPerKg;   // ngrajang (campuran: laki+perempuan)
      const biayaMepe   = kgBasah * pk.mepe.upahPerKg;       // mepe (dominan perempuan)
      const biayaSortasi= kgBasah * pk.sortasi.upahPerKg;    // sortasi (perempuan)
      const biayaPress  = kgBasah * pk.press.upahPerKg;      // press (dominan laki)
      const biayaPacking= kgBasah * pk.packing.upahPerKg;    // packing (campuran)
      const biayaProd   = biayaRajang + biayaMepe + biayaSortasi + biayaPress + biayaPacking;

      // ── Hitung HOK per jenis pekerjaan (upah ÷ upahHarian) ─────────────
      const _uh = params.upahHarian ?? UPAH_HOK;
      const hokRajang  = Math.max(1, Math.round(biayaRajang / _uh));
      const hokMepe    = Math.max(1, Math.round(biayaMepe / _uh));
      const hokSortasi = Math.max(1, Math.round(biayaSortasi / _uh));
      const hokPress   = Math.max(1, Math.round(biayaPress / _uh));
      const hokPacking = Math.max(1, Math.round(biayaPacking / _uh));

      const totalHOK        = hokRajang + hokMepe + hokSortasi + hokPress + hokPacking;
      const hokTidakDibayar = 2; // pemilik + keluarga
      const hokDibayar       = Math.max(1, totalHOK - hokTidakDibayar);
      const hokTotal         = hokDibayar + hokTidakDibayar;

      // Gender split: ngrajang=50:50, mepe/perempuan, press=laki, dll
      const hokLaki      = hokRajang + Math.round(hokRajang * 0.5) + hokPress;
      const hokPerempuan = hokMepe + hokSortasi + hokPacking + Math.round(hokRajang * 0.5);

      // Pekerja (jiwa) — dari HOK dibagi durasi (default 1 hari per jenis)
      const pekerjaTidakDibayar = 2;
      // Estimasi: tiap pekerja 1 hari per jenis kerja, bisa lebih kalau kg besar
      const pekerjaRajang  = Math.max(1, Math.ceil(kgBasah / 100));
      const pekerjaMepe    = Math.max(1, Math.ceil(kgBasah / 200));
      const pekerjaSortasi = Math.max(1, Math.ceil(kgBasah / 150));
      const pekerjaPress   = Math.max(1, Math.ceil(kgBasah / 300));
      const pekerjaPacking = Math.max(1, Math.ceil(kgBasah / 500));
      const pekerjaDibayar  = pekerjaRajang + pekerjaMepe + pekerjaSortasi + pekerjaPress + pekerjaPacking;
      const totalPekerja    = pekerjaDibayar + pekerjaTidakDibayar;

      // Gender pekerja jiwa
      const pekerjaLaki      = pekerjaRajang + pekerjaPress;
      const pekerjaPerempuan = pekerjaMepe + pekerjaSortasi + pekerjaPacking;

      // Operasional & non-tunai
      const ops = biayaProd * 0.15; // 15% dari biaya TK
      const nonT = 0;

      const totalPeng  = biayaProd + ops;
      const pendBersih = nilaiProd - totalPeng;

      const asetTanah_t = TB.asetTanah;
      const asetLain_t  = TB.asetMesinKecil + TB.asetMesinBesar + TB.asetWidek;
      const totalAset   = asetTanah_t + asetLain_t;

      return {
        isTembakau: true,
        jenis: jenisTembakau,
        kgBasah, kgKering,
        nilaiProd, biayaProd, ops, gajiTK: biayaProd, nonT, totalPeng, pendBersih,
        asetTanah_t, asetLain_t, totalAset, luasM2_t: TB.luasProduksi,
        upahHarian: _uh,
        hokTotal, hokLaki, hokPerempuan, hokDibayar, hokTidakDibayar,
        pekerjaLaki, pekerjaPerempuan, pekerjaDibayar, pekerjaTidakDibayar, totalPekerja,
        // Detail per pekerjaan
        hokRajang, hokMepe, hokSortasi, hokPress, hokPacking,
        biayaRajang, biayaMepe, biayaSortasi, biayaPress, biayaPacking,
        pekerjaRajang, pekerjaMepe, pekerjaSortasi, pekerjaPress, pekerjaPacking,
        musim: musimTanam[0] ?? "—",
        kondisiPanen: kondisiPanen ?? "Sedang",
        faktorKondisi: _faktorTembakau,
      };
    }

    // ══════════════════════════════════════════════════════════════════════
    // TEMBAKAU BASAH — pertahankan per 1.000 pohon
    // ══════════════════════════════════════════════════════════════════════
    const pohon    = Math.max(100, parseFloat(jumlahPohon) || 1000);
    const luasM2_t = Math.max(5,   parseFloat(luasTembakau) || 15);
    const ribuan   = pohon / 1000;

    const kgBasah  = TB.kgPer1000 * ribuan * _faktorTembakau;
    const kgKering = kgBasah * TB.susut;
    const nilaiProd = kgBasah * TB.hargaBasah;

    // HOK basah
    const totalHOK     = TB.hokPer1000 * ribuan;
    const hokLaki      = Math.round(totalHOK * TB.hokRasioLaki);
    const hokPerempuan = Math.round(totalHOK * (1 - TB.hokRasioLaki));
    const hokDibayar   = Math.max(1, Math.round(totalHOK * 0.8));
    const hokTidakDibayar = 2;
    const hokTotal     = hokDibayar + hokTidakDibayar;

    // Pekerja (Jiwa)
    const pekerjaTidakDibayar = 2;
    const pekerjaDibayar = Math.max(1, Math.round(ribuan * 3));
    const totalPekerja = pekerjaDibayar + pekerjaTidakDibayar;
    const pekerjaLaki = Math.max(1, Math.min(totalPekerja - 1, Math.round(totalPekerja * 0.50)));
    const pekerjaPerempuan = totalPekerja - pekerjaLaki;

    // HOK breakdown per pekerjaan (basah)
    const pb = TB.pekerjaanBasah;
    const tkKowak  = Math.max(1, Math.round(2 * ribuan));
    const tkMacul  = Math.max(1, Math.round(3 * ribuan));
    const tkTanam  = Math.max(1, Math.round(2 * ribuan));
    const tkMatun  = Math.max(1, Math.round(3 * ribuan));
    const tkPanen  = Math.max(1, Math.round(3 * ribuan));

    // Biaya TK basah = Σ HOK jenis × upah per HOK
    const biayaKowak  = tkKowak * pb.kowak.upahPerHOK;
    const biayaMacul  = tkMacul * pb.macul.upahPerHOK;
    const biayaTanam  = tkTanam * pb.tanam.upahPerHOK;
    const biayaMatun  = tkMatun * pb.matun.upahPerHOK;
    const biayaPanen  = tkPanen * pb.panen.upahPerHOK;
    const gajiTK      = biayaKowak + biayaMacul + biayaTanam + biayaMatun + biayaPanen;

    // Biaya produksi & operasional (per 1.000 pohon)
    const biayaProd = TB.saprotanBasahPer1000 * ribuan;
    const ops = TB.operBasahPer1000 * ribuan;
    const nonT = luasM2_t * TB.pbbPerM2;

    const totalPeng  = gajiTK + biayaProd + ops + nonT;
    const pendBersih = nilaiProd - totalPeng;

    const asetTanah_t = TB.asetTanah;
    const asetLain_t  = TB.asetMesinKecil + TB.asetWidek;
    const totalAset   = asetTanah_t + asetLain_t;

    return {
      isTembakau: true,
      jenis: jenisTembakau,
      pohon, ribuan, kgBasah, kgKering,
      nilaiProd, biayaProd, ops, gajiTK, nonT, totalPeng, pendBersih,
      asetTanah_t, asetLain_t, totalAset, luasM2_t,
      upahHarian: params.upahHarian ?? TB.upahHarian,
      hokTotal, hokLaki, hokPerempuan, hokDibayar, hokTidakDibayar,
      pekerjaLaki, pekerjaPerempuan, pekerjaDibayar, pekerjaTidakDibayar, totalPekerja,
      tkKowak, tkMacul, tkTanam, tkMatun, tkPanen,
      biayaKowak, biayaMacul, biayaTanam, biayaMatun, biayaPanen,
      musim: musimTanam[0] ?? "—",
      kondisiPanen: kondisiPanen ?? "Sedang",
      faktorKondisi: _faktorTembakau,
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  // JALUR KOMODITAS BIASA
  // ══════════════════════════════════════════════════════════════════════
  const d = db[kom];
  if (!d) {
    Alert.alert("Error", `Komoditas "${kom}" tidak ditemukan. Pilih komoditas yang tersedia.`);
    return null;
  }

  const musimList = kom === "Padi" && musimTanam.length > 0 ? musimTanam : [""];
  const hasilPerMusim = musimList.map((m) =>
    hitungSatuMusim({
      musim: m === "" ? (musimTanam[0] ?? "Rendengan") : m,
      kom, mode, luas, satLuas, panen, satPanen, status,
      kondisiPanen, upahHarian,
    })
  );

  if (hasilPerMusim.length === 1) {
    return { ...hasilPerMusim[0], musimList };
  }

  // ── Dua musim: akumulasi keuangan, aset dari musim pertama ───────────────
  const a = hasilPerMusim[0];
  const b = hasilPerMusim[1];
  const totalPekerjaDuaMusim = (a.pekerjaDibayar || 0) + (b.pekerjaDibayar || 0) + 4;
  const pekerjaLakiDuaMusim = Math.max(1, Math.min(totalPekerjaDuaMusim - 1, Math.round(totalPekerjaDuaMusim * 0.40)));
  const pekerjaPerempuanDuaMusim = totalPekerjaDuaMusim - pekerjaLakiDuaMusim;
  return {
    ...a,
    musimList,
    perMusim: hasilPerMusim,
    kondisiPanen: kondisiPanen ?? "Sedang",
    faktorKondisi: kondisiPanenFaktor[kondisiPanen ?? "Sedang"],
    upah:         a.upah  + b.upah,
    biaya:        a.biaya + b.biaya,
    oper:         a.oper  + b.oper,
    combiCost:    a.combiCost + b.combiCost,
    bbmCost:      a.bbmCost  + b.bbmCost,
    sewaLahan:    a.sewaLahan    + b.sewaLahan,
    bagiHasilPot: a.bagiHasilPot + b.bagiHasilPot,
    pendPetani:   a.pendPetani   + b.pendPetani,
    pend:         a.pend + b.pend,
    prod:         a.prod + b.prod,
    non:          a.non,
    totalPeng:    (a.totalPeng - a.non) + (b.totalPeng - b.non) + a.non,
    hokTotal:        a.hokTotal     + b.hokTotal,
    hokLaki:         a.hokLaki      + b.hokLaki,
    hokPerempuan:    a.hokPerempuan + b.hokPerempuan,
    hokDibayar:      a.hokDibayar   + b.hokDibayar,
    hokTidakDibayar: Math.max(a.hokTidakDibayar, b.hokTidakDibayar),
    pekerjaTidakDibayar: 4,
    pekerjaDibayar:      (a.pekerjaDibayar || 0) + (b.pekerjaDibayar || 0),
    totalPekerja:        totalPekerjaDuaMusim,
    pekerjaLaki:         pekerjaLakiDuaMusim,
    pekerjaPerempuan:    pekerjaPerempuanDuaMusim,
    asetTanah: a.asetTanah,
    asetLain:  a.asetLain,
    alatUnits: a.alatUnits,
    luasM2_f:  a.luasM2_f,
    ha:        a.ha,
  };
}
