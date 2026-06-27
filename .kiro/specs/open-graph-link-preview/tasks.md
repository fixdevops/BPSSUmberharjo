# Implementation Plan: Open Graph Link Preview (WhatsApp)

## Overview

Implementasi fitur ini hanya mencakup 3 perubahan file statis — tidak ada modifikasi kode React. Urutan pengerjaan: siapkan gambar di `public/`, buat `public/index.html` dengan OG meta tags, perbarui `vercel.json`, lalu verifikasi output build.

## Tasks

- [ ] 1. Salin gambar OG ke folder `public/`
  - Salin file `assets/images/gambargue.jpeg` ke `public/gambargue.jpeg`
  - Buat folder `public/` jika belum ada
  - _Requirements: 2.2_

- [ ] 2. Buat `public/index.html` dengan OG meta tags
  - [ ] 2.1 Buat file `public/index.html` sebagai template HTML Expo
    - Buat file HTML dengan struktur `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`
    - Tambahkan 5 OG meta tags di dalam `<head>`: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
    - Nilai `og:title`: `"BPS Sumberharjo – SE2026 Smart Estimator"`
    - Nilai `og:description`: string deskriptif 10–200 karakter tentang fungsi kalkulator
    - Nilai `og:image`: `"https://bps-sumberharjo.vercel.app/gambargue.jpeg"` (URL absolut)
    - Nilai `og:url`: `"https://bps-sumberharjo.vercel.app/"`
    - Nilai `og:type`: `"website"`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 2.2 Tulis property test untuk memverifikasi semua OG meta tags berada di dalam `<head>`
    - **Property 1: Semua OG meta tags berada di dalam `<head>`**
    - Parse `dist/index.html` setelah build, temukan semua `<meta property="og:*">`, verifikasi semuanya adalah keturunan `<head>` bukan `<body>`
    - **Validates: Requirements 1.6**

  - [ ]* 2.3 Tulis unit tests untuk memverifikasi nilai setiap OG meta tag di `dist/index.html`
    - Test `og:title` bernilai tepat `"BPS Sumberharjo – SE2026 Smart Estimator"` — _Requirements: 1.1_
    - Test `og:description` panjangnya antara 10–200 karakter — _Requirements: 1.2_
    - Test `og:image` adalah URL absolut yang mengandung `gambargue.jpeg` — _Requirements: 1.3_
    - Test `og:url` adalah URL absolut valid — _Requirements: 1.4_
    - Test `og:type` bernilai tepat `"website"` — _Requirements: 1.5_

- [ ] 3. Perbarui `vercel.json` untuk mengecualikan `/gambargue.jpeg` dari rewrite
  - Ubah aturan rewrite `/(.*) → /index.html` menggunakan negative lookahead regex: `/((?!gambargue\\.jpeg).*)`
  - Pertahankan semua field lain (`buildCommand`, `outputDirectory`, `framework`) tetap sama
  - _Requirements: 2.3_

  - [ ]* 3.1 Tulis smoke test untuk memverifikasi `vercel.json` mengecualikan `/gambargue.jpeg`
    - Baca dan parse `vercel.json`, verifikasi pola rewrite tidak akan mencocokkan path `/gambargue.jpeg`
    - _Requirements: 2.3_

- [ ] 4. Checkpoint — Verifikasi file output build
  - Jalankan `npx expo export --platform web` dan periksa:
    - `dist/index.html` mengandung semua 5 OG meta tags di `<head>`
    - `dist/gambargue.jpeg` ada dan dapat diakses
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

- [ ] 5. Verifikasi smoke test ketersediaan gambar
  - [ ] 5.1 Tulis smoke test untuk memverifikasi keberadaan file gambar
    - Verifikasi `public/gambargue.jpeg` ada di filesystem sebelum build — _Requirements: 2.2_
    - Verifikasi `dist/gambargue.jpeg` ada setelah build — _Requirements: 2.2_

  - [ ]* 5.2 Tulis smoke test untuk memverifikasi `_layout.tsx` tidak berubah
    - Baca `src/app/_layout.tsx`, verifikasi komponen `<Stack>` dan `<ThemeProvider>` masih ada
    - _Requirements: 3.2_

- [ ] 6. Final checkpoint — Semua tests pass
  - Pastikan semua tests pass, tanyakan kepada user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk deployment lebih cepat
- Tidak ada perubahan pada kode React (`src/`) — semua perubahan bersifat statis
- `public/index.html` harus ada sebelum `expo export` dijalankan agar OG tags masuk ke `dist/index.html`
- Nilai `og:image` **harus** URL absolut — WhatsApp crawler tidak mengikuti path relatif
- Setelah deploy, gunakan [Meta Sharing Debugger](https://developers.facebook.com/tools/debug/) untuk clear cache crawler WhatsApp

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.1", "5.1"] },
    { "id": 2, "tasks": ["5.2"] }
  ]
}
```
