import { Redis } from "@upstash/redis";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "";
const WEBHOOK_URL  = process.env.WEBHOOK_URL  || "";

export default async function handler(req, res) {
  const { secret, action } = req.query;

  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) {
    return res.status(401).send(
      "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>Unauthorized</title>" +
      "<script src='https://cdn.tailwindcss.com'><\/script></head>" +
      "<body class='bg-slate-900 flex items-center justify-center min-h-screen'>" +
      "<div class='text-center'><p class='text-6xl mb-4'>&#128274;</p>" +
      "<h2 class='text-2xl font-bold text-red-400 mb-2'>401 Unauthorized</h2>" +
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

  if (req.method === "POST" && action === "mint") {
    const { v4: uuidv4 } = await import("uuid");
    const newKey  = uuidv4();
    const note    = req.body?.note || "via-admin-web";
    const keyType = req.body?.type || "lapangan";
    await redis.set("key:" + newKey, { key: newKey, used: false, createdAt: new Date().toISOString(), createdBy: note, type: keyType });
    await redis.lpush("keys:list", newKey);
    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [{ title: "Kunci Baru Diterbitkan", color: 0x004ec7,
          fields: [{ name: "Kunci", value: newKey, inline: false }, { name: "Oleh", value: note, inline: true }, { name: "Tipe", value: keyType, inline: true }],
          footer: { text: "BPS SE2026 Admin Panel" } }] }) }).catch(() => {});
    }
    return res.status(200).json({ success: true, key: newKey });
  }

  if (req.method === "POST" && action === "list") {
    try {
      const keyIds = await redis.lrange("keys:list", 0, 49);
      const results = keyIds.length > 0 ? await Promise.all(keyIds.map(k => redis.get("key:" + k))) : [];
      return res.status(200).json({ keys: results.filter(Boolean) });
    } catch (err) {
      return res.status(500).json({ success: false, message: "Redis error." });
    }
  }

  if (req.method === "POST" && action === "delete") {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ success: false, message: "key wajib diisi." });
    const trimmedKey = key.trim();
    let keyData;
    try { keyData = await redis.get("key:" + trimmedKey); }
    catch (err) { return res.status(500).json({ success: false, message: "Redis error." }); }
    if (!keyData) return res.status(404).json({ success: false, message: "Kunci tidak ditemukan." });
    await redis.del("key:" + trimmedKey);
    await redis.lrem("keys:list", 0, trimmedKey);
    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [{ title: "Kunci Dicabut", color: 0xff4444,
          fields: [{ name: "Kunci", value: trimmedKey, inline: false }, { name: "Status", value: keyData.used ? "Terpakai" : "Tersedia", inline: true }, { name: "Oleh", value: keyData.createdBy || "unknown", inline: true }],
          footer: { text: "BPS SE2026 Admin" } }] }) }).catch(() => {});
    }
    return res.status(200).json({ success: true, message: "Kunci berhasil dihapus." });
  }

  // GET: render HTML
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
  const lapanganKeys   = recentKeys.filter(k => k.type === "lapangan").length;
  const kalkulatorKeys = recentKeys.filter(k => k.type === "kalkulator").length;

  const tableRows = buildTableRows(recentKeys);

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(buildHtml(totalKeys, activeKeys, usedKeys, lapanganKeys, kalkulatorKeys, tableRows, secret));
}

