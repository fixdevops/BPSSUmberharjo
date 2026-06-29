// ─── PageComingSoon — placeholder halaman belum tersedia ─────────────────────
import { Linking, Pressable, Text, View } from "react-native";
import { T } from "../constants/theme";
import { ui } from "../styles/ui";
import { Icon } from "./Icon";

export function PageComingSoon({ title, icon }: { title: string; icon: string }) {
  return (
    <View style={ui.comingSoonWrap}>
      <View style={ui.comingSoonCard}>
        <View style={ui.comingSoonIconBox}>
          <Icon name={icon} size={40} color={T.primary} />
        </View>
        <Text style={ui.comingSoonTitle}>{title}</Text>
        <Text style={ui.comingSoonSub}>Halaman ini belum tersedia</Text>
        <Text style={ui.comingSoonDesc}>
          Fitur sedang dalam pengembangan dan akan segera hadir di versi berikutnya.
        </Text>
        <View style={ui.comingSoonBadge}>
          <Icon name="zap" size={13} color={T.secondary} />
          <Text style={ui.comingSoonBadgeText}>Segera Hadir · SE2026 v1</Text>
        </View>
        <Pressable
          style={({ pressed }) => [ui.devBtn, pressed && ui.devBtnPressed]}
          onPress={() => Linking.openURL("https://fikriasyam.vercel.app/")}
          accessibilityLabel="Lihat halaman pengembang"
        >
          <Icon name="user" size={14} color={T.onPrimary} />
          <Text style={ui.devBtnText}>Profile Pengembang</Text>
          <Icon name="arrow-right" size={14} color={T.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
