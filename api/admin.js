// ─── api/admin.js — Admin Panel: Buat, Lihat & Hapus Kunci ───────────────────
import { Redis } from "@upstash/redis";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const WEBHOOK_URL  = process.env.WEBHOOK_URL  || "";

export default async function handler(req, res) {
  const { secret, action } = req.query;
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return res.status(401).send(
      "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>Unauthorized</title>" +
      "<script src='https://cdn.tailwindcss.com'></script></head>" +
      "<body class='bg-slate-900 flex items-center justify-center min-h-screen'>" +
      "<div class='text-center'><p class='text-6xl mb-4'>🔒</p>" +
      "<h2 class='text-2xl font-bold text-red-400 mb-2'>401 — Unauthorized</h2>" +
      "<p class='text-slate-400'>Secret salah atau tidak dikonfigurasi.</p>" +
      "</div></body></html>"
    );
  }

  let redis;
  try {
    redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
  } catch (err) {
    return res.status(500).send("<p>Redis tidak terkonfigurasi.</p>");
  }

  // ── POST: Mint kunci baru ─────────────────────────────────────────────────
  if (req.method === "POST" && action === "mint") {
    const { v4: uuidv4 } = await import("uuid");
    const newKey  = uuidv4();
    const note    = req.body?.note || "via-admin-web";
    const keyType = req.body?.type || "app";
    await redis.set("key:" + newKey, { key: newKey, used: false, createdAt: new Date().toISOString(), createdBy: note, type: keyType });
    await redis.lpush("keys:list", newKey);
    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [{ title: "🔑 Kunci Baru Diterbitkan", color: 0x004ec7,
          fields: [{ name: "Kunci", value: "`" + newKey + "`", inline: false }, { name: "Oleh", value: note, inline: true }, { name: "Tipe", value: keyType, inline: true }],
          footer: { text: "BPS SE2026 Admin Panel" } }] }) }).catch(() => {});
    }
    return res.status(200).json({ success: true, key: newKey });
  }

  // ── POST: List kunci ──────────────────────────────────────────────────────
  if (req.method === "POST" && action === "list") {
    try {
      const keyIds = await redis.lrange("keys:list", 0, 49);
      const results = keyIds.length > 0 ? await Promise.all(keyIds.map(k => redis.get("key:" + k))) : [];
      return res.status(200).json({ keys: results.filter(Boolean) });
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
    try { keyData = await redis.get("key:" + trimmedKey); } catch (err) { return res.status(500).json({ success: false, message: "Redis error." }); }
    if (!keyData) return res.status(404).json({ success: false, message: "Kunci tidak ditemukan." });
    await redis.del("key:" + trimmedKey);
    await redis.lrem("keys:list", 0, trimmedKey);
    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [{ title: "🗑️ Kunci Dicabut", color: 0xff4444,
          fields: [{ name: "Kunci", value: "`" + trimmedKey + "`", inline: false }, { name: "Status", value: keyData.used ? "🔴 Terpakai" : "🟢 Tersedia", inline: true }, { name: "Oleh", value: keyData.createdBy || "unknown", inline: true }],
          footer: { text: "BPS SE2026 Admin" } }] }) }).catch(() => {});
    }
    return res.status(200).json({ success: true, message: "Kunci berhasil dihapus." });
  }

  // ── GET: Render halaman admin HTML ────────────────────────────────────────
  let recentKeys = [];
  try {
    const keyIds = await redis.lrange("keys:list", 0, 49);
    if (keyIds.length > 0) {
      const results = await Promise.all(keyIds.map(k => redis.get("key:" + k)));
      recentKeys = results.filter(Boolean);
    }
  } catch (_) {}

  const totalKeys    = recentKeys.length;
  const activeKeys   = recentKeys.filter(k => !k.used).length;
  const usedKeys     = recentKeys.filter(k => k.used).length;
  const lapanganKeys = recentKeys.filter(k => k.type === "lapangan").length;

  // Baris tabel — pakai string biasa (bukan template literal) agar aman
  const tableRows = recentKeys.map(function(k) {
    var typeBadge = k.type === "lapangan"
      ? '<span class="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase">Lapangan</span>'
      : k.type === "pengawas"
      ? '<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pengawas</span>'
      : '<span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase">App</span>';

    var statusBadge = k.used
      ? '<span class="text-red-700 bg-red-50 px-2 py-1 rounded text-xs font-bold">Terpakai</span>'
      : '<span class="text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold">Tersedia</span>';

    var safeKey  = k.key.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    var shortKey = k.key.length > 20 ? k.key.substring(0, 8) + "..." + k.key.slice(-6) : k.key;
    var createdAt = k.createdAt ? new Date(k.createdAt).toLocaleDateString("id-ID") : "-";
    var usedAt    = k.usedAt    ? new Date(k.usedAt).toLocaleDateString("id-ID")    : "-";
    var createdBy = (k.createdBy || "-").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var usedInfo  = k.used ? "Dipakai: " + usedAt : "Belum dipakai";

    return (
      '<tr class="group hover:bg-blue-50 transition-colors" id="row-' + k.key + '">' +
        '<td class="px-6 py-4"><p class="font-bold text-gray-800">' + createdBy + '</p>' +
        '<p class="text-xs text-gray-400">' + createdAt + '</p></td>' +
        '<td class="px-6 py-4">' + typeBadge + '</td>' +
        '<td class="px-6 py-4">' + statusBadge + '<p class="text-xs text-gray-400 mt-1">' + usedInfo + '</p></td>' +
        '<td class="px-6 py-4"><div class="flex items-center gap-2">' +
          '<code class="text-gray-500 text-xs font-mono">' + shortKey + '</code>' +
          '<button class="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-all" onclick="copyKey(\'' + safeKey + '\')">' +
            '<span class="material-symbols-outlined" style="font-size:16px;color:#003996">content_copy</span>' +
          '</button></div></td>' +
        '<td class="px-6 py-4 text-right">' +
          '<button class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" onclick="askDelete(\'' + safeKey + '\', this)">' +
            '<span class="material-symbols-outlined">delete</span>' +
          '</button></td>' +
      '</tr>'
    );
  }).join("");

  var emptyRow =
    '<tr><td colspan="5" class="px-8 py-12 text-center text-gray-400">' +
    '<span class="material-symbols-outlined" style="font-size:48px;display:block;margin:0 auto 12px;opacity:.3">vpn_key_off</span>' +
    '<p>Belum ada kunci yang diterbitkan.</p></td></tr>';

  var html = '<!DOCTYPE html>' +
