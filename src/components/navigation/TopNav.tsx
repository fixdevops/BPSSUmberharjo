// ─── TopNav — App bar bagian atas ─────────────────────────────────────────────
import { Platform, Pressable, Text, View } from "react-native";
import { T } from "../../constants/theme";
import { ui } from "../../styles/ui";
import { DriveSyncStatus } from "../DriveSyncStatus";
import { Icon } from "../Icon";

export function TopNav({
  onSettingsPress,
}: {
  onSettingsPress?: () => void;
}) {
  return (
    <View style={[ui.topNav, { gap: 8 }]}>
      <Text style={ui.topNavBrand}>Estimasi Pintar</Text>
      {/* Indikator status Google Drive — hanya di web */}
      {Platform.OS === "web" && <DriveSyncStatus />}
      <View style={ui.topNavActions}>
        <Pressable
          style={({ pressed }) => [ui.topNavBtn, pressed && { opacity: 0.7 }]}
          onPress={onSettingsPress}
          accessibilityLabel="Pengaturan"
        >
          <Icon name="settings" size={20} color={T.onSurfaceVariant} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [ui.topNavBtn, pressed && { opacity: 0.7 }]}
          onPress={onSettingsPress}
          accessibilityLabel="Profil"
        >
          <Icon name="account_circle" size={20} color={T.onSurfaceVariant} />
        </Pressable>
      </View>
    </View>
  );
}
