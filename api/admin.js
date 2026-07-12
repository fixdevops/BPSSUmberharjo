// ─── api/admin.js — Halaman Admin: Buat, Lihat & Hapus Kunci ─────────────────
// Akses: https://bps-sumberharjo.vercel.app/api/admin?secret=ADMIN_SECRET_ANDA
//
// GET  /api/admin?secret=xxx              → tampilkan halaman HTML admin
// POST /api/admin?secret=xxx&action=mint  → buat kunci baru
// POST /api/admin?secret=xxx&action=list  → lihat semua kunci

import { Redis } from "@upstash/redis";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const WEBHOOK_URL  = process.env.WEBHOOK_URL  || "";

export default async function handler(req, res) {
  // Validasi secret dari query param
  const { secret, action } = req.query;
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return res.status(401).send(`
      <!DOCTYPE html><html lang="id"><head><meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Unauthorized</title>
      <script src="https://cdn.tailwindcss.com"></script></head>
      <body class="bg-slate-900 flex items-center justify-center min-h-screen">
        <div class="text-center">
          <p class="text-6xl mb-4">🔒</p>
          <h2 class="text-2xl font-bold text-red-400 mb-2">401 — Unauthorized</h2>
          <p class="text-slate-400">Secret salah atau tidak dikonfigurasi.</p>
          <p class="text-slate-600 text-xs mt-4">Akses: /api/admin?secret=ADMIN_SECRET_ANDA</p>
        </div>
      </body></html>
    `);
  }

  let redis;
  try {
    redis = new Redis({
      url:   process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  } catch (err) {
    return res.status(500).send("<p>Redis tidak terkonfigurasi.</p>");
  }

  // ── POST: Buat kunci baru ─────────────────────────────────────────────────
  if (req.method === "POST" && action === "mint") {
    const { v4: uuidv4 } = await import("uuid");
    const newKey  = uuidv4();
    const note    = req.body?.note || "via-admin-web";
    const keyType = req.body?.type || "app";

    await redis.set(`key:${newKey}`, {
      key:       newKey,
      used:      false,
      createdAt: new Date().toISOString(),
      createdBy: note,
      type:      keyType,
    });
    await redis.lpush("keys:list", newKey);

    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: "🔑 Kunci Baru Diterbitkan",
            color: 0x004ec7,
            fields: [
              { name: "Kunci",       value: `\`${newKey}\``, inline: false },
              { name: "Dibuat oleh", value: note, inline: true },
              { name: "Tipe",        value: keyType, inline: true },
              { name: "Waktu",       value: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }), inline: true },
            ],
            footer: { text: "BPS SE2026 Admin Panel" },
          }],
        }),
      }).catch(() => {});
    }

    return res.status(200).json({ success: true, key: newKey });
  }

  // ── POST: List kunci ──────────────────────────────────────────────────────
  if (req.method === "POST" && action === "list") {
    try {
      const keyIds = await redis.lrange("keys:list", 0, 49);
      let recentKeysList = [];
      if (keyIds.length > 0) {
        const results = await Promise.all(keyIds.map((k) => redis.get(`key:${k}`)));
        recentKeysList = results.filter(Boolean);
      }
      return res.status(200).json({ keys: recentKeysList });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Redis error." });
    }
  }

  // ── POST: Hapus kunci ─────────────────────────────────────────────────────
  if (req.method === "POST" && action === "delete") {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ success: false, message: "key wajib diisi." });

    const trimmedKey = key.trim();
    let keyData;
    try {
      keyData = await redis.get(`key:${trimmedKey}`);
    } catch (err) {
      return res.status(500).json({ success: false, message: "Redis error." });
    }

    if (!keyData) {
      return res.status(404).json({ success: false, message: "Kunci tidak ditemukan." });
    }

    await redis.del(`key:${trimmedKey}`);
    await redis.lrem("keys:list", 0, trimmedKey);

    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: "🗑️ Kunci Dicabut",
            color: 0xff4444,
            fields: [
              { name: "Kunci",       value: `\`${trimmedKey}\``, inline: false },
              { name: "Status lama", value: keyData.used ? "🔴 Sudah terpakai" : "🟢 Belum terpakai", inline: true },
              { name: "Dibuat oleh", value: keyData.createdBy || "unknown", inline: true },
              { name: "Waktu hapus", value: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }), inline: true },
            ],
            footer: { text: "BPS SE2026 Admin — Pencabutan Akses" },
          }],
        }),
      }).catch(() => {});
    }

    console.log(`[admin] 🗑️ Kunci dihapus: ${trimmedKey}`);
    return res.status(200).json({ success: true, message: "Kunci berhasil dihapus." });
  }

  // ── GET: Render halaman admin HTML ────────────────────────────────────────
  let recentKeys = [];
  try {
    const keyIds = await redis.lrange("keys:list", 0, 49);
    if (keyIds.length > 0) {
      const results = await Promise.all(keyIds.map((k) => redis.get(`key:${k}`)));
      recentKeys = results.filter(Boolean);
    }
  } catch (_) {}

  // Hitung statistik
  const totalKeys   = recentKeys.length;
  const activeKeys  = recentKeys.filter(k => !k.used).length;
  const usedKeys    = recentKeys.filter(k => k.used).length;
  const lapanganKeys = recentKeys.filter(k => k.type === "lapangan").length;

  // Generate baris tabel dari data Redis (pakai string biasa agar aman di dalam template literal HTML)
  const tableRows = recentKeys.map((k) => {
    const typeBadge = k.type === "lapangan"
      ? '<span class="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[11px] font-bold uppercase">Lapangan</span>'
      : k.type === "app"
      ? '<span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase">App</span>'
      : '<span class="bg-inverse-surface text-inverse-on-surface px-3 py-1 rounded-full text-[11px] font-bold uppercase">Admin</span>';

    const statusBadge = k.used
      ? '<span class="text-error bg-error-container px-2 py-1 rounded text-[10px] font-bold">Terpakai</span>'
      : '<span class="text-green-700 bg-green-50 px-2 py-1 rounded text-[10px] font-bold">Tersedia</span>';

    const safeKey   = k.key.replace(/'/g, "\\'");
    const shortKey  = k.key.length > 20 ? k.key.substring(0, 8) + "\u2026" + k.key.slice(-6) : k.key;
    const createdAt = k.createdAt ? new Date(k.createdAt).toLocaleDateString("id-ID") : "-";
    const usedAt    = k.usedAt   ? new Date(k.usedAt).toLocaleDateString("id-ID")    : "-";
    const createdBy = (k.createdBy || "\u2014").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const usedInfo  = k.used ? "Dipakai: " + usedAt : "Belum dipakai";

    return (
      '<tr class="group hover:bg-surface-container-low transition-colors" id="row-' + k.key + '">' +
      '<td class="px-8 py-5">' +
        '<p class="font-bold text-on-surface">' + createdBy + '</p>' +
        '<p class="text-xs text-on-surface-variant">' + createdAt + '</p>' +
      '</td>' +
      '<td class="px-6 py-5">' + typeBadge + '</td>' +
      '<td class="px-6 py-5">' + statusBadge + '<p class="text-[10px] text-on-surface-variant mt-1">' + usedInfo + '</p></td>' +
      '<td class="px-6 py-5">' +
        '<div class="flex items-center gap-2">' +
          '<code class="text-on-surface-variant text-xs font-mono">' + shortKey + '</code>' +
          '<button class="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 rounded transition-all" onclick="copyKey(\'' + safeKey + '\')">' +
            '<span class="material-symbols-outlined text-[16px] text-primary">content_copy</span>' +
          '</button>' +
        '</div>' +
      '</td>' +
      '<td class="px-6 py-5 text-right">' +
        '<button class="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all" onclick="askDelete(\'' + safeKey + '\', this)">' +
          '<span class="material-symbols-outlined">delete</span>' +
        '</button>' +
      '</td>' +
      '</tr>'
    );
  }).join("");

  const emptyRow =
    '<tr><td colspan="5" class="px-8 py-12 text-center text-on-surface-variant">' +
    '<span class="material-symbols-outlined text-4xl mb-3 block opacity-30">vpn_key_off</span>' +
    '<p class="text-sm">Belum ada kunci yang diterbitkan.</p>' +
    '</td></tr>';

  const html = `<!DOCTYPE html>
<html class="light" lang="id">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>BPS SE2026 Admin Panel - Sumberharjo</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary-fixed-dim":"#b3c5ff","inverse-surface":"#213145","primary-container":"#004ec7",
        "surface-container-lowest":"#ffffff","secondary-fixed-dim":"#89ceff",
        "on-surface-variant":"#434654","surface-container-highest":"#d3e4fe",
        "inverse-on-surface":"#eaf1ff","on-primary-fixed":"#001849","inverse-primary":"#b3c5ff",
        "surface-container-high":"#dce9ff","tertiary-fixed":"#ffdbcf","secondary":"#006591",
        "primary-fixed":"#dae1ff","on-secondary-fixed-variant":"#004c6e",
        "tertiary-fixed-dim":"#ffb59b","on-primary-fixed-variant":"#003fa4",
        "on-primary-container":"#bdccff","on-tertiary":"#ffffff","surface-bright":"#f8f9ff",
        "on-surface":"#0b1c30","surface-container":"#e5eeff","secondary-fixed":"#c9e6ff",
        "surface-variant":"#d3e4fe","surface":"#f8f9ff","on-background":"#0b1c30",
        "surface-tint":"#1556ce","surface-container-low":"#eff4ff","on-tertiary-fixed":"#380d00",
        "on-secondary":"#ffffff","on-primary":"#ffffff","error":"#ba1a1a","on-secondary-container":"#004666",
        "primary":"#003996","tertiary-container":"#9e3300","surface-dim":"#cbdbf5",
        "on-secondary-fixed":"#001e2f","on-error":"#ffffff","outline":"#737685",
        "background":"#f8f9ff","error-container":"#ffdad6","tertiary":"#772400",
        "secondary-container":"#39b8fd","outline-variant":"#c3c6d6",
        "on-tertiary-container":"#ffbfaa","on-tertiary-fixed-variant":"#812800",
        "on-error-container":"#93000a","inverse-surface":"#213145","inverse-on-surface":"#eaf1ff"
      },
      borderRadius: { DEFAULT:"0.125rem", lg:"0.25rem", xl:"0.5rem", full:"0.75rem" },
      fontFamily: { "body-md":["Inter"], "headline-md":["Inter"], "label-md":["Inter"] },
      fontSize: {
        "label-md":["12px",{"lineHeight":"16px","letterSpacing":"0.05em","fontWeight":"600"}],
        "body-md":["14px",{"lineHeight":"20px","fontWeight":"400"}],
        "headline-md":["20px",{"lineHeight":"28px","fontWeight":"600"}],
        "headline-lg":["28px",{"lineHeight":"36px","letterSpacing":"-0.01em","fontWeight":"600"}]
      }
    }
  }
}
</script>
<style>
  .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;display:inline-block;vertical-align:middle}
  body{background-color:#f8f9ff}
  .toast{transition:transform .3s cubic-bezier(.175,.885,.32,1.275),opacity .2s ease;transform:translateY(20px);opacity:0}
  .toast.show{transform:translateY(0);opacity:1}
  .custom-scrollbar::-webkit-scrollbar{width:6px;height:6px}
  .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
  .custom-scrollbar::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}
  .glass-card{background:rgba(255,255,255,.8);backdrop-filter:blur(8px);border:1px solid rgba(226,232,240,.8)}
</style>
</head>
<body class="text-on-surface">
`;

<!-- Top AppBar -->
<header class="fixed top-0 left-0 w-full h-16 flex justify-between items-center px-8 z-50 bg-surface border-b border-outline-variant">
  <div class="flex items-center gap-4">
    <span class="md:hidden material-symbols-outlined cursor-pointer text-on-surface-variant" onclick="toggleSidebar()">menu</span>
    <h1 class="text-xl font-bold text-primary">BPS SE2026 Admin Panel</h1>
  </div>
  <div class="flex items-center gap-6">
    <span class="material-symbols-outlined text-on-surface-variant cursor-pointer hover:bg-surface-container-low p-2 rounded-full transition-colors">dns</span>
    <div class="flex items-center gap-3 pl-4 border-l border-outline-variant">
      <div class="text-right hidden sm:block">
        <p class="text-xs font-bold text-on-surface leading-none">Admin Sumberharjo</p>
        <p class="text-xs text-on-surface-variant">Operator Wilayah</p>
      </div>
      <span class="material-symbols-outlined text-primary-container bg-surface-container-highest p-2 rounded-full" style="font-variation-settings:'FILL' 1">account_circle</span>
    </div>
  </div>
</header>

<!-- Sidebar -->
<aside class="fixed left-0 top-0 h-full w-[260px] flex flex-col py-6 z-40 bg-surface-container border-r border-outline-variant transition-transform -translate-x-full md:translate-x-0" id="sidebar">
  <div class="px-6 mb-10 mt-16">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-white font-black text-xl">S</div>
      <div>
        <h2 class="text-xl font-black text-on-surface">SE2026</h2>
        <p class="text-xs text-on-surface-variant uppercase tracking-widest">Sumberharjo</p>
      </div>
    </div>
  </div>
  <nav class="flex-1 px-4 space-y-1">
    <a class="flex items-center gap-3 px-4 py-3 rounded-r-full text-on-surface-variant hover:bg-surface-container-highest transition-colors group" href="#">
      <span class="material-symbols-outlined group-hover:text-primary">dashboard</span>
      <span class="text-xs font-bold">Dashboard</span>
    </a>
    <a class="flex items-center gap-3 px-4 py-3 bg-primary-container text-on-primary-container border-l-4 border-primary rounded-r-full shadow-sm" href="#">
      <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">vpn_key</span>
      <span class="text-xs font-bold">Kunci Akses</span>
    </a>
    <a class="flex items-center gap-3 px-4 py-3 rounded-r-full text-on-surface-variant hover:bg-surface-container-highest transition-colors group" href="#">
      <span class="material-symbols-outlined group-hover:text-primary">analytics</span>
      <span class="text-xs font-bold">Laporan</span>
    </a>
    <a class="flex items-center gap-3 px-4 py-3 rounded-r-full text-on-surface-variant hover:bg-surface-container-highest transition-colors group" href="#">
      <span class="material-symbols-outlined group-hover:text-primary">settings</span>
      <span class="text-xs font-bold">Pengaturan</span>
    </a>
  </nav>
  <div class="px-6 py-4">
    <div class="p-4 bg-primary-fixed-dim/20 rounded-xl border border-primary-fixed-dim/30">
      <p class="text-xs text-primary font-bold mb-1">Status Server</p>
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span class="text-[10px] text-on-surface-variant">Redis Terhubung</span>
      </div>
    </div>
  </div>
</aside>
`;

<!-- Main Content -->
<main class="md:ml-[260px] pt-24 px-8 pb-12 min-h-screen">
  <div class="max-w-[1440px] mx-auto">

    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-2 text-on-surface-variant text-xs mb-2">
          <span>Admin</span>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-primary font-bold">Kunci Akses</span>
        </div>
        <h2 class="text-2xl font-bold text-on-surface">Manajemen Kunci Akses</h2>
        <p class="text-on-surface-variant text-sm">Kelola otentikasi petugas lapangan untuk Sensus Ekonomi 2026.</p>
      </div>
      <div class="flex items-center gap-3">
        <button onclick="window.location.reload()" class="flex items-center gap-2 px-4 py-2 bg-surface border border-outline-variant rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-all">
          <span class="material-symbols-outlined text-[18px]">refresh</span>Refresh Data
        </button>
        <button class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container transition-all shadow-md active:scale-95" onclick="document.getElementById('mintBtn').click()">
          <span class="material-symbols-outlined text-[18px]">add</span>Kunci Baru
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <div class="glass-card p-6 rounded-2xl shadow-sm border-t-4 border-primary">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-primary-container/10 rounded-lg"><span class="material-symbols-outlined text-primary">key</span></div>
          <span class="text-green-600 bg-green-50 px-2 py-1 rounded text-[10px] font-bold">Total</span>
        </div>
        <p class="text-on-surface-variant text-xs">Total Kunci</p>
        <p class="text-2xl font-black text-on-surface">${totalKeys}</p>
      </div>
      <div class="glass-card p-6 rounded-2xl shadow-sm border-t-4 border-secondary">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-secondary-container/10 rounded-lg"><span class="material-symbols-outlined text-secondary">vpn_key</span></div>
          <span class="text-on-surface-variant bg-surface-container px-2 py-1 rounded text-[10px] font-bold">Aktif</span>
        </div>
        <p class="text-on-surface-variant text-xs">Kunci Tersedia</p>
        <p class="text-2xl font-black text-on-surface">${activeKeys}</p>
      </div>
      <div class="glass-card p-6 rounded-2xl shadow-sm border-t-4 border-green-500">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-green-50 rounded-lg"><span class="material-symbols-outlined text-green-600">task_alt</span></div>
          <span class="text-green-700 bg-green-50 px-2 py-1 rounded text-[10px] font-bold">Terpakai</span>
        </div>
        <p class="text-on-surface-variant text-xs">Kunci Digunakan</p>
        <p class="text-2xl font-black text-on-surface">${usedKeys}</p>
      </div>
      <div class="glass-card p-6 rounded-2xl shadow-sm border-t-4 border-tertiary-container">
        <div class="flex justify-between items-start mb-4">
          <div class="p-2 bg-tertiary-container/10 rounded-lg"><span class="material-symbols-outlined text-tertiary">map</span></div>
          <span class="text-tertiary bg-tertiary-fixed px-2 py-1 rounded text-[10px] font-bold">Lapangan</span>
        </div>
        <p class="text-on-surface-variant text-xs">Kunci Lapangan</p>
        <p class="text-2xl font-black text-on-surface">${lapanganKeys}</p>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
`;

      <!-- Left: Form Buat Kunci -->
      <div class="lg:col-span-1 space-y-6">
        <section class="bg-white p-8 rounded-3xl shadow-sm border border-outline-variant sticky top-24">
          <h3 class="text-xl font-bold mb-6 flex items-center gap-2 text-on-surface">
            <span class="material-symbols-outlined text-primary">add_circle</span>Buat Kunci Baru
          </h3>
          <div class="space-y-5">
            <div>
              <label class="block text-xs font-bold text-on-surface-variant mb-2">Nama / Catatan Petugas</label>
              <input class="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm" id="noteIn" placeholder="Contoh: Budi Santoso - SLS 001" type="text"/>
            </div>
            <div>
              <label class="block text-xs font-bold text-on-surface-variant mb-2">Tipe Kunci</label>
              <select class="w-full px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm appearance-none" id="typeIn">
                <option value="app">🔑 App (Kalkulator saja)</option>
                <option value="lapangan">📋 Lapangan (Kalkulator + Data + Drive)</option>
                <option value="pengawas">👁️ Pengawas (PML)</option>
              </select>
            </div>
            <button class="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[.98] transition-all flex items-center justify-center gap-2 group" id="mintBtn" onclick="mint()">
              <span>Generate Kunci Akses</span>
              <span class="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
            </button>

            <!-- Result box -->
            <div class="hidden" id="res">
              <div class="mt-4 p-4 rounded-2xl bg-surface-container border-2 border-dashed border-primary/30 flex flex-col gap-3">
                <div class="flex justify-between items-center">
                  <span class="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-white bg-primary" id="resBadge">APP</span>
                  <span class="text-[10px] text-on-surface-variant">BARU DIBUAT</span>
                </div>
                <div class="flex items-center gap-2 bg-white p-3 rounded-lg border border-outline-variant">
                  <code class="flex-1 text-primary font-bold text-xs overflow-hidden truncate font-mono" id="resKey">—</code>
                  <button class="p-2 hover:bg-surface-container rounded-md text-primary transition-colors" onclick="copyKey(document.getElementById('resKey').innerText)">
                    <span class="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
                <p class="text-[11px] text-on-surface-variant italic leading-tight">⚠️ Simpan kunci ini. Kunci hanya ditampilkan sekali untuk alasan keamanan.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Right: Tabel Kunci -->
      <div class="lg:col-span-2 space-y-6">
        <section class="bg-white rounded-3xl shadow-sm border border-outline-variant overflow-hidden">
          <div class="p-6 md:p-8 border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 class="text-xl font-bold text-on-surface">Daftar Kunci Akses</h3>
            <div class="flex flex-wrap gap-2">
              <button class="filter-chip active px-4 py-1.5 rounded-full border border-primary bg-primary-container/10 text-primary text-xs font-bold transition-all" onclick="filterKeys('all',this)">Semua</button>
              <button class="filter-chip px-4 py-1.5 rounded-full border border-outline-variant text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-all" onclick="filterKeys('app',this)">App</button>
              <button class="filter-chip px-4 py-1.5 rounded-full border border-outline-variant text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-all" onclick="filterKeys('lapangan',this)">Lapangan</button>
              <button class="filter-chip px-4 py-1.5 rounded-full border border-outline-variant text-on-surface-variant text-xs font-bold hover:bg-surface-container transition-all" onclick="filterKeys('pengawas',this)">Pengawas</button>
            </div>
          </div>
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
              <thead class="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th class="px-8 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Nama / Catatan</th>
                  <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipe</th>
                  <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kunci (UUID)</th>
                  <th class="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant" id="keyList">
                ${tableRows || emptyRow}
              </tbody>
            </table>
          </div>
          <div class="p-6 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
            <span class="text-xs text-on-surface-variant">Menampilkan ${totalKeys} kunci akses (50 terbaru)</span>
            <button onclick="window.location.reload()" class="flex items-center gap-1 text-xs text-primary hover:underline font-bold">
              <span class="material-symbols-outlined text-[14px]">refresh</span>Muat Ulang
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</main>
`;

<!-- Footer -->
<footer class="py-6 px-8 flex flex-col md:flex-row justify-between items-center bg-surface-container-lowest md:ml-[260px] border-t border-outline-variant gap-4">
  <p class="text-xs font-bold text-on-surface-variant">© 2026 Badan Pusat Statistik — SE2026 Sumberharjo</p>
  <div class="flex gap-6">
    <a class="text-on-surface-variant hover:text-primary text-xs transition-colors" href="#">Panduan Pengguna</a>
    <a class="text-on-surface-variant hover:text-primary text-xs transition-colors" href="#">Kebijakan Privasi</a>
    <a class="text-on-surface-variant hover:text-primary text-xs transition-colors" href="#">Hubungi IT</a>
  </div>
</footer>

<!-- Delete Confirmation Modal -->
<div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center hidden opacity-0 transition-opacity duration-300" id="overlay">
  <div class="bg-white rounded-3xl p-8 max-w-md w-[90%] shadow-2xl scale-95 transition-transform duration-300">
    <div class="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center text-error mb-6 mx-auto">
      <span class="material-symbols-outlined text-4xl">warning</span>
    </div>
    <h3 class="text-xl font-bold text-on-surface text-center mb-2">Hapus Kunci Akses?</h3>
    <p class="text-center text-on-surface-variant text-sm mb-4">Tindakan ini tidak dapat dibatalkan. Petugas yang menggunakan kunci ini akan langsung kehilangan akses ke aplikasi SE2026.</p>
    <div class="bg-surface-container rounded-lg px-4 py-2 mb-6 font-mono text-xs text-on-surface-variant text-center break-all" id="overlayKeyText"></div>
    <div class="grid grid-cols-2 gap-4">
      <button class="py-3 px-4 rounded-xl border border-outline-variant font-bold text-on-surface-variant hover:bg-surface-container transition-all" onclick="closeModal()">Batal</button>
      <button class="py-3 px-4 rounded-xl bg-error text-white font-bold hover:bg-error/90 shadow-lg shadow-error/20 transition-all" id="confirmDeleteBtn">Ya, Hapus</button>
    </div>
  </div>
</div>

<!-- Toast Notifications -->
<div class="fixed bottom-8 right-8 z-[110] flex flex-col gap-3">
  <div class="toast flex items-center gap-3 bg-white border-l-4 border-green-500 p-4 rounded-lg shadow-xl min-w-[300px]" id="t-ok">
    <span class="material-symbols-outlined text-green-500">check_circle</span>
    <div class="flex-1">
      <p class="font-bold text-on-surface text-sm">Berhasil</p>
      <p class="text-on-surface-variant text-xs" id="t-ok-msg">Aksi berhasil dilakukan.</p>
    </div>
  </div>
  <div class="toast flex items-center gap-3 bg-white border-l-4 border-error p-4 rounded-lg shadow-xl min-w-[300px]" id="t-err">
    <span class="material-symbols-outlined text-error">error</span>
    <div class="flex-1">
      <p class="font-bold text-on-surface text-sm">Gagal</p>
      <p class="text-on-surface-variant text-xs" id="t-err-msg">Terjadi kesalahan pada sistem.</p>
    </div>
  </div>
  <div class="toast flex items-center gap-3 bg-white border-l-4 border-primary p-4 rounded-lg shadow-xl min-w-[300px]" id="t-info">
    <span class="material-symbols-outlined text-primary">info</span>
    <div class="flex-1">
      <p class="font-bold text-on-surface text-sm">Informasi</p>
      <p class="text-on-surface-variant text-xs" id="t-info-msg">Catatan sistem diperbarui.</p>
    </div>
  </div>
</div>
`;

<script>
  const SECRET = new URLSearchParams(window.location.search).get('secret') || '';
  let currentDeleteKey = '';
  let currentDeleteBtn = null;

  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
  }

  // ── Mint / Generate kunci baru ────────────────────────────────────────────
  async function mint() {
    const note = document.getElementById('noteIn').value.trim();
    const type = document.getElementById('typeIn').value;
    const btn  = document.getElementById('mintBtn');
    const res  = document.getElementById('res');

    if (!note) { showToast('err', 'Mohon isi nama atau catatan petugas.'); return; }

    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin material-symbols-outlined">sync</span> Memproses...';

    try {
      const response = await fetch('/api/admin?secret=' + encodeURIComponent(SECRET) + '&action=mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, type }),
      });
      const data = await response.json();

      if (data.success) {
        document.getElementById('resKey').innerText = data.key;
        const badge = document.getElementById('resBadge');
        badge.innerText = type.toUpperCase();
        badge.className = 'px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-white ' +
          (type === 'lapangan' ? 'bg-secondary' : type === 'pengawas' ? 'bg-tertiary' : 'bg-primary');
        res.classList.remove('hidden');

        // Tambah baris ke tabel langsung
        const list = document.getElementById('keyList');
        const rowId = 'row-' + data.key;
        const typeBadge = type === 'lapangan'
          ? '<span class="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[11px] font-bold uppercase">Lapangan</span>'
          : type === 'pengawas'
          ? '<span class="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-[11px] font-bold uppercase">Pengawas</span>'
          : '<span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase">App</span>';

        const shortKey = data.key.substring(0, 8) + '…' + data.key.slice(-6);
        const safeKey  = data.key.replace(/'/g, "\\'");

        const newRow = document.createElement('tr');
        newRow.id = rowId;
        newRow.className = 'group hover:bg-surface-container-low transition-colors';
        newRow.innerHTML =
          '<td class="px-8 py-5"><p class="font-bold text-on-surface">' + note + '</p>' +
          '<p class="text-xs text-on-surface-variant">Baru dibuat · Hari ini</p></td>' +
          '<td class="px-6 py-5">' + typeBadge + '</td>' +
          '<td class="px-6 py-5"><span class="text-green-700 bg-green-50 px-2 py-1 rounded text-[10px] font-bold">Tersedia</span></td>' +
          '<td class="px-6 py-5"><div class="flex items-center gap-2">' +
          '<code class="text-on-surface-variant text-xs font-mono">' + shortKey + '</code>' +
          '<button class="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 rounded transition-all" onclick="copyKey(\'' + safeKey + '\')">' +
          '<span class="material-symbols-outlined text-[16px] text-primary">content_copy</span></button></div></td>' +
          '<td class="px-6 py-5 text-right"><button class="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all" onclick="askDelete(\'' + safeKey + '\', this)">' +
          '<span class="material-symbols-outlined">delete</span></button></td>';

        // Hapus empty state jika ada
        const emptyRow = list.querySelector('td[colspan]');
        if (emptyRow) emptyRow.closest('tr').remove();
        list.insertBefore(newRow, list.firstChild);

        document.getElementById('noteIn').value = '';
        showToast('ok', 'Kunci akses baru berhasil dibuat.');
      } else {
        showToast('err', data.message || 'Gagal membuat kunci.');
      }
    } catch (e) {
      showToast('err', 'Gagal terhubung ke server: ' + e.message);
    }

    btn.disabled = false;
    btn.innerHTML = '<span>Generate Kunci Akses</span><span class="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>';
  }

  // ── Salin kunci ───────────────────────────────────────────────────────────
  function copyKey(k) {
    navigator.clipboard.writeText(k).then(() => showToast('info', 'Kunci disalin ke papan klip.'));
  }

  // ── Konfirmasi hapus ──────────────────────────────────────────────────────
  function askDelete(key, btn) {
    currentDeleteKey = key;
    currentDeleteBtn = btn;
    document.getElementById('overlayKeyText').innerText = key;
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('hidden');
    setTimeout(() => {
      overlay.classList.add('opacity-100');
      overlay.querySelector('div').classList.remove('scale-95');
    }, 10);
    document.getElementById('confirmDeleteBtn').onclick = doDelete;
  }

  function closeModal() {
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('opacity-100');
    overlay.querySelector('div').classList.add('scale-95');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }

  async function doDelete() {
    const key = currentDeleteKey;
    const btn = currentDeleteBtn;
    closeModal();

    try {
      const response = await fetch('/api/admin?secret=' + encodeURIComponent(SECRET) + '&action=delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await response.json();
      if (data.success) {
        const row = document.getElementById('row-' + key);
        if (row) {
          row.classList.add('opacity-50', 'bg-error-container/10');
          setTimeout(() => row.remove(), 300);
        }
        showToast('ok', 'Kunci akses berhasil dihapus.');
      } else {
        showToast('err', data.message || 'Gagal menghapus kunci.');
      }
    } catch (e) {
      showToast('err', 'Error: ' + e.message);
    }
  }

  // ── Filter chips ──────────────────────────────────────────────────────────
  function filterKeys(type, el) {
    document.querySelectorAll('.filter-chip').forEach(c => {
      c.classList.remove('active','bg-primary-container/10','text-primary','border-primary');
      c.classList.add('border-outline-variant','text-on-surface-variant');
    });
    el.classList.add('active','bg-primary-container/10','text-primary','border-primary');
    el.classList.remove('border-outline-variant','text-on-surface-variant');

    document.querySelectorAll('#keyList tr').forEach(row => {
      const typeCell = row.querySelector('td:nth-child(2) span');
      if (!typeCell) return;
      const rowType = typeCell.innerText.toLowerCase().trim();
      row.classList.toggle('hidden', type !== 'all' && rowType !== type);
    });
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  function showToast(type, msg) {
    const id = 't-' + type;
    document.getElementById(id + '-msg').innerText = msg;
    const el = document.getElementById(id);
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 3000);
  }

  // Tutup modal klik di luar
  document.getElementById('overlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });

  window.addEventListener('resize', () => {
    const sb = document.getElementById('sidebar');
    if (window.innerWidth >= 768) sb.classList.remove('-translate-x-full');
    else sb.classList.add('-translate-x-full');
  });
</script>
</body>
</html>\`;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
}
