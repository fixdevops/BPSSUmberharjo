// ─── Data & Logika Kalkulator SE2026 — Versi BPS Realistis ──────────────────
//
// PRINSIP:
//   • Luas    → hektar (ha)
//   • Produksi → kg/ha (produktivitas BPS)
//   • TK      → HOK/ha (Hari Orang Kerja per hektar)
//   • Biaya   → rasio dari nilai produksi (ekonomi produksi standar)
//   • Tembakau → per 1.000 pohon (satuan plot standar BPS)
//   • Gender   → 40% laki-laki : 60% perempuan (BPS lapangan)

import { Alert } from "react-native";

// ─── Tipe Database Komoditas ──────────────────────────────────────────────────
export type KomoditasData = {
  prod:  number;   // produktivitas (kg/ha per musim)
  harga: number;   // harga jual (Rp/kg)
  t:     number;   // kebutuhan TK total (HOK/ha per musim)
  b:     number;   // rasio biaya saprotan terhadap nilai produksi
};

// ─── Database Komoditas (BPS-like) ───────────────────────────────────────────
export const db: Record<string, KomoditasData> = {
  Padi: {
    prod:  5500,   // kg/ha — rata-rata BPS 5–6 ton/ha
    harga: 6500,   // Rp/kg GKP
    t:     25,     // HOK/ha: olah tanah 5 + tanam 6 + rawat 8 + panen 6
    b:     0.35,   // ~35% nilai produksi (pupuk + benih + OPT)
  },
  Jagung: {
    prod:  6000,
    harga: 5000,
    t:     18,     // HOK/ha: tanam 5 + rawat 6 + panen 7
    b:     0.30,
  },
  Kedelai: {
    prod:  1800,
    harga: 9000,
    t:     20,     // HOK/ha: tanam 6 + rawat 8 + panen cabut 6
    b:     0.40,
  },
  "Kacang Hijau": {
    prod:  1200,
    harga: 12000,
    t:     16,     // HOK/ha: tanam 5 + rawat 5 + panen petik 6
    b:     0.35,
  },
  "Bawang Merah": {
    prod:  10000,
    harga: 25000,
    t:     80,     // HOK/ha: padat karya, tanam + rawat intensif
    b:     0.60,
  },
  Cabai: {
    prod:  8000,
    harga: 30000,
    t:     70,
    b:     0.65,
  },
  Tebu: {
    prod:  80000,
    harga: 700,
    t:     40,
    b:     0.50,
  },
};

// ─── Konstanta Tembakau (per 1.000 pohon, BPS realistis) ─────────────────────
export const TEMBAKAU = {
  // Produksi (BPS realistis: 80–200 kg/1.000 pohon)
  kgPer1000:      120,    // kg daun basah per 1.000 pohon
  susut:          0.12,   // konversi basah → kering (susut ±88%)

  // Harga jual
  hargaBasah:     4_000,  // Rp/kg daun basah
  hargaKering:    35_000, // Rp/kg daun kering

  // HOK per 1.000 pohon
  hokPer1000:     8,      // total HOK: kowak 2 + macul 3 + panen 3
  hokRasioLaki:   0.5,    // tembakau basah: 50% laki-laki
  hokRasioKering: 0.3,    // tembakau kering: lebih banyak perempuan (rajang, mepe)

  // Upah harian (Rp/HOK)
  upahHarian:     75_000,

  // Biaya saprotan per 1.000 pohon
  saprotanPer1000:  350_000,
  operPer1000:      130_000,

  // Tembakau kering: upah per kg basah
  upahRajang:     2_000,  // Rp/kg basah
  upahMepe:         500,  // Rp/kg basah

  // Aset (tetap, per unit usaha)
  asetTanah:      1_500_000,  // 15 m² × Rp 100.000/m²
  asetMesin:      2_000_000,
  asetWidek:        800_000,
  luasProduksi:       15,     // m²

  // PBB
  pbbPerM2:          500,     // Rp/m²/tahun
};

// ─── Peta Kategori → Komoditas ────────────────────────────────────────────────
export const kategoriMap: Record<string, string[]> = {
  "Tanaman Pangan": ["Padi", "Jagung", "Kedelai", "Kacang Hijau"],
  "Perkebunan":     ["Tembakau", "Tebu", "Bawang Merah", "Cabai"],
};
export const daftarKategori = Object.keys(kategoriMap);

// ─── Tipe HasilMusim ──────────────────────────────────────────────────────────
export type HasilMusim = {
  musim:    string;
  ha:       number;
  prod:     number;    // kg total
  luasM2_f: number;

  // HOK
  hokTotal:      number;
  hokLaki:       number;
  hokPerempuan:  number;
  hokDibayar:    number;  // HOK untuk pekerja yang dibayar
  hokTidakDibayar: number;

  // Keuangan
  pend:        number;  // penerimaan kotor (nilai produksi)
  pendPetani:  number;  // setelah dipotong bagi hasil (jika ada)
  upah:        number;  // biaya upah TK
  biaya:       number;  // biaya saprotan
  oper:        number;  // biaya operasional (combi, BBM, dll)
  sewaLahan:   number;
  bagiHasilPot: number;
  non:         number;  // biaya non-tunai (PBB, penyusutan)
  totalPeng:   number;

  // Alat & Aset
  asetTanah:  number;
  asetLain:   number;
  alatUnits:  number[];

  // Biaya detail (padi)
  combiCost: number;
  bbmCost:   number;
};

