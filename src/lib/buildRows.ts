// ─── buildRows: Susun baris hasil estimasi untuk ditampilkan di ResultCard ────
// Versi BPS Realistis — semua explain berbasis ha, HOK, kg/ha
import { fmt, rp } from "./helpers";
import { db, dbTernak, explainSaprotan, kondisiPanenLabel, TEMBAKAU } from "./kalkulatorData";

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
          ? `Upah TK tembakau kering — dibayar 1 kali (Rp 77.000/orang):\n\n` +
            `  • Makani   : ${h.orgMakani ?? 0} orang × Rp 77.000 = ${rp(h.biayaMakani ?? 0)}\n` +
            `  • Ngrajang : ${h.orgNgrajang ?? 0} orang × Rp 77.000 = ${rp(h.biayaRajang ?? 0)}\n` +
            `  • Mepe     : ${h.orgMepe ?? 0} orang × Rp 77.000 = ${rp(h.biayaMepe ?? 0)}\n\n` +
            `  Total 26.a = ${rp(h.gajiTK)}\n\n` +
            `  Default ~5.000 kg: makani=2, ngrajang=2, mepe=3 → 7 × Rp 77.000 = Rp 539.000`
          : `Upah TK tembakau basah — dibayar 1 kali (Rp 77.000/orang):\n\n` +
            `  • Kowak  : ${h.orgKowak ?? 0} orang × Rp 77.000 = ${rp(h.biayaKowak ?? 0)}\n` +
            `  • Macul  : ${h.orgMacul ?? 0} orang × Rp 77.000 = ${rp(h.biayaMacul ?? 0)}\n` +
            `  • Matun  : 0 orang (tidak ada penyiangan) = Rp 0\n` +
            `  • Panen  : ${h.orgPanen ?? 0} orang × Rp 77.000 = ${rp(h.biayaPanen ?? 0)}\n\n` +
            `  Total 26.a = ${rp(h.gajiTK)}\n\n` +
            `  Default 3.000 pohon: kowak=2, macul=2, matun=0, panen=1 → 5 × Rp 77.000 = Rp 385.000`,
      },
      {
        label: "26.b. Biaya Produksi",
        value: rp(h.biayaProd),
        explain: isKering
          ? `Biaya Produksi (26.b) — Bahan Baku Tembakau Kering:\n\n` +
            `  • Tembakau basah (bahan baku): ${Math.round(h.kgBasah).toLocaleString("id-ID")} kg × Rp 4.000 = ${rp(h.biayaTembakauMatang ?? 0)}\n\n` +
            `  Total 26.b = ${rp(h.biayaProd)}\n\n` +
            `  ⚠ Peralatan (mesin, widek, timbangan, rak jemur) dicatat sebagai Aset Usaha.`
          : `Saprotan tembakau basah:\n` +
            `  Rp ${TB.saprotanBasahPer1000.toLocaleString("id-ID")} per 1.000 pohon × ${h.ribuan.toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ribuan\n` +
            `  = ${rp(h.biayaProd)}`,
      },
      {
        label: "26.d. Biaya Operasional",
        value: rp(h.ops),
        explain: isKering
          ? `Operasional tembakau kering:\n` +
            `  Rp 150.000 per 1.000 kg basah\n` +
            `  ${Math.round(h.kgBasah).toLocaleString("id-ID")} kg ÷ 1.000 × Rp 150.000 = ${rp(h.ops)}\n` +
            `  (bahan bakar, karung, dll)`
          : `Operasional tembakau basah:\n` +
            `  Rp ${TB.operBasahPer1000.toLocaleString("id-ID")} per 1.000 pohon × ${h.ribuan.toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ribuan\n` +
            `  = ${rp(h.ops)}`,
      },
      {
        label: "26.e. Biaya Non-Operasional (PBB)",
        value: "Rp 0",
        explain: `PBB dan biaya non-operasional lainnya = Rp 0 (sesuai ketentuan SE2026 Sumberharjo).`,
      },
      {
        label: "26.f. Total Pengeluaran",
        value: rp(h.totalPeng),
        explain:
          `Gaji TK    : ${rp(h.gajiTK)}\nSaprotan   : ${rp(h.biayaProd)}\n` +
          `Operasional: ${rp(h.ops)}\nNon-Tunai  : Rp 0\nTotal = ${rp(h.totalPeng)}`,
      },
      // ── PENDAPATAN ──────────────────────────────────────────────────────
      { section: "27 — Pendapatan Usaha Tembakau" },
      // Info luas tempat (hanya tembakau kering, hanya jika diisi)
      ...(isKering && h.luasTempatInfo > 0 ? [{
        label: "Luas Tempat Produksi",
        value: `${(h.luasTempatInfo ?? 0).toLocaleString("id-ID")} m²`,
        explain: `Luas tempat/lokasi produksi rajangan: ${(h.luasTempatInfo ?? 0).toLocaleString("id-ID")} m².\n` +
          `ℹ️ Hanya dicatat sebagai informasi — tidak dihitung sebagai biaya atau pajak.`,
      }] : []),
      {
        label: "27.a. Nilai Produksi / Penjualan",
        value: rp(h.nilaiProd),
        explain: isKering
          ? `Konversi hasil rajangan:\n` +
            `  ${Math.round(h.kgBasah).toLocaleString("id-ID")} kg basah × susut ${TB.susut} = ${Math.round(h.kgKering).toLocaleString("id-ID")} kg kering rajang\n` +
            `  ${Math.round(h.kgKering).toLocaleString("id-ID")} kg × Rp ${TB.hargaKering.toLocaleString("id-ID")}/kg = ${rp(h.nilaiProd)}\n\n` +
            `  ⚠ Nilai dihitung dari input aktual (${Math.round(h.kgBasah).toLocaleString("id-ID")} kg basah), bukan estimasi siklus.`
          : `${fmt(h.kgBasah)} kg basah × Rp ${TB.hargaBasah.toLocaleString("id-ID")}/kg = ${rp(h.nilaiProd)}\n` +
            `(180 kg per 1.000 pohon × ${h.ribuan.toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ribuan pohon)`,
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
            `  • ${(h.kgKering / 100).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kuintal\n` +
            `  • ${(h.kgKering / 1000).toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ton`
          : `Konversi Hasil:\n` +
            `  • ${Math.round(h.kgBasah).toLocaleString("id-ID")} kg\n` +
            `  • ${(h.kgBasah / 100).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kuintal\n` +
            `  • ${(h.kgBasah / 1000).toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ton`,
      },
      // ── ASET ─────────────────────────────────────────────────────────────
      { section: "28 — Aset Usaha Tembakau" },
      {
        label: "28.a. Nilai Tanah & Bangunan",
        value: rp(h.asetTanah_t),
        explain: isKering
          ? `Usaha rajangan (pascapanen) tidak memerlukan lahan — nilai tanah Rp 0.\n` +
            `Proses rajangan dilakukan di tempat pengolahan, bukan di lahan pertanian.`
          : `Nilai tanah dihitung berdasarkan luas lahan tanam yang digunakan untuk budidaya tembakau.\nLuas lahan tanam: ${h.luasM2_t} m² × Rp 100.000/m² = ${rp(h.asetTanah_t)}`,
      },
      {
        label: "28.b. Nilai Aset Peralatan",
        value: rp(h.asetLain_t),
        explain: isKering
          ? `Peralatan usaha rajangan tembakau:\n` +
            (h.asetMesinRajang > 0
              ? `  • Mesin rajang       : Rp ${(h.asetMesinRajang ?? 0).toLocaleString("id-ID")}\n`
              : `  • Mesin rajang       : (tidak ada — skala < 100 kg)\n`) +
            `  • Widek (${h.jumlahWidek ?? 1} unit @ Rp ${(h.hargaWidekPerUnit ?? 200_000).toLocaleString("id-ID")}) : Rp ${(h.asetWidekAset ?? 0).toLocaleString("id-ID")}\n` +
            `  • Timbangan          : Rp ${(h.asetTimbangan ?? 150_000).toLocaleString("id-ID")}\n` +
            `  • Rak jemur          : Rp ${(h.asetRakJemur ?? 0).toLocaleString("id-ID")}\n` +
            `  Total = ${rp(h.asetLain_t)}\n\n` +
            `  ⚠ Widek masuk Aset Usaha, bukan biaya produksi.`
          : `Mesin kecil   : Rp ${TB.asetMesinKecil.toLocaleString("id-ID")}\nWidek bambu   : Rp ${TB.asetWidek.toLocaleString("id-ID")}\nTotal = ${rp(h.asetLain_t)}`,
      },
      {
        label: "28.c. Nilai Total Aset",
        value: rp(h.totalAset),
        explain: isKering
          ? `Usaha rajangan — hanya aset peralatan:\n` +
            `  Peralatan : ${rp(h.asetLain_t)}\n` +
            `  Total Aset = ${rp(h.totalAset)}`
          : `Tanah/Bangunan: ${rp(h.asetTanah_t)}\nAlat/Peralatan: ${rp(h.asetLain_t)}\nTotal Aset     = ${rp(h.totalAset)}`,
      },
      // 28.d hanya untuk Tembakau Basah (ada lahan)
      ...(!isKering ? [{
        label: "28.d. Luas Tanah Dikuasai",
        value: `${fmt(h.luasM2_t)} m²`,
        explain: `Luas lahan tanam tembakau yang dikuasai/diusahakan: ${fmt(h.luasM2_t)} m² (${(h.luasM2_t / 10000).toLocaleString("id-ID", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ha). Luas ini digunakan sebagai dasar informasi usaha budidaya dan perhitungan PBB.`,
      }] : []),
      // ── LABA BERSIH ESTIMASI ────────────────────────────────────────────
      { section: "Ringkasan Usaha" },
      {
        label: "Laba Bersih Estimasi",
        value: rp(h.pendBersih),
        explain: isKering
          ? `Nilai Produksi − Total Pengeluaran:\n` +
            `  ${rp(h.nilaiProd)} − ${rp(h.totalPeng)} = ${rp(h.pendBersih)}\n\n` +
            `  Rincian pengeluaran:\n` +
            `    Upah TK rajangan : ${rp(h.gajiTK)}\n` +
            `    Bahan baku        : ${rp(h.biayaProd)}\n` +
            `    Operasional      : ${rp(h.ops)}\n` +
            (h.bagiHasilPot > 0 ? `    Bagi hasil       : ${rp(h.bagiHasilPot)}\n` : ``) +
            `    Total Pengeluaran: ${rp(h.totalPeng)}\n\n` +
            (h.pendBersih < 0 ? `  ⚠ Merugi — periksa input kg atau harga jual.` : `  ✓ Usaha menguntungkan.`)
          : `Nilai Produksi − Total Pengeluaran:\n` +
            `  ${rp(h.nilaiProd)} − ${rp(h.totalPeng)} = ${rp(h.pendBersih)}\n\n` +
            (h.pendBersih < 0 ? `  ⚠ Merugi — periksa input data.` : `  ✓ Usaha menguntungkan.`),
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
          `• ${h.musimList[0]}: produktivitas ${d.prod.toLocaleString("id-ID")} kg/ha, harga Rp ${d.harga.toLocaleString("id-ID")}/kg\n` +
          `• ${h.musimList[1]}: produktivitas ${Math.round(d.prod * 0.85).toLocaleString("id-ID")} kg/ha (−15%), harga Rp 6.800/kg\n` +
          `Semua nilai keuangan di bawah adalah akumulasi 2 musim.`
        : musimLabel === "Walikan"
          ? `Musim Walikan (kering/irigasi pompanisasi):\n• Produktivitas −15% → ${Math.round(d.prod * 0.85).toLocaleString("id-ID")} kg/ha\n• Harga GKP lebih tinggi: Rp 6.800/kg\n• Biaya saprotan +3% (pompanisasi)`
          : `Musim Rendengan (hujan):\n• Produktivitas standar ${d.prod.toLocaleString("id-ID")} kg/ha\n• Harga GKP: Rp ${d.harga.toLocaleString("id-ID")}/kg`,
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
        `\n\n+ Sewa sawah: ${ha.toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ha × Rp 12.000.000/ha = ${rp(h.sewaLahan)}\nTotal (saprotan + sewa) = ${rp(h.biaya)}`;
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
        `Musim ${a2.musim}:\n  Combi panen : ${(a2.prod / 100).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kw × Rp 50.000 = ${rp(a2.combiCost)}\n  BBM irigasi : -\n  Subtotal    = ${rp(a2.oper)}\n\n` +
        `Musim ${b2.musim}:\n  Combi panen : ${(b2.prod / 100).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kw × Rp 50.000 = ${rp(b2.combiCost)}\n  BBM irigasi : ${ha.toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ha × Rp 187.500 = ${rp(b2.bbmCost)}\n  Subtotal    = ${rp(b2.oper)}\n\nTotal = ${rp(h.oper)}`;
    } else if (musimLabel === "Walikan") {
      explain26d = `Combi panen : ${(h.prod / 100).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kw × Rp 50.000 = ${rp(h.combiCost)}\nBBM irigasi : ${ha.toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ha × Rp 187.500/ha = ${rp(h.bbmCost)}\nTotal = ${rp(h.oper)}`;
    } else {
      explain26d = `Combi panen+angkut: ${(h.prod / 100).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kw × Rp 50.000 = ${rp(h.combiCost)}\nTotal = ${rp(h.oper)}`;
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
        ? `Musim ${h.perMusim[0].musim}: ${Math.round(h.perMusim[0].prod).toLocaleString("id-ID")} kg × Rp ${d.harga.toLocaleString("id-ID")} = ${rp(h.perMusim[0].pend)}\n` +
          `Musim ${h.perMusim[1].musim}: ${Math.round(h.perMusim[1].prod).toLocaleString("id-ID")} kg × Rp 6.800 = ${rp(h.perMusim[1].pend)}`
        : `${Math.round(h.prod).toLocaleString("id-ID")} kg × Rp ${hargaJualR.toLocaleString("id-ID")}/kg = ${rp(h.pend)}`,
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
        `  • ${(h.prod / 100).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kuintal\n` +
        `  • ${(h.prod / 1000).toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ton`,
    });

    // ── ASET ─────────────────────────────────────────────────────────
    rows.push({ section: "28 — Aset Usaha Padi" });
    rows.push({
      label: "28.a. Nilai Aset Lahan Sawah",
      value: rp(h.asetTanah),
      explain: `Lahan sawah ${Math.round(h.luasM2_f).toLocaleString("id-ID")} m² × Rp 100.000/m² = ${rp(h.asetTanah)}`,
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
        `  • ${(h.luasM2_f / 10000).toLocaleString("id-ID", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} Hektar (ha)`,
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
        `\n\n+ Sewa tegalan: ${ha.toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ha × Rp 12.000.000/ha = ${rp(h.sewaLahan)}\nTotal = ${rp(h.biaya)}`;
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
        `Rp ${d.ops1000.toLocaleString("id-ID")} / 1.000 kg × ${(h.prod / 1000).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ${rp(h.oper)}`,
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
      explain: `${Math.round(h.prod).toLocaleString("id-ID")} kg × Rp ${d.harga.toLocaleString("id-ID")}/kg = ${rp(h.pend)}`,
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
        `  • ${(h.prod / 100).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kuintal\n` +
        `  • ${(h.prod / 1000).toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ton`,
    });

    // ── ASET ─────────────────────────────────────────────────────────
    rows.push({ section: "28 — Aset Usaha Kedelai" });
    rows.push({
      label: "28.a. Nilai Aset Lahan Tegalan",
      value: rp(h.asetTanah),
      explain: `Lahan tegalan ${Math.round(h.luasM2_f).toLocaleString("id-ID")} m² × Rp 80.000/m² (kelas tanah di bawah sawah) = ${rp(h.asetTanah)}`,
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
        `  • ${(h.luasM2_f / 10000).toLocaleString("id-ID", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} Hektar (ha)`,
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
      `Rp ${(d?.ops1000 ?? 0).toLocaleString("id-ID")} / 1.000 kg × ${(h.prod / 1000).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ${rp(h.oper)}`,
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
    explain: `${Math.round(h.prod).toLocaleString("id-ID")} kg × Rp ${(d?.harga ?? 0).toLocaleString("id-ID")}/kg = ${rp(h.pend)}`,
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
      `  • ${(h.prod / 100).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kuintal\n` +
      `  • ${(h.prod / 1000).toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ton`,
  });

  // ── ASET ─────────────────────────────────────────────────────────
  rows.push({ section: "28 — Aset Usaha" });
  rows.push({
    label: "28.a. Nilai Aset Lahan",
    value: rp(h.asetTanah),
    explain: `Lahan ${Math.round(h.luasM2_f).toLocaleString("id-ID")} m² × Rp 90.000/m² = ${rp(h.asetTanah)}`,
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
      `  • ${(h.luasM2_f / 10000).toLocaleString("id-ID", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} Hektar (ha)`,
  });

  return rows;
}

