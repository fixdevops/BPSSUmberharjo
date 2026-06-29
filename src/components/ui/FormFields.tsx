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

// ── LuasField ─────────────────────────────────────────────────────────────────
export function LuasField({
  luas,
  setLuas,
  satLuas,
  onSatPress,
  width = "100%",
}: {
  luas: string;
  setLuas: (v: string) => void;
  satLuas: string;
  onSatPress: () => void;
  width?: DimensionValue;
}) {
  return (
    <View style={[ui.fieldWrap, { width: width as any }]}>
      <Text style={ui.fieldLabel}>Luas</Text>
      <View style={ui.luasRow}>
        <TextInput
          style={[ui.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRightWidth: 0 }]}
          value={luas}
          onChangeText={setLuas}
          placeholder="0.00"
          placeholderTextColor={T.outline}
          keyboardType="numeric"
        />
        <Pressable style={ui.luasSat} onPress={onSatPress}>
          <Text style={ui.luasSatText}>{satLuas}</Text>
          <Icon name="expand_more" size={14} color={T.onSurfaceVariant} />
        </Pressable>
      </View>
    </View>
  );
}