function buildTableRows(recentKeys) {
  if (!recentKeys || recentKeys.length === 0) {
    return '<tr><td colspan="4" class="px-8 py-16 text-center text-on-surface-variant">' +
      '<span class="material-symbols-outlined" style="font-size:48px;display:block;margin:0 auto 12px;opacity:.25">vpn_key_off</span>' +
      '<p class="font-body-md">Belum ada kunci yang diterbitkan.</p></td></tr>';
  }
  return recentKeys.map(function(k) {
    var t = (k.type || "lapangan").toLowerCase();
    var typeBadge =
      t === "lapangan"   ? '<span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase">Lapangan</span>' :
      t === "kalkulator" ? '<span class="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[11px] font-bold uppercase">Kalkulator</span>' :
                           '<span class="bg-inverse-surface text-inverse-on-surface px-3 py-1 rounded-full text-[11px] font-bold uppercase">' + (k.type || "?").toUpperCase() + '</span>';
    var safe  = k.key.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    var short = k.key.length > 20 ? k.key.substring(0, 8) + "..." + k.key.slice(-6) : k.key;
    var dt    = k.createdAt ? new Date(k.createdAt).toLocaleDateString("id-ID") : "-";
    var by    = (k.createdBy || "-").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return (
      '<tr class="group hover:bg-surface-container-low transition-colors" id="row-' + k.key + '">' +
      '<td class="px-8 py-5"><p class="font-body-md font-bold text-on-surface">' + by + '</p>' +
      '<p class="text-xs text-on-surface-variant">' + dt + '</p></td>' +
      '<td class="px-6 py-5">' + typeBadge + '</td>' +
      '<td class="table-col-key px-6 py-5"><div class="flex items-center gap-2">' +
      '<code class="font-code-md text-on-surface-variant text-sm">' + short + '</code>' +
      '<button class="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 rounded transition-all" onclick="copyKey(\'' + safe + '\')">' +
      '<span class="material-symbols-outlined text-[16px] text-primary">content_copy</span></button></div></td>' +
      '<td class="px-6 py-5 text-right">' +
      '<button class="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all" onclick="askDelete(\'' + safe + '\', this)">' +
      '<span class="material-symbols-outlined">delete</span></button></td></tr>'
    );
  }).join("");
}

