// ─── lib/keyAuth.ts — Verifikasi kunci akses ke server ───────────────────────
// Mengirim POST /verify ke backend, menyimpan status ke localStorage (web)
// atau AsyncStorage/expo-sqlite workaround (native).

import { Platform } from "react-native";

// ── Konfigurasi ───────────────────────────────────────────────────────────────
// URL deployment Vercel Anda (tanpa trailing slash)
export const API_BASE_URL = "https://bps-sumberharjo.vercel.app";

const STORAGE_KEY     = "bps_access_granted";
const STORAGE_KEY_UUID = "bps_access_key_uuid"; // UUID kunci yang dipakai
const STORAGE_KEY_TYPE = "bps_access_key_type"; // tipe kunci: "lapangan" | "kalkulator"

// ── Helper storage lintas platform ───────────────────────────────────────────
function storageSet(key: string, value: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try { window.localStorage.setItem(key, value); } catch (_) {}
  }
}

function storageGet(key: string): string | null {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }
  return null;
}

function storageRemove(key: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try { window.localStorage.removeItem(key); } catch (_) {}
  }
}

// ── API ───────────────────────────────────────────────────────────────────────

/** Cek apakah akses sudah diberikan sebelumnya (tersimpan di storage lokal) */
export function isAccessGranted(): boolean {
  return storageGet(STORAGE_KEY) === "true";
}

/** Ambil UUID kunci yang sedang aktif (null jika belum ada) */
export function getActiveKeyUUID(): string | null {
  return storageGet(STORAGE_KEY_UUID);
}

/** Hapus status akses (logout / reset) */
export function revokeAccess(): void {
  storageRemove(STORAGE_KEY);
  storageRemove(STORAGE_KEY_UUID);
  storageRemove(STORAGE_KEY_TYPE);
}

/** Ambil tipe kunci yang aktif: "lapangan" | "kalkulator" | null */
export function getKeyType(): "lapangan" | "kalkulator" | null {
  const t = storageGet(STORAGE_KEY_TYPE);
  if (t === "lapangan") return "lapangan";
  if (t === "kalkulator") return "kalkulator";
  // Kunci lama (tipe "app") → anggap kalkulator
  if (t === "app") return "kalkulator";
  return null;
}

/**
 * Cek apakah kunci yang aktif punya akses ke fitur Data Lapangan.
 * Hanya kunci bertipe "lapangan" yang boleh.
 */
export function isLapanganGranted(): boolean {
  return isAccessGranted() && getKeyType() === "lapangan";
}

/**
 * Kirim kunci ke server untuk diverifikasi.
 * - Jika valid   → simpan status + UUID ke storage, return { success: true }
 * - Jika invalid → return { success: false, message: "..." }
 * - Jika error   → return { success: false, message: "Server tidak merespon" }
 */
export async function verifyKey(inputKey: string): Promise<{ success: boolean; message: string }> {
  const key = inputKey.trim();

  if (!key) {
    return { success: false, message: "Kunci tidak boleh kosong." };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });

    const result = await response.json();

    if (response.status === 200) {
      storageSet(STORAGE_KEY, "true");
      // Simpan UUID kunci agar bisa di-revalidasi nanti
      const savedKey = result.key ?? key;
      storageSet(STORAGE_KEY_UUID, savedKey);
      // Simpan tipe kunci
      const keyType = result.type ?? "lapangan";
      storageSet(STORAGE_KEY_TYPE, keyType);
      return { success: true, message: result.message ?? "Akses Diberikan" };
    } else {
      return { success: false, message: result.message ?? "Kunci salah atau sudah terpakai." };
    }
  } catch (error) {
    console.warn("[keyAuth] verifyKey error:", error);
    return { success: false, message: "Server tidak merespon. Periksa koneksi internet Anda." };
  }
}

/**
 * Cek ke server apakah kunci yang tersimpan masih berlaku.
 * Dipanggil saat app dibuka (setelah localStorage mengatakan sudah granted).
 *
 * - true  → kunci masih valid, biarkan masuk
 * - false → kunci dicabut admin, paksa login ulang (revokeAccess sudah dipanggil)
 */
export async function revalidateKey(): Promise<boolean> {
  const uuid = getActiveKeyUUID();

  // Jika tidak ada UUID tersimpan (pengguna lama sebelum fitur ini),
  // beri akses supaya tidak mengganggu pengguna yang sudah ada.
  if (!uuid) return true;

  try {
    const response = await fetch(`${API_BASE_URL}/api/check-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: uuid }),
    });

    const result = await response.json();

    if (response.status === 200 && result.valid === true) {
      // Sync type dari server jika ada (menangani kunci lama sebelum fitur type)
      if (result.type) storageSet(STORAGE_KEY_TYPE, result.type);
      return true;
    }

    // Kunci tidak valid lagi (dihapus admin) → bersihkan storage
    revokeAccess();
    return false;
  } catch (error) {
    // Jika server tidak merespon (offline), jangan paksa logout
    console.warn("[keyAuth] revalidateKey error (offline?):", error);
    return true;
  }
}
