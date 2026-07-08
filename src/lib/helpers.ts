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
 * Format angka dengan pemisah ribuan + boleh desimal (koma id-ID).
 * Cocok untuk luas (m²), hasil panen (kg/kuintal/ton), bobot.
 * Menerima titik ATAU koma sebagai pemisah desimal.
 * Contoh: "6660,5"  → "6.660,5"
 *         "6660.5"  → "6.660,5"
 *         "1.5"     → "1,5"
 *         "1500"    → "1.500"
 *         "1,5"     → "1,5"
 */
export function formatRibuanDesimalInput(raw: string): string {
  // Hanya izinkan digit, koma, dan titik
  const cleaned = raw.replace(/[^0-9.,]/g, "");
  if (!cleaned) return "";

  // Deteksi apakah ada pemisah desimal (koma atau titik)
  // Aturan: karakter TERAKHIR yang berupa koma/titik dianggap pemisah desimal
  // — kecuali kalau titiknya adalah pemisah ribuan (digit sesudahnya > 3 digit)
  const lastDot   = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");

  // Mana yang lebih kanan = pemisah desimal
  const sepPos  = Math.max(lastDot, lastComma);
  const sepChar = sepPos >= 0 ? cleaned[sepPos] : null;

  let intRaw: string;
  let decRaw: string | null = null;

  if (sepChar !== null) {
    const afterSep = cleaned.slice(sepPos + 1);
    // Titik dianggap pemisah RIBUAN (bukan desimal) jika sesudahnya tepat 3 digit
    // dan tidak ada karakter lain setelahnya (mis: "1.000" bukan "1.5")
    const isThousSep = sepChar === "." && /^\d{3}$/.test(afterSep);

    if (isThousSep) {
      // Seluruh string adalah angka bulat — buang semua titik
      intRaw = cleaned.replace(/\./g, "");
      decRaw = null;
    } else {
      // Ada desimal
      intRaw = cleaned.slice(0, sepPos).replace(/[.,]/g, "");
      decRaw = afterSep.replace(/[.,]/g, "");
    }
  } else {
    intRaw = cleaned.replace(/[.,]/g, "");
    decRaw = null;
  }

  if (!intRaw && decRaw === null) return "";

  const intFormatted = intRaw
    ? parseInt(intRaw, 10).toLocaleString("id-ID")
    : "0";

  return decRaw !== null ? `${intFormatted},${decRaw}` : intFormatted;
}

/**
 * Bersihkan format ribuan kembali ke angka murni.
 * "1.000.000" → 1000000  |  "6.660,5" → 6660.5
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