// ─── Konstanta Biaya Operasional ─────────────────────────────────────────────
const SEWA_PER_HA    = 12_000_000;  // Rp/ha/musim
const RASIO_BH       = 0.50;         // maro 50:50
const PBB_TAHUNAN    = 20_000;       // Rp/tahun flat sawah desa
const UPAH_HOK       = 70_000;       // Rp/HOK standar Bojonegoro

// ─── Distribusi gender HOK (BPS lapangan) ────────────────────────────────────
// Perempuan mendominasi: tandur, matun, panen petik
const RASIO_LAKI     = 0.40;
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
}): HasilMusim {
  const { musim, kom, mode, luas, panen, satPanen, status } = params;
  const d = db[kom]!;

  // ── 1. Hitung ha & prod ───────────────────────────────────────────────────
  // Walikan (musim kering) → produktivitas −15% karena tidak semua petani irigasi
  const PROD_PER_HA = (kom === "Padi" && musim === "Walikan")
    ? d.prod * 0.85
    : d.prod;

  let ha = 0, prod = 0;
  if (mode === "luas") {
    const n = parseFloat(luas) || 0;
    ha   = n / 10000;          // M2 → ha
    prod = ha * PROD_PER_HA;
  } else {
    const n = parseFloat(panen) || 0;
    if      (satPanen === "TON")     prod = n * 1000;
    else if (satPanen === "KUINTAL") prod = n * 100;
    else                             prod = n;
    ha = prod / PROD_PER_HA;   // balik dari produksi ke ha
  }
  const luasM2_f = ha * 10000;
  const kuintal  = prod / 100;

  // ── 2. Nilai produksi ─────────────────────────────────────────────────────
  const hargaJual = (kom === "Padi" && musim === "Walikan") ? 6800 : d.harga;
  const pend      = prod * hargaJual;

  // ── 3. HOK (Hari Orang Kerja) ─────────────────────────────────────────────
  // totalHOK = ha × koefisien HOK/ha (sudah termasuk pengolahan + tanam + rawat + panen)
  const totalHOK      = ha * d.t;
  const hokDibayar    = Math.round(totalHOK * 0.75);   // ~75% HOK oleh buruh bayar
  const hokTidakDibayar = Math.max(2, Math.round(totalHOK * 0.25)); // ~25% keluarga
  const hokLaki       = Math.round(totalHOK * RASIO_LAKI);
  const hokPerempuan  = Math.round(totalHOK * RASIO_PEREMPUAN);
  const hokTotal      = hokDibayar + hokTidakDibayar;

  // ── 4. Biaya ──────────────────────────────────────────────────────────────
  // Upah: HOK dibayar × tarif harian
  const upah = hokDibayar * UPAH_HOK;

  // Saprotan: rasio dari nilai produksi (pupuk, benih, OPT, dll.)
  const rasioB = (kom === "Padi" && musim === "Walikan") ? d.b + 0.03 : d.b;
  let biaya    = pend * rasioB;

  // Operasional: combi panen (padi) atau 5% (lainnya)
  const combiCost = kom === "Padi" ? kuintal * 50_000 : pend * 0.05;
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

  // Non-tunai: PBB flat per tahun (tidak dikalikan per musim)
  const non      = PBB_TAHUNAN;
  const totalPeng = upah + biaya + oper + bagiHasilPot + non;

  // ── 5. Aset ───────────────────────────────────────────────────────────────
  const asetTanah = luasM2_f * 100_000;  // Rp 100.000/m²
  const alatDb = [
    { harga: 1_500_000 },   // Pompa (Alkon)
    { harga: 250_000  },    // Sprayer
    { harga: 50_000   },    // Sabit
    { harga: 75_000   },    // Cangkul
  ];
  const unitAlkon   = Math.max(1, Math.round(luasM2_f / 10000));
  const unitSprayer = Math.max(1, Math.round(luasM2_f / 10000));
  const unitSabit   = Math.max(1, Math.round(luasM2_f / 3000));
  const unitCangkul = Math.max(1, Math.round(luasM2_f / 3000));
  const alatUnits   = [unitAlkon, unitSprayer, unitSabit, unitCangkul];
  const asetLain    = alatDb.reduce((sum, a, i) => sum + a.harga * alatUnits[i], 0);

  return {
    musim, ha, prod, luasM2_f,
    hokTotal, hokLaki, hokPerempuan, hokDibayar, hokTidakDibayar,
    pend, pendPetani, upah, biaya, oper, combiCost, bbmCost,
    sewaLahan, bagiHasilPot, non, totalPeng,
    asetTanah, asetLain, alatUnits,
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
};

// ─── Fungsi Hitung Utama ──────────────────────────────────────────────────────
export function hitungEstimasi(params: HitungParams): any | null {
  const {
    kom, mode, luas, satLuas, panen, satPanen,
    musimTanam, jenisTembakau, jumlahPohon, luasTembakau, status,
  } = params;

  // ══════════════════════════════════════════════════════════════════════
  // JALUR TEMBAKAU
  // ══════════════════════════════════════════════════════════════════════
  if (kom === "Tembakau") {
    const pohon    = Math.max(100, parseFloat(jumlahPohon) || 1000);
    const luasM2_t = Math.max(5,   parseFloat(luasTembakau) || 15);
    const ribuan   = pohon / 1000;
    const TB       = TEMBAKAU;
    const isKering = jenisTembakau === "Tembakau Kering";

    // Produksi
    const kgBasah  = TB.kgPer1000 * ribuan;
    const kgKering = kgBasah * TB.susut;

    // Nilai produksi
    const nilaiProd = isKering
      ? kgKering * TB.hargaKering
      : kgBasah  * TB.hargaBasah;

    // HOK
    const totalHOK    = TB.hokPer1000 * ribuan;
    const rasioLaki   = isKering ? TB.hokRasioKering : TB.hokRasioLaki;
    const hokLaki     = Math.round(totalHOK * rasioLaki);
    const hokPerempuan = Math.round(totalHOK * (1 - rasioLaki));
    const hokDibayar  = Math.max(1, Math.round(totalHOK * 0.8));
    const hokTidakDibayar = 2;
    const hokTotal    = hokDibayar + hokTidakDibayar;

    // Biaya TK (HOK × tarif)
    let gajiTK = 0;
    if (isKering) {
      // Kering: rajang + mepe dibayar per kg
      gajiTK = (TB.upahRajang + TB.upahMepe) * kgBasah;
    } else {
      gajiTK = hokDibayar * TB.upahHarian;
    }

    // Rincian HOK tembakau (untuk display Detail TK)
    const tkKowak  = isKering ? 0 : Math.max(1, Math.round(2 * ribuan));
    const tkMacul  = isKering ? 0 : Math.max(1, Math.round(3 * ribuan));
    const tkPanen  = isKering ? 0 : Math.max(1, Math.round(3 * ribuan));
    const tkRajang = isKering ? Math.max(1, Math.round(kgBasah / 50))  : 0;
    const tkMepe   = isKering ? Math.max(1, Math.round(kgBasah / 100)) : 0;

    const biayaProd = TB.saprotanPer1000 * ribuan;
    const ops       = TB.operPer1000 * ribuan;
    const pbb       = luasM2_t * TB.pbbPerM2;
    const nonT      = isKering ? 0 : pbb;
    const totalPeng = gajiTK + biayaProd + ops + nonT;
    const pendBersih = nilaiProd - totalPeng;

    const asetTanah_t = TB.asetTanah;
    const asetLain_t  = TB.asetMesin + TB.asetWidek;
    const totalAset   = asetTanah_t + asetLain_t;

    return {
      isTembakau: true,
      jenis: jenisTembakau,
      pohon, ribuan, kgBasah, kgKering,
      nilaiProd, biayaProd, ops, gajiTK, nonT, totalPeng, pendBersih,
      asetTanah_t, asetLain_t, totalAset, luasM2_t,
      // HOK
      hokTotal, hokLaki, hokPerempuan, hokDibayar, hokTidakDibayar,
      // Rincian untuk Detail TK
      tkKowak, tkMacul, tkPanen, tkRajang, tkMepe,
      musim: musimTanam[0] ?? "—",
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
    })
  );

  if (hasilPerMusim.length === 1) {
    return { ...hasilPerMusim[0], musimList };
  }

  // ── Dua musim: akumulasi nilai finansial, aset pakai musim pertama ────────
  const a = hasilPerMusim[0];
  const b = hasilPerMusim[1];
  return {
    ...a,
    musimList,
    perMusim: hasilPerMusim,
    // Akumulasi keuangan
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
    // Non-tunai dihitung 1× per tahun
    non:      a.non,
    totalPeng: (a.totalPeng - a.non) + (b.totalPeng - b.non) + a.non,
    // HOK akumulasi
    hokTotal:      a.hokTotal     + b.hokTotal,
    hokLaki:       a.hokLaki      + b.hokLaki,
    hokPerempuan:  a.hokPerempuan + b.hokPerempuan,
    hokDibayar:    a.hokDibayar   + b.hokDibayar,
    hokTidakDibayar: Math.max(a.hokTidakDibayar, b.hokTidakDibayar), // keluarga sama
    // Aset: pakai musim pertama (lahan sama)
    asetTanah: a.asetTanah,
    asetLain:  a.asetLain,
    alatUnits: a.alatUnits,
    luasM2_f:  a.luasM2_f,
    ha:        a.ha,
  };
}
