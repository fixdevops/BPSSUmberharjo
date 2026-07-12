// ─── server.js — Backend API Verifikasi Kunci Akses BPS SE2026 ───────────────
// Jalankan: node server.js
// Endpoint:
//   POST /verify          { key: "UUID" }
//   POST /check-key       { key: "UUID" }
//   GET  /admin?secret=xx → halaman admin HTML
//   POST /admin?action=mint&secret=xx → buat kunci baru
//   POST /admin?action=delete&secret=xx → hapus kunci
//
// Persyaratan:
//   npm install express axios uuid
//
// File keys.json harus ada di direktori yang sama

const express = require("express");
const fs      = require("fs");
const path    = require("path");
const axios   = require("axios");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

// ── Konfigurasi ───────────────────────────────────────────────────────────────
const PORT         = process.env.PORT         || 3000;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "bpsadmin2026";  // ganti sesuai kebutuhan
const WEBHOOK_URL  = process.env.WEBHOOK_URL  || "https://discord.com/api/webhooks/1523956108920619048/Pv-0RcVaoH6qqX8Spy-bNkcpxSM_Ozm-YwCYeOyCPTOodM1y_i34Al7hQ6ojYlFiZO_S";
const KEYS_FILE    = path.join(__dirname, "keys.json");

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ── Helper: baca/tulis keys.json ──────────────────────────────────────────────
function readKeys() {
  if (!fs.existsSync(KEYS_FILE)) fs.writeFileSync(KEYS_FILE, "[]", "utf8");
  return JSON.parse(fs.readFileSync(KEYS_FILE, "utf8"));
}
function writeKeys(data) {
  fs.writeFileSync(KEYS_FILE, JSON.stringify(data, null, 2), "utf8");
}

// ── POST /verify ──────────────────────────────────────────────────────────────
app.post("/verify", (req, res) => {
  const { key } = req.body;
  if (!key || typeof key !== "string")
    return res.status(400).json({ status: "error", message: "Parameter 'key' wajib diisi." });

  let data;
  try { data = readKeys(); }
  catch (err) { return res.status(500).json({ status: "error", message: "Kesalahan server." }); }

  const index = data.findIndex((k) => k.key === key.trim() && k.used === false);
  if (index !== -1) {
    data[index].used     = true;
    data[index].usedAt   = new Date().toISOString();
    data[index].usedByIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    try { writeKeys(data); }
    catch (err) { return res.status(500).json({ status: "error", message: "Kesalahan server." }); }

    if (WEBHOOK_URL) {
      axios.post(WEBHOOK_URL, {
        content: `✅ **Kunci digunakan**\n\`${key.trim()}\`\nTipe: ${data[index].type || "app"}\nWaktu: ${new Date().toLocaleString("id-ID")}\nIP: ${data[index].usedByIP}`,
      }).catch((e) => console.warn("[webhook] Gagal:", e.message));
    }

    console.log(`[verify] ✅ ${key.trim()} (${data[index].type || "app"})`);
    return res.status(200).json({
      status:  "success",
      message: "Akses Diberikan",
      key:     key.trim(),
      type:    data[index].type || "app",
    });
  } else {
    console.log(`[verify] ❌ ${key.trim()}`);
    return res.status(403).json({ status: "error", message: "Kunci salah atau sudah terpakai." });
  }
});

// ── POST /check-key ───────────────────────────────────────────────────────────
app.post("/check-key", (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ valid: false });
  try {
    const data = readKeys();
    const found = data.find((k) => k.key === key.trim());
    if (!found) return res.status(403).json({ valid: false, message: "Kunci telah dicabut." });
    return res.status(200).json({ valid: true, type: found.type || "app" });
  } catch {
    return res.status(200).json({ valid: true }); // toleransi jika file error
  }
});

