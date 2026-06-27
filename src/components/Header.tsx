import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Polyline } from "react-native-svg";

export default function Header() {
  return (
    <View style={styles.container}>
      {/* Dekorasi lingkaran */}
      <View style={styles.glowCircle} />

      {/* Badge kanan atas */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Data untuk{"\n"}Indonesia</Text>
      </View>

      {/* Konten utama */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoBox}>
          <Svg width={32} height={32} viewBox="0 0 32 32">
            <Rect x={2} y={2} width={13} height={13} rx={3} fill="#1565F5" />
            <Rect x={17} y={2} width={13} height={13} rx={3} fill="#00B4D8" />
            <Rect x={2} y={17} width={13} height={13} rx={3} fill="#F59E0B" />
            <Rect x={17} y={17} width={13} height={13} rx={3} fill="#22C55E" />
          </Svg>
        </View>

        {/* Teks */}
        <View style={styles.textWrap}>
          <Text style={styles.title}>Estimasi Pintar</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>BPSSumberharjo</Text>
        </View>
      </View>

      {/* Ilustrasi grafik batang */}
      <View style={styles.chartBars}>
        {[18, 28, 22, 38, 30, 44].map((h, i) => (
          <View key={i} style={[styles.bar, { height: h }]} />
        ))}
      </View>

      {/* Ilustrasi garis naik */}
      <View style={styles.lineChart}>
        <Svg width={90} height={45} viewBox="0 0 90 45">
          <Polyline
            points="0,40 18,28 36,32 54,15 72,20 90,4"
            stroke="white"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1565F5",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 52,
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: "hidden",
    position: "relative",
  },
  glowCircle: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  badge: {
    position: "absolute",
    top: 52,
    right: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 14,
    textAlign: "right",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    zIndex: 2,
  },
  logoBox: {
    width: 52,
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 30,
  },
  divider: {
    width: "100%",
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginVertical: 6,
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },
  chartBars: {
    position: "absolute",
    bottom: 10,
    right: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    opacity: 0.25,
  },
  bar: {
    width: 10,
    backgroundColor: "#fff",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  lineChart: {
    position: "absolute",
    bottom: 28,
    right: 16,
    opacity: 0.2,
  },
});
