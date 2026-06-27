# Smoke Test Report — Open Graph Link Preview

Tanggal verifikasi: dilakukan dengan membaca file secara langsung (tanpa build/test runner).

---

## ✅ Check 1: `public/gambargue.jpeg` ada di filesystem
**Requirement: 2.2**

File ditemukan di path:
```
d:\apkbpskalkulator\BPSSumberharjo\public\gambargue.jpeg
```

**Status: PASS**

---

## ✅ Check 2: `public/index.html` ada dan mengandung semua 5 OG meta tags di `<head>`
**Requirement: 1.1–1.6**

File ditemukan di path:
```
d:\apkbpskalkulator\BPSSumberharjo\public\index.html
```

Seluruh 5 meta tag berada di dalam elemen `<head>` (bukan `<body>`):

| Tag | Nilai | Status |
|-----|-------|--------|
| `og:title` | `"BPS Sumberharjo – SE2026 Smart Estimator"` | ✅ PASS (Req 1.1) |
| `og:description` | `"Kalkulator estimasi produksi pertanian SE2026..."` (144 karakter, dalam rentang 10–200) | ✅ PASS (Req 1.2) |
| `og:image` | `"https://bps-sumberharjo.vercel.app/gambargue.jpeg"` (URL absolut, mengandung `gambargue.jpeg`) | ✅ PASS (Req 1.3) |
| `og:url` | `"https://bps-sumberharjo.vercel.app/"` (URL absolut valid) | ✅ PASS (Req 1.4) |
| `og:type` | `"website"` | ✅ PASS (Req 1.5) |

Semua tag berada di dalam `<head>`, tidak ada yang di `<body>`.

**Status: PASS**

---

## ✅ Check 3: `vercel.json` mengecualikan `/gambargue.jpeg` dari rewrite
**Requirement: 2.3**

Konten `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/((?!gambargue\\.jpeg).*)", "destination": "/index.html" }
  ]
}
```

Pola `/((?!gambargue\\.jpeg).*)` menggunakan negative lookahead regex sehingga path `/gambargue.jpeg` **tidak** cocok dengan aturan rewrite ini dan tidak akan di-rewrite ke `index.html`.

**Status: PASS**

---

## ✅ Check 4: `src/app/_layout.tsx` ada dan mengandung komponen Stack/ThemeProvider
**Requirement: 3.2**

File ditemukan di path:
```
d:\apkbpskalkulator\BPSSumberharjo\src\app\_layout.tsx
```

Komponen yang ditemukan:
- `ThemeProvider` — diimpor dari `expo-router` dan dirender sebagai root wrapper
- `Stack` — dirender di dalam `ThemeProvider` dengan `screenOptions={{ headerShown: false }}`

Struktur navigasi tidak berubah.

**Status: PASS**

---

## Ringkasan

| Check | File | Status |
|-------|------|--------|
| `public/gambargue.jpeg` ada | `public/gambargue.jpeg` | ✅ PASS |
| 5 OG meta tags di `<head>` | `public/index.html` | ✅ PASS |
| `vercel.json` kecualikan gambar dari rewrite | `vercel.json` | ✅ PASS |
| `_layout.tsx` punya Stack + ThemeProvider | `src/app/_layout.tsx` | ✅ PASS |

**Semua smoke test PASS. Fitur Open Graph Link Preview siap untuk deploy.**
