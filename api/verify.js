// ─── api/verify.js — Vercel Serverless Function: Verifikasi Kunci ─────────────
// Endpoint: POST https://bps-sumberharjo.vercel.app/api/verify
//
// Env vars (Vercel Dashboard → Settings → Environment Variables):
//   UPSTASH_REDIS_REST_URL    → dari Upstash (Storage → Connect)
//   UPSTASH_REDIS_REST_TOKEN  → dari Upstash
//   WEBHOOK_URL               → webhook Discord

import { Redis } from "@upstash/redis";

const WEBHOOK_URL = process.env.WEBHOOK_URL || "";

export default async function handler(req, res) {
  // ── CORS ──────────────────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  // ── Validasi input ────────────────────────────────────────────────────────
  const { key } = req.body || {};
  if (!key || typeof key !== "string") {
    return res.status(400).json({ status: "error", message: "Parameter 'key' wajib diisi." });
  }

  const trimmedKey = key.trim();

  // ── Cek kunci di Redis ────────────────────────────────────────────────────
  let redis;
  try {
    redis = new Redis({
      url:   process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  } catch (err) {
    console.error("[verify] Redis tidak terkonfigurasi:", err.message);
    return res.status(500).json({ status: "error", message: "Konfigurasi server bermasalah. Hubungi admin." });
  }

  let keyData;
  try {
    keyData = await redis.get(`key:${trimmedKey}`);
  } catch (err) {
    console.error("[verify] Redis error:", err.message);
    return res.status(500).json({ status: "error", message: "Kesalahan server internal." });
  }

  if (!keyData) {
    console.log(`[verify] ❌ Tidak ditemukan: ${trimmedKey}`);
    return res.status(403).json({ status: "error", message: "Kunci salah atau sudah terpakai." });
  }

  if (keyData.used) {
    console.log(`[verify] ❌ Sudah terpakai: ${trimmedKey}`);
    return res.status(403).json({ status: "error", message: "Kunci salah atau sudah terpakai." });
  }

  // ── Tandai kunci sebagai terpakai ─────────────────────────────────────────
  const ip = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown";
  await redis.set(`key:${trimmedKey}`, {
    ...keyData,
    used:     true,
    usedAt:   new Date().toISOString(),
    usedByIP: ip,
  });

  // ── Notifikasi Discord ────────────────────────────────────────────────────
  if (WEBHOOK_URL) {
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title:       "✅ Kunci Akses Digunakan",
          color:       0x006a63,
          fields: [
            { name: "Kunci",        value: `\`${trimmedKey}\``, inline: false },
            { name: "Waktu",        value: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }), inline: true },
            { name: "IP",           value: ip, inline: true },
            { name: "Dibuat oleh",  value: keyData.createdBy || "unknown", inline: true },
          ],
          footer: { text: "BPS SE2026 Sumberharjo" },
        }],
      }),
    }).catch((e) => console.warn("[webhook] Gagal:", e.message));
  }

  console.log(`[verify] ✅ OK: ${trimmedKey}`);
  // Kembalikan juga key UUID dan type agar klien bisa menyimpannya
  return res.status(200).json({
    status:  "success",
    message: "Akses Diberikan",
    key:     trimmedKey,
    type:    keyData.type || "lapangan",
  });
}