'<html lang="id"><head>' +
'<meta charset="utf-8"/>' +
'<meta content="width=device-width,initial-scale=1.0" name="viewport"/>' +
'<title>BPS SE2026 Admin Panel</title>' +
'<script src="https://cdn.tailwindcss.com"><\/script>' +
'<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>' +
'<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>' +
'<style>' +
'body{font-family:Inter,sans-serif;background:#f8f9ff}' +
'.material-symbols-outlined{font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24;display:inline-block;vertical-align:middle}' +
'.toast{transition:transform .3s ease,opacity .2s ease;transform:translateY(20px);opacity:0}' +
'.toast.show{transform:translateY(0);opacity:1}' +
'.scrollbar::-webkit-scrollbar{width:6px;height:6px}' +
'.scrollbar::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}' +
'</style>' +
'</head>' +
'<body class="text-gray-800">' +

'<header class="fixed top-0 left-0 w-full h-16 flex justify-between items-center px-8 z-50 bg-white border-b border-gray-200 shadow-sm">' +
  '<div class="flex items-center gap-4">' +
    '<button class="md:hidden p-2 rounded-lg hover:bg-gray-100" onclick="document.getElementById(\'sb\').classList.toggle(\'-translate-x-full\')">' +
      '<span class="material-symbols-outlined">menu</span>' +
    '</button>' +
    '<h1 class="text-lg font-bold text-blue-900">BPS SE2026 Admin Panel</h1>' +
  '</div>' +
  '<div class="flex items-center gap-3 pl-4 border-l border-gray-200">' +
    '<div class="text-right hidden sm:block">' +
      '<p class="text-xs font-bold text-gray-800 leading-none">Admin Sumberharjo</p>' +
      '<p class="text-xs text-gray-500">Operator Wilayah</p>' +
    '</div>' +
    '<span class="material-symbols-outlined text-blue-800 bg-blue-100 p-2 rounded-full" style="font-variation-settings:\'FILL\' 1">account_circle</span>' +
  '</div>' +
