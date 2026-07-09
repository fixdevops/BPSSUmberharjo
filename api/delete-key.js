// ─── api/delete-key.js — Hapus kunci dari Redis (Admin only) ─────────────────
// Endpoint: DELETE https://bps-sumberharjo.vercel.app/api/delete-key
// Header: Authorization: Bearer <ADMIN_SECRET>
// Body: { "key": "uuid-kunci" }
//
// Efek: kunci dihapus dari Redis → klien yang sudah pakai kunci itu
//       akan dipaksa login ulang saat app dibuka lagi.

import { Redis } from "@upstash/redis";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const WEBHOOK_URL  = process.env.WEBHOOK_URL  || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "DELETE") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  // ── Validasi secret ───────────────────────────────────────────────────────
  const token = (req.headers["authorization"] || "").replace("Bearer ", "").trim();
  if (!ADMIN_SECRET || token !== ADMIN_SECRET) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  const { key } = req.body || {};
  if (!key || typeof key !== "string") {
    return res.status(400).json({ status: "error", message: "Parameter 'key' wajib diisi." });
  }

  const trimmedKey = key.trim();

  let redis;
  try {
    redis = new Redis({
      url:   process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Konfigurasi server bermasalah." });
  }

  // Ambil data kunci dulu (untuk log/notifikasi)
  let keyData;
  try {
    keyData = await redis.get(`key:${trimmedKey}`);
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Redis error." });
  }

  if (!keyData) {
    return res.status(404).json({ status: "error", message: "Kunci tidak ditemukan." });
  }

  // Hapus dari Redis
  await redis.del(`key:${trimmedKey}`);
  // Hapus dari index list (lrange list — bersihkan referensi yang sudah tidak ada)
  await redis.lrem("keys:list", 0, trimmedKey);

  // Notifikasi Discord
  if (WEBHOOK_URL) {
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title: "🗑️ Kunci Dihapus",
          color: 0xff4444,
          fields: [
            { name: "Kunci",        value: `\`${trimmedKey}\``, inline: false },
            { name: "Status lama",  value: keyData.used ? "🔴 Sudah terpakai" : "🟢 Belum terpakai", inline: true },
            { name: "Dibuat oleh",  value: keyData.createdBy || "unknown", inline: true },
            { name: "Waktu hapus",  value: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }), inline: true },
          ],
          footer: { text: "BPS SE2026 Admin — Pencabutan Akses" },
        }],
      }),
    }).catch(() => {});
  }

  console.log(`[delete-key] 🗑️ Kunci dihapus: ${trimmedKey}`);
  return res.status(200).json({ status: "success", message: "Kunci berhasil dihapus." });
}
