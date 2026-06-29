import { Alert, Clipboard, Platform, ToastAndroid } from "react-native";

/** Format angka menjadi string Rupiah, contoh: "Rp 1.234.567" */
export const rp = (x: number) => "Rp " + Math.round(x).toLocaleString("id-ID");

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
