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
              { name: "Kunci",       value: `\`${newKey}\``, inline: false },
              { name: "Dibuat oleh", value: note, inline: true },
              { name: "Waktu",       value: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }), inline: true },
            ],
            footer: { text: "BPS SE2026 Admin Web" },
          }],
        }),
      }).catch(() => {});
    }

    return res.status(200).json({ success: true, key: newKey });
  }

  // ── POST: Hapus kunci ─────────────────────────────────────────────────────
  if (req.method === "POST" && action === "delete") {
    const { key } = req.body || {};
    if (!key) return res.status(400).json({ success: false, message: "key wajib diisi." });

    const trimmedKey = key.trim();

    // Ambil data kunci dulu untuk notifikasi
    let keyData;
    try {
      keyData = await redis.get(`key:${trimmedKey}`);
    } catch (err) {
      return res.status(500).json({ success: false, message: "Redis error." });
    }

    if (!keyData) {
      return res.status(404).json({ success: false, message: "Kunci tidak ditemukan." });
    }

    // Hapus dari Redis
    await redis.del(`key:${trimmedKey}`);
    await redis.lrem("keys:list", 0, trimmedKey);

    // Notifikasi Discord
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
  // Ambil 50 kunci terakhir
  let recentKeys = [];
  try {
    const keyIds = await redis.lrange("keys:list", 0, 49);
    if (keyIds.length > 0) {
      const results = await Promise.all(keyIds.map((k) => redis.get(`key:${k}`)));
      recentKeys = results.filter(Boolean);
    }
  } catch (_) {}

  const rows = recentKeys.map((k) => `
    <tr id="row-${k.key}" style="border-bottom:1px solid #2a2a4a">
      <td style="padding:10px;font-family:monospace;font-size:11px;color:${k.used ? '#666' : '#4ade80'};word-break:break-all;max-width:240px">${k.key}</td>
      <td style="padding:10px;text-align:center;white-space:nowrap">
        <span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
          background:${k.used ? '#3f1f1f' : '#1a3f2f'};color:${k.used ? '#ff6b6b' : '#4ade80'}">
          ${k.used ? '🔴 Terpakai' : '🟢 Tersedia'}
        </span>
      </td>
      <td style="padding:10px;font-size:12px;color:#888;white-space:nowrap">${k.createdBy || '-'}</td>
      <td style="padding:10px;font-size:12px;color:#888;white-space:nowrap">${k.used ? (k.usedAt?.split('T')[0] || '-') : '-'}</td>
      <td style="padding:10px;white-space:nowrap">
        <div style="display:flex;gap:6px;align-items:center">
          ${!k.used ? `<button onclick="copyKey('${k.key}')"
            style="padding:4px 10px;background:#004ec7;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600">
            📋 Salin
          </button>` : ''}
          <button onclick="deleteKey('${k.key}', this)"
            style="padding:4px 10px;background:#3f1f1f;color:#fca5a5;border:1px solid #7f1d1d;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600">
            🗑️ Hapus
          </button>
        </div>
      </td>
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
    .header { max-width: 960px; margin: 0 auto 24px; display: flex; align-items: center; gap: 12px; }
    .logo { width: 48px; height: 48px; background: #1a2f6e; border-radius: 12px;
            display: flex; align-items: center; justify-content: center; font-size: 24px; }
    h1 { font-size: 20px; color: #fff; }
    .sub { font-size: 13px; color: #888; margin-top: 2px; }
    .card { max-width: 960px; margin: 0 auto 16px;
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
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 600px; }
    th { text-align: left; padding: 10px; font-size: 11px; color: #888;
         text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #2a2a4a; }
    tr.deleted { opacity: 0.4; transition: opacity 0.4s; }
    .toast { position: fixed; top: 20px; right: 20px; padding: 12px 20px; border-radius: 10px;
             font-size: 14px; font-weight: 600; transform: translateY(-60px); opacity: 0;
             transition: all 0.3s; pointer-events: none; z-index: 999; }
    .toast.show { transform: translateY(0); opacity: 1; }
    .toast-copy { background: #1a5c3a; color: #4ade80; }
    .toast-delete { background: #7f1d1d; color: #fca5a5; }
    .confirm-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: none;
      align-items: center; justify-content: center; z-index: 1000;
    }
    .confirm-overlay.show { display: flex; }
    .confirm-box {
      background: #1a1a2e; border: 1px solid #7f1d1d; border-radius: 16px;
      padding: 28px; max-width: 420px; width: 90%; text-align: center;
    }
    .confirm-key { font-family: monospace; font-size: 12px; color: #fca5a5;
                   background: #3f1f1f; padding: 8px 12px; border-radius: 8px;
                   word-break: break-all; margin: 12px 0; }
    .confirm-btns { display: flex; gap: 10px; justify-content: center; margin-top: 16px; }
    .btn-confirm-yes { padding: 10px 24px; background: #991b1b; color: white; border: none;
                       border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px; }
    .btn-confirm-no  { padding: 10px 24px; background: #2a2a4a; color: #e0e0e0; border: none;
                       border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <!-- Toast notifikasi -->
  <div class="toast toast-copy"  id="toast-copy">✅ Kunci disalin!</div>
  <div class="toast toast-delete" id="toast-delete">🗑️ Kunci berhasil dihapus!</div>

  <!-- Dialog konfirmasi hapus -->
  <div class="confirm-overlay" id="confirmOverlay">
    <div class="confirm-box">
      <div style="font-size:32px;margin-bottom:8px">⚠️</div>
      <h2 style="color:#fca5a5;font-size:16px;margin-bottom:4px">Hapus Kunci?</h2>
      <p style="font-size:13px;color:#aaa;margin-bottom:4px">
        Pengguna yang sudah memakai kunci ini akan <strong style="color:#fca5a5">dipaksa login ulang</strong>.
      </p>
      <div class="confirm-key" id="confirmKeyText"></div>
      <div class="confirm-btns">
        <button class="btn-confirm-no"  onclick="closeConfirm()">Batal</button>
        <button class="btn-confirm-yes" id="btnConfirmYes">Ya, Hapus</button>
      </div>
    </div>
  </div>

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
    <div class="card-title">50 Kunci Terakhir</div>
    ${recentKeys.length === 0
      ? '<p style="color:#888;font-size:13px;text-align:center;padding:20px">Belum ada kunci yang diterbitkan.</p>'
      : `<div class="table-wrap"><table>
          <thead>
            <tr>
              <th>UUID Kunci</th>
              <th>Status</th>
              <th>Dibuat Oleh</th>
              <th>Tgl Pakai</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody id="keysTableBody">${rows}</tbody>
        </table></div>`
    }
    <p style="margin-top:12px;font-size:11px;color:#555;text-align:right">
      Refresh halaman untuk update data terbaru
    </p>
  </div>

  <p style="max-width:960px;margin:0 auto;font-size:11px;color:#444;text-align:center">
    🔒 Halaman ini hanya bisa diakses dengan secret yang benar. Jangan bagikan URL ini.
  </p>

  <script>
    const SECRET = new URLSearchParams(window.location.search).get('secret') || '';
    let pendingDeleteKey = null;
    let pendingDeleteBtn = null;

    // ── Mint kunci baru ─────────────────────────────────────────────────────
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

    // ── Salin kunci ─────────────────────────────────────────────────────────
    function copyKey(key) {
      navigator.clipboard.writeText(key).then(() => showToast('copy'));
    }

    // ── Konfirmasi hapus ────────────────────────────────────────────────────
    function deleteKey(key, btn) {
      pendingDeleteKey = key;
      pendingDeleteBtn = btn;
      document.getElementById('confirmKeyText').textContent = key;
      document.getElementById('confirmOverlay').classList.add('show');
      document.getElementById('btnConfirmYes').onclick = confirmDelete;
    }

    function closeConfirm() {
      document.getElementById('confirmOverlay').classList.remove('show');
      pendingDeleteKey = null;
      pendingDeleteBtn = null;
    }

    async function confirmDelete() {
      if (!pendingDeleteKey) return;
      const key = pendingDeleteKey;
      const btn = pendingDeleteBtn;
      closeConfirm();

      // Disable tombol hapus di baris tersebut
      if (btn) { btn.disabled = true; btn.textContent = 'Menghapus...'; }

      try {
        const res = await fetch('/api/admin?secret=' + encodeURIComponent(SECRET) + '&action=delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });
        const data = await res.json();
        if (data.success) {
          // Fade out & hapus baris dari tabel
          const row = document.getElementById('row-' + key);
          if (row) {
            row.classList.add('deleted');
            setTimeout(() => row.remove(), 500);
          }
          showToast('delete');
        } else {
          alert('Gagal menghapus: ' + (data.message || 'unknown error'));
          if (btn) { btn.disabled = false; btn.textContent = '🗑️ Hapus'; }
        }
      } catch (e) {
        alert('Error: ' + e.message);
        if (btn) { btn.disabled = false; btn.textContent = '🗑️ Hapus'; }
      }
    }

    // ── Toast helper ────────────────────────────────────────────────────────
    function showToast(type) {
      const id = type === 'delete' ? 'toast-delete' : 'toast-copy';
      const el = document.getElementById(id);
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 2500);
    }

    // Tutup confirm overlay jika klik di luar box
    document.getElementById('confirmOverlay').addEventListener('click', function(e) {
      if (e.target === this) closeConfirm();
    });
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(html);
}
