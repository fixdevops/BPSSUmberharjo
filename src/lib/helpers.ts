import { Alert, Clipboard, Platform, ToastAndroid } from "react-native";

/** Format angka menjadi string Rupiah, contoh: "Rp 1.234.567" */
export const rp = (x: number) => "Rp " + Math.round(x).toLocaleString("id-ID");

/** Format angka non-rupiah dengan pemisah ribuan id-ID, contoh: 1.500 */
export const fmt = (x: number, desimal = 0) =>
  desimal > 0
    ? x.toLocaleString("id-ID", { minimumFractionDigits: desimal, maximumFractionDigits: desimal })
    : Math.round(x).toLocaleString("id-ID");

/**
 * Format angka ribuan bulat saat mengetik (khusus Rupiah).
 * "1000000" → "1.000.000"
 */
export function formatRibuanInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return parseInt(digits, 10).toLocaleString("id-ID");
}

/**
 * Format angka dengan pemisah ribuan titik + boleh desimal dengan titik.
 * Cocok untuk luas (m²), hasil panen (kg/kuintal/ton), bobot.
 * Hanya menerima titik sebagai pemisah desimal (BUKAN koma).
 * Contoh: "6660.5"   → "6.660.5"
 *         "6660"     → "6.660"
 *         "1.5"      → "1.5"
 *         "1500"     → "1.500"
 *         "1500.25"  → "1.500.25"
 *
 * Aturan: titik TERAKHIR adalah pemisah desimal.
 *         titik sebelumnya adalah pemisah ribuan (dicetak ulang).
 */
export function formatRibuanDesimalInput(raw: string): string {
  // Hanya izinkan digit dan titik (koma diabaikan)
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";

  const lastDot = cleaned.lastIndexOf(".");

  if (lastDot === -1) {
    // Tidak ada titik → angka bulat, format ribuan biasa
    const digits = cleaned.replace(/\./g, "");
    return parseInt(digits, 10).toLocaleString("id-ID");
  }

  // Ada titik → titik terakhir = pemisah desimal
  const intRaw = cleaned.slice(0, lastDot).replace(/\./g, "");
  const decRaw = cleaned.slice(lastDot + 1).replace(/\./g, "");

  const intFormatted = intRaw
    ? parseInt(intRaw, 10).toLocaleString("id-ID")
    : "0";

  return `${intFormatted}.${decRaw}`;
}

/**
 * Bersihkan format ribuan kembali ke angka murni.
 * Format: titik sebagai pemisah ribuan, titik TERAKHIR sebagai desimal.
 * "1.000.000"   → 1000000
 * "6.660.5"     → 6660.5
 * "1.500.25"    → 1500.25
 */
export function parseFormatted(val: string): number {
  const str = val.trim();
  if (!str) return 0;
  const lastDot = str.lastIndexOf(".");
  if (lastDot === -1) {
    // Tidak ada titik sama sekali
    return parseFloat(str.replace(/[^0-9]/g, "")) || 0;
  }
  const afterLast = str.slice(lastDot + 1);
  // Jika setelah titik terakhir tepat 3 digit → titik itu pemisah ribuan, bukan desimal
  if (/^\d{3}$/.test(afterLast)) {
    return parseFloat(str.replace(/\./g, "")) || 0;
  }
  // Titik terakhir = pemisah desimal, titik sebelumnya = ribuan
  const intPart = str.slice(0, lastDot).replace(/\./g, "");
  return parseFloat(`${intPart}.${afterLast}`) || 0;
}

/** Bersihkan format ribuan lalu parse ke number */
export function parseRupiah(val: string): number {
  return parseFormatted(val);
}

/** Salin teks ke clipboard, tampilkan toast/alert sesuai platform */
export function copyToClipboard(val: string) {
  Clipboard.setString(val);
  if (Platform.OS === "android") {
    ToastAndroid.show("✓ Disalin ke clipboard", ToastAndroid.SHORT);
  } else {
    Alert.alert("Disalin", `"${val}" berhasil disalin.`);
  }
}
