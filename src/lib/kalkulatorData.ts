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
    { nama: "Pupuk Kandang",               vol: 300, satuan: "kg",    harga: 500     },
    { nama: "Pupuk Urea",                  vol: 30,  satuan: "kg",    harga: 2_200   },
    { nama: "Pupuk Za (KCl)",              vol: 15,  satuan: "kg",    harga: 1_500   },
    { nama: "Pestisida",                   vol: 0.2, satuan: "liter", harga: 50_000  },
  ],
  // Tembakau Rajangan (pascapanen): hanya bahan baku + sarana proses rajangan
  // Satuan per 100 kg daun basah yang diproses
  "Tembakau Kering": [
    { nama: "Tembakau matang (bahan baku)", vol: 100, satuan: "kg",   harga: 12_000  },
    { nama: "Widek (bambu rajang)",         vol: 1,   satuan: "unit", harga: 200_000 },
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
  const items = saprotanDetail[kom];
  if (!items || items.length === 0)
    return `Biaya saprotan Rp ${totalBiaya.toLocaleString("id-ID")} berdasarkan patokan lapangan`;

  // Tembakau Basah: unit per 1.000 pohon
  if (kom === "Tembakau Basah") {
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
      `\n  × ${ha.toFixed(2)} ribuan = Rp ${Math.round(totalBiaya).toLocaleString("id-ID")}` +
      `\n\n  ⚠ Harga dapat berbeda di lapangan.`
    );
  }

  // Tembakau Kering (Rajangan): biaya per 100 kg daun basah yang diproses
  if (kom === "Tembakau Kering") {
    // ha = kgBasah (total kg basah yang diproses)
    const kgBasahTotal = ha * 100; // ha dipakai sebagai satuan "per 100 kg"
    const lines = items.map((item) => {
      // vol per 100 kg: tembakau matang 100 kg, widek 1 unit
      const totalItem = item.vol * item.harga * (kgBasahTotal / 100);
      const volActual = item.vol * (kgBasahTotal / 100);
      const volStr = volActual % 1 === 0 ? volActual.toFixed(0) : volActual.toFixed(1);
      return `  • ${item.nama.padEnd(32)} ${volStr} ${item.satuan.padEnd(6)} × Rp ${item.harga.toLocaleString("id-ID")} = Rp ${Math.round(totalItem).toLocaleString("id-ID")}`;
    });
    const perSatuanTotal = items.reduce((s, i) => s + i.vol * i.harga, 0);
    return (
      `Biaya Produksi (26.b) — Usaha Rajangan Tembakau:\n` +
      `Hanya komponen yang digunakan dalam proses rajangan (pascapanen):\n\n` +
      lines.join("\n") +
      `\n\n  Per 100 kg basah = Rp ${Math.round(perSatuanTotal).toLocaleString("id-ID")}` +
      `\n  Total (${Math.round(kgBasahTotal).toLocaleString("id-ID")} kg basah) = Rp ${Math.round(totalBiaya).toLocaleString("id-ID")}` +
      `\n\n  ⚠ Tidak termasuk biaya budidaya (pupuk, pestisida). Tembakau matang dibeli sebagai bahan baku siap rajang.`
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

// ─── Konstanta Tembakau (per 1.000 pohon, BPS realistis Bojonegoro) ────────────
export const TEMBAKAU = {
  // Produksi — Tembakau Virginia Bojonegoro (tembakau rajang/kering)
  kgPer1000:      180,    // kg daun basah per 1.000 pohon (realistis Bojonegoro)
  susut:          0.20,   // konversi basah → kering (20% yield = 80% susut)

  // Harga jual patokan Bojonegoro 2026
  hargaBasah:     12_000, // Rp/kg daun basah (tembakau daun segar petik, patokan Bojonegoro)
  hargaKering:    65_000, // Rp/kg daun kering rajang siap jual

  // HOK per 1.000 pohon (BASAH) — total dari 5 jenis pekerjaan
  hokPer1000:     13,     // kowak(2) + macul(3) + tanam(2) + matun(3) + panen(3)
  hokRasioLaki:   0.5,    // tembakau basah: 50% laki-laki

  // Upah harian (Rp/HOK) — patokan Bojonegoro 2026
  upahHarian:     75_000,

  // ── Detail upah per jenis pekerjaan TEMBAKAU KERING (per kg basah) ────────
  // Biaya TK rajang = biaya produksi tembakau kering (rajang, jemur, sortasi)
  // Setiap pekerjaan punya upah per kg + gender dominan
  pekerjaanKering: {
    ngrajang:  { label: "Ngrajang (rajang daun)", upahPerKg: 1_500, gender: "campuran" as const },
    mepe:      { label: "Mepe (jemur daun)",      upahPerKg: 500,   gender: "perempuan" as const },
    sortasi:   { label: "Sortasi (pilih kualitas)", upahPerKg: 300,  gender: "perempuan" as const },
    press:     { label: "Press (press bal)",        upahPerKg: 200,  gender: "laki" as const },
    packing:   { label: "Packing (karung/ikat)",   upahPerKg: 100,   gender: "campuran" as const },
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
  // Sesuai spec: Gaji 500k, Biaya Produksi 400k, Ops 180k → Nilai Prod 3.000.000
  gajiBasahPer1000:     500_000,
  saprotanBasahPer1000: 400_000,
  operBasahPer1000:     180_000,
  nilaiBasahPer1000:    3_000_000, // Nilai produksi per 1.000 pohon (flat, sesuai spec)

  // ── Biaya per siklus KERING ───────────────────────────────────────────────
  // Sesuai spec: Gaji 150k, Biaya Produksi 800k, Ops 100k → Nilai Prod 4.800.000
  // Tembakau Kering: input = jumlah siklus/batch
  gajiKeringFlat:        150_000, // Rp gaji TK per siklus kering (flat, sesuai spec)
  gajiKeringPer1000:     0,       // tidak dipakai (legacy)
  saprotanKeringPer1000: 800_000, // biaya input produksi per siklus kering
  operKeringPer1000:     100_000, // biaya operasional per siklus kering
  nilaiKeringPerSiklus:  4_800_000, // Nilai produksi per siklus kering (flat, sesuai spec)

  // Aset (SESUAI SPEC: hanya Mesin Kecil + Widek — tanah/bangunan/mesin besar TIDAK diakui)
  asetTanah:       0,           // tidak diakui per spec
  asetMesinKecil:  1_000_000,   // Rp 1.000.000
  asetMesinBesar:  0,           // tidak diakui per spec
  asetWidek:         800_000,   // Rp 800.000
  // Total aset = 1.800.000 (Mesin Kecil + Widek)
  luasProduksi:         15,   // m²

  // PBB (hanya untuk basah)
  pbbPerM2:           500,    // Rp/m²/tahun
};

// ─── Data Peternakan — FLAT per siklus (sesuai spec gemini-code-1783406649841) ──
// Satuan: per siklus usaha (bukan per ekor × bulan)
export type PeternakanData = {
  jenis:           string;
  satuan:          string;
  hargaJual:       number;   // Rp per ekor saat dijual
  beratJual:       number;   // kg per ekor saat dijual
  hargaPerKg:      number;   // Rp/kg bobot hidup
  periodeBulan:    number;   // lama 1 siklus (bulan)
  // ── Flat per siklus (sesuai spec) ──
  nilaiProduksi:   number;   // Nilai Produksi per siklus (Rp)
  biayaProduksi:   number;   // Biaya Pakan+Vaksin per siklus (Rp)
  biayaOps:        number;   // Biaya Operasional per siklus (Rp)
  gajiDefault:     number;   // Gaji TK default per siklus jika ada pekerja (Rp)
  // Legacy (untuk HOK estimasi)
  tenagaPerEkor:   number;
  upahPerHOK:      number;
  // Kandang
  nilaiKandangPerEkor: number;
};

export const dbTernak: Record<string, PeternakanData> = {
  // ── AYAM KAMPUNG ──────────────────────────────────────────────────────────
  // Spec: Mandiri (Owner) → Gaji Rp 0, BiayaProd 1.500.000, Ops 200.000, NilaiProd 3.000.000
  "Ayam Kampung": {
    jenis:            "Ayam Kampung",
    satuan:           "ekor",
    hargaJual:        75_000,
    beratJual:        1.3,
    hargaPerKg:       58_000,
    periodeBulan:     3,
    nilaiProduksi:    3_000_000,
    biayaProduksi:    1_500_000,
    biayaOps:         200_000,
    gajiDefault:      0,          // Mandiri — pemilik sendiri
    tenagaPerEkor:    0.9,
    upahPerHOK:       70_000,
    nilaiKandangPerEkor: 50_000,
  },
  // ── AYAM BROILER ──────────────────────────────────────────────────────────
  // Spec (dari tabel Ayam): sama dengan Ayam Kampung — Mandiri
  "Ayam Broiler": {
    jenis:            "Ayam Broiler",
    satuan:           "ekor",
    hargaJual:        40_000,
    beratJual:        2.0,
    hargaPerKg:       20_000,
    periodeBulan:     1.2,
    nilaiProduksi:    3_000_000,
    biayaProduksi:    1_500_000,
    biayaOps:         200_000,
    gajiDefault:      0,          // Mandiri — pemilik sendiri
    tenagaPerEkor:    0.2,
    upahPerHOK:       70_000,
    nilaiKandangPerEkor: 50_000,
  },
  // ── KAMBING ───────────────────────────────────────────────────────────────
  // Spec: Pekerja → Gaji 600.000, BiayaProd 1.200.000, Ops 200.000, NilaiProd 3.500.000
  "Kambing": {
    jenis:            "Kambing",
    satuan:           "ekor",
    hargaJual:        1_200_000,
    beratJual:        30,
    hargaPerKg:       40_000,
    periodeBulan:     6,
    nilaiProduksi:    3_500_000,
    biayaProduksi:    1_200_000,
    biayaOps:         200_000,
    gajiDefault:      600_000,    // Ada pekerja
    tenagaPerEkor:    3,
    upahPerHOK:       70_000,
    nilaiKandangPerEkor: 500_000,
  },
  // ── SAPI ──────────────────────────────────────────────────────────────────
  // Spec: Pekerja → Gaji 1.000.000, BiayaProd 3.000.000, Ops 500.000, NilaiProd 8.000.000
  "Sapi": {
    jenis:            "Sapi",
    satuan:           "ekor",
    hargaJual:        20_000_000,
    beratJual:        400,
    hargaPerKg:       50_000,
    periodeBulan:     8,
    nilaiProduksi:    8_000_000,
    biayaProduksi:    3_000_000,
    biayaOps:         500_000,
    gajiDefault:      1_000_000,  // Ada pekerja
    tenagaPerEkor:    15,
    upahPerHOK:       70_000,
    nilaiKandangPerEkor: 3_000_000,
  },
};

// ─── Tipe Hasil Peternakan ────────────────────────────────────────────────────
export type HasilPeternakan = {
  isPeternakan: true;
  jenisTernak:  string;
  jumlahEkor:   number;
  periodeBulan: number;

  // Produksi & pendapatan
  nilaiProd:    number;
  beratTotal:   number;

  // Biaya (flat per siklus, sesuai spec)
  biayaPakan:   number;   // = biayaProduksi dari spec (pakan+vaksin)
  biayaObat:    number;   // = 0 (sudah masuk biayaPakan)
  biayaTK:      number;   // gaji TK
  biayaOps:     number;   // biaya operasional
  biayaLain:    number;   // 0 (tidak dipakai di model flat)
  totalPeng:    number;

  // TK
  hokTotal:         number;
  hokDibayar:       number;
  hokTidakDibayar:  number;
  hokLaki:          number;
  hokPerempuan:     number;
  pekerjaLaki:      number;
  pekerjaPerempuan: number;
  pekerjaDibayar:   number;
  pekerjaTidakDibayar: number;
  totalPekerja:     number;

  // Aset
  asetKandang:  number;
  asetTernak:   number;
  totalAset:    number;

  // Profit
  pendBersih:   number;

  // Meta
  upahHarian:   number;
  status:       string;
  mandiri:      boolean;  // true = owner kerja sendiri (gaji=0)
};

// ─── Hitung Peternakan ────────────────────────────────────────────────────────
// Model flat per siklus sesuai spec gemini-code-1783406649841:
//   Laba = NilaiProduksi - (hitungTotalGaji(jP, uP) + biayaProduksi + biayaOps)
//   hitungTotalGaji: jika pekerja=0 atau upah=0 → return 0 (Mandiri/Owner)
export function hitungPeternakan(params: {
  jenisTernak:  string;
  jumlahEkor:   string;
  status:       string;
  upahHarian?:  number;
  kondisiPanen?: KondisiPanen;
  // Override manual dari user (opsional)
  overridePekerjaLaki?:      number;  // jumlah pekerja laki-laki (jiwa)
  overridePekerjaPerempuan?: number;  // jumlah pekerja perempuan (jiwa)
  overrideDibayar?:          boolean; // true = ada pekerja dibayar, false = mandiri
}): HasilPeternakan | null {
  const d = dbTernak[params.jenisTernak];
  if (!d) return null;

  const jumlahEkor = Math.max(1, parseInt(params.jumlahEkor) || 1);
  const uh         = params.upahHarian ?? 0; // default 0 → owner
  const faktor     = kondisiPanenFaktor[params.kondisiPanen ?? "Sedang"] || 1.0;

  // ── Nilai produksi flat × jumlah ekor × faktor kondisi ───────────────────
  const nilaiProd  = Math.round(d.nilaiProduksi * jumlahEkor * faktor);
  const beratTotal = d.beratJual * jumlahEkor * faktor;

  // ── Biaya produksi & ops flat × jumlah ekor ───────────────────────────────
  const biayaPakan = d.biayaProduksi * jumlahEkor; // pakan + vaksin
  const biayaObat  = 0;                             // sudah termasuk biayaPakan
  const biayaOps   = d.biayaOps * jumlahEkor;

  // ── Algoritma gaji sesuai spec ────────────────────────────────────────────
  // hitungTotalGaji: jika jumlahPekerja<=0 || upahPerPekerja<=0 → return 0
  // Interpretasi: upah diinput user (uh); jika 0 = mandiri/owner
  // Override: jika overrideDibayar diset, gunakan itu; jika tidak, fallback ke uh
  const mandiri = params.overrideDibayar !== undefined
    ? !params.overrideDibayar
    : uh <= 0;
  const biayaTK = mandiri ? 0 : d.gajiDefault * jumlahEkor;

  // ── Status lahan (bagi hasil) ─────────────────────────────────────────────
  let bagiHasilPot = 0;
  if (params.status === "Bagi Hasil") {
    bagiHasilPot = nilaiProd * 0.30;
  }

  const totalPeng  = biayaTK + biayaPakan + biayaOps + bagiHasilPot;
  const pendBersih = nilaiProd - totalPeng;

  // ── TK — HOK estimasi untuk form SE2026 ───────────────────────────────────
  const totalHOKBase    = Math.max(1, Math.round(d.tenagaPerEkor * jumlahEkor));
  const hokTidakDibayar = mandiri ? totalHOKBase : Math.max(1, Math.round(totalHOKBase * 0.20));
  const hokDibayar      = mandiri ? 0 : Math.max(0, totalHOKBase - hokTidakDibayar);
  const hokLaki         = Math.max(1, Math.round(totalHOKBase * 0.60));
  const hokPerempuan    = Math.max(0, totalHOKBase - hokLaki);
  const hokTotal        = hokDibayar + hokTidakDibayar;

  // ── Pekerja jiwa — gunakan override dari user jika ada ───────────────────
  const pekerjaTidakDibayarAuto = mandiri ? 2 : 1;
  const pekerjaDibayarAuto      = mandiri ? 0 : Math.max(1, jumlahEkor <= 2 ? 1 : Math.ceil(jumlahEkor / 2));
  const totalPekerjaAuto        = pekerjaDibayarAuto + pekerjaTidakDibayarAuto;
  const pekerjaLakiAuto         = mandiri ? 1 : Math.max(1, Math.min(totalPekerjaAuto - 1, Math.round(totalPekerjaAuto * 0.65)));
  const pekerjaPerempuanAuto    = mandiri ? 1 : totalPekerjaAuto - pekerjaLakiAuto;

  // Terapkan override jika user mengisi manual
  const pekerjaLaki         = params.overridePekerjaLaki      != null && params.overridePekerjaLaki >= 0
    ? params.overridePekerjaLaki      : pekerjaLakiAuto;
  const pekerjaPerempuan    = params.overridePekerjaPerempuan != null && params.overridePekerjaPerempuan >= 0
    ? params.overridePekerjaPerempuan : pekerjaPerempuanAuto;
  const pekerjaDibayar      = mandiri ? 0 : Math.max(1, pekerjaDibayarAuto);
  const pekerjaTidakDibayar = mandiri ? (pekerjaLaki + pekerjaPerempuan) : Math.max(1, pekerjaTidakDibayarAuto);
  const totalPekerja        = pekerjaLaki + pekerjaPerempuan;

  // ── Aset ──────────────────────────────────────────────────────────────────
  const asetKandang = d.nilaiKandangPerEkor * jumlahEkor;
  const asetTernak  = Math.round(d.hargaJual * jumlahEkor * faktor);
  const totalAset   = asetKandang + asetTernak;

  return {
    isPeternakan: true,
    jenisTernak:  params.jenisTernak,
    jumlahEkor,
    periodeBulan: d.periodeBulan,
    nilaiProd,
    beratTotal,
    biayaPakan,
    biayaObat,
    biayaTK,
    biayaOps,
    biayaLain: 0,
    totalPeng,
    hokTotal, hokDibayar, hokTidakDibayar,
    hokLaki, hokPerempuan,
    pekerjaLaki, pekerjaPerempuan,
    pekerjaDibayar, pekerjaTidakDibayar, totalPekerja,
    asetKandang, asetTernak, totalAset,
    pendBersih,
    upahHarian: uh,
    status: params.status,
    mandiri,
  };
}

// ─── Peta Kategori → Komoditas ────────────────────────────────────────────────
export const kategoriMap: Record<string, string[]> = {
  "Tanaman Pangan": ["Padi", "Jagung", "Kedelai", "Kacang Hijau"],
  "Perkebunan":     ["Tembakau", "Tebu", "Bawang Merah", "Cabai"],
  "Peternakan":     ["Ayam Kampung", "Ayam Broiler", "Kambing", "Sapi"],
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
export function getSewaPerHa(kom: string): number {
  switch (kom) {
    case "Padi": return 12_000_000;
    case "Bawang Merah": return 12_000_000;
    case "Cabai": return 12_000_000;
    case "Tebu": return 8_000_000;
    case "Jagung": return 5_000_000;
    case "Kedelai": return 2_500_000;
    case "Kacang Hijau": return 2_000_000;
    default: return 5_000_000;
  }
}
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
  let upah = hokDibayar * upahHarian;

  // Cek jika upah melebihi 45% dari pend, sesuaikan upah agar rasio wajar (< 60%)
  if (pend > 0 && upah > pend * 0.45) {
    upah = Math.round(pend * 0.45);
  }

  // Saprotan
  const saprotanDasar = ribuan * d.sapr1000;
  const rasioWalikan  = (kom === "Padi" && musim === "Walikan") ? 1.03 : 1.0;
  let biaya = saprotanDasar * rasioWalikan;

  // Operasional: per 1.000 kg, lalu tambah BBM Walikan
  const combiCost = ribuan * d.ops1000;
  const bbmCost   = (kom === "Padi" && musim === "Walikan") ? ha * 187_500 : 0;
  let oper      = combiCost + bbmCost;

  // Status lahan
  let sewaLahan    = 0;
  let bagiHasilPot = 0;
  let pendPetani   = pend;

  if (status === "Sewa") {
    sewaLahan = ha * getSewaPerHa(kom);
    biaya    += sewaLahan;
  } else if (status === "Bagi Hasil") {
    bagiHasilPot = pend * RASIO_BH;
    pendPetani   = pend * (1 - RASIO_BH);
  }

  const non       = PBB_TAHUNAN;
  
  // Hitung total pengeluaran sementara
  let totalPeng = upah + biaya + oper + bagiHasilPot + non;

  // Jika total pengeluaran melampaui 85% dari pendapatan, turunkan biaya & operasional
  if (pend > 0 && totalPeng > pend * 0.85) {
    const targetTotalPeng = pend * 0.85;
    const sisaBoleh = targetTotalPeng - upah - bagiHasilPot - non;
    if (sisaBoleh > 0) {
      const biayaOperTotal = biaya + oper;
      if (biayaOperTotal > 0) {
        const factor = sisaBoleh / biayaOperTotal;
        biaya = biaya * factor;
        oper = oper * factor;
        if (sewaLahan > 0) {
          sewaLahan = sewaLahan * factor;
        }
      }
    } else {
      bagiHasilPot = status === "Bagi Hasil" ? pend * 0.35 : 0;
      upah = pend * 0.35;
      biaya = pend * 0.10;
      oper = pend * 0.04;
      if (sewaLahan > 0) sewaLahan = pend * 0.05;
    }
    totalPeng = upah + biaya + oper + bagiHasilPot + non;
    pendPetani = pend - bagiHasilPot;
  }

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
  // Override peternakan (opsional — dari input user)
  peternakanLaki?:      number;
  peternakanPerempuan?: number;
  peternakanDibayar?:   boolean;
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
    // TEMBAKAU KERING (Rajangan) — usaha pascapanen/pengolahan
    // Input: jumlahPohon = kg daun basah yang akan dirajang
    // Biaya produksi: tembakau matang (bahan baku) + widek
    // Tidak ada luas lahan, tidak ada biaya budidaya
    // ══════════════════════════════════════════════════════════════════════
    if (isKering) {
      const kgBasah  = Math.max(1, parseFloat(jumlahPohon) || 100);
      const kgKering = kgBasah * TB.susut * _faktorTembakau;

      // ── Biaya produksi berbasis input aktual (per 100 kg basah) ──────
      // Tembakau matang (bahan baku): kgBasah kg × Rp 12.000/kg
      const biayaTembakauMatang = kgBasah * 12_000;
      // Widek: 1 unit per 100 kg = ceil(kgBasah/100) unit × Rp 200.000
      const jumlahWidek = Math.max(1, Math.ceil(kgBasah / 100));
      const biayaWidek  = jumlahWidek * 200_000;
      const biayaProd   = biayaTembakauMatang + biayaWidek;

      // ── Gaji TK rajangan (berbasis kg basah) ─────────────────────────
      // Ngrajang: Rp 1.500/kg, Mepe: Rp 500/kg, Sortasi: Rp 300/kg,
      // Press: Rp 200/kg, Packing: Rp 100/kg → total Rp 2.600/kg
      const upahPerKgTotal = 1_500 + 500 + 300 + 200 + 100; // 2.600/kg
      const gajiTK = Math.round(kgBasah * upahPerKgTotal);

      // Rincian per pekerjaan (untuk display)
      const biayaRajang  = Math.round(kgBasah * 1_500);
      const biayaMepe    = Math.round(kgBasah * 500);
      const biayaSortasi = Math.round(kgBasah * 300);
      const biayaPress   = Math.round(kgBasah * 200);
      const biayaPacking = Math.round(kgBasah * 100);

      // ── Biaya operasional (bahan bakar, karung, dll) ──────────────────
      // ~15% dari gaji TK rajangan
      const ops = Math.round(gajiTK * 0.15);

      // ── Nilai produksi berbasis konversi aktual ───────────────────────
      const nilaiProd = Math.round(kgKering * TB.hargaKering);

      const nonT = 0; // tidak ada PBB untuk usaha rajangan

      // ── HOK estimasi berbasis skala rajangan ──────────────────────────
      // 1 orang bisa merajang ~50 kg basah/hari, mepe ~30 kg/hari
      const hokNgrajang  = Math.max(1, Math.ceil(kgBasah / 50));
      const hokMepe      = Math.max(1, Math.ceil(kgBasah / 30));
      const hokSortasi   = Math.max(1, Math.ceil(kgBasah / 60));
      const hokPress     = Math.max(1, Math.ceil(kgBasah / 100));
      const hokPacking   = Math.max(1, Math.ceil(kgBasah / 100));
      const totalHOKBase    = hokNgrajang + hokMepe + hokSortasi + hokPress + hokPacking;
      const hokTidakDibayar = Math.min(2, totalHOKBase);
      const hokDibayar      = Math.max(0, totalHOKBase - hokTidakDibayar);
      const hokLaki         = Math.max(1, Math.round(totalHOKBase * 0.40)); // rajang: lebih banyak perempuan
      const hokPerempuan    = totalHOKBase - hokLaki;
      const hokTotal        = hokDibayar + hokTidakDibayar;

      // ── Pekerja jiwa (realistis untuk usaha rajangan) ─────────────────
      // Skala kecil: 1–2 orang rajang, 1–2 orang mepe, 1 sortasi
      const pekerjaTidakDibayar = Math.min(2, Math.max(1, Math.ceil(kgBasah / 200)));
      const pekerjaDibayar      = Math.max(0, Math.ceil(kgBasah / 100) - pekerjaTidakDibayar);
      const totalPekerja        = pekerjaDibayar + pekerjaTidakDibayar;
      const pekerjaPerempuan    = Math.max(1, Math.round(totalPekerja * 0.60)); // mepe & sortasi dominan perempuan
      const pekerjaLaki         = Math.max(0, totalPekerja - pekerjaPerempuan);

      // ── Status usaha ──────────────────────────────────────────────────
      let sewaLahan    = 0;
      let bagiHasilPot = 0;
      let pendPetani   = nilaiProd;
      // Rajangan tidak punya lahan — status "Bagi Hasil" berarti bagi hasil pengolahan
      if (status === "Bagi Hasil") {
        bagiHasilPot = nilaiProd * 0.30; // bagi hasil jasa rajangan 30%
        pendPetani   = nilaiProd * 0.70;
      }

      const totalPeng  = gajiTK + biayaProd + ops + sewaLahan + bagiHasilPot;
      const pendBersih = nilaiProd - totalPeng;

      // ── Aset: hanya peralatan rajangan ────────────────────────────────
      // Mesin rajang (jika ada) + Widek + Timbangan + Rak jemur
      const asetMesinRajang = kgBasah >= 100 ? TB.asetMesinKecil : 0; // mesin rajang hanya jika skala ≥100 kg
      const asetWidekAset   = jumlahWidek * 200_000;                   // nilai widek yang dimiliki
      const asetTimbangan   = 150_000;                                  // timbangan
      const asetRakJemur    = Math.max(1, Math.ceil(kgBasah / 200)) * 100_000; // rak jemur
      const asetLain_t      = asetMesinRajang + asetWidekAset + asetTimbangan + asetRakJemur;
      const asetTanah_t     = 0; // tidak ada tanah untuk usaha rajangan
      const totalAset       = asetLain_t;

      return {
        isTembakau: true,
        jenis: jenisTembakau,
        kgBasah, kgKering,
        jumlahWidek,
        biayaTembakauMatang, biayaWidek,
        nilaiProd, biayaProd, ops, gajiTK, nonT, totalPeng, pendBersih,
        asetTanah_t, asetLain_t, totalAset,
        asetMesinRajang, asetWidekAset, asetTimbangan, asetRakJemur,
        luasM2_t: 0, // tidak ada luas lahan untuk rajangan
        upahHarian: params.upahHarian ?? TB.upahHarian,
        bagiHasilPot, sewaLahan,
        hokTotal, hokLaki, hokPerempuan, hokDibayar, hokTidakDibayar,
        hokNgrajang, hokMepe, hokSortasi, hokPress, hokPacking,
        pekerjaLaki, pekerjaPerempuan, pekerjaDibayar, pekerjaTidakDibayar, totalPekerja,
        biayaRajang, biayaMepe, biayaSortasi, biayaPress, biayaPacking,
        pekerjaRajang: Math.max(1, Math.ceil(kgBasah / 100)),
        pekerjaMepe: Math.max(1, Math.ceil(kgBasah / 150)),
        pekerjaSortasi: Math.max(1, Math.ceil(kgBasah / 200)),
        pekerjaPress: 1,
        pekerjaPacking: 1,
        musim: musimTanam[0] ?? "—",
        kondisiPanen: kondisiPanen ?? "Sedang",
        faktorKondisi: _faktorTembakau,
        jumlahSiklus: Math.ceil(kgBasah / 100), // informasi siklus (per 100 kg)
      };
    }

    // ══════════════════════════════════════════════════════════════════════
    // TEMBAKAU BASAH — per 1.000 pohon
    // ══════════════════════════════════════════════════════════════════════
    const pohon    = Math.max(100, parseFloat(jumlahPohon) || 1000);
    const luasM2_t = Math.max(5,   parseFloat(luasTembakau) || 15);
    const ribuan   = pohon / 1000;

    // ── Nilai produksi FLAT per 1.000 pohon sesuai spec ──────────────────
    const nilaiProd = TB.nilaiBasahPer1000 * ribuan * _faktorTembakau;
    const kgBasah   = TB.kgPer1000 * ribuan * _faktorTembakau; // estimasi berat (display)
    const kgKering  = kgBasah * TB.susut;

    // HOK breakdown per pekerjaan (basah) — konsisten dengan hokPer1000 = 13
    const pb = TB.pekerjaanBasah;
    const tkKowak  = Math.max(1, Math.round(2 * ribuan));
    const tkMacul  = Math.max(1, Math.round(3 * ribuan));
    const tkTanam  = Math.max(1, Math.round(2 * ribuan));
    const tkMatun  = Math.max(1, Math.round(3 * ribuan));
    const tkPanen  = Math.max(1, Math.round(3 * ribuan));

    // HOK basah total = jumlah dari semua jenis pekerjaan
    const totalHOKBase = tkKowak + tkMacul + tkTanam + tkMatun + tkPanen;
    const hokLaki      = Math.round(totalHOKBase * TB.hokRasioLaki);
    const hokPerempuan = totalHOKBase - hokLaki;
    const hokTidakDibayar = 2;
    const hokDibayar   = Math.max(1, totalHOKBase - hokTidakDibayar);
    const hokTotal     = hokDibayar + hokTidakDibayar;

    // ── Gaji TK FLAT sesuai spec: 500.000 per 1.000 pohon ────────────────
    // Tidak dihitung dari HOK×upah supaya tidak terdistorsi oleh cap
    const gajiTK = TB.gajiBasahPer1000 * ribuan;

    // Biaya per pekerjaan — proporsional dari gajiTK flat untuk display
    const biayaKowak  = Math.round(gajiTK * (tkKowak  / totalHOKBase));
    const biayaMacul  = Math.round(gajiTK * (tkMacul  / totalHOKBase));
    const biayaTanam  = Math.round(gajiTK * (tkTanam  / totalHOKBase));
    const biayaMatun  = Math.round(gajiTK * (tkMatun  / totalHOKBase));
    const biayaPanen  = gajiTK - biayaKowak - biayaMacul - biayaTanam - biayaMatun;

    // Pekerja (Jiwa) — berdasarkan HOK per jenis pekerjaan
    const pekerjaTidakDibayar = 2; // pemilik + keluarga
    const pekerjaDibayar = Math.max(1, Math.round(ribuan * 4));
    const totalPekerja = pekerjaDibayar + pekerjaTidakDibayar;
    const pekerjaLaki = Math.max(1, Math.min(totalPekerja - 1, Math.round(totalPekerja * 0.50)));
    const pekerjaPerempuan = totalPekerja - pekerjaLaki;

    // Biaya produksi & operasional (per 1.000 pohon) — FLAT sesuai spec
    // Basah: saprotan 400k, ops 180k per 1.000 pohon
    let biayaProd = TB.saprotanBasahPer1000 * ribuan;
    let ops = TB.operBasahPer1000 * ribuan;
    const nonT = luasM2_t * TB.pbbPerM2;

    // Status
    let sewaLahan = 0;
    let bagiHasilPot = 0;
    let pendPetani = nilaiProd;
    if (status === "Sewa") {
      sewaLahan = (luasM2_t / 10000) * 10_000_000;
      biayaProd += sewaLahan;
    } else if (status === "Bagi Hasil") {
      bagiHasilPot = nilaiProd * 0.50;
      pendPetani = nilaiProd * 0.50;
    }

    const totalPeng = gajiTK + biayaProd + ops + nonT + bagiHasilPot;
    const pendBersih = nilaiProd - totalPeng;

    // ── Aset: Mesin Kecil + Widek SAJA (sesuai spec) ──────────────────────
    const asetTanah_t = 0;
    const asetLain_t  = TB.asetMesinKecil + TB.asetWidek; // 1.000.000 + 800.000 = 1.800.000
    const totalAset   = asetLain_t;

    return {
      isTembakau: true,
      jenis: jenisTembakau,
      pohon, ribuan, kgBasah, kgKering,
      nilaiProd, biayaProd, ops, gajiTK, nonT, totalPeng, pendBersih,
      asetTanah_t, asetLain_t, totalAset, luasM2_t,
      upahHarian: params.upahHarian ?? TB.upahHarian,
      bagiHasilPot, sewaLahan,
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
  // JALUR PETERNAKAN (Ayam, Kambing, Sapi)
  // ══════════════════════════════════════════════════════════════════════
  if (dbTernak[kom]) {
    return hitungPeternakan({
      jenisTernak:  kom,
      jumlahEkor:   jumlahPohon, // reuse field jumlahPohon untuk input jumlah ekor
      status,
      upahHarian,
      kondisiPanen,
      overridePekerjaLaki:      params.peternakanLaki,
      overridePekerjaPerempuan: params.peternakanPerempuan,
      overrideDibayar:          params.peternakanDibayar,
    });
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
