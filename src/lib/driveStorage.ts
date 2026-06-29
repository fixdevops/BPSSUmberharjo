// ─── driveStorage.ts — Google Drive sebagai storage utama ────────────────────
//
// ARSITEKTUR:
//   • localStorage = cache lokal sementara (agar app tetap cepat)
//   • Google Drive = sumber kebenaran utama (persistent, lintas perangkat)
//
// ALUR:
//   1. App buka → coba load data dari Drive, simpan ke cache lokal
//   2. Setiap CRUD → simpan ke cache lokal, lalu push ke Drive (background)
//   3. Jika belum login Drive → data hanya di cache lokal (bisa hilang)
//
// SETUP:
//   Masukkan Client ID Google di file: src/lib/googleDriveSync.ts
//   Baris: export const GOOGLE_CLIENT_ID: string = "XXXXXX.apps.googleusercontent.com"

import {
    googleSignIn,
    isConfigured,
    isSignedIn,
    restoreFromDrive,
    uploadToDrive
} from "./googleDriveSync";

// ─── State ────────────────────────────────────────────────────────────────────
let _driveReady    = false;  // sudah login & sinkron pertama kali
let _syncPending   = false;  // ada perubahan yang belum di-push
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _onStatusChange: ((status: DriveStatus) => void) | null = null;

export type DriveStatus =
  | "not_configured"   // Client ID belum diisi
  | "not_logged_in"    // belum login Google
  | "syncing"          // sedang upload
  | "synced"           // berhasil sync
  | "error"            // gagal sync
  | "local_only";      // simpan lokal saja (mode offline)

let _currentStatus: DriveStatus = "not_configured";

export function getDriveStatus(): DriveStatus { return _currentStatus; }

export function onDriveStatusChange(cb: (s: DriveStatus) => void) {
  _onStatusChange = cb;
}

function setStatus(s: DriveStatus) {
  _currentStatus = s;
  _onStatusChange?.(s);
}

// ─── Inisialisasi: login otomatis + load data dari Drive ─────────────────────
export async function initDriveStorage(): Promise<void> {
  if (!isConfigured()) {
    setStatus("not_configured");
    return;
  }

  // Coba login diam-diam (tanpa popup) — jika sudah pernah login
  try {
    if (!isSignedIn()) {
      setStatus("not_logged_in");
      return; // user harus login manual pertama kali
    }
    // Sudah punya token — load data dari Drive
    await syncFromDrive();
  } catch (_) {
    setStatus("not_logged_in");
  }
}

// ─── Login manual (dipanggil dari UI) ────────────────────────────────────────
export async function loginAndSync(): Promise<void> {
  if (!isConfigured()) {
    throw new Error("Client ID Google belum dikonfigurasi di src/lib/googleDriveSync.ts");
  }
  setStatus("syncing");
  try {
    await googleSignIn();
    await syncFromDrive();
    _driveReady = true;
  } catch (e: any) {
    setStatus("error");
    throw e;
  }
}

// ─── Unduh data dari Drive ke localStorage ───────────────────────────────────
export async function syncFromDrive(): Promise<boolean> {
  try {
    setStatus("syncing");
    await restoreFromDrive();
    setStatus("synced");
    _driveReady = true;
    return true;
  } catch (e: any) {
    // Jika file belum ada di Drive → tidak error, mulai fresh
    if (e.message?.includes("belum ada")) {
      setStatus("synced");
      _driveReady = true;
      return false;
    }
    setStatus("error");
    return false;
  }
}

// ─── Push data ke Drive (debounced 2 detik) ───────────────────────────────────
// Dipanggil setelah setiap operasi CRUD di database.web.ts
export function scheduleDriveSync(): void {
  if (!isConfigured() || !isSignedIn()) return;

  _syncPending = true;
  if (_syncTimer) clearTimeout(_syncTimer);

  _syncTimer = setTimeout(async () => {
    if (!_syncPending) return;
    _syncPending = false;
    setStatus("syncing");
    try {
      await uploadToDrive();
      setStatus("synced");
    } catch (e: any) {
      console.warn("[Drive] Sync gagal:", e.message);
      setStatus("error");
    }
  }, 2000); // tunggu 2 detik setelah operasi terakhir
}

// ─── Force sync sekarang (tanpa debounce) ────────────────────────────────────
export async function forceDriveSync(): Promise<void> {
  if (!isConfigured()) throw new Error("Client ID belum dikonfigurasi");
  if (!isSignedIn()) await googleSignIn();
  setStatus("syncing");
  try {
    await uploadToDrive();
    setStatus("synced");
  } catch (e: any) {
    setStatus("error");
    throw e;
  }
}
