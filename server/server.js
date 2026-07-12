// ─── server.js — Backend API + Admin Panel BPS SE2026 ────────────────────────
const express = require("express");
const fs      = require("fs");
const path    = require("path");
const axios   = require("axios");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const PORT         = process.env.PORT         || 3000;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "bpsadmin2026";
const WEBHOOK_URL  = process.env.WEBHOOK_URL  || "https://discord.com/api/webhooks/1523956108920619048/Pv-0RcVaoH6qqX8Spy-bNkcpxSM_Ozm-YwCYeOyCPTOodM1y_i34Al7hQ6ojYlFiZO_S";
const KEYS_FILE    = path.join(__dirname, "keys.json");

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

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
  try { data = readKeys(); } catch (_) { return res.status(500).json({ status: "error", message: "Kesalahan server." }); }
  const index = data.findIndex((k) => k.key === key.trim() && k.used === false);
  if (index !== -1) {
    data[index].used     = true;
    data[index].usedAt   = new Date().toISOString();
    data[index].usedByIP = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    try { writeKeys(data); } catch (_) { return res.status(500).json({ status: "error", message: "Kesalahan server." }); }
    if (WEBHOOK_URL) {
      axios.post(WEBHOOK_URL, { content: `✅ **Kunci digunakan**\n\`${key.trim()}\`\nTipe: ${data[index].type||"app"}\nWaktu: ${new Date().toLocaleString("id-ID")}\nIP: ${data[index].usedByIP}` })
        .catch((e) => console.warn("[webhook] Gagal:", e.message));
    }
    return res.status(200).json({ status: "success", message: "Akses Diberikan", key: key.trim(), type: data[index].type || "app" });
  }
  return res.status(403).json({ status: "error", message: "Kunci salah atau sudah terpakai." });
});

// ── POST /check-key ───────────────────────────────────────────────────────────
app.post("/check-key", (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ valid: false });
  try {
    const data  = readKeys();
    const found = data.find((k) => k.key === key.trim());
    if (!found) return res.status(403).json({ valid: false, message: "Kunci telah dicabut." });
    return res.status(200).json({ valid: true, type: found.type || "app" });
  } catch (_) { return res.status(200).json({ valid: true }); }
});

