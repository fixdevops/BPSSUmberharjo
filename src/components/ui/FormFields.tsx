// ─── Form field components: SelectField, InputField, LuasField ───────────────
import { DimensionValue, Pressable, Text, TextInput, View } from "react-native";
import { T } from "../../constants/theme";
import { formatRibuanDesimalInput, formatRibuanInput, parseFormatted } from "../../lib/helpers";
import { ui } from "../../styles/ui";
import { Icon } from "../Icon";

// ── SelectField ───────────────────────────────────────────────────────────────
export function SelectField({
  label,
  value,
  onPress,
  width = "100%",
}: {
  label: string;
  value: string;
  onPress: () => void;
  width?: DimensionValue;
}) {
  return (
    <View style={[ui.fieldWrap, { width: width as any }]}>
      <Text style={ui.fieldLabel}>{label}</Text>
      <Pressable
        style={({ pressed }) => [ui.select, pressed && { borderColor: T.primary }]}
        onPress={onPress}
        accessibilityLabel={`Pilih ${label}`}
      >
        <Text style={ui.selectText} numberOfLines={1}>{value}</Text>
        <Icon name="expand_more" size={16} color={T.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

// ── InputField ────────────────────────────────────────────────────────────────
// keyboardType="numeric"     → format ribuan bulat (Rupiah, ekor, orang)
// keyboardType="decimal-pad" → format ribuan + boleh desimal (kg, kuintal, ton)
// keyboardType="default"     → tidak diformat (teks bebas)
export function InputField({
  label,
  value,
  onChangeText,
  placeholder = "",
  keyboardType = "default",
  width = "100%",
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  width?: DimensionValue;
}) {
  function handleChange(v: string) {
    if (keyboardType === "decimal-pad") {
      onChangeText(formatRibuanDesimalInput(v));
    } else if (keyboardType === "numeric" || keyboardType === "number-pad") {
      onChangeText(formatRibuanInput(v));
    } else {
      onChangeText(v);
    }
  }

  return (
    <View style={[ui.fieldWrap, { width: width as any }]}>
      <Text style={ui.fieldLabel}>{label}</Text>
      <TextInput
        style={ui.input}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={T.outline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

// ── LuasField — input luas dalam M2, mendukung desimal ───────────────────────
export function LuasField({
  luas,
  setLuas,
  width = "100%",
}: {
  luas: string;
  setLuas: (v: string) => void;
  satLuas?: string;
  onSatPress?: () => void;
  width?: DimensionValue;
}) {
  const luasNum = parseFormatted(luas);

  return (
    <View style={[ui.fieldWrap, { width: width as any }]}>
      <Text style={ui.fieldLabel}>Luas Lahan</Text>
      <View style={ui.luasRow}>
        <TextInput
          style={[ui.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }]}
          value={luas}
          onChangeText={(v) => setLuas(formatRibuanDesimalInput(v))}
          placeholder="contoh: 6.660 atau 6.660.5"
          placeholderTextColor={T.outline}
          keyboardType="decimal-pad"
        />
        <View style={[ui.luasSat, { backgroundColor: T.surfaceContainerLow }]}>
          <Text style={[ui.luasSatText, { color: T.onSurfaceVariant, fontWeight: "700" }]}>m²</Text>
        </View>
      </View>
      {luas !== "" && luasNum > 0 && (
        <Text style={{ fontSize: 10, color: T.secondary, marginTop: 3 }}>
          = {(luasNum / 10000).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ha
        </Text>
      )}
    </View>
  );
}
