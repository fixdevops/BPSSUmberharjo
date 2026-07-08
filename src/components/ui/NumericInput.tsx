// ─── NumericInput — TextInput dengan format ribuan otomatis (id-ID) ───────────
// Saat user mengetik angka, nilai langsung diformat: 1000000 → 1.000.000
// Nilai yang disimpan di state parent tetap berformat (string "1.000.000"),
// gunakan parseFormatted() dari helpers untuk konversi ke number.

import { TextInput, type TextInputProps } from "react-native";
import { formatRibuanInput } from "../../lib/helpers";
import { ui } from "../../styles/ui";

interface NumericInputProps extends Omit<TextInputProps, "onChangeText" | "keyboardType"> {
  value: string;
  onChangeText: (formatted: string) => void;
}

export function NumericInput({ value, onChangeText, style, ...rest }: NumericInputProps) {
  return (
    <TextInput
      style={[ui.input, style]}
      value={value}
      onChangeText={(v) => onChangeText(formatRibuanInput(v))}
      keyboardType="numeric"
      {...rest}
    />
  );
}
