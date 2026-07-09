// ─── database.ts — Barrel file untuk platform-split resolution ───────────────
//
// File ini WAJIB ADA agar Metro bisa resolve import "../lib/database"
// di platform yang tidak punya ekstensi spesifik (.web.ts / .native.ts).
//
// Metro resolution order (dengan metro.config.js):
//   1. database.web.ts   → dipilih saat platform = web
//   2. database.native.ts → dipilih saat platform = android / ios
//   3. database.ts        → fallback (file ini, seharusnya tidak pernah dipakai)
//
// Jika file ini dieksekusi, artinya Metro tidak bisa menemukan platform split.
// Export ulang dari web sebagai fallback aman.

export * from "./database.web";
