// ─── api/mint-key.js — Endpoint untuk Bot Discord membuat kunci baru ──────────
// Dipanggil oleh bot.js saat ada perintah /mintakunciweb
//
// POST /api/mint-key
// Header: Authorization: Bearer ADMIN_SECRET
// Body:   { createdBy: "username#1234" }

import { Redis } from "@upstash/redis";
import { v4 as uuidv4 } from "uuid";

const redis = Redis.fromEnv();
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ status: "error", message: "Method not allowed" });
  }

  // Validasi admin secret
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.replace("Bearer ", "");
  if (ADMIN_SECRET && token !== ADMIN_SECRET) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  const { createdBy } = req.body;
  const newKey = uuidv4();

  await redis.set(`key:${newKey}`, {
    key: newKey,
    used: false,
    createdAt: new Date().toISOString(),
    createdBy: createdBy || "unknown",
  });

  console.log(`[mint-key] ✅ Kunci baru diterbitkan untuk ${createdBy}: ${newKey}`);
  return res.status(200).json({ status: "success", key: newKey });
}
