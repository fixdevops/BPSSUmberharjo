// ─── Form field components: SelectField, InputField, LuasField ───────────────
import { DimensionValue, Pressable, Text, TextInput, View } from "react-native";
import { T } from "../../constants/theme";
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
  return (
    <View style={[ui.fieldWrap, { width: width as any }]}>
      <Text style={ui.fieldLabel}>{label}</Text>
      <TextInput
        style={ui.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T.outline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

// ── LuasField — input luas dalam M2 (satuan tetap, tidak bisa diganti) ────────
export function LuasField({
  luas,
  setLuas,
  width = "100%",
}: {
  luas: string;
  setLuas: (v: string) => void;
  satLuas?: string;       // diabaikan — selalu M2
  onSatPress?: () => void; // diabaikan — satuan tetap M2
  width?: DimensionValue;
}) {
  return (
    <View style={[ui.fieldWrap, { width: width as any }]}>
      <Text style={ui.fieldLabel}>Luas Lahan</Text>
      <View style={ui.luasRow}>
        <TextInput
          style={[ui.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }]}
          value={luas}
          onChangeText={setLuas}
          placeholder="contoh: 6660"
          placeholderTextColor={T.outline}
          keyboardType="numeric"
        />
        {/* Label M2 tetap — tidak bisa diubah */}
        <View style={[ui.luasSat, { backgroundColor: T.surfaceContainerLow }]}>
          <Text style={[ui.luasSatText, { color: T.onSurfaceVariant, fontWeight: "700" }]}>m²</Text>
        </View>
      </View>
      {luas && !isNaN(parseFloat(luas)) && (
        <Text style={{ fontSize: 10, color: T.secondary, marginTop: 3 }}>
          = {(parseFloat(luas) / 10000).toLocaleString("id-ID", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} ha
        </Text>
      )}
    </View>
  );
}
