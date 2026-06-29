// ─── googleDriveSync.ts — Sinkronisasi data ke Google Drive ──────────────────
//
// CARA KERJA:
//   1. User klik "Simpan ke Google Drive" → minta izin OAuth Google
//   2. Ambil semua data dari localStorage (se2026_*)
//   3. Upload/update file JSON ke folder tertentu di Google Drive user
//   4. File disimpan sebagai: "se2026-sumberharjo-data.json"
//
// SETUP GOOGLE CLOUD CONSOLE:
//   1. Buka https://console.cloud.google.com
//   2. Buat project baru (misal: "SE2026 BPS")
//   3. Klik "APIs & Services" → "Enable APIs" → cari "Google Drive API" → aktifkan
//   4. Klik "APIs & Services" → "Credentials" → "+ Create Credentials" → "OAuth client ID"
//   5. Pilih "Web application", beri nama
//   6. Di "Authorized JavaScript origins" masukkan URL web Anda (misal: http://localhost:8081)
//   7. Klik "Create" → copy "Your Client ID" (format: XXXXXX.apps.googleusercontent.com)
//   8. Ganti nilai GOOGLE_CLIENT_ID di bawah
//
// ─────────────────────────────────────────────────────────────────────────────

// ⚠️  GANTI dengan Client ID dari Google Cloud Console Anda
// Format yang benar: "123456789-abc.apps.googleusercontent.com"
export const GOOGLE_CLIENT_ID: string = "GANTI_DENGAN_CLIENT_ID_ANDA.apps.googleusercontent.com";

const SCOPES = "https://www.googleapis.com/auth/drive.file";
const FILE_NAME = "se2026-sumberharjo-data.json";
const FOLDER_NAME = "SE2026 BPS Sumberharjo";

// ─── Cek apakah Client ID sudah dikonfigurasi ─────────────────────────────────
export function isConfigured(): boolean {
  return (
    !!GOOGLE_CLIENT_ID &&
    GOOGLE_CLIENT_ID !== "GANTI_DENGAN_CLIENT_ID_ANDA.apps.googleusercontent.com" &&
    GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com")
  );
}

// ─── State token ──────────────────────────────────────────────────────────────
let _accessToken: string | null = null;
let _tokenExpiry: number = 0;

export function isSignedIn(): boolean {
  return !!_accessToken && Date.now() < _tokenExpiry;
}

// ─── Muat script Google Identity Services ────────────────────────────────────
function loadGSIScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) { resolve(); return; }
    const existing = document.getElementById("gsi-script");
    if (existing) {
      // Script sudah ada tapi belum selesai load
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Gagal memuat Google Identity Services")));
      return;
    }
    const s = document.createElement("script");
    s.id  = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Gagal memuat Google Identity Services. Pastikan koneksi internet aktif."));
    document.head.appendChild(s);
  });
}

// ─── Minta akses OAuth via popup Google ──────────────────────────────────────
export async function googleSignIn(): Promise<string> {
  if (!isConfigured()) {
    throw new Error(
      "Google Client ID belum dikonfigurasi.\n\n" +
      "Buka file: src/lib/googleDriveSync.ts\n" +
      "Ganti GOOGLE_CLIENT_ID dengan Client ID dari Google Cloud Console.\n" +
      "Format: XXXXXX.apps.googleusercontent.com"
    );
  }

  await loadGSIScript();

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(`Login Google gagal: ${response.error_description ?? response.error}`));
            return;
          }
          _accessToken = response.access_token;
          _tokenExpiry = Date.now() + ((response.expires_in ?? 3600) - 60) * 1000;
          resolve(_accessToken!);
        },
        error_callback: (err: any) => {
          reject(new Error(`Login dibatalkan: ${err?.type ?? "unknown"}`));
        },
      });
      tokenClient.requestAccessToken({ prompt: "" });
    } catch (e: any) {
      reject(new Error("Gagal inisialisasi Google OAuth: " + e.message));
    }
  });
}

export function googleSignOut(): void {
  if (_accessToken && (window as any).google?.accounts?.oauth2) {
    (window as any).google.accounts.oauth2.revoke(_accessToken, () => {});
  }
  _accessToken = null;
  _tokenExpiry = 0;
}