// ── GET /admin — Halaman Admin HTML ──────────────────────────────────────────
app.get("/admin", (req, res) => {
  const { secret } = req.query;
  if (secret !== ADMIN_SECRET) {
    return res.status(401).send(`
      <html><body style="font-family:sans-serif;padding:40px;background:#1a1a2e;color:#e0e0e0">
        <h2 style="color:#ff6b6b">❌ Unauthorized</h2>
        <p>Akses: <code>http://localhost:${PORT}/admin?secret=ADMIN_SECRET</code></p>
        <p style="color:#888;font-size:12px">Default secret: <code>bpsadmin2026</code> (ganti di env ADMIN_SECRET)</p>
      </body></html>
    `);
  }

  let keys = [];
  try { keys = readKeys(); } catch (_) {}
  // Urutkan terbaru dulu
  keys = keys.slice().reverse().slice(0, 50);

  const rows = keys.map((k) => `
    <tr id="row-${k.key}" style="border-bottom:1px solid #2a2a4a">
      <td style="padding:10px;font-family:monospace;font-size:11px;color:${k.used ? '#666' : '#4ade80'};word-break:break-all;max-width:240px">${k.key}</td>
      <td style="padding:10px;text-align:center">
        <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
          background:${k.used ? '#3f1f1f' : '#1a3f2f'};color:${k.used ? '#ff6b6b' : '#4ade80'}">
          ${k.used ? '🔴 Terpakai' : '🟢 Tersedia'}
        </span><br/>
        <span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;margin-top:4px;display:inline-block;
          background:${k.type === 'lapangan' ? '#1a5c3a' : '#1a3f6e'};
          color:${k.type === 'lapangan' ? '#4ade80' : '#60a5fa'}">
          ${k.type === 'lapangan' ? '📋 Lapangan' : '🔑 App'}
        </span>
      </td>
      <td style="padding:10px;font-size:12px;color:#888">${k.createdBy || '-'}</td>
      <td style="padding:10px;font-size:12px;color:#888">${k.used ? (k.usedAt?.split('T')[0] || '-') : '-'}</td>
      <td style="padding:10px">
        <div style="display:flex;gap:6px">
          ${!k.used ? `<button onclick="copyKey('${k.key}')"
            style="padding:4px 10px;background:#004ec7;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px">
            📋 Salin</button>` : ''}
          <button onclick="deleteKey('${k.key}',this)"
            style="padding:4px 10px;background:#3f1f1f;color:#fca5a5;border:1px solid #7f1d1d;border-radius:6px;cursor:pointer;font-size:11px">
            🗑️ Hapus</button>
        </div>
      </td>
    </tr>`).join("");

  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html><html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin — BPS SE2026 Lokal</title>
<style>
* { box-sizing:border-box;margin:0;padding:0 }
body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f1a;color:#e0e0e0;padding:24px }
.card { max-width:960px;margin:0 auto 16px;background:#1a1a2e;border:1px solid #2a2a4a;border-radius:16px;padding:20px }
.title { font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:16px }
.form-row { display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end }
.fg { display:flex;flex-direction:column;gap:6px;flex:1;min-width:160px }
label { font-size:12px;color:#888 }
input,select { padding:10px 14px;background:#0f0f1a;border:1px solid #2a2a4a;border-radius:8px;color:#e0e0e0;font-size:14px;outline:none }
input:focus,select:focus { border-color:#004ec7 }
.btn { padding:10px 20px;background:#004ec7;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600 }
.result { margin-top:14px;padding:14px;background:#0a1a3a;border:1px solid #1a3f6e;border-radius:10px;display:none }
.key-text { font-family:monospace;font-size:13px;color:#4ade80;word-break:break-all;margin-bottom:8px }
.copy-btn { padding:7px 14px;background:#1a5c3a;color:#4ade80;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600 }
table { width:100%;border-collapse:collapse;min-width:600px }
th { text-align:left;padding:10px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #2a2a4a }
.tbl-wrap { overflow-x:auto }
.toast { position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;
  transform:translateY(-60px);opacity:0;transition:all .3s;pointer-events:none;z-index:999 }
.toast.show { transform:translateY(0);opacity:1 }
.toast-ok { background:#1a5c3a;color:#4ade80 }
.toast-del { background:#7f1d1d;color:#fca5a5 }
h1 { font-size:20px;color:#fff;margin-bottom:4px }
.sub { font-size:13px;color:#888;margin-bottom:20px }
.badge-local { display:inline-block;padding:3px 10px;background:#92400e;color:#fde68a;border-radius:20px;font-size:11px;font-weight:700;margin-left:8px }
</style></head>
<body>
<div class="toast toast-ok" id="t-ok">✅ Disalin!</div>
<div class="toast toast-del" id="t-del">🗑️ Dihapus!</div>
<div style="max-width:960px;margin:0 auto 20px">
  <h1>🔑 Admin Kunci <span class="badge-local">LOKAL</span></h1>
  <p class="sub">BPS SE2026 Sumberharjo — Server lokal http://localhost:${PORT}</p>
</div>

<div class="card">
  <div class="title">Buat Kunci Akses Baru</div>
  <div class="form-row">
    <div class="fg"><label>Catatan</label><input id="noteIn" placeholder="contoh: petugas A" /></div>
    <div class="fg" style="max-width:220px">
      <label>Tipe Kunci</label>
      <select id="typeIn">
        <option value="app">🔑 App (Kalkulator)</option>
        <option value="lapangan">📋 Lapangan (Data Lapangan + Drive)</option>
      </select>
    </div>
    <button class="btn" id="mintBtn" onclick="mint()">+ Buat Kunci</button>
  </div>
  <div class="result" id="res">
    <p style="font-size:12px;color:#888;margin-bottom:6px">Kunci baru:</p>
    <div id="resBadge" style="margin-bottom:6px"></div>
    <div class="key-text" id="resKey"></div>
    <button class="copy-btn" onclick="copyKey(document.getElementById('resKey').textContent)">📋 Salin Kunci</button>
    <p style="font-size:11px;color:#888;margin-top:8px">⚠️ Hanya bisa dipakai 1 kali.</p>
  </div>
</div>

<div class="card">
  <div class="title">Daftar Kunci (50 Terbaru)</div>
  ${keys.length === 0
    ? '<p style="color:#888;font-size:13px;text-align:center;padding:20px">Belum ada kunci.</p>'
    : `<div class="tbl-wrap"><table>
        <thead><tr>
          <th>UUID Kunci</th><th>Status</th><th>Catatan</th><th>Tgl Pakai</th><th>Aksi</th>
        </tr></thead>
        <tbody id="tbody">${rows}</tbody>
      </table></div>`}
  <p style="font-size:11px;color:#555;text-align:right;margin-top:10px">Refresh untuk update</p>
</div>

<script>
const SECRET = '${ADMIN_SECRET}';

async function mint() {
  const btn  = document.getElementById('mintBtn');
  const note = document.getElementById('noteIn').value || 'lokal';
  const type = document.getElementById('typeIn').value;
  btn.disabled = true; btn.textContent = 'Membuat...';
  const res  = await fetch('/admin?secret=' + encodeURIComponent(SECRET) + '&action=mint', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ note, type })
  });
  const d = await res.json();
  if (d.key) {
    document.getElementById('resKey').textContent = d.key;
    const badge = document.getElementById('resBadge');
    badge.innerHTML = '<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:'
      + (type==='lapangan'?'#1a5c3a':'#1a3f6e') + ';color:' + (type==='lapangan'?'#4ade80':'#60a5fa') + '">'
      + (type==='lapangan'?'📋 Lapangan':'🔑 App') + '</span>';
    document.getElementById('res').style.display = 'block';
    document.getElementById('noteIn').value = '';
  }
  btn.disabled = false; btn.textContent = '+ Buat Kunci';
}

function copyKey(k) { navigator.clipboard.writeText(k).then(()=>toast('ok')); }

async function deleteKey(key, btn) {
  if (!confirm('Hapus kunci ini?\\n' + key)) return;
  btn.disabled = true; btn.textContent = '...';
  const res = await fetch('/admin?secret=' + encodeURIComponent(SECRET) + '&action=delete', {
    method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({key})
  });
  const d = await res.json();
  if (d.success) {
    const row = document.getElementById('row-'+key);
    if (row) { row.style.opacity='.3'; setTimeout(()=>row.remove(),400); }
    toast('del');
  } else { alert(d.message||'Gagal'); btn.disabled=false; btn.textContent='🗑️ Hapus'; }
}

function toast(t) {
  const el = document.getElementById('t-'+t);
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 2500);
}
</script>
</body></html>`);
});

// ── POST /admin?action=mint ───────────────────────────────────────────────────
app.post("/admin", (req, res) => {
  const { secret, action } = req.query;
  if (secret !== ADMIN_SECRET) return res.status(401).json({ success: false, message: "Unauthorized" });

  if (action === "mint") {
    const { note, type } = req.body || {};
    const newKey = uuidv4();
    let data = [];
    try { data = readKeys(); } catch (_) {}
    data.push({
      key:       newKey,
      used:      false,
      createdAt: new Date().toISOString(),
      createdBy: note || "admin-lokal",
      type:      type || "app",
    });
    writeKeys(data);
    console.log(`[admin] ✅ Kunci baru (${type||"app"}): ${newKey}`);
    return res.status(200).json({ success: true, key: newKey, type: type || "app" });
  }

  if (action === "delete") {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ success: false, message: "key wajib diisi." });
    let data = [];
    try { data = readKeys(); } catch (_) {}
    const before = data.length;
    data = data.filter((k) => k.key !== key.trim());
    if (data.length === before) return res.status(404).json({ success: false, message: "Kunci tidak ditemukan." });
    writeKeys(data);
    console.log(`[admin] 🗑️ Kunci dihapus: ${key.trim()}`);
    return res.status(200).json({ success: true });
  }

  return res.status(400).json({ success: false, message: "Action tidak dikenal." });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[server] ✅ Berjalan di http://localhost:${PORT}`);
  console.log(`[server] 🔑 Admin panel: http://localhost:${PORT}/admin?secret=${ADMIN_SECRET}`);
  console.log(`[server] 📁 File kunci:  ${KEYS_FILE}\n`);
});
