// ─── api/check-key.js — Cek apakah kunci masih valid di Redis ────────────────
// Endpoint: POST https://bps-sumberharjo.vercel.app/api/check-key
// Body: { "key": "uuid-kunci" }
//
// Response 200 { valid: true }  → kunci ada & sudah terpakai (akses masih boleh)
// Response 403 { valid: false } → kunci tidak ada / dihapus → paksa login ulang

import { Redis } from "@upstash/redis";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ valid: false, message: "Method not allowed" });
  }

  const { key } = req.body || {};
  if (!key || typeof key !== "string") {
    return res.status(400).json({ valid: false, message: "Parameter 'key' wajib diisi." });
  }

  let redis;
  try {
    redis = new Redis({
      url:   process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  } catch (err) {
    // Jika Redis tidak tersedia, beri benefit of the doubt ke klien
    console.error("[check-key] Redis error:", err.message);
    return res.status(200).json({ valid: true, message: "Redis tidak tersedia, akses diizinkan sementara." });
  }

  try {
    const keyData = await redis.get(`key:${key.trim()}`);

    if (!keyData) {
      // Kunci tidak ada (sudah dihapus admin)
      return res.status(403).json({ valid: false, message: "Kunci telah dicabut oleh admin." });
    }

    // Kunci ada (entah used=true atau false), akses masih sah
    return res.status(200).json({ valid: true, type: keyData.type || "lapangan" });
  } catch (err) {
    console.error("[check-key] Redis get error:", err.message);
    // Toleransi — jangan paksa logout jika server error
    return res.status(200).json({ valid: true, message: "Tidak dapat memeriksa kunci saat ini." });
  }
}