// ─── Helper: fetch ke Drive API ───────────────────────────────────────────────
async function driveApi(
  path: string,
  method: string = "GET",
  body?: any,
  contentType?: string
): Promise<any> {
  // Token expired? minta ulang
  if (!isSignedIn()) await googleSignIn();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${_accessToken}`,
  };
  if (contentType) headers["Content-Type"] = contentType;

  const res = await fetch(`https://www.googleapis.com${path}`, {
    method,
    headers,
    body: body ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    if (res.status === 401) {
      _accessToken = null; // token invalid, paksa login ulang
      throw new Error("Sesi Google expired. Silakan coba lagi.");
    }
    throw new Error(`Drive API error ${res.status}: ${err}`);
  }
  return res.json().catch(() => ({}));
}

// ─── Cari atau buat folder SE2026 ─────────────────────────────────────────────
async function getOrCreateFolder(): Promise<string> {
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const list = await driveApi(`/drive/v3/files?q=${q}&fields=files(id,name)`);
  if (list.files?.length > 0) return list.files[0].id as string;

  // Buat folder baru
  const folder = await driveApi(
    "/drive/v3/files",
    "POST",
    { name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" },
    "application/json"
  );
  return folder.id as string;
}

// ─── Kumpulkan semua data dari localStorage ───────────────────────────────────
function collectAllData(): object {
  const keys = ["sls", "rt", "bangunan", "kk", "foto"];
  const data: Record<string, any> = {
    exportedAt:  new Date().toISOString(),
    appVersion:  "SE2026 v1.1.0",
    exportDevice: navigator.userAgent,
  };
  for (const key of keys) {
    try {
      const raw = localStorage.getItem("se2026_" + key);
      data[key] = raw ? JSON.parse(raw) : [];
    } catch { data[key] = []; }
  }
  return data;
}

// ─── Upload / update file JSON ke Drive ──────────────────────────────────────
export async function uploadToDrive(): Promise<string> {
  if (!isSignedIn()) await googleSignIn();

  const folderId = await getOrCreateFolder();
  const content  = JSON.stringify(collectAllData(), null, 2);

  // Cari file yang sudah ada (supaya update, bukan buat baru terus)
  const q = encodeURIComponent(
    `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`
  );
  const list       = await driveApi(`/drive/v3/files?q=${q}&fields=files(id,name)`);
  const existingId = (list.files?.[0]?.id as string) ?? null;

  const boundary = "se2026_boundary_" + Date.now();
  const metaObj  = existingId
    ? { name: FILE_NAME }
    : { name: FILE_NAME, parents: [folderId] };

  const multipart = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metaObj),
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n");

  const endpoint = existingId
    ? `/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : `/upload/drive/v3/files?uploadType=multipart`;

  const res = await fetch(`https://www.googleapis.com${endpoint}`, {
    method: existingId ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${_accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipart,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`Upload gagal (${res.status}): ${err}`);
  }
  const result = await res.json();
  return result.id as string;
}

// ─── Unduh data dari Drive ────────────────────────────────────────────────────
export async function downloadFromDrive(): Promise<{
  sls: any[]; rt: any[]; bangunan: any[]; kk: any[]; foto: any[];
}> {
  if (!isSignedIn()) await googleSignIn();

  const folderId = await getOrCreateFolder();
  const q = encodeURIComponent(
    `name='${FILE_NAME}' and '${folderId}' in parents and trashed=false`
  );
  const list = await driveApi(`/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`);
  if (!list.files?.length) {
    throw new Error("File backup belum ada di Google Drive. Simpan data terlebih dahulu.");
  }

  const fileId = list.files[0].id as string;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${_accessToken}` } }
  );
  if (!res.ok) throw new Error(`Download gagal (${res.status}): ${res.statusText}`);
  return res.json();
}

// ─── Restore ke localStorage ──────────────────────────────────────────────────
export async function restoreFromDrive(): Promise<void> {
  const data = await downloadFromDrive();
  const keys = ["sls", "rt", "bangunan", "kk", "foto"] as const;
  for (const key of keys) {
    if (Array.isArray(data[key])) {
      localStorage.setItem("se2026_" + key, JSON.stringify(data[key]));
    }
  }
  // Sinkronkan counter ID agar tidak tabrakan saat insert baru
  for (const key of keys) {
    if (Array.isArray(data[key]) && data[key].length > 0) {
      const maxId = Math.max(...data[key].map((x: any) => Number(x.id) || 0));
      localStorage.setItem("se2026_cnt_" + key, String(maxId));
    }
  }
}
