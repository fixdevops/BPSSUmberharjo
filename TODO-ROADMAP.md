# 📋 TODO / ROADMAP — BPSSumberharjo Kalkulator SE2026
> File ini agar AI lain **tahu maksud user**, progress, dan apa yang belum dikerjakan.
> Baca ini DULU sebelum mengubah apapun.

---

## 🎯 MAKSUD USER (Ringkasan Permintaan)

User ingin kalkulator pendataan **Sensus Ekonomi 2026 (SE2026)** yang:
1. Rumusnya akurat & konsisten dengan kuesioner BPS asli (pekerja, upah, luas, kg/ton/kuintal/m², biaya produksi/operasional, total aset)
2. Ada **analisis AI** yang mendeteksi anomali (data yang nggak masuk akal / inkonsisten)
3. Ada fitur **"Benerin Otomatis"** — AI mengusulkan koreksi & langsung menuju field yang bermasalah
4. **Upah tenaga kerja harus detail per jenis pekerjaan** (matun, daun, ngrajang, mepe, dll) — bukan 1 angka flat
5. Input harus fleksibel: harian / berapa hari / 1 hari / awal sampai akhir musim
6. **Tembakau kering**: input cuma **kg** (bukan jumlah pohon + luas tanah)
7. **Tembakau kering**: biaya produksi = **harga per kg rajang** (proses rajang daun)

---

## ✅ SELESAI (Sudah Dikerjakan & Build Lolos)

### Rumus Inti SE2026
- [x] Pekerja: laki-laki, perempuan, dibayar, tidak dibayar
- [x] **Padi: pekerja tidak dibayar = 4** (pemilik ikut setiap musim rendeng+walikan)
- [x] Luas: m² ↔ hektar, kg ↔ ton ↔ kuintal
- [x] Biaya produksi, biaya operasional, total aset
- [x] 26.a Upah TK diubah ke **HOK-based** (HOK dibayar × upah harian), bukan per-ton
- [x] HOK/ha dinaikkan ke realistis (Padi 100, Jagung 80, Bawang 150, Cabai 140, Tebu 90, Kedelai 70, Kacang Hijau 60)
- [x] Detail HOK diperbaiki: hapus faktor 0.75 misterius, sekarang konsisten

### Analisis AI (Deteksi Anomali Offline)
- [x] File `src/lib/anomaliAnalysis.ts` — 15+ aturan patokan BPS:
  - A01 Konsistensi pekerja 24.c1 = 24.c2
  - A02 Padi: tidak dibayar harus = 4
  - A03 Produktivitas di luar rentang wajar
  - A04 Beban upah > 60% nilai produksi
  - A05 Usaha rugi
  - A06 Luas lahan terlalu kecil
  - A07 Nilai produksi < Rp 100.000
  - A08 Total aset = 0
  - A09 HOK/ha di luar rentang wajar
  - A10 Input nol
  - A11 Gender split konsisten
  - A15 Bagi Hasil tapi pemilik = 0
- [x] Skor kesehatan 0–100 + komponen `AnomaliCard.tsx`

### Fitur "Benerin Otomatis (AI)"
- [x] `usulkanKoreksi()` di anomaliAnalysis.ts — auto-fix upah harian & saprotan
- [x] Tombol "Terapkan" di AnomaliCard → auto-isi field upah harian

### Tembakau
- [x] **Tembakau kering: input cuma kg daun basah** (bukan jumlah pohon + luas)
- [x] **Tembakau kering: biaya produksi = Σ upah per jenis pekerjaan × kg**
  - Ngrajang Rp 1.000/kg, Mepe Rp 250/kg, Sortasi Rp 150/kg, Press Rp 100/kg, Packing Rp 50/kg
- [x] **Tembakau basah: detail per jenis pekerjaan** (upah FLAT borongan, bukan per hari)
  - Kowak Rp 75rb (borongan), Macul Rp 75rb (borongan), Tanam Rp 70rb (borongan), Matun Rp 70rb (borongan), Panen Rp 80rb (borongan)
  - Total gaji TK tembakau basah = Rp 500.000 per 1.000 pohon (FLAT) — dibagi proporsional ke masing-masing jenis pekerjaan
- [x] Detail HOK tembakau (basah & kering) tampil di index.tsx
- [x] explain di buildRows.ts update per jenis pekerjaan

---

## 🔧 KURANG / BELUM KERJA (Prioritas Tinggi — User Sudah Minta)

### 1. ⚠️ Input Durasi Kerja (BELUM DIBUAT)
User minta: input harus bisa pilih **harian / berapa hari / 1 hari / awal sampai akhir musim**.
- **Status:** BELUM DIBUAT. Sekarang upah cuma `HOK × upahHarian`, belum ada pilihan durasi.
- **Yang harus dikerjakan:**
  - Tambah field di Section 2: "Sistem Upah" → opsi: `Per Hari (HOK)` / `Borongan (1 musim)` / `Per Kg Hasil` / `Per Hari (awal-akhir)`
  - Jika "Borongan": upah = total kontrak (input angka), bukan HOK × harian
  - Jika "Per Kg Hasil": upah = kg × upahPerKg (cocok untuk ngrajang/mepe)
  - Jika "Per Hari (awal-akhir)": upah = jumlahHari × upahHarian
