// ─── lib/keyAuth.ts — Verifikasi kunci akses ke server ───────────────────────
// Mengirim POST /verify ke backend, menyimpan status ke localStorage (web)
// atau AsyncStorage/expo-sqlite workaround (native).

import { Platform } from "react-native";

// ── Konfigurasi ───────────────────────────────────────────────────────────────
// URL deployment Vercel Anda (tanpa trailing slash)
export const API_BASE_URL = "https://bps-sumberharjo.vercel.app";

const STORAGE_KEY = "bps_access_granted";

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

/** Hapus status akses (logout / reset) */
export function revokeAccess(): void {
  storageRemove(STORAGE_KEY);
}

/**
 * Kirim kunci ke server untuk diverifikasi.
 * - Jika valid   → simpan status ke storage, return { success: true }
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
      return { success: true, message: result.message ?? "Akses Diberikan" };
    } else {
      return { success: false, message: result.message ?? "Kunci salah atau sudah terpakai." };
    }
  } catch (error) {
    console.warn("[keyAuth] verifyKey error:", error);
    return { success: false, message: "Server tidak merespon. Periksa koneksi internet Anda." };
  }
}