'</header>' +

'<aside id="sb" class="fixed left-0 top-0 h-full w-64 flex flex-col py-6 z-40 bg-blue-950 transition-transform -translate-x-full md:translate-x-0">' +
  '<div class="px-6 mb-8 mt-16">' +
    '<div class="flex items-center gap-3">' +
      '<div class="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white font-black text-xl">S</div>' +
      '<div>' +
        '<h2 class="text-lg font-black text-white">SE2026</h2>' +
        '<p class="text-xs text-blue-300 uppercase tracking-widest">Sumberharjo</p>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<nav class="flex-1 px-4 space-y-1">' +
    '<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-200 hover:bg-blue-800 transition-colors" href="#">' +
      '<span class="material-symbols-outlined">dashboard</span><span class="text-sm font-semibold">Dashboard</span></a>' +
    '<a class="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-700 text-white shadow" href="#">' +
      '<span class="material-symbols-outlined" style="font-variation-settings:\'FILL\' 1">vpn_key</span><span class="text-sm font-bold">Kunci Akses</span></a>' +
    '<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-200 hover:bg-blue-800 transition-colors" href="#">' +
      '<span class="material-symbols-outlined">analytics</span><span class="text-sm font-semibold">Laporan</span></a>' +
    '<a class="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-200 hover:bg-blue-800 transition-colors" href="#">' +
      '<span class="material-symbols-outlined">settings</span><span class="text-sm font-semibold">Pengaturan</span></a>' +
  '</nav>' +
  '<div class="px-6 py-4">' +
    '<div class="p-4 bg-blue-900 rounded-xl border border-blue-700">' +
      '<p class="text-xs text-blue-300 font-bold mb-2">Status Server</p>' +
      '<div class="flex items-center gap-2">' +
        '<span class="w-2 h-2 bg-green-400 rounded-full" style="animation:pulse 2s infinite"></span>' +
        '<span class="text-xs text-blue-200">Redis Terhubung</span>' +
      '</div>' +
    '</div>' +
  '</div>' +
'</aside>';

  html +=