function buildHtml(totalKeys, activeKeys, usedKeys, lapanganKeys, kalkulatorKeys, tableRows, secret) {
  var H = '';
  H += '<!DOCTYPE html>';
  H += '<html lang="id" class="light">';
  H += '<head>';
  H += '<meta charset="utf-8"/>';
  H += '<meta name="viewport" content="width=device-width, initial-scale=1.0"/>';
  H += '<title>BPS SE2026 Admin Panel - Sumberharjo</title>';
  H += '<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"><\/script>';
  H += '<link rel="preconnect" href="https://fonts.googleapis.com"/>';
  H += '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>';
  H += '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>';
  H += '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"/>';
  H += '<script>';
  H += 'tailwind.config={theme:{extend:{colors:{';
  H += '"primary":"#003996","primary-container":"#004ec7","on-primary":"#ffffff","on-primary-container":"#bdccff",';
  H += '"secondary":"#006591","on-secondary":"#ffffff","secondary-container":"#39b8fd",';
  H += '"surface":"#f8f9ff","surface-container":"#e5eeff","surface-container-low":"#eff4ff",';
  H += '"surface-container-lowest":"#ffffff","surface-container-high":"#dce9ff","surface-container-highest":"#d3e4fe",';
  H += '"on-surface":"#0b1c30","on-surface-variant":"#434654",';
  H += '"outline":"#737685","outline-variant":"#c3c6d6",';
  H += '"error":"#ba1a1a","error-container":"#ffdad6",';
  H += '"inverse-surface":"#213145","inverse-on-surface":"#eaf1ff","inverse-primary":"#b3c5ff",';
  H += '"primary-fixed":"#dae1ff","primary-fixed-dim":"#b3c5ff",';
  H += '"tertiary":"#772400","tertiary-container":"#9e3300","tertiary-fixed":"#ffdbcf","tertiary-fixed-dim":"#ffb59b",';
  H += '"background":"#f8f9ff"';
  H += '},spacing:{';
  H += '"margin-desktop":"32px","sidebar-width":"260px","container-max-width":"1440px"';
  H += '},fontFamily:{';
  H += '"sans":["Inter","sans-serif"],"mono":["monospace"]';
  H += '},fontSize:{';
  H += '"body-md":["0.875rem",{lineHeight:"1.5rem"}],';
  H += '"label-md":["0.75rem",{lineHeight:"1rem",fontWeight:"500"}],';
  H += '"headline-md":["1.75rem",{lineHeight:"2.25rem"}],';
  H += '"headline-lg":["2rem",{lineHeight:"2.5rem"}]';
  H += '}}}};';
  H += '<\/script>';
  H += '<style>';
  H += '.material-symbols-outlined{font-variation-settings:"FILL" 0,"wght" 400,"GRAD" 0,"opsz" 24;display:inline-block;vertical-align:middle}';
  H += 'body{background-color:#f8f9ff}';
  H += '.toast{transition:transform .3s cubic-bezier(.175,.885,.32,1.275),opacity .2s ease;transform:translateY(20px);opacity:0}';
  H += '.toast.show{transform:translateY(0);opacity:1}';
  H += '.custom-scrollbar::-webkit-scrollbar{width:6px;height:6px}';
  H += '.custom-scrollbar::-webkit-scrollbar-track{background:transparent}';
  H += '.custom-scrollbar::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:10px}';
  H += '.glass-card{background:rgba(255,255,255,.8);backdrop-filter:blur(8px);border:1px solid rgba(226,232,240,.8)}';
  H += '#sidebar{transition:transform .25s ease}';
  H += '#sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:35}';
  H += '@media(max-width:767px){';
  H += '  main{padding-left:16px!important;padding-right:16px!important;padding-top:72px!important}';
  H += '  header{padding-left:12px!important;padding-right:12px!important}';
  H += '  header h1{font-size:1rem!important;line-height:1.4!important}';
  H += '  .stat-val{font-size:1.4rem!important}';
  H += '  .table-col-key{display:none!important}';
  H += '  .toast-wrap{right:12px!important;bottom:12px!important;left:12px!important;min-width:unset!important}';
  H += '  select,input[type=text]{font-size:16px!important}';
  H += '  .form-section{position:static!important}';
  H += '}';
  H += '@media(max-width:480px){';
  H += '  .page-title{font-size:1.5rem!important}';
  H += '  .grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))!important}';
  H += '}';
  H += '</style>';
  H += '</head>';
  H += '<body class="font-sans text-on-surface antialiased">';

  // HEADER
  H += '<header class="fixed top-0 left-0 w-full h-16 flex justify-between items-center px-4 md:px-margin-desktop z-50 bg-surface border-b border-outline-variant">';
  H += '<div class="flex items-center gap-4">';
  H += '<button class="md:hidden p-2 rounded-lg hover:bg-surface-container transition-colors" onclick="toggleSidebar()">';
  H += '<span class="material-symbols-outlined text-on-surface-variant">menu</span>';
  H += '</button>';
  H += '<h1 class="font-headline-md text-headline-md font-bold text-primary">BPS SE2026 Admin Panel</h1>';
  H += '</div>';
  H += '<div class="flex items-center gap-6">';
  H += '<span class="material-symbols-outlined text-on-surface-variant" title="Server Status">dns</span>';
  H += '<div class="relative">';
  H += '<span class="material-symbols-outlined text-on-surface-variant">notifications</span>';
  H += '<span class="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></span>';
  H += '</div>';
  H += '<div class="hidden md:flex items-center gap-3 pl-6 border-l border-outline-variant">';
  H += '<span class="text-sm font-medium text-on-surface-variant">Admin Sumberharjo</span>';
  H += '<span class="material-symbols-outlined text-primary" style="font-variation-settings:\'FILL\' 1">account_circle</span>';
  H += '</div>';
  H += '</div>';
  H += '</header>';

  // SIDEBAR OVERLAY (mobile)
  H += '<div id="sidebar-overlay" onclick="closeSidebar()"></div>';

  // SIDEBAR
  H += '<aside id="sidebar" class="fixed left-0 top-0 h-full w-[260px] flex flex-col z-40 bg-surface-container border-r border-outline-variant -translate-x-full md:translate-x-0">';

  // Sidebar header — hanya judul + tombol close mobile
  H += '<div class="flex items-center justify-between px-5 h-16 border-b border-outline-variant flex-shrink-0">';
  H += '<span class="text-sm font-bold text-primary">BPS SE2026</span>';
  H += '<button class="md:hidden p-1.5 rounded-lg hover:bg-surface-container-low" onclick="closeSidebar()">';
  H += '<span class="material-symbols-outlined text-on-surface-variant" style="font-size:20px">close</span></button>';
  H += '</div>';

  // Nav — hanya Beranda & Kunci Akses
  H += '<nav class="flex-1 px-3 pt-4 space-y-1">';
  H += '<a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors">';
  H += '<span class="material-symbols-outlined text-[20px]">home</span>';
  H += '<span class="text-sm font-medium">Beranda</span></a>';
  H += '<a href="#" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary border-l-4 border-primary">';
  H += '<span class="material-symbols-outlined text-[20px]" style="font-variation-settings:\'FILL\' 1">vpn_key</span>';
  H += '<span class="text-sm font-semibold">Kunci Akses</span></a>';
  H += '</nav>';
  H += '<div class="mx-3 p-4 rounded-xl bg-surface-container-low border border-outline-variant">';
  H += '<div class="flex items-center gap-2 mb-1">';
  H += '<span class="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"></span>';
  H += '<p class="text-xs font-semibold text-on-surface">Status Server</p></div>';
  H += '<p class="text-xs text-on-surface-variant">Redis Terhubung</p>';
  H += '</div>';
  H += '</aside>';

  // MAIN
  H += '<main class="md:ml-[260px] pt-20 md:pt-24 px-4 md:px-margin-desktop pb-12 min-h-screen">';
  H += '<div class="max-w-container-max-width mx-auto">';

  // Breadcrumb
  H += '<nav class="flex items-center gap-2 text-xs text-on-surface-variant mb-4">';
  H += '<span>Admin</span>';
  H += '<span class="material-symbols-outlined text-[14px]">chevron_right</span>';
  H += '<span class="text-primary font-semibold">Kunci Akses</span>';
  H += '</nav>';

  // Page title
  H += '<div class="flex items-start justify-between mb-8 flex-wrap gap-4">';
  H += '<div>';
  H += '<h2 class="page-title text-3xl font-black text-on-surface mb-1">Manajemen Kunci Akses</h2>';
  H += '<p class="text-on-surface-variant text-sm">Kelola otentikasi petugas lapangan untuk Sensus Ekonomi 2026.</p>';
  H += '</div>';
  H += '<div class="flex gap-3">';
  H += '<button onclick="location.reload()" class="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors text-sm font-medium">';
  H += '<span class="material-symbols-outlined text-[18px]">refresh</span><span>Refresh</span></button>';
  H += '<button onclick="document.getElementById(\'mintBtn\').click()" class="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-colors text-sm font-bold shadow-md">';
  H += '<span class="material-symbols-outlined text-[18px]">add</span><span>Kunci Baru</span></button>';
  H += '</div>';
  H += '</div>';

  // Stats cards
  H += '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">';

  H += '<div class="glass-card rounded-2xl p-5 border-t-4 border-primary">';
  H += '<div class="flex items-center justify-between mb-3">';
  H += '<span class="material-symbols-outlined text-primary" style="font-size:28px">key</span>';
  H += '<span class="stat-val text-3xl font-black text-primary">' + totalKeys + '</span>';
  H += '</div>';
  H += '<p class="text-sm font-medium text-on-surface-variant">Total Kunci</p>';
  H += '</div>';

  H += '<div class="glass-card rounded-2xl p-5 border-t-4 border-secondary">';
  H += '<div class="flex items-center justify-between mb-3">';
  H += '<span class="material-symbols-outlined text-secondary" style="font-size:28px">key_off</span>';
  H += '<span class="stat-val text-3xl font-black text-secondary">' + activeKeys + '</span>';
  H += '</div>';
  H += '<p class="text-sm font-medium text-on-surface-variant">Kunci Tersedia</p>';
  H += '</div>';

  H += '<div class="glass-card rounded-2xl p-5 border-t-4 border-tertiary-container">';
  H += '<div class="flex items-center justify-between mb-3">';
  H += '<span class="material-symbols-outlined text-tertiary" style="font-size:28px">map</span>';
  H += '<span class="stat-val text-3xl font-black text-tertiary">' + lapanganKeys + '</span>';
  H += '</div>';
  H += '<p class="text-sm font-medium text-on-surface-variant">Kunci Lapangan</p>';
  H += '</div>';

  H += '<div class="glass-card rounded-2xl p-5 border-t-4 border-error">';
  H += '<div class="flex items-center justify-between mb-3">';
  H += '<span class="material-symbols-outlined text-error" style="font-size:28px">calculate</span>';
  H += '<span class="stat-val text-3xl font-black text-error">' + kalkulatorKeys + '</span>';
  H += '</div>';
  H += '<p class="text-sm font-medium text-on-surface-variant">Kunci Kalkulator</p>';
  H += '</div>';

  H += '</div>';

  // Content grid: form + table
  H += '<div class="grid grid-cols-1 md:grid-cols-3 gap-6">';

  // LEFT: Form
  H += '<div class="md:col-span-1">';
  H += '<div class="form-section glass-card rounded-2xl p-6 md:sticky md:top-24">';
  H += '<h3 class="font-bold text-on-surface text-base mb-5 flex items-center gap-2">';
  H += '<span class="material-symbols-outlined text-primary text-[20px]">add_circle</span>';
  H += 'Buat Kunci Baru</h3>';

  H += '<div class="space-y-4">';
  H += '<div>';
  H += '<label class="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">Nama / Catatan Petugas</label>';
  H += '<input id="noteIn" type="text" placeholder="cth: Ahmad Fauzi - PCL-01"';
  H += ' class="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm';
  H += ' focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />';
  H += '</div>';

  H += '<div>';
  H += '<label class="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">Tipe Kunci</label>';
  H += '<select id="typeIn" class="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm';
  H += ' focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all">';
  H += '<option value="lapangan">Lapangan (Data Lapangan)</option>';
  H += '<option value="kalkulator">Kalkulator (BPS Kalkulator)</option>';
  H += '</select>';
  H += '</div>';

  H += '<button id="mintBtn" onclick="mint()"';
  H += ' class="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary';
  H += ' hover:bg-primary-container transition-colors font-bold text-sm shadow-md">';
  H += '<span>Generate Kunci Akses</span>';
  H += '<span class="material-symbols-outlined">arrow_forward</span>';
  H += '</button>';
  H += '</div>';

  // Result area
  H += '<div id="res" class="hidden mt-5 p-4 rounded-xl bg-green-50 border border-green-200">';
  H += '<div class="flex items-center gap-2 mb-2">';
  H += '<span id="resBadge" class="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-white bg-primary">LAPANGAN</span>';
  H += '<span class="text-xs font-semibold text-green-700">Kunci Berhasil Dibuat</span>';
  H += '</div>';
  H += '<div class="flex items-center gap-2 mb-2">';
  H += '<code id="resKey" class="text-xs text-on-surface break-all flex-1 font-mono bg-white rounded px-2 py-1 border border-green-200"></code>';
  H += '<button onclick="copyKey(document.getElementById(\'resKey\').innerText)"';
  H += ' class="flex-shrink-0 p-1.5 rounded-lg hover:bg-green-100 transition-colors">';
  H += '<span class="material-symbols-outlined text-[16px] text-primary">content_copy</span></button>';
  H += '</div>';
  H += '<p class="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1 flex items-center gap-1">';
  H += '<span class="material-symbols-outlined text-[14px]">warning</span>';
  H += 'Salin dan simpan kunci ini. Tidak akan ditampilkan ulang.</p>';
  H += '</div>';

  H += '</div>';
  H += '</div>';

  // RIGHT: Table
  H += '<div class="md:col-span-2">';
  H += '<div class="glass-card rounded-2xl overflow-hidden">';

  // Table header + filter chips
  H += '<div class="px-6 py-4 border-b border-outline-variant flex items-center justify-between flex-wrap gap-3">';
  H += '<h3 class="font-bold text-on-surface text-base flex items-center gap-2">';
  H += '<span class="material-symbols-outlined text-primary text-[20px]">list</span>';
  H += 'Daftar Kunci Terdaftar</h3>';
  H += '<div class="flex gap-2 flex-wrap">';
  H += '<button class="filter-chip px-3 py-1 rounded-full text-xs font-semibold border transition-colors border-primary bg-primary-container/10 text-primary" onclick="filterKeys(\'all\', this)">Semua</button>';
  H += '<button class="filter-chip px-3 py-1 rounded-full text-xs font-semibold border transition-colors border-outline-variant text-on-surface-variant" onclick="filterKeys(\'lapangan\', this)">Lapangan</button>';
  H += '<button class="filter-chip px-3 py-1 rounded-full text-xs font-semibold border transition-colors border-outline-variant text-on-surface-variant" onclick="filterKeys(\'kalkulator\', this)">Kalkulator</button>';
  H += '</div>';
  H += '</div>';

  // Table
  H += '<div class="overflow-x-auto custom-scrollbar">';
  H += '<table class="w-full">';
  H += '<thead class="bg-surface-container-low">';
  H += '<tr>';
  H += '<th class="px-8 py-3 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Identitas / Catatan</th>';
  H += '<th class="px-6 py-3 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tipe</th>';
  H += '<th class="table-col-key px-6 py-3 text-left text-xs font-bold text-on-surface-variant uppercase tracking-wider">Kunci Akses</th>';
  H += '<th class="px-6 py-3 text-right text-xs font-bold text-on-surface-variant uppercase tracking-wider">Aksi</th>';
  H += '</tr>';
  H += '</thead>';
  H += '<tbody id="keyList" class="divide-y divide-outline-variant">';
  H += tableRows;
  H += '</tbody>';
  H += '</table>';
  H += '</div>';

  // Table footer
  H += '<div class="px-6 py-3 border-t border-outline-variant flex items-center justify-between text-xs text-on-surface-variant bg-surface-container-lowest">';
  H += '<span>Menampilkan ' + totalKeys + ' dari ' + totalKeys + ' kunci</span>';
  H += '<button onclick="location.reload()" class="flex items-center gap-1 hover:text-primary transition-colors">';
  H += '<span class="material-symbols-outlined text-[14px]">refresh</span><span>Refresh</span></button>';
  H += '</div>';

  H += '</div>';
  H += '</div>';

  H += '</div>';
  H += '</div>';
  H += '</main>';

  // FOOTER
  H += '<footer class="w-full py-6 px-4 md:px-margin-desktop flex flex-col md:flex-row justify-between items-center bg-surface-container-lowest md:ml-[260px] md:max-w-[calc(100%-260px)] border-t border-outline-variant gap-4">';
  H += '<p class="text-xs text-on-surface-variant">&copy; 2024 Badan Pusat Statistik &mdash; SE2026 Sumberharjo</p>';
  H += '<div class="flex items-center gap-4 text-xs text-on-surface-variant">';
  H += '<a href="#" class="hover:text-primary transition-colors">Panduan Pengguna</a>';
  H += '<span class="text-outline-variant">|</span>';
  H += '<a href="#" class="hover:text-primary transition-colors">Kebijakan Privasi</a>';
  H += '<span class="text-outline-variant">|</span>';
  H += '<a href="#" class="hover:text-primary transition-colors">Hubungi IT</a>';
  H += '</div>';
  H += '</footer>';

  // DELETE MODAL
  H += '<div id="overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center hidden opacity-0 transition-opacity duration-300">';
  H += '<div class="bg-white rounded-3xl p-8 max-w-md w-[90%] shadow-2xl scale-95 transition-transform duration-300">';
  H += '<div class="flex flex-col items-center text-center">';
  H += '<div class="w-16 h-16 rounded-full bg-error-container flex items-center justify-center mb-4">';
  H += '<span class="material-symbols-outlined text-error" style="font-size:32px">warning</span>';
  H += '</div>';
  H += '<h3 class="text-xl font-black text-on-surface mb-2">Hapus Kunci Akses?</h3>';
  H += '<p class="text-sm text-on-surface-variant mb-6">Tindakan ini tidak dapat dibatalkan. Petugas yang menggunakan kunci ini tidak akan bisa masuk setelah dihapus.</p>';
  H += '<div class="flex gap-3 w-full">';
  H += '<button onclick="closeModal()" class="flex-1 px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors font-semibold text-sm">Batal</button>';
  H += '<button id="confirmDeleteBtn" class="flex-1 px-5 py-2.5 rounded-xl bg-error text-white hover:opacity-90 transition-opacity font-bold text-sm">Ya, Hapus</button>';
  H += '</div>';
  H += '</div>';
  H += '</div>';
  H += '</div>';

  // TOASTS
  H += '<div class="toast-wrap fixed bottom-8 right-8 z-[110] flex flex-col gap-3">';
  H += '<div id="t-ok" class="toast flex items-start gap-3 bg-white rounded-2xl shadow-xl border-l-4 border-green-500 px-5 py-4 min-w-[280px]">';
  H += '<span class="material-symbols-outlined text-green-500 flex-shrink-0" style="font-variation-settings:\'FILL\' 1">check_circle</span>';
  H += '<div><p class="font-bold text-sm text-on-surface">Berhasil</p>';
  H += '<p id="t-ok-msg" class="text-xs text-on-surface-variant mt-0.5"></p></div>';
  H += '</div>';
  H += '<div id="t-err" class="toast flex items-start gap-3 bg-white rounded-2xl shadow-xl border-l-4 border-error px-5 py-4 min-w-[280px]">';
  H += '<span class="material-symbols-outlined text-error flex-shrink-0" style="font-variation-settings:\'FILL\' 1">error</span>';
  H += '<div><p class="font-bold text-sm text-on-surface">Gagal</p>';
  H += '<p id="t-err-msg" class="text-xs text-on-surface-variant mt-0.5"></p></div>';
  H += '</div>';
  H += '<div id="t-info" class="toast flex items-start gap-3 bg-white rounded-2xl shadow-xl border-l-4 border-primary px-5 py-4 min-w-[280px]">';
  H += '<span class="material-symbols-outlined text-primary flex-shrink-0" style="font-variation-settings:\'FILL\' 1">info</span>';
  H += '<div><p class="font-bold text-sm text-on-surface">Informasi</p>';
  H += '<p id="t-info-msg" class="text-xs text-on-surface-variant mt-0.5"></p></div>';
  H += '</div>';
  H += '</div>';

  // JAVASCRIPT
  H += '<script>';
  H += 'var SECRET = new URLSearchParams(window.location.search).get(\'secret\') || \'\';';
  H += 'var currentDeleteKey = \'\', currentDeleteBtn = null;';

  H += 'function toggleSidebar() {';
  H += '  var sb = document.getElementById(\'sidebar\');';
  H += '  var ov = document.getElementById(\'sidebar-overlay\');';
  H += '  sb.classList.toggle(\'-translate-x-full\');';
  H += '  ov.style.display = sb.classList.contains(\'-translate-x-full\') ? \'none\' : \'block\';';
  H += '}';
  H += 'function closeSidebar() {';
  H += '  document.getElementById(\'sidebar\').classList.add(\'-translate-x-full\');';
  H += '  document.getElementById(\'sidebar-overlay\').style.display = \'none\';';
  H += '}';

  H += 'async function mint() {';
  H += '  var note = document.getElementById(\'noteIn\').value.trim();';
  H += '  var type = document.getElementById(\'typeIn\').value;';
  H += '  var btn = document.getElementById(\'mintBtn\');';
  H += '  if (!note) { showToast(\'err\', \'Mohon isi nama atau catatan petugas.\'); return; }';
  H += '  btn.disabled = true;';
  H += '  btn.innerHTML = \'<span class="material-symbols-outlined">sync<\\/span> Memproses...\';';
  H += '  try {';
  H += '    var r = await fetch(\'/api/admin?secret=\' + encodeURIComponent(SECRET) + \'&action=mint\',';
  H += '      { method: \'POST\', headers: {\'Content-Type\':\'application/json\'}, body: JSON.stringify({note:note,type:type}) });';
  H += '    var d = await r.json();';
  H += '    if (d.success) {';
  H += '      document.getElementById(\'resKey\').innerText = d.key;';
  H += '      var badge = document.getElementById(\'resBadge\');';
  H += '      badge.innerText = type.toUpperCase();';
  H += '      badge.className = \'px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider text-white \' +';
  H += '        (type === \'lapangan\' ? \'bg-primary\' : \'bg-secondary\');';
  H += '      document.getElementById(\'res\').classList.remove(\'hidden\');';
  H += '      document.getElementById(\'noteIn\').value = \'\';';
  H += '      var list = document.getElementById(\'keyList\');';
  H += '      var emptyTd = list.querySelector(\'td[colspan]\');';
  H += '      if (emptyTd) emptyTd.closest(\'tr\').remove();';
  H += '      var sk = d.key.length > 20 ? d.key.substring(0,8) + \'...\' + d.key.slice(-6) : d.key;';
  H += '      var safe = d.key.replace(/\\\\/g,\'\\\\\\\\\').replace(/\'/g,"\\\\\'");';
  H += '      var tb = type===\'lapangan\' ? \'<span class="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase">Lapangan<\\/span>\'';
  H += '             : \'<span class="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[11px] font-bold uppercase">Kalkulator<\\/span>\';';
  H += '      var row = document.createElement(\'tr\');';
  H += '      row.id = \'row-\' + d.key;';
  H += '      row.className = \'group hover:bg-surface-container-low transition-colors\';';
  H += '      row.innerHTML = \'<td class="px-8 py-5"><p class="font-bold text-on-surface">\' + note + \'<\\/p><p class="text-xs text-on-surface-variant">Baru dibuat<\\/p><\\/td>\'';
  H += '        + \'<td class="px-6 py-5">\' + tb + \'<\\/td>\'';
  H += '        + \'<td class="table-col-key px-6 py-5"><div class="flex items-center gap-2"><code class="text-on-surface-variant text-sm">\' + sk + \'<\\/code>\'';
  H += '        + \'<button class="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 rounded transition-all" onclick="copyKey(\\\'\' + safe + \'\\\')">\'';
  H += '        + \'<span class="material-symbols-outlined text-[16px] text-primary">content_copy<\\/span><\\/button><\\/div><\\/td>\'';
  H += '        + \'<td class="px-6 py-5 text-right"><button class="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all" onclick="askDelete(\\\'\' + safe + \'\\\', this)">\'';
  H += '        + \'<span class="material-symbols-outlined">delete<\\/span><\\/button><\\/td>\';';
  H += '      list.insertBefore(row, list.firstChild);';
  H += '      showToast(\'ok\', \'Kunci akses baru berhasil dibuat.\');';
  H += '    } else { showToast(\'err\', d.message || \'Gagal.\'); }';
  H += '  } catch(e) { showToast(\'err\', \'Error: \' + e.message); }';
  H += '  btn.disabled = false;';
  H += '  btn.innerHTML = \'<span>Generate Kunci Akses<\\/span><span class="material-symbols-outlined">arrow_forward<\\/span>\';';
  H += '}';

  H += 'function copyKey(k) { navigator.clipboard.writeText(k).then(function(){ showToast(\'info\',\'Kunci disalin ke papan klip.\'); }); }';

  H += 'function askDelete(key, btn) {';
  H += '  currentDeleteKey = key; currentDeleteBtn = btn;';
  H += '  var ov = document.getElementById(\'overlay\');';
  H += '  ov.classList.remove(\'hidden\');';
  H += '  setTimeout(function(){ ov.classList.add(\'opacity-100\'); ov.querySelector(\'div\').classList.remove(\'scale-95\'); }, 10);';
  H += '  document.getElementById(\'confirmDeleteBtn\').onclick = doDelete;';
  H += '}';

  H += 'function closeModal() {';
  H += '  var ov = document.getElementById(\'overlay\');';
  H += '  ov.classList.remove(\'opacity-100\');';
  H += '  ov.querySelector(\'div\').classList.add(\'scale-95\');';
  H += '  setTimeout(function(){ ov.classList.add(\'hidden\'); }, 300);';
  H += '}';

  H += 'async function doDelete() {';
  H += '  var key = currentDeleteKey;';
  H += '  closeModal();';
  H += '  try {';
  H += '    var r = await fetch(\'/api/admin?secret=\' + encodeURIComponent(SECRET) + \'&action=delete\',';
  H += '      { method:\'POST\', headers:{\'Content-Type\':\'application/json\'}, body:JSON.stringify({key:key}) });';
  H += '    var d = await r.json();';
  H += '    if (d.success) {';
  H += '      var row = document.getElementById(\'row-\' + key);';
  H += '      if (row) { row.style.opacity=\'0.3\'; setTimeout(function(){ row.remove(); }, 300); }';
  H += '      showToast(\'ok\', \'Kunci akses berhasil dihapus.\');';
  H += '    } else { showToast(\'err\', d.message || \'Gagal.\'); }';
  H += '  } catch(e) { showToast(\'err\',\'Error: \'+e.message); }';
  H += '}';

  H += 'function filterKeys(type, el) {';
  H += '  document.querySelectorAll(\'.filter-chip\').forEach(function(c){';
  H += '    c.classList.remove(\'border-primary\',\'bg-primary-container/10\',\'text-primary\');';
  H += '    c.classList.add(\'border-outline-variant\',\'text-on-surface-variant\');';
  H += '  });';
  H += '  el.classList.add(\'border-primary\',\'bg-primary-container/10\',\'text-primary\');';
  H += '  el.classList.remove(\'border-outline-variant\',\'text-on-surface-variant\');';
  H += '  document.querySelectorAll(\'#keyList tr\').forEach(function(row){';
  H += '    var cell = row.querySelector(\'td:nth-child(2) span\');';
  H += '    if (!cell) return;';
  H += '    row.style.display = (type===\'all\' || cell.innerText.toLowerCase().trim()===type) ? \'\' : \'none\';';
  H += '  });';
  H += '}';

  H += 'function showToast(type, msg) {';
  H += '  var el = document.getElementById(\'t-\'+type);';
  H += '  document.getElementById(\'t-\'+type+\'-msg\').innerText = msg;';
  H += '  el.classList.add(\'show\');';
  H += '  setTimeout(function(){ el.classList.remove(\'show\'); }, 3000);';
  H += '}';

  H += 'window.addEventListener(\'resize\', function(){';
  H += '  var sb = document.getElementById(\'sidebar\');';
  H += '  var ov = document.getElementById(\'sidebar-overlay\');';
  H += '  if(window.innerWidth>=768){ sb.classList.remove(\'-translate-x-full\'); ov.style.display=\'none\'; }';
  H += '  else { sb.classList.add(\'-translate-x-full\'); ov.style.display=\'none\'; }';
  H += '});';

  H += '<\/script>';
  H += '</body>';
  H += '</html>';
  return H;
}
