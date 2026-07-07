// ─── api/admin.js — Halaman Admin: Buat & Lihat Kunci ────────────────────────
// Akses: https://bps-sumberharjo.vercel.app/api/admin?secret=ADMIN_SECRET_ANDA
//
// GET  /api/admin?secret=xxx         → tampilkan halaman HTML admin
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
      <html><body style="font-family:sans-serif;padding:40px;background:#1a1a2e;color:#e0e0e0">
        <h2 style="color:#ff6b6b">❌ Unauthorized</h2>
        <p>Secret salah atau tidak dikonfigurasi.</p>
        <p style="font-size:12px;color:#888">Akses: /api/admin?secret=ADMIN_SECRET_ANDA</p>
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
    const newKey = uuidv4();
    const note   = req.body?.note || "via-admin-web";

    await redis.set(`key:${newKey}`, {
      key:       newKey,
      used:      false,
      createdAt: new Date().toISOString(),
      createdBy: note,
    });

    // Simpan ke index list
    await redis.lpush("keys:list", newKey);

    // Notifikasi Discord
    if (WEBHOOK_URL) {
      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{
            title: "🔑 Kunci Baru Diterbitkan",
            color: 0x004ec7,
            fields: [
              { name: "Kunci",      value: `\`${newKey}\``, inline: false },
              { name: "Dibuat oleh", value: note, inline: true },
              { name: "Waktu",      value: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }), inline: true },
            ],
            footer: { text: "BPS SE2026 Admin Web" },
          }],
        }),
      }).catch(() => {});
    }

    return res.status(200).json({ success: true, key: newKey });
  }

  // ── GET: Render halaman admin HTML ────────────────────────────────────────
  // Ambil 20 kunci terakhir
  let recentKeys = [];
  try {
    const keyIds = await redis.lrange("keys:list", 0, 19);
    if (keyIds.length > 0) {
      const results = await Promise.all(keyIds.map((k) => redis.get(`key:${k}`)));
      recentKeys = results.filter(Boolean);
    }
  } catch (_) {}

  const rows = recentKeys.map((k) => `
    <tr style="border-bottom:1px solid #333">
      <td style="padding:10px;font-family:monospace;font-size:12px;color:${k.used ? '#888' : '#4ade80'}">${k.key}</td>
      <td style="padding:10px;text-align:center">
        <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
          background:${k.used ? '#3f1f1f' : '#1a3f2f'};color:${k.used ? '#ff6b6b' : '#4ade80'}">
          ${k.used ? '🔴 Terpakai' : '🟢 Tersedia'}
        </span>
      </td>
      <td style="padding:10px;font-size:12px;color:#888">${k.createdBy || '-'}</td>
      <td style="padding:10px;font-size:12px;color:#888">${k.used ? (k.usedAt?.split('T')[0] || '-') : '-'}</td>
      ${!k.used ? `<td style="padding:10px">
        <button onclick="copyKey('${k.key}')"
          style="padding:4px 12px;background:#004ec7;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">
          📋 Salin
        </button>
      </td>` : '<td></td>'}
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Kunci — BPS SE2026</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #0f0f1a; color: #e0e0e0; min-height: 100vh; padding: 24px; }
    .header { max-width: 900px; margin: 0 auto 24px; display: flex; align-items: center; gap: 12px; }
    .logo { width: 48px; height: 48px; background: #1a2f6e; border-radius: 12px;
            display: flex; align-items: center; justify-content: center; font-size: 24px; }
    h1 { font-size: 20px; color: #fff; }
    .sub { font-size: 13px; color: #888; margin-top: 2px; }
    .card { max-width: 900px; margin: 0 auto 16px;
            background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 16px; padding: 20px; }
    .card-title { font-size: 13px; font-weight: 700; color: #888;
                  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .mint-form { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
    .input-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 200px; }
    label { font-size: 12px; color: #888; }
    input { padding: 10px 14px; background: #0f0f1a; border: 1px solid #2a2a4a;
            border-radius: 8px; color: #e0e0e0; font-size: 14px; outline: none; }
    input:focus { border-color: #004ec7; }
    .btn { padding: 10px 20px; background: #004ec7; color: white; border: none;
           border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
           white-space: nowrap; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.85; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .result-box { margin-top: 16px; padding: 16px; background: #0a1a3a;
                  border: 1px solid #1a3f6e; border-radius: 10px; display: none; }
    .result-key { font-family: monospace; font-size: 14px; color: #4ade80;
                  word-break: break-all; letter-spacing: 0.5px; margin-bottom: 10px; }
    .copy-btn { padding: 8px 16px; background: #1a5c3a; color: #4ade80; border: none;
                border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px; font-size: 12px; color: #888;
         text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #2a2a4a; }
    .toast { position: fixed; top: 20px; right: 20px; background: #1a5c3a;
             color: #4ade80; padding: 12px 20px; border-radius: 10px; font-size: 14px;
             font-weight: 600; transform: translateY(-60px); opacity: 0;
             transition: all 0.3s; pointer-events: none; z-index: 999; }
    .toast.show { transform: translateY(0); opacity: 1; }
  </style>
</head>
<body>
  <div class="toast" id="toast">✅ Kunci disalin!</div>

  <div class="header">
    <div class="logo">🔑</div>
    <div>
      <h1>Admin Manajemen Kunci</h1>
      <p class="sub">BPS SE2026 Sumberharjo — Sistem Autentikasi</p>
    </div>
  </div>

  <!-- Buat Kunci Baru -->
  <div class="card">
    <div class="card-title">Buat Kunci Akses Baru</div>
    <div class="mint-form">
      <div class="input-group">
        <label for="noteInput">Catatan (opsional)</label>
        <input type="text" id="noteInput" placeholder="contoh: untuk petugas A" />
      </div>
      <button class="btn" id="mintBtn" onclick="mintKey()">+ Buat Kunci</button>
    </div>
    <div class="result-box" id="resultBox">
      <p style="font-size:12px;color:#888;margin-bottom:8px">Kunci baru berhasil dibuat:</p>
      <div class="result-key" id="resultKey"></div>
      <button class="copy-btn" onclick="copyKey(document.getElementById('resultKey').textContent)">
        📋 Salin Kunci
      </button>
      <p style="font-size:11px;color:#888;margin-top:8px">⚠️ Kunci ini hanya bisa digunakan 1 kali. Kirim ke pengguna yang berhak.</p>
    </div>
  </div>

  <!-- Daftar Kunci -->
  <div class="card">
    <div class="card-title">20 Kunci Terakhir</div>
    ${recentKeys.length === 0
      ? '<p style="color:#888;font-size:13px;text-align:center;padding:20px">Belum ada kunci yang diterbitkan.</p>'
      : `<table>
          <thead>
            <tr>
              <th>UUID Kunci</th>
              <th>Status</th>
              <th>Dibuat Oleh</th>
              <th>Tgl Pakai</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`
    }
    <p style="margin-top:12px;font-size:11px;color:#555;text-align:right">
      Refresh halaman untuk update data terbaru
    </p>
  </div>

  <p style="max-width:900px;margin:0 auto;font-size:11px;color:#444;text-align:center">
    🔒 Halaman ini hanya bisa diakses dengan secret yang benar. Jangan bagikan URL ini.
  </p>

  <script>
    const SECRET = new URLSearchParams(window.location.search).get('secret') || '';

    async function mintKey() {
      const btn  = document.getElementById('mintBtn');
      const note = document.getElementById('noteInput').value || 'via-admin-web';
      btn.disabled = true;
      btn.textContent = 'Membuat...';

      try {
        const res = await fetch('/api/admin?secret=' + encodeURIComponent(SECRET) + '&action=mint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note }),
        });
        const data = await res.json();
        if (data.success) {
          document.getElementById('resultKey').textContent = data.key;
          document.getElementById('resultBox').style.display = 'block';
          document.getElementById('noteInput').value = '';
        }
      } catch (e) {
        alert('Gagal membuat kunci: ' + e.message);
      }

      btn.disabled = false;
      btn.textContent = '+ Buat Kunci';
    }

    function copyKey(key) {
      navigator.clipboard.writeText(key).then(() => {
        const toast = document.getElementById('toast');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      });
    }
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
}