'<main class="md:ml-64 pt-24 px-6 pb-12 min-h-screen">' +
  '<div class="max-w-7xl mx-auto">' +

    '<div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">' +
      '<div>' +
        '<div class="flex items-center gap-2 text-gray-400 text-xs mb-2">' +
          '<span>Admin</span>' +
          '<span class="material-symbols-outlined" style="font-size:14px">chevron_right</span>' +
          '<span class="text-blue-700 font-bold">Kunci Akses</span>' +
        '</div>' +
        '<h2 class="text-2xl font-bold text-gray-900">Manajemen Kunci Akses</h2>' +
        '<p class="text-gray-500 text-sm">Kelola otentikasi petugas lapangan untuk Sensus Ekonomi 2026.</p>' +
      '</div>' +
      '<div class="flex items-center gap-3">' +
        '<button onclick="window.location.reload()" class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">' +
          '<span class="material-symbols-outlined" style="font-size:18px">refresh</span>Refresh' +
        '</button>' +
        '<button onclick="document.getElementById(\'mintBtn\').click()" class="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md">' +
          '<span class="material-symbols-outlined" style="font-size:18px">add</span>Kunci Baru' +
        '</button>' +
      '</div>' +
    '</div>' +

    '<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">' +
      '<div class="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-blue-800">' +
        '<div class="flex justify-between items-start mb-3">' +
          '<span class="material-symbols-outlined text-blue-800 bg-blue-50 p-2 rounded-lg">key</span>' +
          '<span class="text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold">Total</span>' +
        '</div>' +
        '<p class="text-gray-500 text-xs mb-1">Total Kunci</p>' +
        '<p class="text-3xl font-black text-gray-900">' + totalKeys + '</p>' +
      '</div>' +
      '<div class="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-cyan-600">' +
        '<div class="flex justify-between items-start mb-3">' +
          '<span class="material-symbols-outlined text-cyan-700 bg-cyan-50 p-2 rounded-lg">vpn_key</span>' +
          '<span class="text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs font-bold">Aktif</span>' +
        '</div>' +
        '<p class="text-gray-500 text-xs mb-1">Kunci Tersedia</p>' +
        '<p class="text-3xl font-black text-gray-900">' + activeKeys + '</p>' +
      '</div>' +
      '<div class="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-green-600">' +
        '<div class="flex justify-between items-start mb-3">' +
          '<span class="material-symbols-outlined text-green-700 bg-green-50 p-2 rounded-lg">task_alt</span>' +
          '<span class="text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold">Terpakai</span>' +
        '</div>' +
        '<p class="text-gray-500 text-xs mb-1">Kunci Digunakan</p>' +
        '<p class="text-3xl font-black text-gray-900">' + usedKeys + '</p>' +
      '</div>' +
      '<div class="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-orange-500">' +
        '<div class="flex justify-between items-start mb-3">' +
          '<span class="material-symbols-outlined text-orange-600 bg-orange-50 p-2 rounded-lg">map</span>' +
          '<span class="text-orange-700 bg-orange-50 px-2 py-1 rounded text-xs font-bold">Lapangan</span>' +
        '</div>' +
        '<p class="text-gray-500 text-xs mb-1">Kunci Lapangan</p>' +
        '<p class="text-3xl font-black text-gray-900">' + lapanganKeys + '</p>' +
      '</div>' +
    '</div>' +

    '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">';

  html +=
      '<div class="lg:col-span-1">' +
        '<section class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">' +
          '<h3 class="text-lg font-bold mb-5 flex items-center gap-2 text-gray-900">' +
            '<span class="material-symbols-outlined text-blue-800">add_circle</span>Buat Kunci Baru' +
          '</h3>' +
          '<div class="space-y-4">' +
            '<div>' +
              '<label class="block text-xs font-bold text-gray-500 mb-1">Nama / Catatan Petugas</label>' +
              '<input id="noteIn" type="text" placeholder="Contoh: Budi Santoso - SLS 001"' +
                ' class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-sm"/>' +
            '</div>' +
            '<div>' +
              '<label class="block text-xs font-bold text-gray-500 mb-1">Tipe Kunci</label>' +
              '<select id="typeIn" class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm">' +
                '<option value="app">Kunci App (Kalkulator saja)</option>' +
                '<option value="lapangan">Kunci Lapangan (Kalkulator + Data + Drive)</option>' +
                '<option value="pengawas">Kunci Pengawas (PML)</option>' +
              '</select>' +
            '</div>' +
            '<button id="mintBtn" onclick="mint()" class="w-full py-3 bg-blue-800 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">' +
              '<span>Generate Kunci</span>' +
              '<span class="material-symbols-outlined">arrow_forward</span>' +
            '</button>' +
            '<div id="resBox" class="hidden p-4 rounded-xl bg-blue-50 border-2 border-dashed border-blue-200">' +
              '<div class="flex justify-between items-center mb-2">' +
                '<span id="resBadge" class="px-2 py-1 rounded text-xs font-black uppercase text-white bg-blue-800">APP</span>' +
                '<span class="text-xs text-gray-400">BARU DIBUAT</span>' +
              '</div>' +
              '<div class="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200 mb-2">' +
                '<code id="resKey" class="flex-1 text-blue-800 font-bold text-xs font-mono truncate">-</code>' +
                '<button onclick="copyKey(document.getElementById(\'resKey\').innerText)" class="p-1 hover:bg-blue-100 rounded text-blue-800">' +
                  '<span class="material-symbols-outlined" style="font-size:18px">content_copy</span>' +
                '</button>' +
              '</div>' +
              '<p class="text-xs text-gray-500 italic">Simpan kunci ini. Kunci hanya ditampilkan sekali.</p>' +
            '</div>' +
          '</div>' +
        '</section>' +
      '</div>' +

      '<div class="lg:col-span-2">' +
        '<section class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">' +
          '<div class="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">' +
            '<h3 class="text-lg font-bold text-gray-900">Daftar Kunci Akses</h3>' +
            '<div class="flex flex-wrap gap-2">' +
              '<button onclick="filterKeys(\'all\',this)" class="chip active px-4 py-1.5 rounded-full border border-blue-700 bg-blue-50 text-blue-700 text-xs font-bold">Semua</button>' +
              '<button onclick="filterKeys(\'app\',this)" class="chip px-4 py-1.5 rounded-full border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50">App</button>' +
              '<button onclick="filterKeys(\'lapangan\',this)" class="chip px-4 py-1.5 rounded-full border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50">Lapangan</button>' +
              '<button onclick="filterKeys(\'pengawas\',this)" class="chip px-4 py-1.5 rounded-full border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50">Pengawas</button>' +
            '</div>' +
          '</div>' +
          '<div class="overflow-x-auto scrollbar">' +
            '<table class="w-full text-left border-collapse">' +
              '<thead class="bg-gray-50 border-b border-gray-100">' +
                '<tr>' +
                  '<th class="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Nama / Catatan</th>' +
                  '<th class="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Tipe</th>' +
                  '<th class="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>' +
                  '<th class="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Kunci (UUID)</th>' +
                  '<th class="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Aksi</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody id="keyList" class="divide-y divide-gray-50">' +
                (tableRows || emptyRow) +
              '</tbody>' +
            '</table>' +
          '</div>' +
          '<div class="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">' +
            '<span class="text-xs text-gray-400">Menampilkan ' + totalKeys + ' kunci (50 terbaru)</span>' +
            '<button onclick="window.location.reload()" class="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1">' +
              '<span class="material-symbols-outlined" style="font-size:14px">refresh</span>Muat ulang' +
            '</button>' +
          '</div>' +
        '</section>' +
      '</div>' +

    '</div>' +
  '</div>' +
