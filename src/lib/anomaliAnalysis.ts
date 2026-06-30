// ─── Mesin Analisis Anomali SE2026 (Aturan Cerdas Offline) ───────────────────
//
// Menganalisis hasil hitungEstimasi + data usaha Blok II untuk mendeteksi
// anomali / inkonsistensi yang umum terjadi saat pendataan Sensus Ekonomi 2026.
//
// PRINSIP: 100% lokal, tanpa internet, tanpa model AI eksternal.
// Berbasis ambang batas & rasio patokan BPS lapangan.

import { db } from "./kalkulatorData";

// ─── Tipe Hasil Analisis ──────────────────────────────────────────────────────
export type Level = "error" | "warning" | "ok" | "info";

export type Temuan = {
  kode:   string;
  level:  Level;
  judul:  string;
  detail: string;
  saran:  string;
};

export type Ringkasan = {
  totalError:     number;
  totalWarning:   number;
  totalOk:        number;
  totalInfo:      number;
  skorKesehatan:  number; // 0–100
};

export type HasilAnalisis = {
  temuan:    Temuan[];
  ringkasan: Ringkasan;
};

// ─── Rentang produktivitas wajar per komoditas (kg/ha) ────────────────────────
// Patokan lapangan Bojonegoro (bisa berbeda per wilayah).
const RENTANG_PROD: Record<string, [number, number]> = {
  Padi:          [4_000, 9_000],
  Jagung:        [3_000, 7_000],
  Kedelai:       [1_000, 2_500],
  "Kacang Hijau":[800, 2_000],
  "Bawang Merah":[5_000, 12_000],
  Cabai:         [3_000, 10_000],
  Tebu:          [50_000, 90_000],
};

// ─── Data usaha yang relevan untuk analisis ───────────────────────────────────
export type DataUsaha = {
  kom:        string;
  musimTanam: string[];
  status:     string;
  upahHarian: number; // Rp/HOK saat ini (dari input)
};

// ─── Helper: dorong temuan ────────────────────────────────────────────────────
function dorong(
  out: Temuan[],
  kode: string, level: Level,
  judul: string, detail: string, saran: string,
) {
  out.push({ kode, level, judul, detail, saran });
}

