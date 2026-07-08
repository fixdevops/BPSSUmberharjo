import { Alert, Clipboard, Platform, ToastAndroid } from "react-native";

/** Format angka menjadi string Rupiah, contoh: "Rp 1.234.567" */
export const rp = (x: number) => "Rp " + Math.round(x).toLocaleString("id-ID");

/** Format angka non-rupiah dengan pemisah ribuan id-ID, contoh: 1.500 */
export const fmt = (x: number, desimal = 0) =>
  desimal > 0
    ? x.toLocaleString("id-ID", { minimumFractionDigits: desimal, maximumFractionDigits: desimal })
    : Math.round(x).toLocaleString("id-ID");

/**
 * Format angka ribuan saat mengetik (format-while-typing).
 * Input "1000000" → "1.000.000"
 * Hanya mengambil digit, lalu format id-ID.
 */
export function formatRibuanInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return parseInt(digits, 10).toLocaleString("id-ID");
}

/**
 * Bersihkan format ribuan kembali ke angka murni.
 * "1.000.000" → 1000000
 */
export function parseFormatted(val: string): number {
  return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
}

/** Bersihkan format ribuan lalu parse ke number */
export function parseRupiah(val: string): number {
  return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
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
