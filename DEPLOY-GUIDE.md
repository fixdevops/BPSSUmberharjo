# 🚀 Panduan Deploy Sistem Autentikasi Kunci

## Yang Sudah Dikerjakan ✅

1. **Frontend (React Native/Web):**
   - `src/screens/KeyAuthScreen.tsx` — halaman verifikasi kunci
   - `src/lib/keyAuth.ts` — logika komunikasi dengan API
   - `src/app/index.tsx` — integrasi cek akses sebelum masuk app

2. **Backend (Vercel Serverless Functions):**
   - `api/verify.js` — endpoint POST `/api/verify` (dipanggil app)
   - `api/mint-key.js` — endpoint POST `/api/mint-key` (dipanggil bot Discord)

3. **Infrastructure:**
   - `vercel.json` — routing API functions + SPA
   - Dependencies `@upstash/redis` dan `uuid` sudah di-install

---

## Yang Harus Anda Lakukan (Urut dari Atas)

### 1️⃣ Buat Upstash Redis di Vercel Dashboard

1. Buka https://vercel.com/dashboard
2. Pilih project **bps-sumberharjo**
3. Tab **Storage** → **Create Database**
4. Pilih **Upstash** → **Redis**
5. Nama: `bps-keys` (bebas)
6. Region: **Singapore** (terdekat)
7. Klik **Create & Connect to Project**

✅ Env vars `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` otomatis ditambahkan.

---

### 2️⃣ Tambah Environment Variables di Vercel

Dashboard → project → **Settings** → **Environment Variables** → **Add**:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `WEBHOOK_URL` | `https://discord.com/api/webhooks/1523956108920619048/Pv-0Rc...` | Production, Preview, Development |
| `ADMIN_SECRET` | `bpsse2026sumberharjo_secret_2026` (buat string acak panjang min 32 karakter) | Production, Preview, Development |

**Catatan:** `UPSTASH_REDIS_REST_URL` dan `UPSTASH_REDIS_REST_TOKEN` sudah otomatis ada dari step 1.

---

### 3️⃣ Deploy Ulang ke Vercel

Karena ada perubahan kode baru (folder `api/`), Anda harus deploy ulang:

**Opsi A — Auto Deploy (Recommended):**
1. Commit semua perubahan:
   ```bash
   git add .
   git commit -m "feat: tambah sistem autentikasi kunci dengan Upstash"
   git push origin main
   ```
2. Vercel akan otomatis deploy (tunggu 1-2 menit)

**Opsi B — Manual Deploy via CLI:**
```bash
npm install -g vercel
vercel --prod
```

**Verifikasi Deploy Berhasil:**
- Buka https://bps-sumberharjo.vercel.app/api/verify
- Jika muncul `{"status":"error","message":"Method not allowed"}` → **✅ Endpoint aktif!**
- Jika 404 Not Found → ada masalah routing, cek `vercel.json`

---

### 4️⃣ Setup & Jalankan Discord Bot (Lokal / Railway)

Bot Discord **tidak bisa** jalan di Vercel (butuh WebSocket persistent). Jalankan di komputer lokal atau deploy ke Railway/Render (gratis).

**A. Buat Bot Discord (jika belum):**
1. https://discord.com/developers/applications
2. New Application → beri nama "BPS SE2026 Auth"
3. Tab **Bot** → **Reset Token** → salin token
4. **Privileged Gateway Intents** → aktifkan semua
5. Tab **OAuth2** → **URL Generator**:
   - Scope: `bot`, `applications.commands`
   - Permissions: `Send Messages`, `Send Messages in Threads`
   - Salin URL, buka di browser → invite bot ke server Discord

**B. Konfigurasi Bot:**
```bash
cd server
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=token_bot_dari_developer_portal
CLIENT_ID=application_id_dari_developer_portal
API_BASE_URL=https://bps-sumberharjo.vercel.app
ADMIN_SECRET=bpsse2026sumberharjo_secret_2026
```

**C. Jalankan Bot:**
```bash
npm install
node bot.js
```

Jika sukses, akan muncul:
```
[bot] ✅ Login sebagai BPS SE2026 Auth#1234
[bot] ✅ Slash commands berhasil didaftarkan.
```

---

### 5️⃣ Test End-to-End

**A. Test Buat Kunci:**
1. Di Discord server, ketik `/mintakunciweb`
2. Cek DM dari bot → ada kunci UUID
3. Salin kunci (tanpa backtick)

**B. Test Verifikasi:**
1. Buka https://bps-sumberharjo.vercel.app
2. Akan muncul halaman **Verifikasi Kunci Akses**
3. Paste kunci → klik **Verifikasi Kunci**
4. Jika berhasil: "Akses diberikan! Membuka aplikasi…"
5. Cek channel Discord → ada notifikasi embed hijau dengan detail

**C. Test Kunci Sudah Terpakai:**
1. Refresh browser (atau buka incognito)
2. Input kunci yang sama lagi
3. Harus muncul error: "Kunci salah atau sudah terpakai"

---

## Troubleshooting

### ❌ "Server tidak merespon"
- Cek network tab browser (F12) → lihat response `/api/verify`
- Pastikan Upstash Redis sudah connect ke project
- Cek env vars `UPSTASH_REDIS_REST_URL` dan `_TOKEN` ada di Vercel

### ❌ Bot Discord: "Unauthorized" saat buat kunci
- Pastikan `ADMIN_SECRET` di `.env` bot **sama persis** dengan di Vercel env vars
- Cek `API_BASE_URL` di `.env` sudah benar (tanpa trailing slash)

### ❌ Kunci valid tapi tetap ditolak
- Cek Upstash Dashboard → lihat apakah key tersimpan di Redis
- Format key di Redis: `key:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### ❌ Aplikasi tidak muncul halaman verifikasi
- Cek localStorage browser: `bps_access_granted` → hapus manual
- Atau panggil `revokeAccess()` di console browser

---

## Maintenance

**Hapus kunci yang expired (manual):**
- Buka Upstash Dashboard → Redis browser → hapus key yang lama

**Lihat log verifikasi:**
- Vercel Dashboard → project → **Logs** → filter by `verify`

**Reset semua akses pengguna (emergency):**
1. Vercel env vars → hapus `UPSTASH_REDIS_REST_URL` dan `_TOKEN` sementara
2. Buat database baru → connect ulang

---

## Struktur Akhir

```
project/
├── api/
│   ├── verify.js       ← POST /api/verify (verifikasi kunci)
│   └── mint-key.js     ← POST /api/mint-key (buat kunci baru)
├── src/
│   ├── app/index.tsx   ← cek autentikasi
│   ├── lib/keyAuth.ts  ← logika client-side
│   └── screens/KeyAuthScreen.tsx ← UI halaman login
├── server/
│   ├── bot.js          ← Discord bot (jalankan lokal/Railway)
│   └── .env            ← config bot (jangan commit!)
├── vercel.json         ← routing API + SPA
└── package.json        ← dependencies @upstash/redis, uuid
```

**Status:** ✅ Siap deploy, tinggal eksekusi step 1-5 di atas.
