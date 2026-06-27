# Requirements Document

## Introduction

Fitur ini menambahkan Open Graph (OG) meta tags pada web app Expo BPS Sumberharjo yang di-deploy ke Vercel. Tujuannya agar ketika link aplikasi dibagikan di **WhatsApp**, platform tersebut secara otomatis menampilkan preview berupa gambar (`gambargue.jpeg`), judul, dan deskripsi aplikasi.

Karena aplikasi menggunakan Expo Router dengan output `static` dan di-deploy ke Vercel sebagai SPA, OG meta tags disuntikkan ke `<head>` HTML melalui file `public/index.html`. Gambar OG ditempatkan di folder `public/` agar ter-copy ke `dist/` saat build dan dapat diakses publik melalui URL absolut.

## Glossary

- **OG_Image**: File gambar thumbnail preview (`gambargue.jpeg`); harus berupa URL absolut dan dapat diakses publik.
- **Crawler**: Bot WhatsApp yang mengambil HTML halaman untuk membaca meta tags dan menghasilkan preview.
- **Static_Build**: Output `expo export --platform web` yang menghasilkan file statis di folder `dist/`.
- **Canonical_URL**: URL aplikasi yang dideploy di Vercel (contoh: `https://bps-sumberharjo.vercel.app`).

## Requirements

### Requirement 1: Open Graph Meta Tags pada HTML

**User Story:** Sebagai pengguna, saya ingin ketika saya menyalin dan mengirim link aplikasi web ini di WhatsApp, muncul preview dengan gambar, judul, dan deskripsi, sehingga penerima dapat langsung memahami isi aplikasi sebelum membukanya.

#### Acceptance Criteria

1. THE Static_Build SHALL menghasilkan file HTML yang mengandung meta tag `og:title` dengan nilai tepat "BPS Sumberharjo – SE2026 Smart Estimator" di dalam elemen `<head>`.
2. THE Static_Build SHALL menghasilkan file HTML yang mengandung meta tag `og:description` dengan teks antara 10 dan 200 karakter yang menjelaskan fungsi aplikasi, di dalam elemen `<head>`.
3. THE Static_Build SHALL menghasilkan file HTML yang mengandung meta tag `og:image` berisi URL absolut `https://<Canonical_URL>/gambargue.jpeg`, di dalam elemen `<head>`.
4. THE Static_Build SHALL menghasilkan file HTML yang mengandung meta tag `og:url` berisi Canonical_URL aplikasi, di dalam elemen `<head>`.
5. THE Static_Build SHALL menghasilkan file HTML yang mengandung meta tag `og:type` dengan nilai tepat `website`, di dalam elemen `<head>`.
6. THE Static_Build SHALL menempatkan semua meta tag OG di dalam elemen `<head>` (bukan `<body>`), karena Crawler WhatsApp hanya membaca meta tags dari `<head>`.

---

### Requirement 2: Ketersediaan Publik OG_Image

**User Story:** Sebagai developer, saya ingin file gambar OG dapat diakses langsung oleh crawler WhatsApp melalui URL publik, sehingga gambar muncul pada preview saat link dibagikan.

#### Acceptance Criteria

1. WHEN Crawler mengirimkan HTTP GET request ke `https://<Canonical_URL>/gambargue.jpeg`, THE Web_Server SHALL mengembalikan respons HTTP status 200 dengan `Content-Type: image/jpeg`.
2. THE Static_Build SHALL menyertakan file `gambargue.jpeg` di dalam folder `public/` proyek Expo agar ter-copy ke root `dist/` saat build dan dapat diakses pada path `/gambargue.jpeg`.
3. THE `vercel.json` SHALL mengecualikan path `/gambargue.jpeg` dari aturan rewrite `/(.*) → /index.html` agar request gambar tidak di-rewrite ke `index.html`.

---

### Requirement 3: Tidak Ada Regresi Fungsionalitas App

**User Story:** Sebagai developer, saya ingin penambahan meta tags OG tidak merusak fungsionalitas web app yang sudah berjalan.

#### Acceptance Criteria

1. WHEN pengguna membuka aplikasi di browser web setelah penambahan OG meta tags, THE Web_App SHALL menampilkan halaman utama kalkulator tanpa pesan error di console browser dan tanpa layar kosong.
2. THE `_layout.tsx` SHALL tetap merender komponen `<Stack>` dan `<ThemeProvider>` sehingga struktur navigasi tidak berubah.
