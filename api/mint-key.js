// ─── api/mint-key.js — Vercel Serverless Function: Buat Kunci Baru ────────────
// Endpoint: POST https://bps-sumberharjo.vercel.app/api/mint-key
// Dipanggil oleh bot Discord saat /mintakunciweb
//
// Header: Authorization: Bearer <ADMIN_SECRET>
// Body:   { "createdBy": "username#1234" }

import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  // ── Validasi ADMIN_SECRET ─────────────────────────────────────────────────
  const token = (req.headers["authorization"] || "").replace("Bearer ", "");
  if (ADMIN_SECRET && token !== ADMIN_SECRET) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  // ── Buat kunci baru di Redis ──────────────────────────────────────────────
  let redis;
  try {
    redis = new Redis({
      url:   process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: "Konfigurasi server bermasalah." });
  }

  const { createdBy } = req.body || {};
  const newKey = uuidv4();

  await redis.set(`key:${newKey}`, {
    key:       newKey,
    used:      false,
    createdAt: new Date().toISOString(),
    createdBy: createdBy || "unknown",
  });

  console.log(`[mint-key] ✅ Kunci baru untuk ${createdBy}: ${newKey}`);
  return res.status(200).json({ status: "success", key: newKey });
}