'</main>' +

'<footer class="py-5 px-6 flex flex-col md:flex-row justify-between items-center bg-white md:ml-64 border-t border-gray-100 gap-3">' +
  '<p class="text-xs text-gray-400">&#169; 2026 Badan Pusat Statistik &#8212; SE2026 Sumberharjo</p>' +
  '<div class="flex gap-5">' +
    '<a class="text-gray-400 hover:text-blue-800 text-xs" href="#">Panduan</a>' +
    '<a class="text-gray-400 hover:text-blue-800 text-xs" href="#">Kebijakan</a>' +
    '<a class="text-gray-400 hover:text-blue-800 text-xs" href="#">Hubungi IT</a>' +
  '</div>' +
'</footer>';

  html +=
'<div id="overlay" class="fixed inset-0 bg-black/60 z-50 hidden flex items-center justify-center" onclick="if(event.target===this)closeModal()">' +
  '<div id="overlayBox" class="bg-white rounded-2xl p-8 max-w-md w-11/12 shadow-2xl scale-95 transition-transform">' +
    '<div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-5 mx-auto">' +
      '<span class="material-symbols-outlined" style="font-size:36px">warning</span>' +
    '</div>' +
    '<h3 class="text-xl font-bold text-gray-900 text-center mb-2">Hapus Kunci Akses?</h3>' +
    '<p class="text-center text-gray-500 text-sm mb-3">Tindakan ini tidak dapat dibatalkan. Petugas yang menggunakan kunci ini akan langsung kehilangan akses.</p>' +
    '<div id="overlayKey" class="bg-gray-50 rounded-lg px-4 py-2 mb-6 font-mono text-xs text-gray-500 text-center break-all"></div>' +
    '<div class="grid grid-cols-2 gap-3">' +
      '<button onclick="closeModal()" class="py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50">Batal</button>' +
      '<button id="confirmBtn" class="py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg">Ya, Hapus</button>' +
    '</div>' +
  '</div>' +
