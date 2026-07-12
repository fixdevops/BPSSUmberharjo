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
export const GOOGLE_CLIENT_ID: string = "176184827054-4l30l0g8fc7fbmo1pj5ji4vdmra06khf.apps.googleusercontent.com";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");
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

// ─── State token & profil akun ────────────────────────────────────────────────
let _accessToken: string | null = null;
let _tokenExpiry: number = 0;

export type GoogleUser = {
  name:  string;
  email: string;
  photo: string | null;
};
let _currentUser: GoogleUser | null = null;

export function isSignedIn(): boolean {
  return !!_accessToken && Date.now() < _tokenExpiry;
}

/** Kembalikan info akun yang sedang login, null jika belum login */
export function getSignedInUser(): GoogleUser | null {
  return isSignedIn() ? _currentUser : null;
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
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(`Login Google gagal: ${response.error_description ?? response.error}`));
            return;
          }
          _accessToken = response.access_token;
          _tokenExpiry = Date.now() + ((response.expires_in ?? 3600) - 60) * 1000;
          (window as any).__se2026_gtoken = _accessToken;
          // Ambil profil akun (nama & email) via People API
          try {
            const userRes = await fetch(
              "https://www.googleapis.com/oauth2/v2/userinfo",
              { headers: { Authorization: `Bearer ${_accessToken}` } }
            );
            if (userRes.ok) {
              const u = await userRes.json();
              _currentUser = {
                name:  u.name  ?? u.given_name ?? "Pengguna",
                email: u.email ?? "",
                photo: u.picture ?? null,
              };
            }
          } catch (_) { /* profil opsional, tidak gagalkan login */ }
          resolve(_accessToken!);
        },
        error_callback: (err: any) => {
          if (err?.type === "popup_closed") {
            reject(new Error(
              "Popup login Google ditutup.\n\n" +
              "Jika popup tidak muncul sama sekali, pastikan:\n" +
              "• URL ini sudah terdaftar di Google Cloud Console\n" +
              "• Authorized JavaScript Origins: " + window.location.origin
            ));
          } else {
            reject(new Error(`Login dibatalkan: ${err?.type ?? "unknown"}`));
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: "" });
    } catch (e: any) {
      reject(new Error("Gagal inisialisasi Google OAuth: " + e.message));
    }
  });
}

/** Ganti akun — paksa tampilkan picker akun Google (prompt: "select_account") */
export async function switchAccount(): Promise<string> {
  if (!isConfigured()) throw new Error("Client ID belum dikonfigurasi.");
  await loadGSIScript();
  // Revoke token lama dulu
  if (_accessToken && (window as any).google?.accounts?.oauth2) {
    (window as any).google.accounts.oauth2.revoke(_accessToken, () => {});
  }
  _accessToken = null;
  _tokenExpiry = 0;
  _currentUser = null;

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(`Login gagal: ${response.error_description ?? response.error}`));
            return;
          }
          _accessToken = response.access_token;
          _tokenExpiry = Date.now() + ((response.expires_in ?? 3600) - 60) * 1000;
          (window as any).__se2026_gtoken = _accessToken;
          try {
            const userRes = await fetch(
              "https://www.googleapis.com/oauth2/v2/userinfo",
              { headers: { Authorization: `Bearer ${_accessToken}` } }
            );
            if (userRes.ok) {
              const u = await userRes.json();
              _currentUser = {
                name:  u.name  ?? u.given_name ?? "Pengguna",
                email: u.email ?? "",
                photo: u.picture ?? null,
              };
            }
          } catch (_) {}
          resolve(_accessToken!);
        },
        error_callback: (err: any) => {
          reject(new Error(`Login dibatalkan: ${err?.type ?? "unknown"}`));
        },
      });
      // prompt: "select_account" → paksa tampilkan picker meskipun sudah pernah login
      tokenClient.requestAccessToken({ prompt: "select_account" });
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
  _currentUser = null;
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

// ─── Cari atau buat 1 folder (dalam parent tertentu) ─────────────────────────
async function getOrCreateSingleFolder(name: string, parentId?: string): Promise<string> {
  const parentClause = parentId
    ? ` and '${parentId}' in parents`
    : ` and 'root' in parents`;
  const q = encodeURIComponent(
    `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentClause}`
  );
  const list = await driveApi(`/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`);
  if (list.files?.length > 0) return list.files[0].id as string;

  const body: Record<string, any> = { name, mimeType: "application/vnd.google-apps.folder" };
  if (parentId) body.parents = [parentId];
  const folder = await driveApi("/drive/v3/files", "POST", body, "application/json");
  return folder.id as string;
}

// ─── Cari atau buat folder root SE2026 ────────────────────────────────────────
async function getOrCreateFolder(): Promise<string> {
  return getOrCreateSingleFolder(FOLDER_NAME);
}

