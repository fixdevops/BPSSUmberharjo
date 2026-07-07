# Server Autentikasi Kunci — BPS SE2026 Sumberharjo
## Arsitektur (Vercel Serverless + KV)

```
Discord Bot (lokal/VPS)
    │
    │ POST /api/mint-key (buat kunci baru)
    ▼
Vercel Serverless Functions
    ├── api/mint-key.js  ← dipanggil bot saat /mintakunciweb
    └── api/verify.js    ← dipanggil aplikasi saat input kunci
              │
              ▼
        Vercel KV (Redis)
        key:UUID → { used: false, ... }
```

## Setup Upstash Redis di Vercel

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project → tab **Storage** → **Create Database** → **Upstash**
3. Pilih **Redis** → beri nama → pilih region terdekat (Singapore)
4. Klik **Create & Connect to Project**
5. Env vars `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` otomatis ditambahkan

## Environment Variables di Vercel Dashboard

| Key | Value |
|-----|-------|
| `WEBHOOK_URL` | `https://discord.com/api/webhooks/...` |
| `ADMIN_SECRET` | string acak panjang (min 32 karakter) |
| `UPSTASH_REDIS_REST_URL` | auto dari Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | auto dari Upstash |

## Struktur Folder untuk Deploy

```
server/
├── api/
│   ├── verify.js      ← POST /api/verify
│   └── mint-key.js    ← POST /api/mint-key
├── bot.js             ← jalankan LOKAL, bukan di Vercel
├── package.json
├── .env.example
└── README.md
```

## Menjalankan Bot Discord (lokal / VPS)

```bash
cd server
cp .env.example .env
# edit .env dengan nilai yang benar
npm install
node bot.js
```

## Konfigurasi Aplikasi React Native

Edit `src/lib/keyAuth.ts`:
```ts
export const API_BASE_URL = "https://nama-project.vercel.app";
```

## Catatan Penting

- **Bot Discord TIDAK berjalan di Vercel** — jalankan lokal atau di VPS kecil (free tier Railway/Render)
- **`server.js` (Express) tidak digunakan lagi** — diganti oleh Vercel Serverless Functions
- Vercel KV gratis untuk penggunaan kecil (30.000 req/bulan)