// ─── Fungsi Utama ─────────────────────────────────────────────────────────────
export function analisisAnomali(h: any, u: DataUsaha): HasilAnalisis {
  const temuan: Temuan[] = [];

  // Guard: tidak ada hasil
  if (!h) {
    dorong(temuan, "A00", "error",
      "Data hasil belum dihitung",
      "Objek hasil hitung kosong. Tekan tombol Hitung Estimasi terlebih dahulu.",
      "Lengkapi parameter input lalu tekan Hitung Estimasi SE2026.");
    return finalkan(temuan);
  }

  const kom = u.kom;
  const isPadi = kom === "Padi";
  const isTembakau = !!h.isTembakau;
  const ha = h.ha ?? (h.luasM2_f ? h.luasM2_f / 10000 : (h.luasM2_t ? h.luasM2_t / 10000 : 0));
  const luasM2 = h.luasM2_f ?? h.luasM2_t ?? 0;

  // ══════════════════════════════════════════════════════════════════════
  // A10 — Input nol / data tidak lengkap
  // ══════════════════════════════════════════════════════════════════════
  const prod = h.prod ?? h.kgBasah ?? 0;
  if ((luasM2 === 0) && (prod === 0) && !isTembakau) {
    dorong(temuan, "A10", "error",
      "Data input tidak lengkap",
      "Luas lahan dan hasil produksi keduanya 0. Tidak dapat menghasilkan estimasi valid.",
      "Isi minimal luas lahan (m²) atau hasil panen sebelum menghitung.");
    return finalkan(temuan);
  }

  // ══════════════════════════════════════════════════════════════════════
  // A02 — Padi: pekerja tidak dibayar harus = 4
  // ══════════════════════════════════════════════════════════════════════
  if (isPadi) {
    if (h.pekerjaTidakDibayar === 4) {
      dorong(temuan, "A02", "ok",
        "Pekerja tidak dibayar = 4 (konsisten)",
        "Padi: pemilik/keluarga 4 orang ikut setiap musim rendengan & walikan. Sesuai patokan.",
        "Tidak perlu tindakan.");
    } else {
      dorong(temuan, "A02", "error",
        `Pekerja tidak dibayar = ${h.pekerjaTidakDibayar} (harusnya 4)`,
        "Padi di Bojonegoro: pekerja tidak dibayar flat 4 (pemilik + keluarga ikut garap).",
        "Periksa kembali input — nilai ini harus 4 untuk padi.");
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // A13 — Non-padi: pekerja tidak dibayar > 4
  // ══════════════════════════════════════════════════════════════════════
  if (!isPadi && (h.pekerjaTidakDibayar ?? 0) > 4) {
    dorong(temuan, "A13", "warning",
      `Pekerja tidak dibayar ${h.pekerjaTidakDibayar} orang (di atas normal)`,
      `Komoditas ${kom} biasanya pekerja tidak dibayar 2 orang (inti keluarga).`,
      "Konfirmasi ke responden apakah benar keluarga inti > 4 yang ikut menggarap.");
  }

  // ══════════════════════════════════════════════════════════════════════
  // A01 — Konsistensi pekerja 24.c1 = 24.c2
  // ══════════════════════════════════════════════════════════════════════
  const c1 = (h.pekerjaLaki ?? 0) + (h.pekerjaPerempuan ?? 0);
  const c2 = (h.pekerjaDibayar ?? 0) + (h.pekerjaTidakDibayar ?? 0);
  if (c1 === c2) {
    dorong(temuan, "A01", "ok",
      "Konsistensi total pekerja (24.c1 = 24.c2)",
      `Total gender (${c1}) = total status pembayaran (${c2}). Laporan konsisten.`,
      "Tidak perlu tindakan.");
  } else {
    dorong(temuan, "A01", "error",
      `Inkonsistensi total pekerja: ${c1} ≠ ${c2}`,
      `24.c1 (laki+perempuan) = ${c1}, tapi 24.c2 (dibayar+tidak dibayar) = ${c2}. Harus sama.`,
      "Rekonsiliasi: jumlah pekerja menurut gender harus sama dengan jumlah menurut status pembayaran.");
  }

  // ══════════════════════════════════════════════════════════════════════
  // A11 — Gender split konsisten dengan total
  // ══════════════════════════════════════════════════════════════════════
  const laki = h.pekerjaLaki ?? 0;
  const perempuan = h.pekerjaPerempuan ?? 0;
  if ((laki + perempuan) !== (h.totalPekerja ?? 0)) {
    dorong(temuan, "A11", "warning",
      `Laki + Perempuan (${laki + perempuan}) ≠ Total (${h.totalPekerja ?? 0})`,
      "Pembagian gender tidak menjumlah ke total pekerja.",
      "Periksa rasio gender di parameter komoditas.");
  }

  // ══════════════════════════════════════════════════════════════════════
  // A03 — Produktivitas di luar rentang wajar
  // ══════════════════════════════════════════════════════════════════════
  if (!isTembakau && ha > 0) {
    const rentang = RENTANG_PROD[kom];
    if (rentang) {
      const prodPerHa = prod / ha;
      if (prodPerHa < rentang[0]) {
        dorong(temuan, "A03", "warning",
          `Produktivitas ${Math.round(prodPerHa).toLocaleString("id-ID")} kg/ha terlalu RENDAH`,
          `Patokan ${kom}: ${rentang[0].toLocaleString("id-ID")}–${rentang[1].toLocaleString("id-ID")} kg/ha. Hasil di bawah batas bawah.`,
          "Periksa luas & hasil panen. Mungkin ada input kuintal/ton yang tertukar.");
      } else if (prodPerHa > rentang[1]) {
        dorong(temuan, "A03", "warning",
          `Produktivitas ${Math.round(prodPerHa).toLocaleString("id-ID")} kg/ha terlalu TINGGI`,
          `Patokan ${kom}: ${rentang[0].toLocaleString("id-ID")}–${rentang[1].toLocaleString("id-ID")} kg/ha. Hasil di atas batas atas.`,
          "Konfirmasi ke responden. Waspadai salah satuan (kg vs kuintal vs ton).");
      } else {
        dorong(temuan, "A03", "ok",
          `Produktivitas ${Math.round(prodPerHa).toLocaleString("id-ID")} kg/ha (dalam rentang wajar)`,
          `Sesuai patokan ${rentang[0].toLocaleString("id-ID")}–${rentang[1].toLocaleString("id-ID")} kg/ha.`,
          "Tidak perlu tindakan.");
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // A06 — Luas lahan terlalu kecil
  // ══════════════════════════════════════════════════════════════════════
  if (!isTembakau && luasM2 > 0 && luasM2 < 50) {
    dorong(temuan, "A06", "warning",
      `Luas lahan ${luasM2} m² sangat kecil`,
      "Usaha tanaman pangan < 50 m² jarang layak secara komersial. Kemungkinan salah input.",
      "Konfirmasi luas ke responden. Ingat: 1 ha = 10.000 m².");
  }

  // ══════════════════════════════════════════════════════════════════════
  // A09 — HOK/ha di luar rentang wajar
  // ══════════════════════════════════════════════════════════════════════
  if (!isTembakau && ha > 0 && (h.hokTotal ?? 0) > 0) {
    const hokPerHa = h.hokTotal / ha;
      if (hokPerHa < 5) {
        dorong(temuan, "A09", "warning",
          `HOK ${hokPerHa.toFixed(1)}/ha terlalu RENDAH`,
          "Normal intensitas kerja usaha tanaman pangan: 40–150 HOK/ha.",
          "Cek kebutuhan TK komoditas. Mungkin luas dibesar-besarkan.");
      } else if (hokPerHa > 200) {
        dorong(temuan, "A09", "warning",
          `HOK ${hokPerHa.toFixed(1)}/ha terlalu TINGGI`,
          "Di atas 200 HOK/ha jarang terjadi kecuali komoditas padat karya (bawang/cabai).",
          "Konfirmasi kebutuhan tenaga kerja.");
      }
  }

  // ══════════════════════════════════════════════════════════════════════
  // A04 — Rasio upah / nilai produksi
  // ══════════════════════════════════════════════════════════════════════
  const nilaiProd = h.nilaiProd ?? h.pend ?? 0;
  const upah = h.gajiTK ?? h.upah ?? 0;
  if (nilaiProd > 0 && upah > 0) {
    const rasio = upah / nilaiProd;
    if (rasio > 0.60) {
      dorong(temuan, "A04", "warning",
        `Beban upah ${Math.round(rasio * 100)}% dari nilai produksi`,
        "Rasio upah/produksi > 60% mengindikasikan marjin tipis / potensi rugi.",
        "Cek apakah upah per HOK realistis dan hasil panen tidak terlalu sedikit.");
    } else {
      dorong(temuan, "A04", "ok",
        `Beban upah ${Math.round(rasio * 100)}% dari nilai produksi (wajar)`,
        "Rasio upah/produksi di bawah 60%, marjin sehat.",
        "Tidak perlu tindakan.");
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // A05 — Usaha rugi (pengeluaran > pendapatan)
  // ══════════════════════════════════════════════════════════════════════
  const totalPeng = h.totalPeng ?? 0;
  if (nilaiProd > 0 && totalPeng > nilaiProd) {
    dorong(temuan, "A05", "error",
      "Usaha RUGI (pengeluaran > pendapatan)",
      `Total pengeluaran melebihi nilai produksi. Rugi ${"Rp " + Math.round(totalPeng - nilaiProd).toLocaleString("id-ID")}.`,
      "Periksa komponen biaya (saprotan, sewa, operasional) & pastikan hasil panen benar.");
  } else if (nilaiProd > 0) {
    dorong(temuan, "A05", "ok",
      "Usaha untung (pendapatan > pengeluaran)",
      `Laba kotor ${"Rp " + Math.round(nilaiProd - totalPeng).toLocaleString("id-ID")}.`,
      "Tidak perlu tindakan.");
  }

  // ══════════════════════════════════════════════════════════════════════
  // A07 — Nilai produksi < Rp 100.000
  // ══════════════════════════════════════════════════════════════════════
  if (nilaiProd > 0 && nilaiProd < 100_000) {
    dorong(temuan, "A07", "error",
      `Nilai produksi ${"Rp " + Math.round(nilaiProd).toLocaleString("id-ID")} di bawah minimum`,
      "Kuesioner SE2026: nilai minimum pendapatan Rp 100.000. Di bawah itu data ditolak sistem.",
      "Konfirmasi luas & hasil panen responden.");
  }

  // ══════════════════════════════════════════════════════════════════════
  // A08 — Total aset = 0
  // ══════════════════════════════════════════════════════════════════════
  const totalAset = h.totalAset ?? ((h.asetTanah ?? h.asetTanah_t ?? 0) + (h.asetLain ?? h.asetLain_t ?? 0));
  if (totalAset === 0) {
    dorong(temuan, "A08", "warning",
      "Total aset = Rp 0",
      "Setiap usaha pertanian biasanya punya aset minimal (lahan/alat).",
      "Isi luas lahan agar aset tanah bisa dihitung.");
  } else if (totalAset > 0) {
    dorong(temuan, "A08", "ok",
      `Total aset ${"Rp " + Math.round(totalAset).toLocaleString("id-ID")} tercatat`,
      "Aset usaha tercatat.",
      "Tidak perlu tindakan.");
  }

  // ══════════════════════════════════════════════════════════════════════
  // A15 — Bagi Hasil tapi pendapatan pemilik = 0
  // ══════════════════════════════════════════════════════════════════════
  if (u.status === "Bagi Hasil" && (h.bagiHasilPot ?? 0) === 0) {
    dorong(temuan, "A15", "warning",
      "Status Bagi Hasil tapi bagian pemilik = Rp 0",
      "Sistem maro 50:50 harus menghasilkan potongan dari pendapatan kotor.",
      "Cek apakah nilai produksi sudah diisi.");
  }

  return finalkan(temuan);
}

// ─── Fungsi AI Auto-Fix: usulkan koreksi untuk anomali ────────────────────────
// Mengembalikan nilai upahHarian yang direkomendasikan AI agar rasio upah/produksi
// masuk rentang sehat (< 50%). Jika anomali bukan dari upah, kembalikan null.
export type Koreksi = {
  field: string;        // "upahHarian" | "sapr1000" | dll
  label: string;        // deskripsi singkat
  nilaiLama: number;
  nilaiBaru: number;
  alasan: string;
};

export function usulkanKoreksi(h: any, u: DataUsaha): Koreksi[] {
  const koreksi: Koreksi[] = [];
  const nilaiProd = h.nilaiProd ?? h.pend ?? 0;
  const upah = h.gajiTK ?? h.upah ?? 0;
  const totalPeng = h.totalPeng ?? 0;

  // ── Koreksi upahHarian jika rasio > 60% ──────────────────────────────────
  if (nilaiProd > 0 && upah > 0) {
    const rasio = upah / nilaiProd;
    if (rasio > 0.60 && (h.hokDibayar ?? 0) > 0) {
      // Target: rasio 40%
      const targetUpah = nilaiProd * 0.40;
      const upahBaru = Math.round(targetUpah / (h.hokDibayar ?? 1));
      if (upahBaru < u.upahHarian && upahBaru >= 30000) {
        koreksi.push({
          field: "upahHarian",
          label: "Turunkan upah harian",
          nilaiLama: u.upahHarian,
          nilaiBaru: upahBaru,
          alasan: `Rasio upah/produksi ${Math.round(rasio * 100)}% (terlalu tinggi). ` +
            `AI menyarankan Rp ${upahBaru.toLocaleString("id-ID")}/HOK agar rasio turun ke ~40%. ` +
            `Mempertahankan ${h.hokDibayar} HOK.`,
        });
      }
    }
  }

  // ── Koreksi jika usaha rugi — usulkan turunkan saprotan ───────────────────
  if (nilaiProd > 0 && totalPeng > nilaiProd) {
    const biaya = h.biaya ?? 0;
    const oper = h.oper ?? 0;
    if (biaya > 0 && (h.prod ?? 0) > 0) {
      const saprotanPerTon = biaya / (h.prod / 1000);
      // Jika saprotan per ton di atas 50% harga jual, turunkan
      const hargaJual = hargaJualDariKom(u.kom);
      if (hargaJual > 0 && saprotanPerTon > hargaJual * 500) {
        const saprotanBaruPerTon = hargaJual * 400;
        koreksi.push({
          field: "sapr1000",
          label: "Turunkan biaya saprotan per ton",
          nilaiLama: Math.round(saprotanPerTon),
          nilaiBaru: Math.round(saprotanBaruPerTon),
          alasan: `Biaya saprotan Rp ${Math.round(saprotanPerTon).toLocaleString("id-ID")}/ton melebihi patokan wajar. ` +
            `AI menyarankan Rp ${Math.round(saprotanBaruPerTon).toLocaleString("id-ID")}/ton agar tidak rugi.`,
        });
      }
    }
  }

  return koreksi;
}

// ─── Helper: harga jual patokan dari komoditas ──────────────────────────────
function hargaJualDariKom(kom: string): number {
  const d = db[kom];
  return d?.harga ?? 0;
}

// ─── Hitung ringkasan & skor kesehatan ───────────────────────────────────────
function finalkan(temuan: Temuan[]): HasilAnalisis {
  const totalError   = temuan.filter((t) => t.level === "error").length;
  const totalWarning = temuan.filter((t) => t.level === "warning").length;
  const totalOk      = temuan.filter((t) => t.level === "ok").length;
  const totalInfo    = temuan.filter((t) => t.level === "info").length;

  // Skor: mulai 100, error -25, warning -10, minimum 0
  let skor = 100 - (totalError * 25) - (totalWarning * 10);
  if (skor < 0) skor = 0;
  if (skor > 100) skor = 100;

  return {
    temuan,
    ringkasan: { totalError, totalWarning, totalOk, totalInfo, skorKesehatan: skor },
  };
}

// ─── Helper util untuk komponen: label & warna skor ───────────────────────────
export function labelSkor(skor: number): { teks: string; warna: string } {
  if (skor >= 80) return { teks: "Sehat",      warna: "#22c55e" };
  if (skor >= 50) return { teks: "Perlu Cek",  warna: "#f59e0b" };
  return { teks: "Bermasalah",                 warna: "#ef4444" };
}
