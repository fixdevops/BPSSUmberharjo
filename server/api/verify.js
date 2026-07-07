// ─── api/verify.js — Vercel Serverless Function dengan Upstash Redis ─────────
// Setup Upstash: Vercel Dashboard → Storage → Upstash → Create Redis
// Env vars otomatis ditambahkan: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
//
// Environment Variables tambahan (set manual di Vercel Dashboard):
//   WEBHOOK_URL   → URL webhook Discord Anda

import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv(); // baca UPSTASH_REDIS_REST_URL & TOKEN otomatis

const WEBHOOK_URL = process.env.WEBHOOK_URL || "";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  const { key } = req.body;

  if (!key || typeof key !== "string") {
    return res.status(400).json({ status: "error", message: "Parameter 'key' wajib diisi." });
  }

  const trimmedKey = key.trim();

  // Cek apakah kunci ada dan belum terpakai
  const keyData = await redis.get(`key:${trimmedKey}`);

  if (!keyData) {
    console.log(`[verify] ❌ Kunci tidak ditemukan: ${trimmedKey}`);
    return res.status(403).json({ status: "error", message: "Kunci salah atau sudah terpakai." });
  }

  if (keyData.used) {
    console.log(`[verify] ❌ Kunci sudah terpakai: ${trimmedKey}`);
    return res.status(403).json({ status: "error", message: "Kunci salah atau sudah terpakai." });
  }

  // Tandai kunci sebagai terpakai
  await redis.set(`key:${trimmedKey}`, {
    ...keyData,
    used: true,
    usedAt: new Date().toISOString(),
    usedByIP: req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown",
  });

  // Kirim notifikasi ke Discord
  if (WEBHOOK_URL) {
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content:
            `✅ **Kunci digunakan**\n\`${trimmedKey}\`\n` +
            `Waktu: ${new Date().toLocaleString("id-ID")}\n` +
            `IP: ${keyData.usedByIP || "unknown"}`,
        }),
      });
    } catch (err) {
      console.warn("[webhook] Gagal kirim notifikasi:", err.message);
    }
  }

  console.log(`[verify] ✅ Kunci valid digunakan: ${trimmedKey}`);
  return res.status(200).json({ status: "success", message: "Akses Diberikan" });
}
