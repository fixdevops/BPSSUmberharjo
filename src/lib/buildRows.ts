// ─── buildRows: Susun baris hasil estimasi untuk ditampilkan di ResultCard ────
// Versi BPS Realistis — semua explain berbasis ha, HOK, kg/ha
import { rp } from "./helpers";
import { db, explainSaprotan, kondisiPanenLabel, TEMBAKAU } from "./kalkulatorData";

export type ResultRowItem = {
  label:    string;
  value:    string;
  explain?: string;
};
export type ResultItem = { section: string } | ResultRowItem;

export function buildRows(params: {
  hasil: any;
  kom: string;
  mode: string;
  panen: string;
  satPanen: string;
  status: string;
  musimTanam: string[];
}): ResultItem[] {
  const { hasil: h, kom, mode, panen, satPanen, status } = params;
  if (!h) return [];

  // ══════════════════════════════════════════════════════════════════════
  // TEMBAKAU
  // ══════════════════════════════════════════════════════════════════════
  if (h.isTembakau) {
    const isKering = h.jenis === "Tembakau Kering";
    const TB = TEMBAKAU;
    return [
      // ── KONDISI PANEN ────────────────────────────────────────────────────
      {
        label: "Kondisi Hasil Panen",
        value: kondisiPanenLabel[h.kondisiPanen as keyof typeof kondisiPanenLabel] ?? h.kondisiPanen ?? "Sedang (normal)",
        explain:
          `Faktor pengali produktivitas:\n` +
          `  • Sedang      → ×1,00 (baseline BPS)\n` +
          `  • Baik        → ×1,15 (+15%)\n` +
          `  • Sangat Baik → ×1,30 (+30%)\n\n` +
          `Kondisi dipilih: ${h.kondisiPanen ?? "Sedang"} (×${(h.faktorKondisi ?? 1).toFixed(2)})\n` +
          `Mempengaruhi jumlah kg produksi dan nilai jual.`,
      },
      // ── HOK ────────────────────────────────────────────────────────────
      { section: "24 — Tenaga Kerja (HOK = Hari Orang Kerja)" },
      {
        label: "24.a   HOK Laki-laki",
        value: `${h.hokLaki} HOK`,
        explain:
          `Total HOK = ${h.ribuan.toFixed(2)} × ${TB.hokPer1000} HOK/1.000 pohon = ${(h.ribuan * TB.hokPer1000).toFixed(1)} HOK\n` +
          `Laki-laki (${isKering ? "30" : "50"}%) = ${h.hokLaki} HOK\n` +
          (isKering ? `(Kering: lebih banyak perempuan rajang & mepe)` : `(Basah: kowak & macul didominasi laki-laki)`),
      },
      {
        label: "24.b   HOK Perempuan",
        value: `${h.hokPerempuan} HOK`,
        explain:
          `Perempuan (${isKering ? "70" : "50"}%) = ${h.hokPerempuan} HOK\n` +
          (isKering ? `(Pekerjaan rajang & mepe dominan perempuan)` : `(Panen & sortir dominan perempuan)`),
      },
      {
        label: "24.c   Total HOK",
        value: `${h.hokTotal} HOK`,
        explain:
          `${h.ribuan.toFixed(2)} ribuan pohon × ${TB.hokPer1000} HOK/1.000 pohon = ${(h.ribuan * TB.hokPer1000).toFixed(1)} HOK\n` +
          `Dibayar : ${h.hokDibayar} HOK\nTidak Dibayar (keluarga) : ${h.hokTidakDibayar} HOK`,
      },
      {
        label: "24.d   HOK Dibayar",
        value: `${h.hokDibayar} HOK`,
        explain: isKering
          ? `Pekerjaan kering:\n  Ngrajang : ~${h.tkRajang} org (Rp ${TB.upahRajang.toLocaleString()}/kg)\n  Mepe     : ~${h.tkMepe} org (Rp ${TB.upahMepe.toLocaleString()}/kg)\nDari ${Math.round(h.kgBasah).toLocaleString()} kg basah`
          : `Pekerjaan basah:\n  Kowak/bajak  : ${h.tkKowak} org\n  Macul/bedengan: ${h.tkMacul} org\n  Panen/petik  : ${h.tkPanen} org\nPer ${h.ribuan.toFixed(2)}× 1.000 pohon`,
      },
      {
        label: "24.e   Tidak Dibayar",
        value: `${h.hokTidakDibayar} HOK`,
        explain: `2 HOK anggota keluarga (standar BPS SE2026).`,
      },
      // ── PENGELUARAN ────────────────────────────────────────────────────
      { section: "26 — Pengeluaran Usaha" },
      {
        label: "26.a   Gaji Tenaga Kerja",
        value: rp(h.gajiTK),
        explain: isKering
          ? `${h.ribuan.toFixed(2)} × Rp ${TB.gajiKeringPer1000.toLocaleString()}/1.000 pohon = ${rp(h.gajiTK)}\n` +
            `(Termasuk upah rajang & mepe)`
          : `${h.ribuan.toFixed(2)} × Rp ${TB.gajiBasahPer1000.toLocaleString()}/1.000 pohon = ${rp(h.gajiTK)}`,
      },
      {
        label: "26.b   Biaya Saprotan",
        value: rp(h.biayaProd),
        explain: isKering
          ? explainSaprotan("Tembakau Kering", h.ribuan, h.biayaProd)
          : explainSaprotan("Tembakau Basah",  h.ribuan, h.biayaProd),
      },
      {
        label: "26.d   Biaya Operasional",
        value: rp(h.ops),
        explain: isKering
          ? `Rp ${TB.operKeringPer1000.toLocaleString()} per 1.000 pohon\n× ${h.ribuan.toFixed(2)} = ${rp(h.ops)}`
          : `Rp ${TB.operBasahPer1000.toLocaleString()} per 1.000 pohon\n× ${h.ribuan.toFixed(2)} = ${rp(h.ops)}`,
      },
      {
        label: "26.e   Non-Tunai (PBB)",
        value: isKering ? "Rp 0" : rp(h.nonT),
        explain: isKering
          ? `Tembakau Kering: tidak ada biaya non-tunai (PBB dibebankan ke usaha basah).`
          : `PBB lahan: ${h.luasM2_t} m² × Rp ${TB.pbbPerM2.toLocaleString()}/m² = ${rp(h.nonT)}`,
      },
      {
        label: "26.f   Total Pengeluaran",
        value: rp(h.totalPeng),
        explain:
          `Gaji TK    : ${rp(h.gajiTK)}\nSaprotan   : ${rp(h.biayaProd)}\n` +
          `Operasional: ${rp(h.ops)}\nNon-Tunai  : ${rp(h.nonT)}\nTotal = ${rp(h.totalPeng)}`,
      },
      // ── PENDAPATAN ──────────────────────────────────────────────────────
      { section: "27 — Pendapatan Usaha" },
      {
        label: "27.a   Nilai Produksi",
        value: rp(h.nilaiProd),
        explain: isKering
          ? `${Math.round(h.kgBasah).toLocaleString()} kg basah × susut ${TB.susut} = ${Math.round(h.kgKering).toLocaleString()} kg kering\n` +
            `${Math.round(h.kgKering).toLocaleString()} kg × Rp ${TB.hargaKering.toLocaleString()}/kg = ${rp(h.nilaiProd)}`
          : `${Math.round(h.kgBasah).toLocaleString()} kg × Rp ${TB.hargaBasah.toLocaleString()}/kg = ${rp(h.nilaiProd)}`,
      },
      {
        label: "27.c   Pendapatan Bersih",
        value: rp(h.pendBersih),
        explain: `Nilai Produksi − Total Pengeluaran\n${rp(h.nilaiProd)} − ${rp(h.totalPeng)} = ${rp(h.pendBersih)}`,
      },
      {
        label: "Hasil Produksi",
        value: isKering
          ? `${Math.round(h.kgKering).toLocaleString("id-ID")} kg kering`
          : `${Math.round(h.kgBasah).toLocaleString("id-ID")} kg basah`,
        explain: isKering
          ? `${h.ribuan.toFixed(2)} × ${TB.kgPer1000} kg/1.000 pohon = ${Math.round(h.kgBasah).toLocaleString()} kg basah\n× susut ${TB.susut} = ${Math.round(h.kgKering).toLocaleString()} kg kering`
          : `${h.ribuan.toFixed(2)} × ${TB.kgPer1000} kg/1.000 pohon = ${Math.round(h.kgBasah).toLocaleString()} kg basah`,
      },
      // ── ASET ─────────────────────────────────────────────────────────────
      { section: "28 — Aset Usaha" },
      {
        label: "28.a   Nilai Tanah & Bangunan",
        value: rp(h.asetTanah_t),
        explain: `Luas produksi ${h.luasM2_t} m² × Rp 100.000/m² = ${rp(h.asetTanah_t)}`,
      },
      {
        label: "28.b   Aset Lainnya",
        value: rp(h.asetLain_t),
        explain: isKering
          ? `Mesin kecil  : Rp ${TB.asetMesinKecil.toLocaleString()}\nMesin besar  : Rp ${TB.asetMesinBesar.toLocaleString()}\nWidek        : Rp ${TB.asetWidek.toLocaleString()}\nTotal = ${rp(h.asetLain_t)}`
          : `Mesin kecil  : Rp ${TB.asetMesinKecil.toLocaleString()}\nWidek        : Rp ${TB.asetWidek.toLocaleString()}\nTotal = ${rp(h.asetLain_t)}`,
      },
      {
        label: "28.c   Total Aset",
        value: rp(h.totalAset),
        explain: `${rp(h.asetTanah_t)} + ${rp(h.asetLain_t)} = ${rp(h.totalAset)}`,
      },
      {
        label: "28.d   Luas Produksi",
        value: `${h.luasM2_t} m²`,
        explain: `Luas tempat produksi tembakau: ${h.luasM2_t} m² (standar 3 × 5 m).`,
      },
    ];
  }

  // ══════════════════════════════════════════════════════════════════════
  // KOMODITAS BIASA
  // ══════════════════════════════════════════════════════════════════════
  const d = db[kom];
  const ha = h.ha ?? (h.luasM2_f / 10000);
  const isDuaMusim  = Array.isArray(h.musimList) && h.musimList.length === 2;
  const musimLabel  = isDuaMusim
    ? `${h.musimList[0]} + ${h.musimList[1]}`
    : (Array.isArray(h.musimList) ? h.musimList[0] : h.musim) ?? "—";

  // Produktivitas aktual (Walikan −15%)
  const PROD_PER_HA_R = (kom === "Padi" && musimLabel === "Walikan") ? (d?.prod ?? 0) * 0.85 : (d?.prod ?? 0);
  const hargaJualR    = (kom === "Padi" && musimLabel === "Walikan") ? 6800 : (d?.harga ?? 0);

  const rows: ResultItem[] = [];

  // Info musim Padi
  if (kom === "Padi") {
    rows.push({
      label: "Musim Tanam",
      value: musimLabel,
      explain: isDuaMusim
        ? `2 musim tanam dalam 1 tahun:\n` +
          `• ${h.musimList[0]}: produktivitas ${d?.prod.toLocaleString()} kg/ha, harga Rp ${(d?.harga ?? 0).toLocaleString()}/kg\n` +
          `• ${h.musimList[1]}: produktivitas ${Math.round((d?.prod ?? 0) * 0.85).toLocaleString()} kg/ha (−15%), harga Rp 6.800/kg\n` +
          `Semua nilai keuangan di bawah adalah akumulasi 2 musim.`
        : musimLabel === "Walikan"
          ? `Musim Walikan (kering/irigasi pompanisasi):\n• Produktivitas −15% → ${Math.round((d?.prod ?? 0) * 0.85).toLocaleString()} kg/ha\n• Harga GKP lebih tinggi: Rp 6.800/kg\n• Biaya saprotan +3% (pompanisasi)`
          : `Musim Rendengan (hujan):\n• Produktivitas standar ${d?.prod.toLocaleString()} kg/ha\n• Harga GKP: Rp ${(d?.harga ?? 0).toLocaleString()}/kg`,
    });
  }

  // Kondisi Hasil Panen
  rows.push({
    label: "Kondisi Hasil Panen",
    value: kondisiPanenLabel[h.kondisiPanen as keyof typeof kondisiPanenLabel] ?? h.kondisiPanen ?? "Sedang (normal)",
    explain:
      `Faktor pengali produktivitas:\n` +
      `  • Sedang      → ×1,00 (baseline BPS)\n` +
      `  • Baik        → ×1,15 (+15%)\n` +
      `  • Sangat Baik → ×1,30 (+30%)\n\n` +
      `Kondisi dipilih: ${h.kondisiPanen ?? "Sedang"} (×${(h.faktorKondisi ?? 1).toFixed(2)})\n` +
      `Mempengaruhi jumlah kg produksi dan nilai jual.`,
  });

  // ── HOK ──────────────────────────────────────────────────────────────────
  rows.push({ section: "24 — Tenaga Kerja (HOK = Hari Orang Kerja)" });
  rows.push({
    label: "24.a   HOK Laki-laki",
    value: `${h.hokLaki} HOK`,
    explain:
      `Total HOK = ${ha.toFixed(3)} ha × ${d?.t} HOK/ha = ${(ha * (d?.t ?? 0)).toFixed(1)} HOK\n` +
      `Laki-laki 40% = ${h.hokLaki} HOK\n` +
      `(Olah tanah, bajak, angkut — dominan laki-laki)`,
  });
  rows.push({
    label: "24.b   HOK Perempuan",
    value: `${h.hokPerempuan} HOK`,
    explain:
      `Perempuan 60% = ${h.hokPerempuan} HOK\n` +
      `(Tanam, matun, panen, sortir — dominan perempuan)\nSumber: pola lapangan BPS Bojonegoro`,
  });
  rows.push({
    label: "24.c   Total HOK",
    value: `${h.hokTotal} HOK`,
    explain:
      `${ha.toFixed(3)} ha × ${d?.t} HOK/ha = ${(ha * (d?.t ?? 0)).toFixed(1)} HOK\n` +
      `Dibayar (buruh tani)  : ${h.hokDibayar} HOK\n` +
      `Tidak Dibayar (keluarga): ${h.hokTidakDibayar} HOK` +
      (isDuaMusim ? `\n\nBreakdown per musim:\n${h.perMusim.map((m: any) => `  ${m.musim}: ${m.hokTotal} HOK`).join("\n")}` : ""),
  });
  rows.push({
    label: "24.d   HOK Dibayar (Buruh Tani)",
    value: `${h.hokDibayar} HOK`,
    explain:
      `~60% dari total HOK dikerjakan oleh buruh bayar.\n${ha.toFixed(3)} ha × ${d?.t} HOK/ha × 60% = ${h.hokDibayar} HOK\n` +
      `Upah standar: Rp 70.000/HOK (referensi gender split)\n→ Total upah TK: ${rp(h.upah)}` +
      (isDuaMusim ? `\n\nBreakdown:\n${h.perMusim.map((m: any) => `  ${m.musim}: ${m.hokDibayar} HOK`).join("\n")}` : ""),
  });
  rows.push({
    label: "24.e   Tidak Dibayar (Keluarga)",
    value: `${h.hokTidakDibayar} HOK`,
    explain:
      `~25% dikerjakan anggota keluarga (pengawasan, pengangkutan ringan).\nMinimal 2 HOK (standar BPS SE2026).`,
  });

  // ── PENGELUARAN ───────────────────────────────────────────────────────────
  rows.push({ section: "26 — Pengeluaran Usaha" + (isDuaMusim ? " (Akumulasi 2 Musim)" : "") });

  // 26.a Upah TK
  rows.push({
    label: "26.a   Upah Tenaga Kerja",
    value: rp(h.upah),
    explain:
      `Patokan upah TK: Rp ${(db[kom]?.gaji1000 ?? 0).toLocaleString()} per 1.000 kg produksi\n` +
      `${(h.prod / 1000).toFixed(2)} × Rp ${(db[kom]?.gaji1000 ?? 0).toLocaleString()} = ${rp(h.upah)}` +
      (isDuaMusim
        ? `\n\nBreakdown per musim:\n${h.perMusim.map((m: any) => `  ${m.musim}: ${rp(m.upah)}`).join("\n")}`
        : ""),
  });

  // 26.b Saprotan
  let explain26b = "";
  if (status === "Milik Sendiri") {
    explain26b = explainSaprotan(kom, ha, h.biaya) +
      (isDuaMusim
        ? `\n\nBreakdown per musim:\n${h.perMusim.map((m: any) => `  ${m.musim}: ${rp(m.biaya)}`).join("\n")}`
        : "");
  } else if (status === "Sewa") {
    const saprotanSaja = h.biaya - h.sewaLahan;
    explain26b =
      explainSaprotan(kom, ha, saprotanSaja) +
      `\n\n+ Sewa lahan: ${ha.toFixed(3)} ha × Rp 12.000.000/ha = ${rp(h.sewaLahan)}\nTotal (saprotan + sewa) = ${rp(h.biaya)}`;
  } else {
    explain26b =
      explainSaprotan(kom, ha, h.biaya) +
      `\n\n(Bagi hasil dicatat terpisah sebagai 26.c)`;
  }
  rows.push({ label: "26.b   Biaya Saprotan", value: rp(h.biaya), explain: explain26b });

  // 26.c Bagi Hasil (opsional)
  if (status === "Bagi Hasil") {
    rows.push({
      label: "26.c   Bagi Hasil ke Pemilik (Maro)",
      value: rp(h.bagiHasilPot),
      explain:
        `Sistem maro 50:50 — pemilik lahan mendapat 50% penerimaan kotor.\n\n` +
        `Penerimaan kotor  : ${rp(h.pend)}\nBagian pemilik lahan: × 50% = ${rp(h.bagiHasilPot)}\nBagian petani garap : ${rp(h.pendPetani)}\n\n` +
        `Upah TK & saprotan tetap ditanggung petani penggarap.` +
        (isDuaMusim
          ? `\n\nBreakdown:\n${h.perMusim.map((m: any) => `  ${m.musim}: ${rp(m.bagiHasilPot)}`).join("\n")}`
          : ""),
    });
  }

  // 26.d Operasional
  let explain26d = "";
  if (kom === "Padi") {
    if (isDuaMusim) {
      const a2 = h.perMusim[0]; const b2 = h.perMusim[1];
      explain26d =
        `Musim ${a2.musim}:\n  Combi panen : ${(a2.prod / 100).toFixed(1)} kw × Rp 50.000 = ${rp(a2.combiCost)}\n  BBM irigasi : -\n  Subtotal    = ${rp(a2.oper)}\n\n` +
        `Musim ${b2.musim}:\n  Combi panen : ${(b2.prod / 100).toFixed(1)} kw × Rp 50.000 = ${rp(b2.combiCost)}\n  BBM irigasi : ${ha.toFixed(3)} ha × Rp 187.500 = ${rp(b2.bbmCost)}\n  Subtotal    = ${rp(b2.oper)}\n\nTotal = ${rp(h.oper)}`;
    } else if (musimLabel === "Walikan") {
      explain26d =
        `Combi panen : ${(h.prod / 100).toFixed(1)} kw × Rp 50.000 = ${rp(h.combiCost)}\nBBM irigasi : ${ha.toFixed(3)} ha × Rp 187.500/ha = ${rp(h.bbmCost)}\nTotal = ${rp(h.oper)}`;
    } else {
      explain26d =
        `Combi panen+angkut: ${(h.prod / 100).toFixed(1)} kw × Rp 50.000 = ${rp(h.combiCost)}\n(Termasuk biaya angkut ke rumah/gudang)\nTotal = ${rp(h.oper)}`;
    }
  } else {
    explain26d = `Patokan operasional: Rp ${(db[kom]?.ops1000 ?? 0).toLocaleString()} per 1.000 kg produksi\n` +
      `${(h.prod / 1000).toFixed(2)} × Rp ${(db[kom]?.ops1000 ?? 0).toLocaleString()} = ${rp(h.oper)}`;
  }
  rows.push({ label: "26.d   Biaya Operasional", value: rp(h.oper), explain: explain26d });

  // 26.e Non-tunai
  rows.push({
    label: "26.e   Biaya Non-Tunai (PBB)",
    value: rp(h.non),
    explain:
      `PBB sawah: Rp 20.000/tahun (SPPT flat kawasan desa)\n` +
      `Dihitung 1× per tahun, tidak dikali jumlah musim.\nTotal = ${rp(h.non)}`,
  });

  // 26.f Total pengeluaran
  rows.push({
    label: "26.f   Total Pengeluaran",
    value: rp(h.totalPeng),
    explain:
      `  Upah TK     : ${rp(h.upah)}\n  Saprotan    : ${rp(h.biaya)}\n  Operasional : ${rp(h.oper)}\n  Non-Tunai   : ${rp(h.non)}\n` +
      (status === "Bagi Hasil" ? `  Bagi Hasil  : ${rp(h.bagiHasilPot)}\n` : "") +
      `Total = ${rp(h.totalPeng)}`,
  });

  // ── PENDAPATAN ────────────────────────────────────────────────────────────
  rows.push({ section: "27 — Pendapatan Usaha" });

  rows.push({
    label: "27.a   Nilai Produksi",
    value: rp(h.pend),
    explain: isDuaMusim
      ? (() => {
          const a2 = h.perMusim[0]; const b2 = h.perMusim[1];
          return (
            `Musim ${a2.musim}:\n  ${Math.round(a2.prod).toLocaleString()} kg × Rp ${(d?.harga ?? 0).toLocaleString()}/kg = ${rp(a2.pend)}\n\n` +
            `Musim ${b2.musim}:\n  ${Math.round(b2.prod).toLocaleString()} kg × Rp 6.800/kg = ${rp(b2.pend)}\n\nTotal = ${rp(h.pend)}`
          );
        })()
      : `${Math.round(h.prod).toLocaleString("id-ID")} kg × Rp ${hargaJualR.toLocaleString("id-ID")}/kg = ${rp(h.pend)}`,
  });

  const pendBersih = h.pend - h.totalPeng;
  rows.push({
    label: "27.c   Pendapatan Bersih",
    value: rp(pendBersih),
    explain:
      `Nilai Produksi  : ${rp(h.pend)}\nTotal Pengeluaran: ${rp(h.totalPeng)}\n` +
      `Pendapatan Bersih = ${rp(pendBersih)}` +
      (status === "Bagi Hasil" ? `\n\nCatatan: Pendapatan petani penggarap setelah maro:\n${rp(h.pendPetani)} (bagian petani setelah bagi hasil)` : ""),
  });

  // 27.d Hasil produksi & luas
  rows.push({
    label: "Hasil Produksi",
    value: `${Math.round(h.prod).toLocaleString("id-ID")} kg`,
    explain: isDuaMusim
      ? (() => {
          const a2 = h.perMusim[0]; const b2 = h.perMusim[1];
          return (
            `Musim ${a2.musim}: ${Math.round(a2.prod).toLocaleString()} kg\n` +
            `Musim ${b2.musim}: ${Math.round(b2.prod).toLocaleString()} kg\nTotal = ${Math.round(h.prod).toLocaleString()} kg`
          );
        })()
      : mode === "luas"
        ? `Luas ${Math.round(h.luasM2_f).toLocaleString()} m² (${ha.toFixed(4)} ha) × ${PROD_PER_HA_R.toLocaleString()} kg/ha = ${Math.round(h.prod).toLocaleString()} kg`
        : satPanen === "KUINTAL"
          ? `Input: ${panen} kw × 100 = ${Math.round(h.prod).toLocaleString()} kg\nEstimasi luas: ${Math.round(h.prod).toLocaleString()} kg ÷ ${PROD_PER_HA_R.toLocaleString()} kg/ha = ${Math.round(h.luasM2_f).toLocaleString()} m²`
          : satPanen === "TON"
            ? `Input: ${panen} ton × 1.000 = ${Math.round(h.prod).toLocaleString()} kg\nEstimasi luas: ${Math.round(h.prod).toLocaleString()} kg ÷ ${PROD_PER_HA_R.toLocaleString()} kg/ha = ${Math.round(h.luasM2_f).toLocaleString()} m²`
            : `Input: ${Math.round(h.prod).toLocaleString()} kg\nEstimasi luas = ${Math.round(h.luasM2_f).toLocaleString()} m²`,
  });

  rows.push({
    label: "Estimasi Luas",
    value: `${Math.round(h.luasM2_f).toLocaleString("id-ID")} m²`,
    explain:
      `${Math.round(h.luasM2_f).toLocaleString("id-ID")} m² = ${ha.toFixed(4)} ha` +
      (isDuaMusim ? "\n(Lahan sama untuk kedua musim tanam.)" : ""),
  });

  // ── ASET ──────────────────────────────────────────────────────────────────
  rows.push({ section: "28 — Aset Usaha" });
  rows.push({
    label: "28.a   Nilai Tanah",
    value: rp(h.asetTanah),
    explain:
      `${Math.round(h.luasM2_f).toLocaleString()} m² × Rp 100.000/m²\n` +
      `= ${rp(h.asetTanah)}\n(Estimasi BPS pedesaan Bojonegoro)`,
  });
  rows.push({
    label: "28.b   Aset Lainnya (Alat)",
    value: rp(h.asetLain),
    explain:
      `Estimasi peralatan untuk luas ${Math.round(h.luasM2_f).toLocaleString()} m²:\n\n` +
      `  Pompa Air (Alkon) ${String(h.alatUnits[0]).padStart(3)}× Rp 1.500.000 = ${rp(h.alatUnits[0] * 1_500_000)}\n` +
      `  Sprayer (16L)     ${String(h.alatUnits[1]).padStart(3)}× Rp   250.000 = ${rp(h.alatUnits[1] * 250_000)}\n` +
      `  Sabit/Arit        ${String(h.alatUnits[2]).padStart(3)}× Rp    50.000 = ${rp(h.alatUnits[2] * 50_000)}\n` +
      `  Cangkul (Pacul)   ${String(h.alatUnits[3]).padStart(3)}× Rp    75.000 = ${rp(h.alatUnits[3] * 75_000)}\n\n` +
      `  Mesin/Sprayer = 1 unit per 10.000 m²\n  Alat tangan  = 1 unit per 3.000 m²\n\nTotal = ${rp(h.asetLain)}`,
  });
  rows.push({
    label: "28.c   Total Aset",
    value: rp(h.asetTanah + h.asetLain),
    explain: `${rp(h.asetTanah)} + ${rp(h.asetLain)} = ${rp(h.asetTanah + h.asetLain)}`,
  });
  rows.push({
    label: "28.d   Luas Lahan",
    value: `${Math.round(h.luasM2_f).toLocaleString("id-ID")} m²`,
    explain: `${Math.round(h.luasM2_f).toLocaleString("id-ID")} m² = ${ha.toFixed(4)} ha`,
  });

  return rows;
}