// ─── Buat folder bertingkat untuk 1 bangunan ──────────────────────────────────
//
// Struktur:
//   SE2026 BPS Sumberharjo/
//    Foto/
//     SLS-001_RT_001_RW_002/           ← SLS kode + RT + RW digabung 1 level
//      B001_KK_1_Rumah_Budi-Santoso & KK_2_Solikun/   ← semua KK digabung
//       Foto_Depan.jpg
//       Foto_Dalam.jpg
//       Foto_Meteran.jpg
//
// params.namaKKList : array nama semua KK di bangunan ini, sudah dengan nomor urut
//                     misal: ["KK_1_Budi Santoso", "KK_2_Solikun"]
//
export async function getOrCreateBangunanFolder(params: {
  nomorUrut:  string;     // "001"
  jenis:      string;     // "Rumah"
  namaKKList: string[];   // ["KK_1_Budi Santoso"] atau ["Mushola Al-Ikhlas"]
  slsKode:    string;     // "SLS-001"
  namaRT:     string;     // "RT 01"  → label RT, dipakai di nama folder level-1
  namaRW:     string;     // "RW 02"  → akan jadi "RW_002"
}): Promise<string> {
  const san = (s: string) =>
    s.replace(/[/\\:*?"<>|&]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").trim();

  // Normalisasi angka dalam nama RT/RW → zero-padded 3 digit
  const normNum = (s: string) =>
    san(s.replace(/(\D*)(\d+)/, (_, prefix, n) => `${prefix}_${n.padStart(3, "0")}`));

  // Level-1: "SLS-001_RT_001_RW_002"
  // SLS = RT, jadi gabungkan kode SLS + RT + RW dalam satu folder
  const rtPart    = normNum(params.namaRT);   // "RT_001"
  const rwPart    = normNum(params.namaRW);   // "RW_002"
  const slsLabel  = `${params.slsKode}_${rtPart}_${rwPart}`.slice(0, 60);

  // Level-2: "B001_KK_001_Budi-Santoso_Rumah" atau "B003_Mushola_Al-Ikhlas"
  const kkPart       = params.namaKKList.map((k) => san(k)).join("_&_").slice(0, 80);
  const bangunanLabel = `B${params.nomorUrut}_${kkPart}_${san(params.jenis)}`.slice(0, 100);

  const rootId  = await getOrCreateFolder();
  const fotoId  = await getOrCreateSingleFolder("Foto", rootId);
  const slsRtId = await getOrCreateSingleFolder(slsLabel, fotoId);
  const bId     = await getOrCreateSingleFolder(bangunanLabel, slsRtId);
  return bId;
}

// ─── Rename folder bangunan di Drive (saat KK baru ditambahkan) ───────────────
// Ambil folder ID bangunan lama berdasarkan prefix "B{nomorUrut}_" lalu rename
// dengan nama KK terbaru. Dipakai oleh DetailBangunanScreen setelah insertKK.
export async function renameBangunanFolder(params: {
  bangunanFolderId: string;  // ID folder bangunan yang sudah ada
  nomorUrut:        string;  // "001"
  jenis:            string;  // "Rumah"
  namaKKList:       string[]; // semua KK terkini: ["KK_001_Budi", "KK_002_Solikun"]
}): Promise<void> {
  try {
    if (!isSignedIn()) await googleSignIn();
    const san = (s: string) =>
      s.replace(/[/\\:*?"<>|&]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").trim();
    const kkPart = params.namaKKList.map((k) => san(k)).join(" & ").slice(0, 80);
    const newName = `B${params.nomorUrut}_${kkPart}_${san(params.jenis)}`.slice(0, 100);
    await driveApi(
      `/drive/v3/files/${params.bangunanFolderId}`,
      "PATCH",
      { name: newName },
      "application/json"
    );
  } catch (e: any) {
    console.warn("[Drive] Rename folder bangunan gagal:", e.message);
  }
}


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

// ─── Upload foto (data URI / base64) ke Drive, kembalikan public URL ─────────
// Digunakan oleh FormBangunanScreen saat menyimpan foto depan/dalam
export async function uploadFotoBase64ToDrive(
  dataUri: string,
  fileName: string,
  folderId?: string
): Promise<string | null> {
  try {
    if (!isSignedIn()) await googleSignIn();

    // Tentukan folder tujuan
    const targetFolderId = folderId ?? await getOrCreateFolder();

    // Parse data URI: "data:image/jpeg;base64,XXXX..."
    const commaIdx = dataUri.indexOf(",");
    if (commaIdx === -1) throw new Error("Format data URI tidak valid");
    const header   = dataUri.substring(0, commaIdx);
    const b64data  = dataUri.substring(commaIdx + 1);
    const mimeType = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";

    // Decode base64 → Uint8Array
    const byteStr = atob(b64data);
    const bytes   = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });

    // Multipart upload ke Drive
    const meta     = JSON.stringify({ name: fileName, parents: [targetFolderId] });
    const boundary = "foto_bdr_" + Date.now();
    const CRLF     = "\r\n";

    // Build multipart body menggunakan Blob concat
    const bodyParts: BlobPart[] = [
      `--${boundary}${CRLF}`,
      `Content-Type: application/json; charset=UTF-8${CRLF}${CRLF}`,
      meta, CRLF,
      `--${boundary}${CRLF}`,
      `Content-Type: ${mimeType}${CRLF}${CRLF}`,
      blob,
      `${CRLF}--${boundary}--`,
    ];
    const multipartBody = new Blob(bodyParts, { type: `multipart/related; boundary=${boundary}` });

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${_accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (!res.ok) {
      console.warn("Upload foto gagal:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const result = await res.json();
    // Kembalikan URL preview Drive
    return `https://drive.google.com/uc?export=view&id=${result.id}`;
  } catch (e: any) {
    console.warn("uploadFotoBase64ToDrive error:", e.message);
    return null;
  }
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