'</div>' +

'<div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3">' +
  '<div id="t-ok" class="toast flex items-center gap-3 bg-white border-l-4 border-green-500 p-4 rounded-lg shadow-xl min-w-72">' +
    '<span class="material-symbols-outlined text-green-500">check_circle</span>' +
    '<div><p class="font-bold text-gray-800 text-sm">Berhasil</p><p id="t-ok-msg" class="text-gray-500 text-xs"></p></div>' +
  '</div>' +
  '<div id="t-err" class="toast flex items-center gap-3 bg-white border-l-4 border-red-500 p-4 rounded-lg shadow-xl min-w-72">' +
    '<span class="material-symbols-outlined text-red-500">error</span>' +
    '<div><p class="font-bold text-gray-800 text-sm">Gagal</p><p id="t-err-msg" class="text-gray-500 text-xs"></p></div>' +
  '</div>' +
  '<div id="t-info" class="toast flex items-center gap-3 bg-white border-l-4 border-blue-500 p-4 rounded-lg shadow-xl min-w-72">' +
    '<span class="material-symbols-outlined text-blue-500">info</span>' +
    '<div><p class="font-bold text-gray-800 text-sm">Info</p><p id="t-info-msg" class="text-gray-500 text-xs"></p></div>' +
  '</div>' +
'</div>';

  html +=
'<script>' +
'var SECRET = new URLSearchParams(window.location.search).get("secret") || "";' +
'var pendingKey = null, pendingBtn = null;' +

'async function mint() {' +
  'var note = document.getElementById("noteIn").value.trim();' +
  'var type = document.getElementById("typeIn").value;' +
  'var btn  = document.getElementById("mintBtn");' +
  'if (!note) { showToast("err","Mohon isi nama petugas."); return; }' +
  'btn.disabled = true;' +
  'btn.innerHTML = "<span class=\\"material-symbols-outlined\\" style=\\"animation:spin 1s linear infinite\\">sync</span> Memproses...";' +
  'try {' +
    'var r = await fetch("/api/admin?secret="+encodeURIComponent(SECRET)+"&action=mint",' +
      '{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({note:note,type:type})});' +
    'var d = await r.json();' +
    'if (d.success) {' +
      'document.getElementById("resKey").innerText = d.key;' +
      'var badge = document.getElementById("resBadge");' +
      'badge.innerText = type.toUpperCase();' +
      'badge.className = "px-2 py-1 rounded text-xs font-black uppercase text-white " + (type==="lapangan"?"bg-cyan-700":type==="pengawas"?"bg-yellow-600":"bg-blue-800");' +
      'document.getElementById("resBox").classList.remove("hidden");' +
      'document.getElementById("noteIn").value = "";' +
      'var list = document.getElementById("keyList");' +
      'var emptyTd = list.querySelector("td[colspan]"); if (emptyTd) emptyTd.closest("tr").remove();' +
      'var sk = d.key.substring(0,8)+"..."+d.key.slice(-6);' +
      'var safe = d.key.replace(/\\\'/g, "\\\\\'");' +
      'var tb = type==="lapangan"?\'<span class="bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Lapangan</span>\':' +
               'type==="pengawas"?\'<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Pengawas</span>\':' +
               '\'<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">App</span>\';' +
      'var row = document.createElement("tr");' +
      'row.id = "row-"+d.key;' +
      'row.className = "group hover:bg-blue-50 transition-colors";' +
      'row.innerHTML = "<td class=\\"px-6 py-4\\"><p class=\\"font-bold text-gray-800\\">"+note+"</p><p class=\\"text-xs text-gray-400\\">Baru dibuat</p></td>"' +
        '+"<td class=\\"px-6 py-4\\">"+tb+"</td>"' +
        '+"<td class=\\"px-6 py-4\\"><span class=\\"text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold\\">Tersedia</span></td>"' +
        '+"<td class=\\"px-6 py-4\\"><div class=\\"flex items-center gap-2\\"><code class=\\"text-gray-500 text-xs font-mono\\">"+sk+"</code>"' +
        '+"<button class=\\"opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded\\" onclick=\\"copyKey(\'"+safe+"\')\\">"' +
        '+"<span class=\\"material-symbols-outlined\\" style=\\"font-size:16px;color:#1e40af\\">content_copy</span></button></div></td>"' +
        '+"<td class=\\"px-6 py-4 text-right\\"><button class=\\"p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg\\" onclick=\\"askDelete(\'"+safe+"\',this)\\">"' +
        '+"<span class=\\"material-symbols-outlined\\">delete</span></button></td>";' +
      'list.insertBefore(row, list.firstChild);' +
      'showToast("ok","Kunci akses baru berhasil dibuat.");' +
    '} else { showToast("err", d.message || "Gagal."); }' +
  '} catch(e) { showToast("err","Error: "+e.message); }' +
  'btn.disabled = false;' +
  'btn.innerHTML = "<span>Generate Kunci</span><span class=\\"material-symbols-outlined\\">arrow_forward</span>";' +
