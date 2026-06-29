// ─── TopNav — App bar bagian atas ─────────────────────────────────────────────
import { Text, View } from "react-native";
import { T } from "../../constants/theme";
import { ui } from "../../styles/ui";
import { Icon } from "../Icon";

export function TopNav() {
  return (
    <View style={ui.topNav}>
      <Text style={ui.topNavBrand}>Estimasi Pintar</Text>
      <View style={ui.topNavActions}>
        <View style={ui.topNavBtn}><Icon name="notifications" size={20} color={T.onSurfaceVariant} /></View>
        <View style={ui.topNavBtn}><Icon name="account_circle" size={20} color={T.onSurfaceVariant} /></View>
      </View>
    </View>
  );
}
