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

  // ======================================================================
  // JALUR TEMBAKAU (Basah / Kering)
  // ======================================================================
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
      // ── PEKERJA (JIWA / ORANG) ──────────────────────────────────────────
      { section: "24 — Pekerja (Sensus Ekonomi 2026)" },
      {
        label: "24.a1. Pekerja Laki-laki",
        value: `${h.pekerjaLaki} orang`,
        explain: `Jumlah fisik pekerja laki-laki yang terlibat: ${h.pekerjaLaki} orang.\n` +
          `Setara dengan hari kerja Laki-laki: ${h.hokLaki} hari.\n` +
          (isKering ? `(Kering: lebih banyak perempuan rajang & mepe)` : `(Basah: kowak & macul didominasi laki-laki)`),
      },
      {
        label: "24.b1. Pekerja Perempuan",
        value: `${h.pekerjaPerempuan} orang`,
        explain: `Jumlah fisik pekerja perempuan yang terlibat: ${h.pekerjaPerempuan} orang.\n` +
          `Setara dengan hari kerja Perempuan: ${h.hokPerempuan} hari.\n` +
          (isKering ? `(Pekerjaan rajang & mepe dominan perempuan)` : `(Panen & sortir dominan perempuan)`),
      },
      {
        label: "24.c1. Total Pekerja (a1+b1)",
        value: `${h.totalPekerja} orang`,
        explain: `Total fisik pekerja yang terlibat: ${h.totalPekerja} orang. (Setara dengan ${h.hokTotal} hari kerja)`,
      },
      {
        label: "24.a2. Pekerja Dibayar",
        value: `${h.pekerjaDibayar} orang`,
        explain: `Pekerja dibayar (buruh musiman/borongan): ${h.pekerjaDibayar} orang.\n` +
          `Setara dengan hari kerja Dibayar: ${h.hokDibayar} hari.`,
      },
      {
        label: "24.b2. Pekerja Tidak Dibayar",
        value: `${h.pekerjaTidakDibayar} orang`,
        explain: `Pekerja tidak dibayar (anggota keluarga/pemilik): ${h.pekerjaTidakDibayar} orang.\n` +
          `Setara dengan hari kerja Tidak Dibayar: ${h.hokTidakDibayar} hari.`,
      },
      {
        label: "24.c2. Total Pekerja (a2+b2)",
        value: `${h.totalPekerja} orang`,
        explain: `Total pekerja berdasarkan status pembayaran: ${h.totalPekerja} orang. (KONSISTEN: harus sama dengan total 24.c1)`,
      },
      // ── PENGELUARAN ────────────────────────────────────────────────────
      { section: "26 — Pengeluaran Usaha Tembakau" },
      {
        label: "26.a. Upah Tenaga Kerja",
        value: rp(h.gajiTK),
        explain: isKering
          ? `Biaya produksi tembakau kering = Σ upah per jenis pekerjaan × kg basah:\n` +
            `  • Ngrajang : ${Math.round(h.kgBasah).toLocaleString("id-ID")} kg × Rp 1.000 = ${rp(h.biayaRajang ?? 0)}\n` +
            `  • Mepe     : ${Math.round(h.kgBasah).toLocaleString("id-ID")} kg × Rp 250   = ${rp(h.biayaMepe ?? 0)}\n` +
            `  • Sortasi  : ${Math.round(h.kgBasah).toLocaleString("id-ID")} kg × Rp 150   = ${rp(h.biayaSortasi ?? 0)}\n` +
            `  • Press    : ${Math.round(h.kgBasah).toLocaleString("id-ID")} kg × Rp 100   = ${rp(h.biayaPress ?? 0)}\n` +
            `  • Packing  : ${Math.round(h.kgBasah).toLocaleString("id-ID")} kg × Rp 50    = ${rp(h.biayaPacking ?? 0)}\n` +
            `Total 26.a = ${rp(h.gajiTK)}`
          : `Upah TK per jenis pekerjaan basah (hari kerja × upah/hari):\n` +
            `  • Kowak ${h.tkKowak ?? 0} hari × Rp 75.000 = ${rp(h.biayaKowak ?? 0)}\n` +
            `  • Macul ${h.tkMacul ?? 0} hari × Rp 75.000 = ${rp(h.biayaMacul ?? 0)}\n` +
            `  • Tanam ${h.tkTanam ?? 0} hari × Rp 70.000 = ${rp(h.biayaTanam ?? 0)}\n` +
            `  • Matun ${h.tkMatun ?? 0} hari × Rp 70.000 = ${rp(h.biayaMatun ?? 0)}\n` +
            `  • Panen ${h.tkPanen ?? 0} hari × Rp 80.000 = ${rp(h.biayaPanen ?? 0)}\n` +
            `Total 26.a = ${rp(h.gajiTK)}`,
      },
      {
        label: "26.b. Biaya Produksi (Saprotan)",
        value: rp(h.biayaProd),
        explain: isKering
          ? `Tembakau kering: biaya produksi = upah TK rajang (sudah termasuk di 26.a).\nSaprotan terpisah: Rp ${Math.round((h.biayaProd ?? 0)).toLocaleString("id-ID")}`
          : explainSaprotan("Tembakau Basah",  h.ribuan, h.biayaProd),
      },
      {
        label: "26.d. Biaya Operasional",
        value: rp(h.ops),
        explain: isKering
          ? `Operasional tembakau kering: 15% dari biaya TK.\n${rp(h.gajiTK ?? 0)} × 15% = ${rp(h.ops)}`
          : `Operasional tembakau basah: Rp ${TB.operBasahPer1000.toLocaleString()} per 1.000 pohon\n× ${h.ribuan.toFixed(2)} = ${rp(h.ops)}`,
      },
      {
        label: "26.e. Biaya Non-Operasional (PBB)",
        value: isKering ? "Rp 0" : rp(h.nonT),
        explain: isKering
          ? `Tembakau Kering: tidak ada biaya non-tunai (PBB dibebankan ke usaha basah).`
          : `PBB lahan: ${h.luasM2_t} m² × Rp ${TB.pbbPerM2.toLocaleString()}/m² = ${rp(h.nonT)}`,
      },
      {
        label: "26.f. Total Pengeluaran",
        value: rp(h.totalPeng),
        explain:
          `Gaji TK    : ${rp(h.gajiTK)}\nSaprotan   : ${rp(h.biayaProd)}\n` +
          `Operasional: ${rp(h.ops)}\nNon-Tunai  : ${rp(h.nonT)}\nTotal = ${rp(h.totalPeng)}`,
      },
      // ── PENDAPATAN ──────────────────────────────────────────────────────
      { section: "27 — Pendapatan Usaha Tembakau" },
      {
        label: "27.a. Nilai Produksi / Penjualan",
        value: rp(h.nilaiProd),
        explain: isKering
          ? `${Math.round(h.kgBasah).toLocaleString()} kg basah × susut ${TB.susut} = ${Math.round(h.kgKering).toLocaleString()} kg kering\n` +
            `${Math.round(h.kgKering).toLocaleString()} kg × Rp ${TB.hargaKering.toLocaleString()}/kg = ${rp(h.nilaiProd)}`
          : `${Math.round(h.kgBasah).toLocaleString()} kg × Rp ${TB.hargaBasah.toLocaleString()}/kg = ${rp(h.nilaiProd)}`,
      },
      {
        label: "27.c. Total Nilai Produksi",
        value: rp(h.nilaiProd),
        explain: `Sensus Ekonomi 2026: Total pendapatan kotor dari komoditas yang dihasilkan.`,
      },
      {
        label: "Hasil Produksi (Konversi)",
        value: isKering
          ? `${Math.round(h.kgKering).toLocaleString("id-ID")} kg kering`
          : `${Math.round(h.kgBasah).toLocaleString("id-ID")} kg basah`,
        explain: isKering
          ? `Konversi Hasil:\n` +
            `  • ${Math.round(h.kgKering).toLocaleString("id-ID")} kg\n` +
            `  • ${(h.kgKering / 100).toFixed(2)} kuintal\n` +
            `  • ${(h.kgKering / 1000).toFixed(3)} ton`
          : `Konversi Hasil:\n` +
            `  • ${Math.round(h.kgBasah).toLocaleString("id-ID")} kg\n` +
            `  • ${(h.kgBasah / 100).toFixed(2)} kuintal\n` +
            `  • ${(h.kgBasah / 1000).toFixed(3)} ton`,
      },
      // ── ASET ─────────────────────────────────────────────────────────────
      { section: "28 — Aset Usaha Tembakau" },
      {
        label: "28.a. Nilai Tanah & Bangunan",
        value: rp(h.asetTanah_t),
        explain: `Luas tempat produksi ${h.luasM2_t} m² × Rp 100.000/m² = ${rp(h.asetTanah_t)}`,
      },
      {
        label: "28.b. Nilai Aset Selain Tanah",
        value: rp(h.asetLain_t),
        explain: isKering
          ? `Mesin rajang  : Rp ${TB.asetMesinKecil.toLocaleString()}\nMesin kering  : Rp ${TB.asetMesinBesar.toLocaleString()}\nWidek bambu   : Rp ${TB.asetWidek.toLocaleString()}\nTotal = ${rp(h.asetLain_t)}`
          : `Mesin kecil   : Rp ${TB.asetMesinKecil.toLocaleString()}\nWidek bambu   : Rp ${TB.asetWidek.toLocaleString()}\nTotal = ${rp(h.asetLain_t)}`,
      },
      {
        label: "28.c. Nilai Total Aset",
        value: rp(h.totalAset),
        explain: `Tanah/Bangunan: ${rp(h.asetTanah_t)}\nAlat/Peralatan: ${rp(h.asetLain_t)}\nTotal Aset     = ${rp(h.totalAset)}`,
      },
      {
        label: "28.d. Luas Tanah Dikuasai",
        value: `${h.luasM2_t} m²`,
        explain: `Luas tanah/lapangan jemur tembakau: ${h.luasM2_t} m² = ${(h.luasM2_t / 10000).toFixed(4)} ha.`,
      },
    ];
  }

  // ======================================================================
  // JALUR PADI (RICE)
  // ======================================================================
  if (kom === "Padi") {
    const ha = h.ha ?? (h.luasM2_f / 10000);
    const isDuaMusim  = Array.isArray(h.musimList) && h.musimList.length === 2;
    const musimLabel  = isDuaMusim
      ? `${h.musimList[0]} + ${h.musimList[1]}`
      : (Array.isArray(h.musimList) ? h.musimList[0] : h.musim) ?? "—";

    const d = db["Padi"]!;
    const PROD_PER_HA_R = (musimLabel === "Walikan") ? d.prod * 0.85 : d.prod;
    const hargaJualR    = (musimLabel === "Walikan") ? 6800 : d.harga;

    const rows: ResultItem[] = [];

    rows.push({
      label: "Musim Tanam",
      value: musimLabel,
      explain: isDuaMusim
        ? `2 musim tanam dalam 1 tahun:\n` +
          `• ${h.musimList[0]}: produktivitas ${d.prod.toLocaleString()} kg/ha, harga Rp ${d.harga.toLocaleString()}/kg\n` +
          `• ${h.musimList[1]}: produktivitas ${Math.round(d.prod * 0.85).toLocaleString()} kg/ha (−15%), harga Rp 6.800/kg\n` +
          `Semua nilai keuangan di bawah adalah akumulasi 2 musim.`
        : musimLabel === "Walikan"
          ? `Musim Walikan (kering/irigasi pompanisasi):\n• Produktivitas −15% → ${Math.round(d.prod * 0.85).toLocaleString()} kg/ha\n• Harga GKP lebih tinggi: Rp 6.800/kg\n• Biaya saprotan +3% (pompanisasi)`
          : `Musim Rendengan (hujan):\n• Produktivitas standar ${d.prod.toLocaleString()} kg/ha\n• Harga GKP: Rp ${d.harga.toLocaleString()}/kg`,
    });

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

    // ── PEKERJA (JIWA / ORANG) ──────────────────────────────────────────
    rows.push({ section: "24 — Pekerja Padi (Sensus Ekonomi 2026)" });
    rows.push({
      label: "24.a1. Pekerja Laki-laki",
      value: `${h.pekerjaLaki} orang`,
      explain: `Pekerja fisik laki-laki (bajak sawah, ngangkut gabah, operator alkon): ${h.pekerjaLaki} orang.\n` +
        `Setara dengan hari kerja Laki-laki: ${h.hokLaki} hari.`,
    });
    rows.push({
      label: "24.b1. Pekerja Perempuan",
      value: `${h.pekerjaPerempuan} orang`,
      explain: `Pekerja fisik perempuan (tanam sawah/tandur, matun/rumput, sortir): ${h.pekerjaPerempuan} orang.\n` +
        `Setara dengan hari kerja Perempuan: ${h.hokPerempuan} hari.`,
    });
    rows.push({
      label: "24.c1. Total Pekerja (a1+b1)",
      value: `${h.totalPekerja} orang`,
      explain: `Jumlah fisik semua orang yang ikut bekerja: ${h.totalPekerja} orang. (Setara dengan ${h.hokTotal} hari kerja)`,
    });
    rows.push({
      label: "24.a2. Pekerja Dibayar",
      value: `${h.pekerjaDibayar} orang`,
      explain: `Buruh tani bayaran (musiman/borongan): ${h.pekerjaDibayar} orang.\n` +
        `Setara dengan hari kerja Dibayar: ${h.hokDibayar} hari.`,
    });
    rows.push({
      label: "24.b2. Pekerja Tidak Dibayar",
      value: `${h.pekerjaTidakDibayar} orang`,
      explain: `Keluarga/Pemilik sawah: ${h.pekerjaTidakDibayar} orang.\n` +
        `⚠️ SPESIFIK PADI: Bernilai flat 4 karena pemilik/keluarga ikut turun langsung menggarap setiap musim rendengan & walikan.\n` +
        `Setara dengan hari kerja Tidak Dibayar: ${h.hokTidakDibayar} hari.`,
    });
    rows.push({
      label: "24.c2. Total Pekerja (a2+b2)",
      value: `${h.totalPekerja} orang`,
      explain: `Total pekerja berdasarkan status pembayaran: ${h.totalPekerja} orang. (KONSISTEN: harus sama dengan total 24.c1)`,
    });

    // ── PENGELUARAN ──────────────────────────────────────────────────
    rows.push({ section: "26 — Pengeluaran Usaha Padi" + (isDuaMusim ? " (Akumulasi 2 Musim)" : "") });
    rows.push({
      label: "26.a. Upah Tenaga Kerja",
      value: rp(h.upah),
      explain: `Upah TK = hari kerja dibayar × upah per hari.\n` +
        `${h.hokDibayar} hari × Rp ${(h.upahHarian ?? 70000).toLocaleString("id-ID")}/hari = ${rp(h.upah)}`,
    });

    let explain26b = "";
    if (status === "Milik Sendiri") {
      explain26b = explainSaprotan("Padi", ha, h.biaya) +
        (isDuaMusim ? `\n\nBreakdown: \n${h.perMusim.map((m: any) => `  ${m.musim}: ${rp(m.biaya)}`).join("\n")}` : "");
    } else if (status === "Sewa") {
      const saprotanSaja = h.biaya - h.sewaLahan;
      explain26b = explainSaprotan("Padi", ha, saprotanSaja) +
        `\n\n+ Sewa sawah: ${ha.toFixed(3)} ha × Rp 12.000.000/ha = ${rp(h.sewaLahan)}\nTotal (saprotan + sewa) = ${rp(h.biaya)}`;
    } else {
      explain26b = explainSaprotan("Padi", ha, h.biaya) + `\n\n(Bagi hasil dicatat terpisah sebagai 26.c)`;
    }
    rows.push({ label: "26.b. Biaya Produksi (Saprotan)", value: rp(h.biaya), explain: explain26b });

    if (status === "Bagi Hasil") {
      rows.push({
        label: "26.c. Bagi Hasil ke Pemilik (Maro)",
        value: rp(h.bagiHasilPot),
        explain: `Sistem maro (50:50) dari hasil kotor:\nBagian pemilik sawah: ${rp(h.bagiHasilPot)}\nBagian penggarap: ${rp(h.pendPetani)}`,
      });
    }

    let explain26d = "";
    if (isDuaMusim) {
      const a2 = h.perMusim[0]; const b2 = h.perMusim[1];
      explain26d =
        `Musim ${a2.musim}:\n  Combi panen : ${(a2.prod / 100).toFixed(1)} kw × Rp 50.000 = ${rp(a2.combiCost)}\n  BBM irigasi : -\n  Subtotal    = ${rp(a2.oper)}\n\n` +
        `Musim ${b2.musim}:\n  Combi panen : ${(b2.prod / 100).toFixed(1)} kw × Rp 50.000 = ${rp(b2.combiCost)}\n  BBM irigasi : ${ha.toFixed(3)} ha × Rp 187.500 = ${rp(b2.bbmCost)}\n  Subtotal    = ${rp(b2.oper)}\n\nTotal = ${rp(h.oper)}`;
    } else if (musimLabel === "Walikan") {
      explain26d = `Combi panen : ${(h.prod / 100).toFixed(1)} kw × Rp 50.000 = ${rp(h.combiCost)}\nBBM irigasi : ${ha.toFixed(3)} ha × Rp 187.500/ha = ${rp(h.bbmCost)}\nTotal = ${rp(h.oper)}`;
    } else {
      explain26d = `Combi panen+angkut: ${(h.prod / 100).toFixed(1)} kw × Rp 50.000 = ${rp(h.combiCost)}\nTotal = ${rp(h.oper)}`;
    }
    rows.push({ label: "26.d. Biaya Operasional", value: rp(h.oper), explain: explain26d });

    rows.push({
      label: "26.e. Biaya Non-Operasional (PBB)",
      value: rp(h.non),
      explain: `PBB sawah: Rp 20.000/tahun (Pajak Bumi & Bangunan flat sawah pedesaan Bojonegoro).`,
    });

    rows.push({
      label: "26.f. Total Pengeluaran",
      value: rp(h.totalPeng),
      explain: `Upah TK: ${rp(h.upah)}\nSaprotan: ${rp(h.biaya)}\nOperasional: ${rp(h.oper)}\nNon-oper: ${rp(h.non)}\nTotal = ${rp(h.totalPeng)}`,
    });

    // ── PENDAPATAN ──────────────────────────────────────────────────
    rows.push({ section: "27 — Nilai Produksi Padi" });
    rows.push({
      label: "27.a. Nilai Produksi / Penjualan",
      value: rp(h.pend),
      explain: isDuaMusim
        ? `Musim ${h.perMusim[0].musim}: ${Math.round(h.perMusim[0].prod).toLocaleString()} kg × Rp ${d.harga.toLocaleString()} = ${rp(h.perMusim[0].pend)}\n` +
          `Musim ${h.perMusim[1].musim}: ${Math.round(h.perMusim[1].prod).toLocaleString()} kg × Rp 6.800 = ${rp(h.perMusim[1].pend)}`
        : `${Math.round(h.prod).toLocaleString("id-ID")} kg × Rp ${hargaJualR.toLocaleString()}/kg = ${rp(h.pend)}`,
    });

    rows.push({
      label: "27.c. Total Nilai Produksi",
      value: rp(h.pend),
      explain: `Total pendapatan dari panen padi setahun.`,
    });

    rows.push({
      label: "Hasil Produksi (Konversi)",
      value: `${Math.round(h.prod).toLocaleString("id-ID")} kg GKP`,
      explain: `Konversi Gabah Kering Panen (GKP):\n` +
        `  • ${Math.round(h.prod).toLocaleString("id-ID")} kg\n` +
        `  • ${(h.prod / 100).toFixed(2)} kuintal\n` +
        `  • ${(h.prod / 1000).toFixed(3)} ton`,
    });

    // ── ASET ─────────────────────────────────────────────────────────
    rows.push({ section: "28 — Aset Usaha Padi" });
    rows.push({
      label: "28.a. Nilai Aset Lahan Sawah",
      value: rp(h.asetTanah),
      explain: `Lahan sawah ${Math.round(h.luasM2_f).toLocaleString()} m² × Rp 100.000/m² = ${rp(h.asetTanah)}`,
    });

    rows.push({
      label: "28.b. Nilai Aset Peralatan sawah",
      value: rp(h.asetLain),
      explain: `Daftar peralatan sawah:\n` +
        `  - Pompa air (Alkon)  ${h.alatUnits[0]} unit × Rp 1.500.000 = ${rp(h.alatUnits[0] * 1500000)}\n` +
        `  - Sprayer hama       ${h.alatUnits[1]} unit × Rp 250.000 = ${rp(h.alatUnits[1] * 250000)}\n` +
        `  - Sabit potong padi  ${h.alatUnits[2]} unit × Rp 50.000 = ${rp(h.alatUnits[2] * 50000)}\n` +
        `  - Cangkul tanah      ${h.alatUnits[3]} unit × Rp 75.000 = ${rp(h.alatUnits[3] * 75000)}\n` +
        `Total = ${rp(h.asetLain)}`,
    });

    rows.push({
      label: "28.c. Nilai Total Aset Padi",
      value: rp(h.asetTanah + h.asetLain),
      explain: `Sawah: ${rp(h.asetTanah)}\nAlat-alat: ${rp(h.asetLain)}\nTotal = ${rp(h.asetTanah + h.asetLain)}`,
    });

    rows.push({
      label: "28.d. Luas Lahan Sawah (Konversi)",
      value: `${Math.round(h.luasM2_f).toLocaleString("id-ID")} m²`,
      explain: `Luas lahan sawah:\n` +
        `  • ${Math.round(h.luasM2_f).toLocaleString("id-ID")} m²\n` +
        `  • ${(h.luasM2_f / 10000).toFixed(4)} Hektar (ha)`,
    });

    return rows;
  }

  // ======================================================================
  // JALUR KEDELAI (SOYBEAN)
  // ======================================================================
  if (kom === "Kedelai") {
    const ha = h.ha ?? (h.luasM2_f / 10000);
    const d = db["Kedelai"]!;

    const rows: ResultItem[] = [];

    rows.push({
      label: "Kondisi Hasil Panen",
      value: kondisiPanenLabel[h.kondisiPanen as keyof typeof kondisiPanenLabel] ?? h.kondisiPanen ?? "Sedang (normal)",
      explain: `Kondisi dipilih: ${h.kondisiPanen ?? "Sedang"} (×${(h.faktorKondisi ?? 1).toFixed(2)})`,
    });

    // ── PEKERJA (JIWA / ORANG) ──────────────────────────────────────────
    rows.push({ section: "24 — Pekerja Kedelai (Sensus Ekonomi 2026)" });
    rows.push({
      label: "24.a1. Pekerja Laki-laki",
      value: `${h.pekerjaLaki} orang`,
      explain: `Pekerja fisik laki-laki (olah tegalan, semprot, angkut kedelai): ${h.pekerjaLaki} orang.`,
    });
    rows.push({
      label: "24.b1. Pekerja Perempuan",
      value: `${h.pekerjaPerempuan} orang`,
      explain: `Pekerja fisik perempuan (tanam, penyiangan rumput, petik panen, sortir biji): ${h.pekerjaPerempuan} orang.`,
    });
    rows.push({
      label: "24.c1. Total Pekerja (a1+b1)",
      value: `${h.totalPekerja} orang`,
      explain: `Jumlah fisik pekerja: ${h.totalPekerja} orang. (Setara dengan ${h.hokTotal} hari kerja)`,
    });
    rows.push({
      label: "24.a2. Pekerja Dibayar",
      value: `${h.pekerjaDibayar} orang`,
      explain: `Buruh tani bayaran (musiman/borongan): ${h.pekerjaDibayar} orang.\n` +
        `Setara dengan hari kerja Dibayar: ${h.hokDibayar} hari.`,
    });
    rows.push({
      label: "24.b2. Pekerja Tidak Dibayar",
      value: `${h.pekerjaTidakDibayar} orang`,
      explain: `Keluarga petani kedelai: 2 orang (anggota keluarga/pemilik sawah/tegalan).\n` +
        `Setara dengan hari kerja Tidak Dibayar: ${h.hokTidakDibayar} hari.`,
    });
    rows.push({
      label: "24.c2. Total Pekerja (a2+b2)",
      value: `${h.totalPekerja} orang`,
      explain: `Total pekerja berdasarkan status pembayaran: ${h.totalPekerja} orang. (KONSISTEN: harus sama dengan total 24.c1)`,
    });

    // ── PENGELUARAN ──────────────────────────────────────────────────
    rows.push({ section: "26 — Pengeluaran Usaha Kedelai" });
    rows.push({
      label: "26.a. Upah Tenaga Kerja",
      value: rp(h.upah),
      explain: `Upah TK = hari kerja dibayar × upah per hari.\n` +
        `${h.hokDibayar} hari × Rp ${(h.upahHarian ?? 70000).toLocaleString("id-ID")}/hari = ${rp(h.upah)}`,
    });

    let explain26b = "";
    if (status === "Milik Sendiri") {
      explain26b = explainSaprotan("Kedelai", ha, h.biaya);
    } else if (status === "Sewa") {
      const saprotanSaja = h.biaya - h.sewaLahan;
      explain26b = explainSaprotan("Kedelai", ha, saprotanSaja) +
        `\n\n+ Sewa tegalan: ${ha.toFixed(3)} ha × Rp 12.000.000/ha = ${rp(h.sewaLahan)}\nTotal = ${rp(h.biaya)}`;
    } else {
      explain26b = explainSaprotan("Kedelai", ha, h.biaya) + `\n\n(Bagi hasil dicatat terpisah sebagai 26.c)`;
    }
    rows.push({ label: "26.b. Biaya Produksi (Saprotan)", value: rp(h.biaya), explain: explain26b });

    if (status === "Bagi Hasil") {
      rows.push({
        label: "26.c. Bagi Hasil ke Pemilik",
        value: rp(h.bagiHasilPot),
        explain: `Maro hasil kedelai (50% dari pendapatan kotor): ${rp(h.bagiHasilPot)}`,
      });
    }

    rows.push({
      label: "26.d. Biaya Operasional",
      value: rp(h.oper),
      explain: `Perontokan (threshing), penjemuran, pengangkutan biji kedelai:\n` +
        `Rp ${d.ops1000.toLocaleString()} / 1.000 kg × ${(h.prod / 1000).toFixed(2)} = ${rp(h.oper)}`,
    });

    rows.push({
      label: "26.e. Biaya Non-Operasional (PBB)",
      value: rp(h.non),
      explain: `PBB tegalan flat pedesaan: Rp 20.000/tahun.`,
    });

    rows.push({
      label: "26.f. Total Pengeluaran",
      value: rp(h.totalPeng),
      explain: `Upah TK: ${rp(h.upah)}\nSaprotan: ${rp(h.biaya)}\nOperasional: ${rp(h.oper)}\nNon-oper: ${rp(h.non)}\nTotal = ${rp(h.totalPeng)}`,
    });

    // ── PENDAPATAN ──────────────────────────────────────────────────
    rows.push({ section: "27 — Nilai Produksi Kedelai" });
    rows.push({
      label: "27.a. Nilai Produksi / Penjualan",
      value: rp(h.pend),
      explain: `${Math.round(h.prod).toLocaleString("id-ID")} kg × Rp ${d.harga.toLocaleString()}/kg = ${rp(h.pend)}`,
    });

    rows.push({
      label: "27.c. Total Nilai Produksi",
      value: rp(h.pend),
      explain: `Total hasil pendapatan kotor kedelai setahun.`,
    });

    rows.push({
      label: "Hasil Produksi (Konversi)",
      value: `${Math.round(h.prod).toLocaleString("id-ID")} kg biji kering`,
      explain: `Konversi Hasil Kedelai:\n` +
        `  • ${Math.round(h.prod).toLocaleString("id-ID")} kg\n` +
        `  • ${(h.prod / 100).toFixed(2)} kuintal\n` +
        `  • ${(h.prod / 1000).toFixed(3)} ton`,
    });

    // ── ASET ─────────────────────────────────────────────────────────
    rows.push({ section: "28 — Aset Usaha Kedelai" });
    rows.push({
      label: "28.a. Nilai Aset Lahan Tegalan",
      value: rp(h.asetTanah),
      explain: `Lahan tegalan ${Math.round(h.luasM2_f).toLocaleString()} m² × Rp 80.000/m² (kelas tanah di bawah sawah) = ${rp(h.asetTanah)}`,
    });

    rows.push({
      label: "28.b. Nilai Aset Peralatan Kedelai",
      value: rp(h.asetLain),
      explain: `Daftar peralatan usaha kedelai:\n` +
        `  - Sprayer hama      ${h.alatUnits[0]} unit × Rp 250.000 = ${rp(h.alatUnits[0] * 250000)}\n` +
        `  - Sabit potong      ${h.alatUnits[1]} unit × Rp 50.000 = ${rp(h.alatUnits[1] * 50000)}\n` +
        `  - Cangkul           ${h.alatUnits[2]} unit × Rp 75.000 = ${rp(h.alatUnits[2] * 75000)}\n` +
        `  - Terpal penjemuran ${h.alatUnits[3]} unit × Rp 150.000 = ${rp(h.alatUnits[3] * 150000)}\n` +
        `Total = ${rp(h.asetLain)}`,
    });

    rows.push({
      label: "28.c. Nilai Total Aset Kedelai",
      value: rp(h.asetTanah + h.asetLain),
      explain: `Lahan: ${rp(h.asetTanah)}\nAlat-alat: ${rp(h.asetLain)}\nTotal = ${rp(h.asetTanah + h.asetLain)}`,
    });

    rows.push({
      label: "28.d. Luas Lahan Kedelai (Konversi)",
      value: `${Math.round(h.luasM2_f).toLocaleString("id-ID")} m²`,
      explain: `Luas lahan tegalan:\n` +
        `  • ${Math.round(h.luasM2_f).toLocaleString("id-ID")} m²\n` +
        `  • ${(h.luasM2_f / 10000).toFixed(4)} Hektar (ha)`,
    });

    return rows;
  }

  // ======================================================================
  // FALLBACK KOMODITAS LAIN (Jagung, Kacang Hijau, Bawang, Cabai, Tebu)
  // ======================================================================
  const ha = h.ha ?? (h.luasM2_f / 10000);
  const d = db[kom];

  const rows: ResultItem[] = [];

  rows.push({
    label: "Kondisi Hasil Panen",
    value: kondisiPanenLabel[h.kondisiPanen as keyof typeof kondisiPanenLabel] ?? h.kondisiPanen ?? "Sedang (normal)",
    explain: `Kondisi dipilih: ${h.kondisiPanen ?? "Sedang"} (×${(h.faktorKondisi ?? 1).toFixed(2)})`,
  });

  // ── PEKERJA (JIWA / ORANG) ──────────────────────────────────────────
  rows.push({ section: "24 — Pekerja (Sensus Ekonomi 2026)" });
  rows.push({
    label: "24.a1. Pekerja Laki-laki",
    value: `${h.pekerjaLaki} orang`,
    explain: `Pekerja laki-laki yang terlibat secara fisik: ${h.pekerjaLaki} orang.`,
  });
  rows.push({
    label: "24.b1. Pekerja Perempuan",
    value: `${h.pekerjaPerempuan} orang`,
    explain: `Pekerja perempuan yang terlibat secara fisik: ${h.pekerjaPerempuan} orang.`,
  });
  rows.push({
    label: "24.c1. Total Pekerja (a1+b1)",
    value: `${h.totalPekerja} orang`,
    explain: `Total fisik pekerja yang terlibat: ${h.totalPekerja} orang.`,
  });
  rows.push({
    label: "24.a2. Pekerja Dibayar",
    value: `${h.pekerjaDibayar} orang`,
    explain: `Pekerja dibayar / buruh tani musiman/borongan: ${h.pekerjaDibayar} orang.`,
  });
  rows.push({
    label: "24.b2. Pekerja Tidak Dibayar",
    value: `${h.pekerjaTidakDibayar} orang`,
    explain: `Pekerja keluarga / tidak dibayar: ${h.pekerjaTidakDibayar} orang.`,
  });
  rows.push({
    label: "24.c2. Total Pekerja (a2+b2)",
    value: `${h.totalPekerja} orang`,
    explain: `Total pekerja berdasarkan status pembayaran: ${h.totalPekerja} orang.`,
  });

  // ── PENGELUARAN ──────────────────────────────────────────────────
  rows.push({ section: "26 — Pengeluaran Usaha" });
  rows.push({
    label: "26.a. Upah Tenaga Kerja",
    value: rp(h.upah),
    explain: `Upah TK = hari kerja dibayar × upah per hari.\n` +
      `${h.hokDibayar} hari × Rp ${(h.upahHarian ?? 70000).toLocaleString("id-ID")}/hari = ${rp(h.upah)}`,
  });

  rows.push({
    label: "26.b. Biaya Produksi (Saprotan)",
    value: rp(h.biaya),
    explain: explainSaprotan(kom, ha, h.biaya - (status === "Sewa" ? h.sewaLahan : 0)),
  });

  if (status === "Bagi Hasil") {
    rows.push({
      label: "26.c. Bagi Hasil ke Pemilik",
      value: rp(h.bagiHasilPot),
      explain: `Sistem bagi hasil dari panen kotor (maro): ${rp(h.bagiHasilPot)}`,
    });
  }

  rows.push({
    label: "26.d. Biaya Operasional",
    value: rp(h.oper),
    explain: `Biaya penunjang operasional panen & angkut:\n` +
      `Rp ${(d?.ops1000 ?? 0).toLocaleString()} / 1.000 kg × ${(h.prod / 1000).toFixed(2)} = ${rp(h.oper)}`,
  });

  rows.push({
    label: "26.e. Biaya Non-Operasional (PBB)",
    value: rp(h.non),
    explain: `PBB lahan flat: Rp 20.000/tahun.`,
  });

  rows.push({
    label: "26.f. Total Pengeluaran",
    value: rp(h.totalPeng),
    explain: `Upah TK: ${rp(h.upah)}\nSaprotan: ${rp(h.biaya)}\nOperasional: ${rp(h.oper)}\nNon-oper: ${rp(h.non)}\nTotal = ${rp(h.totalPeng)}`,
  });

  // ── PENDAPATAN ──────────────────────────────────────────────────
  rows.push({ section: "27 — Nilai Produksi" });
  rows.push({
    label: "27.a. Nilai Produksi / Penjualan",
    value: rp(h.pend),
    explain: `${Math.round(h.prod).toLocaleString("id-ID")} kg × Rp ${(d?.harga ?? 0).toLocaleString()}/kg = ${rp(h.pend)}`,
  });

  rows.push({
    label: "27.c. Total Nilai Produksi",
    value: rp(h.pend),
    explain: `Total pendapatan dari hasil panen setahun.`,
  });

  rows.push({
    label: "Hasil Produksi (Konversi)",
    value: `${Math.round(h.prod).toLocaleString("id-ID")} kg`,
    explain: `Konversi Hasil Panen:\n` +
      `  • ${Math.round(h.prod).toLocaleString("id-ID")} kg\n` +
      `  • ${(h.prod / 100).toFixed(2)} kuintal\n` +
      `  • ${(h.prod / 1000).toFixed(3)} ton`,
  });

  // ── ASET ─────────────────────────────────────────────────────────
  rows.push({ section: "28 — Aset Usaha" });
  rows.push({
    label: "28.a. Nilai Aset Lahan",
    value: rp(h.asetTanah),
    explain: `Lahan ${Math.round(h.luasM2_f).toLocaleString()} m² × Rp 90.000/m² = ${rp(h.asetTanah)}`,
  });

  rows.push({
    label: "28.b. Nilai Aset Peralatan",
    value: rp(h.asetLain),
    explain: `Daftar peralatan:\n` +
      `  - Sprayer hama  ${h.alatUnits[1]} unit × Rp 250.000 = ${rp(h.alatUnits[1] * 250000)}\n` +
      `  - Sabit potong  ${h.alatUnits[2]} unit × Rp 50.000 = ${rp(h.alatUnits[2] * 50000)}\n` +
      `  - Cangkul       ${h.alatUnits[3]} unit × Rp 75.000 = ${rp(h.alatUnits[3] * 75000)}\n` +
      `Total = ${rp(h.asetLain)}`,
  });

  rows.push({
    label: "28.c. Nilai Total Aset",
    value: rp(h.asetTanah + h.asetLain),
    explain: `Lahan: ${rp(h.asetTanah)}\nAlat-alat: ${rp(h.asetLain)}\nTotal = ${rp(h.asetTanah + h.asetLain)}`,
  });

  rows.push({
    label: "28.d. Luas Lahan (Konversi)",
    value: `${Math.round(h.luasM2_f).toLocaleString("id-ID")} m²`,
    explain: `Luas lahan:\n` +
      `  • ${Math.round(h.luasM2_f).toLocaleString("id-ID")} m²\n` +
      `  • ${(h.luasM2_f / 10000).toFixed(4)} Hektar (ha)`,
  });

  return rows;
}