// ── Helper: bangun HTML admin ─────────────────────────────────────────────────
function buildAdminHTML(port, keys) {
  const total    = keys.length;
  const avail    = keys.filter(k => !k.used).length;
  const used_cnt = keys.filter(k => k.used).length;
  const lapangan = keys.filter(k => k.type === "lapangan").length;

  const rows = keys.map((k, i) => {
    const bg  = i % 2 === 0 ? "#ffffff" : "#f8faff";
    const tgl = k.createdAt ? new Date(k.createdAt).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"2-digit" }) : "-";
    const tglP = k.usedAt   ? new Date(k.usedAt).toLocaleDateString("id-ID",   { day:"2-digit", month:"short", year:"2-digit" }) : "-";
    return [
      `<tr id="row-${k.key}" style="background:${bg};border-bottom:1px solid #e2e8f0;transition:opacity .4s">`,
      `<td style="padding:12px 14px;font-family:monospace;font-size:12px;color:${k.used?"#94a3b8":"#0f172a"};word-break:break-all;max-width:220px">${k.key}<br><span style="font-size:10px;color:#94a3b8">${tgl}</span></td>`,
      `<td style="padding:12px 14px;white-space:nowrap">`,
      `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:${k.used?"#fee2e2":"#dcfce7"};color:${k.used?"#dc2626":"#16a34a"}">${k.used?"● Terpakai":"● Tersedia"}</span><br>`,
      `<span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:${k.type==="lapangan"?"#e0f2fe":"#eef2ff"};color:${k.type==="lapangan"?"#0284c7":"#004ec7"}">${k.type==="lapangan"?"🗺 Lapangan":"🔑 App"}</span></td>`,
      `<td style="padding:12px 14px;font-size:12px;color:#475569">${k.createdBy||"-"}</td>`,
      `<td style="padding:12px 14px;font-size:12px;color:#94a3b8">${tglP}</td>`,
      `<td style="padding:12px 14px;white-space:nowrap"><div style="display:flex;gap:6px">`,
      !k.used ? `<button onclick="copyKey('${k.key}')" style="padding:5px 12px;background:#eef2ff;color:#004ec7;border:1px solid #c7d7f9;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700">📋 Salin</button>` : "",
      `<button onclick="askDelete('${k.key}',this)" style="padding:5px 12px;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700">🗑️ Hapus</button>`,
      `</div></td></tr>`
    ].join("");
  }).join("");

  const tableHTML = keys.length === 0
    ? `<div style="padding:48px;text-align:center;color:#94a3b8"><div style="font-size:36px;margin-bottom:12px">📭</div>Belum ada kunci yang diterbitkan.</div>`
    : `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;min-width:640px">
        <thead><tr style="background:#eef2ff;border-bottom:2px solid #c7d7f9">
          <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#004ec7;text-transform:uppercase;letter-spacing:.5px;text-align:left">UUID Kunci</th>
          <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#004ec7;text-transform:uppercase;letter-spacing:.5px;text-align:left">Status &amp; Tipe</th>
          <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#004ec7;text-transform:uppercase;letter-spacing:.5px;text-align:left">Catatan</th>
          <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#004ec7;text-transform:uppercase;letter-spacing:.5px;text-align:left">Tgl Pakai</th>
          <th style="padding:10px 14px;font-size:11px;font-weight:700;color:#004ec7;text-transform:uppercase;letter-spacing:.5px;text-align:left">Aksi</th>
        </tr></thead>
        <tbody id="tbody">${rows}</tbody>
      </table></div>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Panel — BPS SE2026</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4ff;min-height:100vh}
.topbar{background:#004ec7;padding:0 28px;height:60px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 12px rgba(0,78,199,.3)}
.topbar-brand{display:flex;align-items:center;gap:12px}
.logo-box{width:34px;height:34px;background:rgba(255,255,255,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px}
.wrap{max-width:1000px;margin:0 auto;padding:28px 20px 60px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:24px}
.stat{background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:18px;box-shadow:0 2px 8px rgba(0,78,199,.05)}
.stat-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:10px}
.stat-val{font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-.5px}
.stat-lbl{font-size:12px;font-weight:600;color:#64748b;margin-top:2px}
.card{background:#fff;border-radius:20px;border:1px solid #e2e8f0;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,78,199,.05);overflow:hidden}
.card-head{padding:20px 24px 16px;display:flex;align-items:flex-end;justify-content:space-between;border-bottom:1px solid #e2e8f0}
.card-title{font-size:15px;font-weight:800;color:#0f172a}
.card-sub{font-size:12px;color:#64748b;margin-top:2px}
.card-body{padding:20px 24px 24px}
.form-row{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end}
.fg{display:flex;flex-direction:column;gap:6px;flex:1;min-width:180px}
.fg label{font-size:12px;font-weight:600;color:#475569;text-transform:uppercase;letter-spacing:.4px}
input[type=text],select{width:100%;padding:11px 14px;background:#f8faff;border:1.5px solid #e2e8f0;border-radius:10px;color:#0f172a;font-size:14px;outline:none;transition:border-color .2s}
input[type=text]:focus,select:focus{border-color:#004ec7;background:#fff}
.btn-primary{padding:11px 24px;background:#004ec7;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:700;white-space:nowrap;box-shadow:0 4px 12px rgba(0,78,199,.25)}
.btn-primary:hover{opacity:.88}.btn-primary:disabled{opacity:.5;cursor:not-allowed}
.btn-refresh{padding:7px 14px;background:#eef2ff;color:#004ec7;border:1px solid #c7d7f9;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700}
.res-box{display:none;margin-top:18px;padding:18px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:14px}
.res-key{font-family:monospace;font-size:13px;color:#0f172a;font-weight:700;word-break:break-all;padding:12px;background:#fff;border-radius:10px;border:1px solid #e2e8f0;margin:10px 0}
.btn-copy-key{padding:8px 18px;background:#16a34a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700}
.filters{display:flex;gap:8px;flex-wrap:wrap;padding:16px 24px}
.pill{padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid #e2e8f0;background:#fff;color:#475569;transition:all .15s}
.pill.active{background:#004ec7;border-color:#004ec7;color:#fff}
.pill:hover:not(.active){background:#f0f4ff;border-color:#c7d7f9;color:#004ec7}
tbody tr:hover{background:#f0f4ff!important}
.toast{position:fixed;top:20px;right:20px;padding:13px 20px;border-radius:12px;font-size:13px;font-weight:700;transform:translateY(-70px);opacity:0;transition:all .3s;pointer-events:none;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.12)}
.toast.show{transform:translateY(0);opacity:1}
.t-ok{background:#fff;border:1.5px solid #86efac;color:#16a34a}
.t-err{background:#fff;border:1.5px solid #fca5a5;color:#dc2626}
.t-info{background:#fff;border:1.5px solid #c7d7f9;color:#004ec7}
.overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);display:none;align-items:center;justify-content:center;padding:24px;z-index:100;backdrop-filter:blur(4px)}
.overlay.show{display:flex}
.confirm-box{background:#fff;border-radius:20px;padding:32px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.15)}
.confirm-btns{display:flex;gap:10px;margin-top:20px}
.btn-cancel{flex:1;padding:11px;background:#f1f5f9;color:#475569;border:none;border-radius:10px;cursor:pointer;font-weight:600;font-size:14px}
.btn-danger{flex:1;padding:11px;background:#dc2626;color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(220,38,38,.25)}
.footer{text-align:center;font-size:11px;color:#94a3b8;padding:24px}
</style>
</head>
<body>

<div class="toast t-ok"  id="t-ok"></div>
<div class="toast t-err" id="t-err"></div>
<div class="toast t-info" id="t-info"></div>

<div class="overlay" id="overlay">
  <div class="confirm-box">
    <div style="width:56px;height:56px;background:#fee2e2;border-radius:20px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:24px">🗑️</div>
    <h3 style="font-size:16px;color:#0f172a;margin-bottom:6px">Hapus Kunci?</h3>
    <p style="font-size:13px;color:#64748b;line-height:1.6">Pengguna yang memakai kunci ini akan <strong style="color:#dc2626">dipaksa login ulang</strong>.</p>
    <div id="confirmKey" style="font-family:monospace;font-size:11px;color:#dc2626;background:#fee2e2;padding:10px;border-radius:8px;word-break:break-all;margin:12px 0"></div>
    <div class="confirm-btns">
      <button class="btn-cancel" onclick="closeOverlay()">Batal</button>
      <button class="btn-danger" id="btnConfirm">Ya, Hapus</button>
    </div>
  </div>
</div>

<div class="topbar">
  <div class="topbar-brand">
    <div class="logo-box">🛡️</div>
    <div>
      <div style="font-size:16px;font-weight:800;color:#fff">Admin Panel</div>
      <div style="font-size:11px;color:rgba(255,255,255,.7)">BPS SE2026 Sumberharjo — Manajemen Kunci Akses</div>
    </div>
  </div>
  <span style="padding:4px 12px;background:rgba(255,255,255,.15);border-radius:20px;font-size:11px;font-weight:700;color:#fff;border:1px solid rgba(255,255,255,.25)">🟢 Lokal :${port}</span>
</div>

<div class="wrap">
  <div class="stats">
    <div class="stat"><div class="stat-icon" style="background:#eef2ff">🔑</div><div class="stat-val">${total}</div><div class="stat-lbl">Total Kunci</div></div>
    <div class="stat"><div class="stat-icon" style="background:#dcfce7">✅</div><div class="stat-val" style="color:#16a34a">${avail}</div><div class="stat-lbl">Tersedia</div></div>
    <div class="stat"><div class="stat-icon" style="background:#fee2e2">📱</div><div class="stat-val" style="color:#dc2626">${used_cnt}</div><div class="stat-lbl">Terpakai</div></div>
    <div class="stat"><div class="stat-icon" style="background:#e0f2fe">🗺️</div><div class="stat-val" style="color:#0284c7">${lapangan}</div><div class="stat-lbl">Lapangan</div></div>
  </div>

  <div class="card">
    <div class="card-head"><div><div class="card-title">✨ Buat Kunci Akses Baru</div><div class="card-sub">Terbitkan kunci untuk petugas SE2026</div></div></div>
    <div class="card-body">
      <div class="form-row">
        <div class="fg"><label>Catatan (opsional)</label><input type="text" id="noteIn" placeholder="contoh: untuk petugas A, SLS 001..." /></div>
        <div class="fg" style="max-width:240px"><label>Tipe Kunci</label>
          <select id="typeIn">
            <option value="app">🔑 App — Kalkulator saja</option>
            <option value="lapangan">🗺️ Lapangan — Data + Peta + Drive</option>
          </select>
        </div>
        <button class="btn-primary" id="mintBtn" onclick="mint()">+ Buat Kunci</button>
      </div>
      <div class="res-box" id="res">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:14px">🎉</span>
          <strong style="color:#16a34a;font-size:13px">Kunci baru berhasil dibuat!</strong>
          <span id="resBadge" style="margin-left:auto"></span>
        </div>
        <div class="res-key" id="resKey"></div>
        <div style="display:flex;gap:8px">
          <button class="btn-copy-key" onclick="copyKey(document.getElementById('resKey').textContent)">📋 Salin Kunci</button>
          <button onclick="document.getElementById('res').style.display='none'" style="padding:8px 14px;background:#f1f5f9;color:#64748b;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600">Tutup</button>
        </div>
        <p style="font-size:11px;color:#64748b;margin-top:10px">⚠️ Kunci hanya bisa digunakan <strong>1 kali</strong>. Kirimkan ke petugas yang berhak.</p>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-head">
      <div><div class="card-title">📋 Daftar Kunci</div><div class="card-sub">${total} kunci · ${avail} tersedia · ${used_cnt} terpakai</div></div>
      <button class="btn-refresh" onclick="location.reload()">🔄 Refresh</button>
    </div>
    <div class="filters">
      <span class="pill active" onclick="filterKeys('all',this)">Semua (${total})</span>
      <span class="pill" onclick="filterKeys('avail',this)">Tersedia (${avail})</span>
      <span class="pill" onclick="filterKeys('used',this)">Terpakai (${used_cnt})</span>
      <span class="pill" onclick="filterKeys('app',this)">App</span>
      <span class="pill" onclick="filterKeys('lapangan',this)">Lapangan</span>
    </div>
    ${tableHTML}
    <p style="font-size:11px;color:#cbd5e1;text-align:right;padding:12px 24px">Refresh halaman untuk memuat data terbaru</p>
  </div>
</div>
<div class="footer">BPS Kabupaten Bojonegoro · SE2026 · Admin Panel</div>

<script>
const SECRET='${ADMIN_SECRET}';
let pendingKey=null,pendingBtn=null;
async function mint(){
  const btn=document.getElementById('mintBtn'),note=document.getElementById('noteIn').value||'lokal',type=document.getElementById('typeIn').value;
  btn.disabled=true;btn.textContent='Membuat...';
  try{
    const r=await fetch('/admin?secret='+encodeURIComponent(SECRET)+'&action=mint',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({note,type})});
    const d=await r.json();
    if(d.key){
      document.getElementById('resKey').textContent=d.key;
      document.getElementById('resBadge').innerHTML='<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:'+(type==='lapangan'?'#e0f2fe':'#eef2ff')+';color:'+(type==='lapangan'?'#0284c7':'#004ec7')+'">'+(type==='lapangan'?'🗺️ Lapangan':'🔑 App')+'</span>';
      document.getElementById('res').style.display='block';
      document.getElementById('noteIn').value='';
      showToast('ok','Kunci berhasil dibuat!');
    }else{showToast('err',d.message||'Gagal membuat kunci');}
  }catch(e){showToast('err','Error: '+e.message);}
  btn.disabled=false;btn.textContent='+ Buat Kunci';
}
function copyKey(k){
  navigator.clipboard.writeText(k.trim()).then(()=>showToast('info','Kunci disalin!')).catch(()=>{const t=document.createElement('textarea');t.value=k;document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);showToast('info','Kunci disalin!');});
}
function askDelete(key,btn){pendingKey=key;pendingBtn=btn;document.getElementById('confirmKey').textContent=key;document.getElementById('overlay').classList.add('show');document.getElementById('btnConfirm').onclick=doDelete;}
function closeOverlay(){document.getElementById('overlay').classList.remove('show');pendingKey=null;pendingBtn=null;}
async function doDelete(){
  if(!pendingKey)return;
  const key=pendingKey,btn=pendingBtn;closeOverlay();
  if(btn){btn.disabled=true;btn.textContent='...';}
  try{
    const r=await fetch('/admin?secret='+encodeURIComponent(SECRET)+'&action=delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})});
    const d=await r.json();
    if(d.success){const row=document.getElementById('row-'+key);if(row){row.style.opacity='.3';setTimeout(()=>row.remove(),400);}showToast('ok','Kunci berhasil dihapus!');}
    else{showToast('err',d.message||'Gagal menghapus');if(btn){btn.disabled=false;btn.textContent='🗑️ Hapus';}}
  }catch(e){showToast('err','Error: '+e.message);if(btn){btn.disabled=false;btn.textContent='🗑️ Hapus';}}
}
function filterKeys(type,el){
  document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));el.classList.add('active');
  document.querySelectorAll('#tbody tr').forEach(row=>{
    if(type==='all'){row.style.display='';return;}
    const t=row.innerHTML;
    if(type==='avail')row.style.display=t.includes('Tersedia')?'':'none';
    else if(type==='used')row.style.display=t.includes('Terpakai')?'':'none';
    else if(type==='app')row.style.display=(t.includes('🔑 App'))?'':'none';
    else if(type==='lapangan')row.style.display=t.includes('Lapangan')?'':'none';
  });
}
let tt;function showToast(type,msg){
  ['t-ok','t-err','t-info'].forEach(id=>{const e=document.getElementById(id);e.classList.remove('show');e.textContent='';});
  const id=type==='ok'?'t-ok':type==='err'?'t-err':'t-info';
  const el=document.getElementById(id);el.textContent=(type==='ok'?'✅ ':type==='err'?'❌ ':'📋 ')+msg;el.classList.add('show');
  clearTimeout(tt);tt=setTimeout(()=>el.classList.remove('show'),3000);
}
document.getElementById('overlay').addEventListener('click',function(e){if(e.target===this)closeOverlay();});
</script>
</body></html>`;
}

