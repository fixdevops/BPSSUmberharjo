// ─── server.js — Backend API Verifikasi Kunci Akses BPS SE2026 ───────────────
// Jalankan: node server.js
// Endpoint: POST /verify { key: "UUID" }
//
// Persyaratan:
//   npm install express axios
//
// File keys.json harus ada di direktori yang sama:
//   [] (array kosong jika baru pertama kali)

const express = require("express");
const fs      = require("fs");
const path    = require("path");
const axios   = require("axios");

const app = express();
app.use(express.json());

// ── Konfigurasi ───────────────────────────────────────────────────────────────
const PORT        = process.env.PORT        || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL || "https://discord.com/api/webhooks/1523956108920619048/Pv-0RcVaoH6qqX8Spy-bNkcpxSM_Ozm-YwCYeOyCPTOodM1y_i34Al7hQ6ojYlFiZO_S";
const KEYS_FILE   = path.join(__dirname, "keys.json");

// CORS — izinkan semua origin (sesuaikan jika butuh lebih ketat)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ── Helper: baca/tulis keys.json ──────────────────────────────────────────────
function readKeys() {
  if (!fs.existsSync(KEYS_FILE)) {
    fs.writeFileSync(KEYS_FILE, "[]", "utf8");
  }
  return JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));
}

function writeKeys(data) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2), "utf8");
}

// ── POST /verify ──────────────────────────────────────────────────────────────
app.post("/verify", (req, res) => {
  const { key } = req.body;

  if (!key || typeof key !== "string") {
    return res.status(400).json({ status: "error", message: "Parameter 'key' wajib diisi." });
  }

  let data;
  try {
    data = readKeys();
  } catch (err) {
    console.error("[verify] Gagal membaca keys.json:", err);
    return res.status(500).json({ status: "error", message: "Kesalahan server internal." });
  }

  const index = data.findIndex((k) => k.key === key.trim() && k.used === false);

  if (index !== -1) {
    // Tandai kunci sebagai sudah terpakai
    data[index].used      = true;
    data[index].usedAt    = new Date().toISOString();
    data[index].usedByIP  = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    try {
      writeKeys(data);
    } catch (err) {
      console.error("[verify] Gagal menulis keys.json:", err);
      return res.status(500).json({ status: "error", message: "Kesalahan server internal." });
    }

    // Kirim notifikasi ke Discord (opsional, tidak blokir response)
    if (WEBHOOK_URL) {
      axios
        .post(WEBHOOK_URL, {
          content: `✅ **Kunci digunakan**\n\`${key.trim()}\`\nWaktu: ${new Date().toLocaleString("id-ID")}\nIP: ${data[index].usedByIP}`,
        })
        .catch((err) => console.warn("[webhook] Gagal kirim notifikasi:", err.message));
    }

    console.log(`[verify] ✅ Kunci valid digunakan: ${key.trim()}`);
    return res.status(200).json({ status: "success", message: "Akses Diberikan" });

  } else {
    console.log(`[verify] ❌ Kunci tidak valid / sudah terpakai: ${key.trim()}`);
    return res.status(403).json({ status: "error", message: "Kunci salah atau sudah terpakai." });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] Berjalan di http://localhost:${PORT}`);
  console.log(`[server] File kunci: ${KEYS_FILE}`);
  if (!WEBHOOK_URL) {
    console.warn("[server] WEBHOOK_URL tidak dikonfigurasi — notifikasi Discord dinonaktifkan.");
  }
});