- **File:** `src/lib/kalkulatorData.ts` (hitungSatuMusim + tembakau), `src/app/index.tsx` (input)

### 2. ⚠️ Auto-fill Detail Pekerjaan Jika User Tidak Isi (BELUM SEMPURNA)
User minta: "kalau nggak di isi sama user brati otomatis kamu isi"
- **Status:** SEBAGIAN. Sekarang detail pekerjaan tembakau sudah auto-fill dari kg/pohon. TAPI untuk komoditas biasa (padi, dll), detail jenis pekerjaan (matun, sabit, dll) BELUM bisa diisi user & BELUM ada auto-fill yang disesuaikan.
- **Yang harus dikerjakan:**
  - Tambah input opsional detail pekerjaan di Section 2 (matun, panen, dll) — kosong = auto-fill dari patokan
  - Kalau user isi sebagian, gabung dengan auto-fill sisanya

### 3. ⚠️ Tombol "Perbaiki" di Setiap Peringatan Anomali → Menuju Field Bermasalah (BELUM DIBUAT)
User minta: "tombol perbaiki otomatis di peringatanya dan menuju yang mau di perbaiki"
- **Status:** BELUM. Sekarang tombol "Terapkan" hanya di kotak koreksi ungu, belum di tiap peringatan (error/warning). Belum ada scroll/focus ke field.
- **Yang harus dikerjakan:**
  - Tambah prop `fieldTarget` di tipe `Temuan` (mis. "upahHarian", "luas", "panen")
  - Tambah tombol "Perbaiki" di setiap TemuanItem (AnomaliCard.tsx)
  - Saat tekan → terapkan koreksi + scroll/focus ke field terkait (pakai ref/scrollTo)

### 4. ⚠️ Upah TK di Komoditas Biasa = Detail Per Jenis Pekerjaan (BELUM)
User minta: "Upah Tenaga Kerja harus sesuai upah semisal pekerjaja dari ini ini ini"
- **Status:** BELUM. Sekarang komoditas biasa (padi, jagung, dll) pakai `HOK × upahHarian` flat. Belum dipecah per jenis (bajak, tanam, matun, panen, dll).
- **Yang harus dikerjakan:**
  - Definisikan `pekerjaanPadi`, `pekerjaanJagung`, dll di TEMBAKAU-style (upah per HOK per jenis)
  - Ubah hitungSatuMusim: upah = Σ (HOK jenis × upah jenis)
  - Update buildRows explain 26.a

---

## ⏳ BELUM KERJA (Prioritas Rendah)

- [ ] Tembakau basah: review menyeluruh sama pola detail baru (sudah sebagian, perlu testing)
- [ ] Kalibrasi saprotan per wilayah (selain Bojonegoro)
- [ ] Ekspor laporan anomali ke teks/clipboard
- [ ] Penyimpanan data Blok II ke database permanen (Section 3 sudah dihapus, mungkin perlu form terpisah)
- [ ] Mode 2 musim untuk komoditas non-padi
- [ ] Unit test untuk analisis anomali & rumus tembakau

---

## ⚠️ CATATAN PENTING UNTUK AI LAIN

### Arsitektur File
| File | Peran | Jangan |
|------|-------|--------|
| `src/lib/kalkulatorData.ts` | Sumber kebenaran rumus + konstanta komoditas | Ubah tanpa paham dampak ke buildRows |
| `src/lib/buildRows.ts` | Tampilan hasil (explain). Harus sesuai rumus di kalkulatorData | Buat explain yang tidak cocok dengan angka |
| `src/lib/anomaliAnalysis.ts` | Mesin deteksi + koreksi AI. Berbasis patokan BPS | Tambah aturan tanpa patokan jelas |
| `src/components/AnomaliCard.tsx` | UI kartu anomali + tombol benerin | |
| `src/app/index.tsx` | Layar utama, form input, render hasil | |

### Konsistensi Wajib
- **Upah 26.a sekarang HOK-based** (bukan per-ton). `HOK dibayar × upahHarian = 26.a`
- **Tembakau beda satuan**: kering = per kg daun basah; basah = per 1.000 pohon
- **Tembakau kering biaya produksi** = Σ upah per jenis pekerjaan × kg (nggrajang/mepe/sortasi/press/packing)
- **Tembakau basah biaya TK** = FLAT Rp 500.000 per 1.000 pohon (dibagi proporsional ke kowak/macul/tanam/matun/panen) — BUKAN per hari × HOK

### Konstanta Upah Per Jenis Pekerjaan (TEMBAKAU.pekerjaanKering & pekerjaanBasah)
Sudah didefinisikan di `kalkulatorData.ts`. Tinggal dipakai. Patokan Bojonegoro, bisa diubah per wilayah.

### Alur Kerja yang Disarankan
1. Baca README ini dulu
2. Cek `git status` untuk lihat perubahan terakhir
3. Untuk fitur baru: ikuti pola yang sudah ada (SectionCard, InputField, SelectField, toggle Ya/Tidak)
4. Setelah ubah: jalankan `npx tsc --noEmit` + `npx expo export --platform web`
5. Update file ini setelah selesai (pindahkan item dari "KURANG" ke "SELESAI")