// ── GET /admin ────────────────────────────────────────────────────────────────
app.get("/admin", (req, res) => {
  const { secret } = req.query;
  if (secret !== ADMIN_SECRET) {
    return res.status(401).send(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unauthorized</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;background:#f0f4ff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.c{background:#fff;border-radius:20px;border:1px solid #e2e8f0;padding:40px;max-width:380px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,78,199,.08)}
.i{width:64px;height:64px;background:#fee2e2;border-radius:20px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px}
h2{font-size:18px;color:#0f172a;margin-bottom:8px}p{font-size:13px;color:#64748b;line-height:1.6}
code{background:#f1f5f9;padding:3px 8px;border-radius:6px;font-size:12px;color:#004ec7}</style></head>
<body><div class="c"><div class="i">🔒</div><h2>Akses Ditolak</h2><p>Secret salah.<br><br>Akses: <code>/admin?secret=ADMIN_SECRET</code></p></div></body></html>`);
  }

  let keys = [];
  try { keys = readKeys(); } catch (_) {}
  keys = keys.slice().reverse().slice(0, 50);

  res.setHeader("Content-Type", "text/html");
  return res.send(buildAdminHTML(PORT, keys));
});

// ── POST /admin (mint / delete) ───────────────────────────────────────────────
app.post("/admin", (req, res) => {
  const { secret, action } = req.query;
  if (secret !== ADMIN_SECRET) return res.status(401).json({ success: false, message: "Unauthorized" });

  if (action === "mint") {
    const { note, type } = req.body || {};
    const newKey = uuidv4();
    let data = [];
    try { data = readKeys(); } catch (_) {}
    data.push({ key: newKey, used: false, createdAt: new Date().toISOString(), createdBy: note || "admin-lokal", type: type || "app" });
    writeKeys(data);
    if (WEBHOOK_URL) {
      axios.post(WEBHOOK_URL, { embeds: [{ title: "🔑 Kunci Baru (Lokal)", color: 0x004ec7, fields: [{ name: "Kunci", value: `\`${newKey}\`` }, { name: "Tipe", value: type||"app", inline: true }, { name: "Catatan", value: note||"-", inline: true }], footer: { text: "BPS SE2026 Admin Lokal" } }] }).catch(() => {});
    }
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

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[server] ✅ Berjalan di http://localhost:${PORT}`);
  console.log(`[server] 🛡️  Admin panel: http://localhost:${PORT}/admin?secret=${ADMIN_SECRET}`);
  console.log(`[server] 📁  File kunci:  ${KEYS_FILE}\n`);
});