// ======================================================================
// BUILDROWS PETERNAKAN — sesuai spec gemini-code-1783406649841
// Model flat per siklus: Laba = NilaiProd - (Gaji + BiayaProd + Ops)
// ======================================================================
export function buildRowsPeternakan(h: any): ResultItem[] {
  if (!h || !h.isPeternakan) return [];

  const d = dbTernak[h.jenisTernak as string];
  const rows: ResultItem[] = [];
  const mandiri: boolean = h.mandiri === true || (h.upahHarian ?? 0) <= 0 || h.hokDibayar === 0;

  // ── Info usaha ──────────────────────────────────────────────────────────────
  rows.push({
    label: "Jenis Ternak",
    value: h.jenisTernak,
    explain: `Komoditas peternakan: ${h.jenisTernak}. Patokan BPS Bojonegoro 2026.`,
  });
  rows.push({
    label: "Jumlah Ternak",
    value: `${h.jumlahEkor} ekor`,
    explain: `Total populasi ternak: ${h.jumlahEkor} ekor.`,
  });
  rows.push({
    label: "Periode Pemeliharaan",
    value: `${d?.periodeBulan ?? h.periodeBulan} bulan / siklus`,
    explain: `Lama 1 siklus pemeliharaan sampai siap jual: ${d?.periodeBulan ?? h.periodeBulan} bulan.`,
  });
  rows.push({
    label: "Status Pekerja",
    value: mandiri ? "Mandiri (Owner)" : "Ada Pekerja",
    explain: mandiri
      ? `Seluruh pekerjaan dilakukan pemilik & keluarga sendiri.\nGaji TK = Rp 0 (Mandiri/Owner).`
      : `Menggunakan tenaga kerja upahan.\nGaji dihitung dari patokan flat per siklus.`,
  });
  rows.push({
    label: "Bobot Jual Estimasi",
    value: `${h.beratTotal.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`,
    explain: `${h.jumlahEkor} ekor × ${d?.beratJual ?? "—"} kg/ekor = ${h.beratTotal.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`,
  });

  // ── 24 — Pekerja ───────────────────────────────────────────────────────────
  rows.push({ section: "24 — Pekerja Peternakan (Sensus Ekonomi 2026)" });
  rows.push({
    label: "24.a1. Pekerja Laki-laki",
    value: `${h.pekerjaLaki} orang`,
    explain: mandiri
      ? `Pemilik (laki-laki) mengerjakan sendiri: 1 orang.\nTidak dibayar — kerja mandiri.`
      : `Pekerja laki-laki (pakan, kandang, angkut): ${h.pekerjaLaki} orang. Setara ${h.hokLaki} hari kerja.`,
  });
  rows.push({
    label: "24.b1. Pekerja Perempuan",
    value: `${h.pekerjaPerempuan} orang`,
    explain: mandiri
      ? `Anggota keluarga perempuan (istri/anak) membantu: 1 orang. Tidak menerima upah.`
      : `Pekerja perempuan (bantu pakan, perawatan): ${h.pekerjaPerempuan} orang. Setara ${h.hokPerempuan} hari kerja.`,
  });
  rows.push({
    label: "24.c1. Total Pekerja (a1+b1)",
    value: `${h.totalPekerja} orang`,
    explain: `Total fisik pekerja: ${h.totalPekerja} orang. (Setara ${h.hokTotal} hari kerja)`,
  });
  rows.push({
    label: "24.a2. Pekerja Dibayar",
    value: `${h.pekerjaDibayar} orang`,
    explain: mandiri
      ? `Tidak ada tenaga kerja bayaran — semua dikerjakan pemilik & keluarga.`
      : `Tenaga kerja upahan: ${h.pekerjaDibayar} orang. Setara ${h.hokDibayar} hari kerja.`,
  });
  rows.push({
    label: "24.b2. Pekerja Tidak Dibayar",
    value: `${h.pekerjaTidakDibayar} orang`,
    explain: mandiri
      ? `Semua pekerja tidak dibayar (pemilik + keluarga): ${h.pekerjaTidakDibayar} orang.\n  • Laki-laki (pemilik): 1\n  • Perempuan (keluarga): 1`
      : `Pemilik/keluarga (tidak dibayar): ${h.pekerjaTidakDibayar} orang.`,
  });
  rows.push({
    label: "24.c2. Total Pekerja (a2+b2)",
    value: `${h.totalPekerja} orang`,
    explain: `Total: ${h.totalPekerja} orang (harus sama dengan 24.c1).`,
  });

  // ── 26 — Pengeluaran ───────────────────────────────────────────────────────
  rows.push({ section: "26 — Pengeluaran Usaha Peternakan" });
  rows.push({
    label: "26.a. Upah Tenaga Kerja",
    value: rp(h.biayaTK),
    explain: mandiri
      ? `Gaji TK = Rp 0\nAlgoritma spec: jika jumlahPekerja ≤ 0 atau upah ≤ 0 → Gaji = 0 (Mandiri/Owner).`
      : `Gaji flat per siklus:\n${h.jumlahEkor} ekor × Rp ${(d?.gajiDefault ?? 0).toLocaleString("id-ID")}/ekor = ${rp(h.biayaTK)}`,
  });
  rows.push({
    label: "26.b. Biaya Produksi (Pakan + Vaksin)",
    value: rp(h.biayaPakan),
    explain: `Biaya produksi flat per siklus:\n${h.jumlahEkor} ekor × Rp ${(d?.biayaProduksi ?? 0).toLocaleString("id-ID")}/ekor = ${rp(h.biayaPakan)}\n\nKomponen:\n${
      h.jenisTernak === "Sapi"
        ? "  • Jerami + konsentrat + bekatul\n  • Garam mineral, air minum\n  • Vaksin anthrax & SE, obat cacing"
        : h.jenisTernak === "Kambing"
        ? "  • Rumput segar (Odot/Gajah) + konsentrat\n  • Dedak + garam\n  • Vaksin SE, obat cacing, vitamin"
        : h.jenisTernak === "Ayam Broiler"
        ? "  • Pakan starter (DOC–14 hari) + finisher\n  • Air minum bebas\n  • Vitamin & vaksin"
        : "  • Dedak halus + jagung giling\n  • Sayuran + air minum\n  • Vaksin ND, obat cacing"
    }`,
  });
  rows.push({
    label: "26.d. Biaya Operasional",
    value: rp(h.biayaOps ?? 0),
    explain: `Biaya operasional pendukung (listrik, air, dll) flat per siklus:\n${h.jumlahEkor} ekor × Rp ${(d?.biayaOps ?? 0).toLocaleString("id-ID")}/ekor = ${rp(h.biayaOps ?? 0)}`,
  });
  rows.push({
    label: "26.f. Total Pengeluaran",
    value: rp(h.totalPeng),
    explain: `Upah TK         : ${rp(h.biayaTK)}\nBiaya Produksi  : ${rp(h.biayaPakan)}\nBiaya Ops       : ${rp(h.biayaOps ?? 0)}\nTotal           = ${rp(h.totalPeng)}\n\nFormula spec:\nLaba = Nilai Produksi − (Gaji + BiayaProduksi + BiayaOps)`,
  });

  // ── 27 — Nilai Produksi ────────────────────────────────────────────────────
  rows.push({ section: "27 — Nilai Produksi Peternakan" });
  rows.push({
    label: "27.a. Nilai Jual Ternak",
    value: rp(h.nilaiProd),
    explain: `${h.jumlahEkor} ekor × Rp ${Math.round(h.nilaiProd / h.jumlahEkor).toLocaleString("id-ID")}/ekor = ${rp(h.nilaiProd)}\n\nPatokan Bojonegoro 2026:\n  • Harga/ekor : Rp ${(d?.hargaJual ?? 0).toLocaleString("id-ID")}\n  • Harga/kg   : Rp ${(d?.hargaPerKg ?? 0).toLocaleString("id-ID")}`,
  });
  rows.push({
    label: "27.c. Total Nilai Produksi",
    value: rp(h.nilaiProd),
    explain: `Total pendapatan kotor dari penjualan ternak 1 siklus.`,
  });
  rows.push({
    label: "Laba Kotor (Estimasi)",
    value: rp(h.pendBersih),
    explain: `Nilai Produksi − (Gaji + BiayaProduksi + Ops):\n` +
      `${rp(h.nilaiProd)} − (${rp(h.biayaTK)} + ${rp(h.biayaPakan)} + ${rp(h.biayaOps ?? 0)}) = ${rp(h.pendBersih)}` +
      (mandiri ? `\n\n✓ Status Mandiri: Gaji = Rp 0 → laba lebih tinggi.` : "") +
      (h.pendBersih < 0 ? `\n\n⚠ Merugi — periksa input data.` : ""),
  });

  // ── 28 — Aset ─────────────────────────────────────────────────────────────
  rows.push({ section: "28 — Aset Usaha Peternakan" });
  rows.push({
    label: "28.a. Nilai Kandang",
    value: rp(h.asetKandang),
    explain: `Estimasi nilai kandang:\n${h.jumlahEkor} ekor × Rp ${Math.round(h.asetKandang / h.jumlahEkor).toLocaleString("id-ID")}/ekor = ${rp(h.asetKandang)}`,
  });
  rows.push({
    label: "28.b. Nilai Ternak (Aset)",
    value: rp(h.asetTernak),
    explain: `Nilai pasar ternak saat ini:\n${h.jumlahEkor} ekor × Rp ${(d?.hargaJual ?? 0).toLocaleString("id-ID")}/ekor = ${rp(h.asetTernak)}`,
  });
  rows.push({
    label: "28.c. Nilai Total Aset",
    value: rp(h.totalAset),
    explain: `Kandang : ${rp(h.asetKandang)}\nTernak  : ${rp(h.asetTernak)}\nTotal   = ${rp(h.totalAset)}`,
  });

  return rows;
}