'}' +

'function copyKey(k) { navigator.clipboard.writeText(k).then(function(){ showToast("info","Kunci disalin ke papan klip."); }); }' +

'function askDelete(key, btn) {' +
  'pendingKey = key; pendingBtn = btn;' +
  'document.getElementById("overlayKey").innerText = key;' +
  'var ov = document.getElementById("overlay");' +
  'ov.classList.remove("hidden");' +
  'setTimeout(function(){ document.getElementById("overlayBox").classList.remove("scale-95"); }, 10);' +
  'document.getElementById("confirmBtn").onclick = doDelete;' +
'}' +

'function closeModal() {' +
  'document.getElementById("overlayBox").classList.add("scale-95");' +
  'setTimeout(function(){ document.getElementById("overlay").classList.add("hidden"); }, 200);' +
'}' +

'async function doDelete() {' +
  'var key = pendingKey;' +
  'closeModal();' +
  'try {' +
    'var r = await fetch("/api/admin?secret="+encodeURIComponent(SECRET)+"&action=delete",' +
      '{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:key})});' +
    'var d = await r.json();' +
    'if (d.success) {' +
      'var row = document.getElementById("row-"+key);' +
      'if (row) { row.style.opacity="0.3"; setTimeout(function(){ row.remove(); }, 300); }' +
      'showToast("ok","Kunci akses berhasil dihapus.");' +
    '} else { showToast("err", d.message || "Gagal menghapus."); }' +
  '} catch(e) { showToast("err","Error: "+e.message); }' +
'}' +

'function filterKeys(type, el) {' +
  'document.querySelectorAll(".chip").forEach(function(c) {' +
    'c.classList.remove("active","border-blue-700","bg-blue-50","text-blue-700");' +
    'c.classList.add("border-gray-200","text-gray-500");' +
  '});' +
  'el.classList.add("active","border-blue-700","bg-blue-50","text-blue-700");' +
  'el.classList.remove("border-gray-200","text-gray-500");' +
  'document.querySelectorAll("#keyList tr").forEach(function(row) {' +
    'var cell = row.querySelector("td:nth-child(2) span");' +
    'if (!cell) return;' +
    'var rt = cell.innerText.toLowerCase().trim();' +
    'row.style.display = (type==="all" || rt===type) ? "" : "none";' +
  '});' +
'}' +

'function showToast(type, msg) {' +
  'var el = document.getElementById("t-"+type);' +
  'document.getElementById("t-"+type+"-msg").innerText = msg;' +
  'el.classList.add("show");' +
  'setTimeout(function(){ el.classList.remove("show"); }, 3000);' +
'}' +

'window.addEventListener("resize", function() {' +
  'var sb = document.getElementById("sb");' +
  'if (window.innerWidth >= 768) sb.classList.remove("-translate-x-full");' +
  'else sb.classList.add("-translate-x-full");' +
'});' +
'<\/script>' +
'</body></html>';

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
}
