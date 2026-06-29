// ─── InfoCard — Catatan akurasi parameter desa ────────────────────────────────
import { Text, View } from "react-native";
import { T } from "../constants/theme";
import { ui } from "../styles/ui";
import { Icon } from "./Icon";

export function InfoCard() {
  return (
    <View style={ui.infoCard}>
      <View style={ui.infoIconBox}>
        <Icon name="info" size={20} color={T.onSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ui.infoTitle}>Catatan Akurasi</Text>
        <Text style={ui.infoBody}>
          Parameter default aplikasi ini berasal dari{" "}
          <Text style={{ fontWeight: "700", color: T.secondary }}>Desa Sumberharjo.</Text>
          {" "}Untuk penggunaan di wilayah lain, sesuaikan parameter lokal — hubungi developer agar parameter dapat dikalibrasi sesuai kondisi wilayah Anda.
        </Text>
      </View>
    </View>
  );
}
